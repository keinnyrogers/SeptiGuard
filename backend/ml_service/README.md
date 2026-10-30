# SeptiGuard prediction service

This internal FastAPI service runs scikit-learn `LinearRegression` over daily tank-fill averages prepared by Laravel. It does not access the database directly and does not modify or store sensor readings.

## Local setup

This workspace's local setup is configured in the ignored `backend/.env`. For a fresh checkout, set `PREDICTION_SERVICE_URL=http://127.0.0.1:8001`, a private `PREDICTION_SERVICE_API_KEY`, and `PREDICTION_SERVICE_TIMEOUT=5` in `backend/.env`. Set a strong random key and never commit it. Start the service from the repository root:

```powershell
.\backend\ml_service\start.ps1
```

The script reads the API key from `backend/.env` without displaying it and binds the service to localhost. Install dependencies first with `python -m pip install -r .\backend\ml_service\requirements.txt` if needed. For deployment, run the service on a private network, use TLS or a trusted internal proxy, and configure the secret through the host's secret manager.

Laravel sends the authenticated resident's last 30 days of daily fill averages and timestamps for the current service cycle. After a recorded desludging, it can also send up to 30 days of pre-service daily averages separately. If the post-service readings do not yet span three days, the service may return a clearly marked provisional estimate using the previous cycle's positive fill rate rebased to the latest post-service reading. Once enough post-service days exist, the normal regression over the new cycle takes over. Pre-service readings are never mixed into that new-cycle regression. A service outage returns HTTP 503 from the resident prediction API; there is deliberately no silent PHP-algorithm fallback.

Run service unit tests with:

```powershell
python -m unittest
```
