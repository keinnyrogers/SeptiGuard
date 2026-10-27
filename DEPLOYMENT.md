# SeptiGuard demo deployment

This deployment keeps the hosted database separate from local data. It runs Laravel, MySQL, the prediction API, Reverb, and the queue/MQTT workers on Railway; the Vite frontend is hosted separately on Cloudflare Pages.

## Important safeguards

- Deploy a new, empty MySQL service. Do not import the local database.
- The Laravel container runs migrations only. Do not run `php artisan db:seed`: the default seeder creates demo accounts with a known password and sample tank records.
- Keep all credentials in Railway/Cloudflare environment settings. Never commit `.env`, admin passwords, or service credentials.
- Complaint and profile photos are private local files. Attach a Railway volume to the Laravel web service at `/var/www/html/storage/app/private` or photo uploads will not survive redeployments.
- The current default MQTT broker is public and unauthenticated. Use it only for non-sensitive testing; do not send real resident data through it. The backend can use MQTT credentials and TLS, but the current ESP32 sketch only supports unauthenticated, unencrypted MQTT. Do not connect that firmware to real resident data or an authenticated broker until it has been updated.

## Railway services

Create these five services in one Railway project:

1. **MySQL** — add a new Railway MySQL service; do not import data.
2. **Laravel web** — deploy this repository with the root directory set to `/backend`. Railway will build `backend/Dockerfile`. The image runs migrations and starts Apache on port `8080`; set the service's target port to `8080` and health check path to `/up`.
3. **Laravel workers** — create another service from the same repository and root directory (`/backend`). Set its start command to `supervisord -c /etc/supervisor/worker.conf`. This runs the database queue worker and MQTT listener.
4. **Reverb** — create another service from the same repository and root directory (`/backend`). Set its start command to `php artisan reverb:start --host=0.0.0.0 --port=8081`. Set the public target port to `8081`.
5. **Prediction API** — create a service from the same repository with root directory `/backend/ml_service`. Railway will build `backend/ml_service/Dockerfile`. Set its health check path to `/health` and port to `8000`.

Configure the backend environment in the Laravel web, workers, and Reverb services. Use Railway variable references for the MySQL service's `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, and `MYSQLPASSWORD` values; do not copy credentials into this file.

Required Laravel settings:

```text
APP_ENV=production
APP_DEBUG=false
LOG_CHANNEL=stderr
APP_KEY=<generate a new key for the hosted app>
APP_URL=<Laravel web service HTTPS URL>
FRONTEND_URL=<Cloudflare Pages HTTPS URL>
DB_CONNECTION=mysql
DB_HOST=<MySQL MYSQLHOST>
DB_PORT=<MySQL MYSQLPORT>
DB_DATABASE=<MySQL MYSQLDATABASE>
DB_USERNAME=<MySQL MYSQLUSER>
DB_PASSWORD=<MySQL MYSQLPASSWORD>
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
BROADCAST_CONNECTION=reverb
```

Generate a fresh Laravel key locally with `php artisan key:generate --show` from `backend`; use the displayed key only as the Railway `APP_KEY` value. Do not reuse the local app key.

For Reverb, generate a unique app ID, key, and secret, then set the same values in all Laravel services:

```text
REVERB_APP_ID=<unique app ID>
REVERB_APP_KEY=<unique app key>
REVERB_APP_SECRET=<long random secret>
REVERB_HOST=<Reverb private domain>
REVERB_PORT=8081
REVERB_SCHEME=http
```

Set `PREDICTION_SERVICE_URL` in the Laravel services to the prediction service's private URL, including port `8000`. Set the same newly generated `PREDICTION_SERVICE_API_KEY` in Laravel and the prediction service. Configure `MQTT_HOST`, `MQTT_PORT`, `MQTT_TOPIC`, `MQTT_USERNAME`, `MQTT_PASSWORD`, and `MQTT_TLS` for the broker. Keep the ESP32 on test-only data until its firmware supports the chosen broker's authentication and TLS settings.

Attach the private-file volume to the **Laravel web** service at `/var/www/html/storage/app/private`. The MySQL connection and app key must be configured before the first deployment; the web container applies migrations on startup. Create the first admin only after migrations finish by opening a Railway shell for the Laravel web service and running:

```text
php artisan hoa-admin:create
```

The command prompts for the admin name, email, and a password twice without echoing the password. It creates only that administrator; it does not add demo residents or tank readings.

## Cloudflare Pages frontend

Create a Pages project from this repository:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`

Set these build-time variables in Cloudflare Pages:

```text
VITE_API_URL=<Laravel web service HTTPS URL>
VITE_REVERB_APP_KEY=<Reverb app key>
VITE_REVERB_HOST=<Reverb public hostname, without https://>
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

Set Laravel `FRONTEND_URL` to the exact Pages origin (for example `https://your-project.pages.dev`). After the Pages URL is available, set that exact URL before testing login. Use the same `VITE_API_URL` and Reverb settings for production builds; Vite embeds them at build time.
