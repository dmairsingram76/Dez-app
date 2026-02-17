# Database Migrations

This folder contains numbered SQL migration scripts that build the Dez app database schema.

## Migration Order

Run these scripts **in order** against your Supabase database:

| Script | Description |
|--------|-------------|
| `001_extensions.sql` | Enable required PostgreSQL extensions (pgcrypto, postgis) |
| `002_tables.sql` | Create all application tables |
| `003_indexes.sql` | Create indexes for query performance |
| `004_rls_policies.sql` | Enable Row Level Security and create policies |
| `005_functions.sql` | Create stored procedures, functions, and triggers |
| `006_analytics_views.sql` | Create analytics views for dashboards |

## Running Migrations

### Option 1: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each script in order
4. Click **Run**

### Option 2: Supabase CLI

```bash
# Run all migrations in order
supabase db push

# Or run individual migrations
supabase db execute -f migrations/001_extensions.sql
supabase db execute -f migrations/002_tables.sql
# ... etc
```

### Option 3: psql

```bash
# Connect to your database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations
\i migrations/001_extensions.sql
\i migrations/002_tables.sql
\i migrations/003_indexes.sql
\i migrations/004_rls_policies.sql
\i migrations/005_functions.sql
\i migrations/006_analytics_views.sql
```

## Adding New Migrations

When adding new migrations:

1. Create a new file with the next number: `007_description.sql`
2. Include a header comment describing the migration
3. Document any dependencies on previous migrations
4. Test the migration on a development database first

## Rollback

These migrations don't include automatic rollback scripts. To rollback:

1. Take a database backup before running migrations
2. Create a manual rollback script if needed
3. Or restore from backup

## Notes

- Migrations are designed to be **idempotent** where possible (using `CREATE OR REPLACE`, `IF NOT EXISTS`)
- The `deleted_at` column pattern supports soft deletes for GDPR compliance
- RLS policies follow a "default deny, explicit allow" security model
