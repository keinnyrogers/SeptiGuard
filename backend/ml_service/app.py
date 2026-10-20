import hmac
import math
import os
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from sklearn.linear_model import LinearRegression

API_KEY = os.environ.get("PREDICTION_SERVICE_API_KEY", "")
CRITICAL_FILL_PERCENTAGE = 80.0
MIN_DAILY_POINTS = 3
MAX_FORECAST_DAYS = 365

app = FastAPI(title="SeptiGuard Prediction Service", version="1.0.0")


class ReadingPoint(BaseModel):
    reading_date: date | None = None
    measured_at: datetime
    fill_percentage: float = Field(ge=0, le=100)
    readings_count: int = Field(ge=1)


class ForecastRequest(BaseModel):
    as_of: datetime
    history: list[ReadingPoint]


def require_api_key(authorization: str | None = Header(default=None)) -> None:
    if not API_KEY:
        raise HTTPException(status_code=503, detail="Prediction service API key is not configured.")
    provided = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not hmac.compare_digest(provided, API_KEY):
        raise HTTPException(status_code=401, detail="Invalid prediction service credentials.")


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def as_iso(value: datetime) -> str:
    return as_utc(value).isoformat(timespec="microseconds").replace("+00:00", "Z")


def make_forecast(request: ForecastRequest) -> dict:
    as_of = as_utc(request.as_of)
    daily: dict[date, list[ReadingPoint]] = {}

    for reading in request.history:
        measured_at = as_utc(reading.measured_at)
        if measured_at >= as_of - timedelta(days=30):
            reading_date = reading.reading_date or measured_at.date()
            daily.setdefault(reading_date, []).append(reading)

    points = []
    for reading_date in sorted(daily):
        entries = daily[reading_date]
        average_fill = sum(entry.fill_percentage for entry in entries) / len(entries)
        latest_measurement = max(as_utc(entry.measured_at) for entry in entries)
        points.append({
            "date": reading_date,
            "measured_at": latest_measurement,
            "fill_percentage": round(average_fill, 2),
            "readings_count": sum(entry.readings_count for entry in entries),
        })

    latest = points[-1] if points else None
    first_date = points[0]["date"] if points else None
    days_observed = (points[-1]["date"] - first_date).days if len(points) > 1 else 0
    history = [
        {
            "reading_date": point["date"].isoformat(),
            "measured_at": as_iso(point["measured_at"]),
            "fill_percentage": point["fill_percentage"],
        }
        for point in points
    ]
    base = {
        "threshold_percentage": CRITICAL_FILL_PERCENTAGE,
        "current_fill": latest["fill_percentage"] if latest else None,
        "readings_used": sum(point["readings_count"] for point in points),
        "daily_points": len(points),
        "days_observed": days_observed,
        "history": history,
        "fill_rate_per_day": None,
        "trend_fit_percent": None,
        "days_to_critical": None,
        "predicted_critical_at": None,
        "as_of": as_iso(as_of),
        "method": "30-day daily-average scikit-learn LinearRegression",
    }

    if latest is None:
        return {**base, "status": "no_readings", "message": "No tank readings are available yet."}

    if latest["measured_at"] < as_of - timedelta(hours=48):
        return {
            **base,
            "status": "stale_readings",
            "message": "The latest reading is more than 48 hours old. A current reading is needed before forecasting.",
        }

    current_fill = latest["fill_percentage"]
    if current_fill >= CRITICAL_FILL_PERCENTAGE:
        return {
            **base,
            "status": "threshold_reached",
            "message": "The latest daily reading is already at or above the 80% critical threshold.",
            "days_to_critical": 0,
            "predicted_critical_at": as_iso(latest["measured_at"]),
        }

    if len(points) < MIN_DAILY_POINTS or days_observed < 2:
        return {
            **base,
            "status": "insufficient_data",
            "message": "At least three readings from three separate days spanning two or more days are needed.",
        }

    x_values = [[(point["date"] - first_date).days] for point in points]
    y_values = [point["fill_percentage"] for point in points]
    model = LinearRegression()
    model.fit(x_values, y_values)
    daily_rate = float(model.coef_[0])
    trend_fit = max(0.0, min(1.0, float(model.score(x_values, y_values)))) if len(set(y_values)) > 1 else 0.0

    base["fill_rate_per_day"] = round(daily_rate, 3)
    base["trend_fit_percent"] = round(trend_fit * 100, 1)

    if daily_rate <= 0:
        return {
            **base,
            "status": "no_increasing_trend",
            "message": "Recent readings do not show a positive fill trend, so a date cannot be estimated.",
        }

    days_to_critical = math.ceil(
        (CRITICAL_FILL_PERCENTAGE - current_fill) / daily_rate - 1e-9
    )
    if days_to_critical > MAX_FORECAST_DAYS:
        return {
            **base,
            "status": "beyond_forecast_horizon",
            "message": "The estimated critical date is more than one year away, so no date is shown.",
        }

    days_to_critical = max(1, days_to_critical)
    predicted_at = latest["measured_at"] + timedelta(days=days_to_critical)
    return {
        **base,
        "status": "ready",
        "message": "This is a linear-regression trend estimate, not a guarantee.",
        "days_to_critical": days_to_critical,
        "predicted_critical_at": as_iso(predicted_at),
    }


@app.get("/health")
def health() -> dict[str, Literal["ok"]]:
    return {"status": "ok"}


@app.post("/forecast", dependencies=[Depends(require_api_key)])
def forecast(request: ForecastRequest) -> dict:
    return {"data": make_forecast(request)}
