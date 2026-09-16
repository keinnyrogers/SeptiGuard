# SeptiGuard Data Dictionary

**System:** SeptiGuard Septic Tank Monitoring and Maintenance System  
**Database:** MySQL  
**Source:** Laravel database migrations in `backend/database/migrations/`

This document describes the current database structure. The application tables are listed first, followed by Laravel framework support tables.

## Relationship Summary

- One `users` record can have one `resident_profiles` record.
- One `users` record can have one `septic_systems` record.
- One `septic_systems` record can have many `tank_readings` records.
- One `septic_systems` record can have many `predictions` records.
- One `users` record can have many `complaints` records.
- A complaint may be assigned to one HOA user through `assigned_to`.
- One `users` record can have many `septi_notifications` records.

## Core Application Tables

### `users`

Stores resident and HOA administrator accounts.

| Field | MySQL Type | Null | Default | Key / Constraint | Description |
|---|---|---:|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto-increment | Primary key | Unique user identifier. |
| `name` | VARCHAR(255) | No | None |  | User's full name. |
| `email` | VARCHAR(255) | No | None | Unique | User's login email address. |
| `role` | VARCHAR(255) | No | `resident` |  | User role, such as resident or HOA administrator. |
| `account_status` | VARCHAR(255) | No | `pending` |  | Approval state of the account. |
| `email_verified_at` | TIMESTAMP | Yes | NULL |  | Date and time the email was verified. |
| `password` | VARCHAR(255) | No | None |  | Hashed account password. |
| `remember_token` | VARCHAR(100) | Yes | NULL |  | Token used for remember-me login sessions. |
| `api_token_hash` | VARCHAR(255) | Yes | NULL |  | Hashed bearer token used by the frontend API client. |
| `created_at` | TIMESTAMP | Yes | NULL |  | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | NULL |  | Last record update timestamp. |

### `resident_profiles`

Stores resident household and contact information.

| Field | MySQL Type | Null | Default | Key / Constraint | Description |
|---|---|---:|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto-increment | Primary key | Unique profile identifier. |
| `user_id` | BIGINT UNSIGNED | No | None | Unique, foreign key to `users.id` | Resident account associated with the profile. |
| `address` | VARCHAR(255) | No | None |  | Resident address. |
| `contact_number` | VARCHAR(255) | No | None |  | Resident contact number. |
| `household_members` | INT | No | `1` |  | Number of people in the household. |
| `notes` | TEXT | Yes | NULL |  | Additional resident information. |
| `created_at` | TIMESTAMP | Yes | NULL |  | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | NULL |  | Last record update timestamp. |

### `septic_systems`

Stores the septic tank and connected IoT device details for a resident.

| Field | MySQL Type | Null | Default | Key / Constraint | Description |
|---|---|---:|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto-increment | Primary key | Unique septic system identifier. |
| `user_id` | BIGINT UNSIGNED | No | None | Unique, foreign key to `users.id` | Resident who owns the septic system. |
| `device_id` | VARCHAR(255) | Yes | NULL | Unique | Identifier of the connected IoT sensor device. |
| `tank_type` | VARCHAR(255) | No | None |  | Type or design of septic tank. |
| `capacity_liters` | INT UNSIGNED | No | None |  | Total tank capacity in liters. |
| `installation_date` | DATE | Yes | NULL |  | Date the tank was installed. |
| `last_maintenance_date` | DATE | Yes | NULL |  | Date of the most recent maintenance service. |
| `location` | VARCHAR(255) | No | None |  | Physical location of the septic system. |
| `created_at` | TIMESTAMP | Yes | NULL |  | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | NULL |  | Last record update timestamp. |

### `tank_readings`

Stores manual and IoT sensor readings from septic systems.

| Field | MySQL Type | Null | Default | Key / Constraint | Description |
|---|---|---:|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto-increment | Primary key | Unique tank reading identifier. |
| `septic_system_id` | BIGINT UNSIGNED | No | None | Foreign key to `septic_systems.id` | Septic system measured by the reading. |
| `fill_level_percentage` | TINYINT UNSIGNED | No | None | 0-255 database range; application uses 0-100 | Tank fill level as a percentage. |
| `measured_at` | TIMESTAMP | No | None |  | Date and time of measurement. |
| `source` | VARCHAR(255) | No | `manual` |  | Reading source, such as manual or sensor. |
| `notes` | TEXT | Yes | NULL |  | Optional notes about the reading. |
| `status` | ENUM | No | `normal` | `normal`, `warning`, `critical` | Condition calculated from the fill level. |
| `distance_cm` | DECIMAL(6,2) | Yes | NULL |  | Sensor distance measurement in centimeters. |
| `created_at` | TIMESTAMP | Yes | NULL |  | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | NULL |  | Last record update timestamp. |

### `complaints`

