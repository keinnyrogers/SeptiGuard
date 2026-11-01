# SeptiGuard Azure VM deployment

This deployment runs the frontend, Laravel API, MySQL, prediction API, Reverb, and Laravel queue/MQTT workers on one Ubuntu VM. Caddy serves the frontend and API over HTTPS. Only ports 80 and 443 are published by Docker; MySQL, the prediction API, and Reverb stay on the private Docker network.

## Before deploying

- Use the `septiguard.tech` and `api.septiguard.tech` A records pointing to the VM's static public IP.
- Allow inbound TCP ports 80 and 443 in the Azure network security group. Keep SSH restricted to trusted IP addresses.
- Do not import the local database or run the default seeders. The first deployment should use a new, empty database.
- Do not commit `deploy/vm/.env`, Firebase service-account credentials, database dumps, or resident data.
- The default MQTT example uses a public unauthenticated broker and is for non-sensitive test data only. Do not send real resident data through it.

## Prepare the deployment environment

On the VM, after pulling the commit containing these deployment files:

```bash
cd ~/SeptiGuard
cp deploy/vm/.env.example deploy/vm/.env
chmod 600 deploy/vm/.env
```

Edit `deploy/vm/.env`. Generate a new Laravel key in `base64:` format with:

```bash
printf 'base64:'
openssl rand -base64 32 | tr -d '\n'
printf '\n'
```

Set that value as `APP_KEY`. Generate separate random values for `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, `PREDICTION_SERVICE_API_KEY`, and `SENSOR_API_KEY` with `openssl rand -hex 32`. Do not reuse local application keys or passwords or share these values in chat.

### Firebase push notifications

Use the Firebase project intended for production (the current project, if one is already configured):

1. Use the intended Firebase project (the same project used by the SeptiGuard web app), enable Firebase Cloud Messaging, and obtain the web app configuration plus a Web Push VAPID key. SeptiGuard uses its own API authentication; Firebase Authentication is not required for this notification setup.
2. Set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_FIREBASE_VAPID_KEY` in `deploy/vm/.env`. These are browser-side Firebase configuration values, not the Admin private key.
3. Generate/download a Firebase Admin service-account JSON from the Firebase project’s Service accounts settings. Transfer it securely to `deploy/vm/firebase-service-account.json` on the VM. Never commit it, put its contents in chat, or include it in a screenshot.
4. On the VM, restrict the file and make it readable by the PHP worker user in the container:

   ```bash
   sudo chown 33:33 deploy/vm/firebase-service-account.json
   sudo chmod 400 deploy/vm/firebase-service-account.json
   ```

5. Set `FIREBASE_PROJECT_ID` to the same Firebase project ID. The Compose file mounts the private JSON read-only into both Laravel and the queue worker.

Push delivery requires the resident to enable notifications in the portal on a supported browser/device. Test with a real, approved, non-demo resident account; demo accounts are intentionally excluded from resident notifications.

### Outgoing email

In Titan, open **Enable Titan on other apps** and use its current SMTP instructions. Set the SMTP host, port, encryption/scheme, mailbox username, and mailbox password in `deploy/vm/.env`:

```text
MAIL_MAILER=smtp
MAIL_SCHEME=<Titan's documented SMTP encryption>
MAIL_HOST=<Titan's documented SMTP host>
MAIL_PORT=<Titan's documented SMTP port>
MAIL_USERNAME=admin@septiguard.tech
MAIL_PASSWORD=<Titan mailbox password>
MAIL_FROM_ADDRESS=admin@septiguard.tech
MAIL_FROM_NAME=SeptiGuard
```

Keep the mailbox password private. Do not send it in chat or commit the environment file. Confirm Titan SPF/DKIM records are verified for better deliverability.

Use the MQTT host, topic, and test-device credentials that match the demo firmware. Keep the broker and data test-only unless the firmware and broker are configured for authentication and TLS.

## Build and start

Confirm Compose can parse the configuration before starting services:

```bash
sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml config --quiet
```

Then build and start the stack:

```bash
sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml up -d --build
sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml ps
```

The Laravel web container applies migrations on startup. Do not run `php artisan db:seed`. Check logs if any service is unhealthy:

```bash
sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml logs --tail=100 backend
sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml logs --tail=100 caddy
```

Once the backend is healthy, create the first administrator interactively:

```bash
sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml exec backend php artisan hoa-admin:create
```

Use the prompt to set the administrator credentials; do not put the password in a command or chat.

## Verify and operate

- Open `https://septiguard.tech` and confirm Caddy has issued a certificate.
- Check the Laravel API health endpoint at `https://api.septiguard.tech/up`.
- Test login, reports, live updates, and sensor readings using test accounts and non-sensitive data.
- Configure SMTP and Firebase separately if resident email or push delivery is needed. The default mailer logs mail rather than delivering it.
- Back up the database and private uploads before upgrades. Keep backups off the VM.
- To stop the application stack: `sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml down`. This preserves named volumes.
- To start it again: `sudo docker compose --env-file deploy/vm/.env -f compose.vm.yaml up -d`.
- To stop Azure VM compute billing, use Azure **Stop (deallocate)** after stopping or when done. Disk and other attached-resource charges may continue.

Do not use `docker compose down -v` on a VM containing data; `-v` deletes the named database and upload volumes.
