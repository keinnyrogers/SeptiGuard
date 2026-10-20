import unittest
from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch

from fastapi import HTTPException

from app import ForecastRequest, ReadingPoint, make_forecast, require_api_key


class ForecastTests(unittest.TestCase):
    def test_service_requires_the_configured_bearer_key(self) -> None:
        with patch("app.API_KEY", "service-test-key"):
            self.assertIsNone(require_api_key("Bearer service-test-key"))
            with self.assertRaises(HTTPException) as raised:
                require_api_key("Bearer wrong-key")

        self.assertEqual(raised.exception.status_code, 401)

    def test_linear_regression_estimates_critical_date_from_daily_averages(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[
                ReadingPoint(measured_at=now - timedelta(days=2), fill_percentage=40, readings_count=2),
                ReadingPoint(measured_at=now - timedelta(days=1), fill_percentage=45, readings_count=1),
                ReadingPoint(measured_at=now, fill_percentage=50, readings_count=1),
            ],
        )

        result = make_forecast(request)

        self.assertEqual(result["status"], "ready")
        self.assertEqual(result["fill_rate_per_day"], 5.0)
        self.assertEqual(result["days_to_critical"], 6)
        self.assertEqual(result["readings_used"], 4)
        self.assertIn("scikit-learn LinearRegression", result["method"])

    def test_same_day_readings_are_averaged_before_fitting(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[
                ReadingPoint(measured_at=now - timedelta(days=2, hours=3), fill_percentage=40, readings_count=1),
                ReadingPoint(measured_at=now - timedelta(days=2), fill_percentage=42, readings_count=1),
                ReadingPoint(measured_at=now - timedelta(days=1), fill_percentage=45, readings_count=1),
                ReadingPoint(measured_at=now, fill_percentage=50, readings_count=1),
            ],
        )

        result = make_forecast(request)

        self.assertEqual(result["history"][0]["fill_percentage"], 41.0)
        self.assertEqual(result["daily_points"], 3)

    def test_explicit_daily_date_is_preserved_when_timestamp_crosses_utc_day(self) -> None:
        now = datetime(2026, 10, 20, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[
                ReadingPoint(
                    reading_date=date(2026, 10, 18),
                    measured_at=datetime(2026, 10, 18, 16, tzinfo=timezone.utc),
                    fill_percentage=40,
                    readings_count=1,
                ),
                ReadingPoint(
                    reading_date=date(2026, 10, 19),
                    measured_at=datetime(2026, 10, 19, 16, tzinfo=timezone.utc),
                    fill_percentage=45,
                    readings_count=1,
                ),
                ReadingPoint(
                    reading_date=date(2026, 10, 20),
                    measured_at=datetime(2026, 10, 19, 16, tzinfo=timezone.utc),
                    fill_percentage=50,
                    readings_count=1,
                ),
            ],
        )

        result = make_forecast(request)

        self.assertEqual(
            [point["reading_date"] for point in result["history"]],
            ["2026-10-18", "2026-10-19", "2026-10-20"],
        )

    def test_stale_data_does_not_produce_a_forecast(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[
                ReadingPoint(measured_at=now - timedelta(days=4), fill_percentage=40, readings_count=1),
                ReadingPoint(measured_at=now - timedelta(days=3), fill_percentage=45, readings_count=1),
                ReadingPoint(measured_at=now - timedelta(days=2, hours=1), fill_percentage=50, readings_count=1),
            ],
        )

        result = make_forecast(request)

        self.assertEqual(result["status"], "stale_readings")
        self.assertIsNone(result["days_to_critical"])

    def test_insufficient_history_does_not_produce_a_forecast(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[
                ReadingPoint(measured_at=now - timedelta(days=1), fill_percentage=40, readings_count=1),
                ReadingPoint(measured_at=now, fill_percentage=45, readings_count=1),
            ],
        )

        self.assertEqual(make_forecast(request)["status"], "insufficient_data")

    def test_empty_history_returns_no_readings_state(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        result = make_forecast(ForecastRequest(as_of=now, history=[]))

        self.assertEqual(result["status"], "no_readings")
        self.assertIsNone(result["current_fill"])

    def test_critical_level_is_reported_without_extrapolating(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[ReadingPoint(measured_at=now, fill_percentage=82, readings_count=1)],
        )

        result = make_forecast(request)

        self.assertEqual(result["status"], "threshold_reached")
        self.assertEqual(result["days_to_critical"], 0)

    def test_non_increasing_trend_has_no_estimated_date(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[
                ReadingPoint(measured_at=now - timedelta(days=2), fill_percentage=60, readings_count=1),
                ReadingPoint(measured_at=now - timedelta(days=1), fill_percentage=55, readings_count=1),
                ReadingPoint(measured_at=now, fill_percentage=50, readings_count=1),
            ],
        )

        result = make_forecast(request)

        self.assertEqual(result["status"], "no_increasing_trend")
        self.assertIsNone(result["predicted_critical_at"])

    def test_forecast_beyond_one_year_is_not_dated(self) -> None:
        now = datetime(2026, 10, 19, 12, tzinfo=timezone.utc)
        request = ForecastRequest(
            as_of=now,
            history=[
                ReadingPoint(measured_at=now - timedelta(days=2), fill_percentage=49.98, readings_count=1),
                ReadingPoint(measured_at=now - timedelta(days=1), fill_percentage=49.99, readings_count=1),
                ReadingPoint(measured_at=now, fill_percentage=50, readings_count=1),
            ],
        )

        result = make_forecast(request)

        self.assertEqual(result["status"], "beyond_forecast_horizon")
        self.assertIsNone(result["predicted_critical_at"])


if __name__ == "__main__":
    unittest.main()
