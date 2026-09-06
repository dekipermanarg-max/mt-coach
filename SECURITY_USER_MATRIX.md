# MT Coach — User & Access Matrix

| Username | Role | Branch access | Write | Notes |
|---|---|---|---|---|
| deki | SUPERADMIN | ALL | YES | Full access |
| ica | SUPERADMIN | ALL | YES | Full access |
| yogi | MTC | Solok - Pandan; Painan - Pagaruyung; Padang - Sutomo | YES | Branch-restricted |
| farah | MTC | Padang - S. Parman; Padang - Gajah Mada | YES | Branch-restricted |
| zelly | MTC | Payakumbuh - Simpang Benteng; Bukittinggi - Jambu Air; Bukittinggi - Manggis Ganting | YES | Branch-restricted |
| asa | MTC | Mathchamps only | YES | Mathchamps-only scope |
| anggun | ADMIN | Padang - Tarandam; Padang - S. Parman; Padang - Ujung Gurun | NO | View only |
| bella | ADMIN | Payakumbuh - Simpang Benteng; Bukittinggi - Jambu Air; Bukittinggi - Manggis Ganting | NO | View only |
| ibah | ADMIN | Padang - Gajah Mada; Padang - Sutomo; Solok - Pandan; Painan - Pagaruyung | NO | View only |
| aii | ADMIN | Padang - Gajah Mada; Padang - Sutomo; Solok - Pandan; Painan - Pagaruyung | NO | View only |

## Password policy

Passwords are **not assigned in this file or source code**. Each person must establish their own password through the Supabase Auth onboarding/password setup flow. Never commit passwords, temporary passwords, service-role keys, or other secrets to the repository.

## Important implementation note

The username/role/branch records must be linked to a Supabase Auth user before access is granted. The application must fail closed when `auth_user_id` is missing, inactive, or not linked to an active `app_users` row. The `asa` account is intentionally scoped to Mathchamps and must not gain access to the general planning/monitoring/performance/data/backup areas merely by being authenticated.
