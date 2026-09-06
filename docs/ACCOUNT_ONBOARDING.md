# MT Coach Account Onboarding

Passwords are user-created; no passwords are stored in the repository.

## Required onboarding fields

For every account, collect:
- username
- display name
- email address used for Supabase Auth
- approved role
- approved branch/scope assignments

## Access rules

- `SUPERADMIN`: all active branches and all modules.
- `ATASAN`: all active branches and management/finalization access.
- `MTC`: write access only to assigned branches.
- `ADMIN`: read-only access only to assigned branches.
- `asa`: Mathchamps-only write scope; no access to general MT Coach modules.

## Password setup

Do not create or communicate a password on behalf of a user. The Auth account should be invited or otherwise onboarded through the configured Supabase Auth flow so the user establishes their own password. If the project's email provider is not configured yet, do not enable unrestricted self-signup as a workaround; it would allow unapproved accounts into the application.

## Provisioning sequence

1. Create/invite the Supabase Auth identity using the person's email.
2. Create or update the matching `app_users` record with the Auth user's UUID.
3. Set the approved role and active status.
4. Add only the approved `user_branch_access` rows.
5. For `asa`, apply the Mathchamps-only module scope in addition to write permission.
6. Verify RLS with that user's Auth session before production deployment.
7. Record the provisioning action in `audit_log` where supported.
