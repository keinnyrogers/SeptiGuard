# SeptiGuard prediction service

This internal FastAPI service runs scikit-learn `LinearRegression` over daily tank-fill averages prepared by Laravel. It does not access the database directly and does not modify or store sensor readings.

## Local setup

This workspace's local setup is configured in the ignored `backend/.env`. For a fresh checkout, set `PREDICTION_SERVICE_URL=http://127.0.0.1:8001`, a private `PREDICTION_SERVICE_API_KEY`, and `PREDICTION_SERVICE_TIMEOUT=5` in `backend/.env`. Set a strong random key and never commit it. Start the service from the repository root:

```powershell
.\backend\ml_service\start.ps1
```

The script reads the API key from `backend/.env` without displaying it and binds the service to localhost. Install dependencies first with `python -m pip install -r .\backend\ml_service\requirements.txt` if needed. For deployment, run the service on a private network, use TLS or a trusted internal proxy, and configure the secret through the host's secret manager.

Laravel sends only the authenticated resident's last 30 days of daily fill averages and timestamps. A service outage returns HTTP 503 from the resident prediction API; there is deliberately no silent PHP-algorithm fallback.

Run service unit tests with:

```powershell
python -m unittest
```
