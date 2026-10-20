# Resident notification delivery

Resident events remain available in the in-app Alerts page. When configured, tank warning/critical alerts and HOA complaint updates are also queued for email.

## Gmail SMTP

In `backend/.env`, set:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-sending-account@gmail.com
MAIL_PASSWORD=your-google-app-password
MAIL_FROM_ADDRESS=your-sending-account@gmail.com
MAIL_FROM_NAME="SeptiGuard"
```

Use a Google App Password for an account with 2-Step Verification enabled. Do not use the account's normal password. The sender address must be an address Gmail permits that account to send as.

## Start delivery

Set mail values only in the local `backend/.env`; never commit credentials. After changing environment values, clear cached config and start a queue worker in a separate backend terminal:

```powershell
php artisan config:clear
php artisan queue:work --tries=3
```

The queue worker must stay running for email delivery. Failed sends are retried with backoff and recorded in Laravel's failed-jobs table/logs. The in-app notification is saved independently and does not depend on email delivery. SMS delivery is not supported.