Stores resident complaints and their HOA workflow status. This table was originally created as `maintenance_requests` and renamed to `complaints`.

| Field | MySQL Type | Null | Default | Key / Constraint | Description |
|---|---|---:|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto-increment | Primary key | Unique complaint identifier. |
| `ticket_code` | VARCHAR(255) | No | None | Unique | Public complaint tracking code. |
| `user_id` | BIGINT UNSIGNED | No | None | Foreign key to `users.id` | Resident who submitted the complaint. |
| `title` | VARCHAR(255) | No | None |  | Short complaint title. |
| `category` | VARCHAR(255) | No | None |  | Complaint category. |
| `priority` | VARCHAR(255) | No | `medium` |  | Complaint priority. |
| `description` | TEXT | No | None |  | Detailed complaint description. |
| `location` | VARCHAR(255) | Yes | NULL |  | Location related to the complaint. |
| `photo_path` | VARCHAR(255) | Yes | NULL |  | Stored path of an optional complaint photo. |
| `hoa_response` | TEXT | Yes | NULL |  | Response or notes from the HOA. |
| `assigned_to` | BIGINT UNSIGNED | Yes | NULL | Foreign key to `users.id` | HOA user assigned to handle the complaint. |
| `resolved_at` | TIMESTAMP | Yes | NULL |  | Date and time the complaint was resolved. |
| `status` | VARCHAR(255) | No | `pending` |  | Current complaint workflow status. |
| `created_at` | TIMESTAMP | Yes | NULL |  | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | NULL |  | Last record update timestamp. |

### `predictions`

Stores predicted septic tank fill levels and estimated dates.

| Field | MySQL Type | Null | Default | Key / Constraint | Description |
|---|---|---:|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto-increment | Primary key | Unique prediction identifier. |
| `septic_system_id` | BIGINT UNSIGNED | No | None | Foreign key to `septic_systems.id` | Septic system covered by the prediction. |
| `current_fill` | DECIMAL(5,2) | No | None |  | Fill level used by the prediction model. |
| `daily_fill_rate` | DECIMAL(5,2) | No | None |  | Estimated daily increase in fill percentage. |
| `days_until_full` | INT UNSIGNED | No | None |  | Estimated days until the tank reaches the configured full threshold. |
| `predicted_full_date` | DATE | No | None |  | Predicted date the tank will be full or critical. |
| `confidence` | DECIMAL(5,2) | Yes | NULL |  | Model confidence score. |
| `predicted_at` | TIMESTAMP | No | Current timestamp |  | Date and time the prediction was generated. |
| `created_at` | TIMESTAMP | Yes | NULL |  | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | NULL |  | Last record update timestamp. |

### `septi_notifications`

Stores system notifications delivered to users.

| Field | MySQL Type | Null | Default | Key / Constraint | Description |
|---|---|---:|---|---|---|
| `id` | BIGINT UNSIGNED | No | Auto-increment | Primary key | Unique notification identifier. |
| `user_id` | BIGINT UNSIGNED | No | None | Foreign key to `users.id` | User receiving the notification. |
| `title` | VARCHAR(255) | No | None |  | Notification title. |
| `message` | TEXT | No | None |  | Notification content. |
| `type` | ENUM | No | None | `critical_alert`, `warning_alert`, `predictive_alert`, `ticket_update`, `announcement` | Notification category. |
| `channel` | ENUM | No | `fcm` | `fcm`, `email`, `sms` | Delivery channel. |
| `is_read` | BOOLEAN | No | `false` |  | Indicates whether the user has read the notification. |
| `is_sent` | BOOLEAN | No | `false` |  | Indicates whether delivery was completed. |
| `sent_at` | TIMESTAMP | Yes | NULL |  | Date and time the notification was sent. |
| `created_at` | TIMESTAMP | Yes | NULL |  | Record creation timestamp. |
| `updated_at` | TIMESTAMP | Yes | NULL |  | Last record update timestamp. |

## Laravel Support Tables

These tables are created by Laravel for framework services and are not primary SeptiGuard business entities.

- `password_reset_tokens`: Stores password reset tokens by email.
- `sessions`: Stores server-side login sessions, including session ID, user ID, IP address, user agent, payload, and last activity.
- `cache`: Stores cached values and expiration timestamps.
- `cache_locks`: Stores locks used by the cache system.
- `jobs`: Stores queued jobs waiting for processing.
- `job_batches`: Stores information about grouped queued jobs.
- `failed_jobs`: Stores jobs that failed during processing.

## Notes

- Foreign keys use cascading deletes for user-owned profiles, septic systems, tank readings, predictions, and notifications.
- Complaint assignments use `nullOnDelete`, so deleting an assigned HOA user keeps the complaint but clears `assigned_to`.
- Passwords and API tokens are stored as hashes and must never be included in a shared database export or documentation sample.
- The prediction and notification structures are present, but their real-time frontend data connection is still pending.
