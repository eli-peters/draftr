# Database Migrations

## Where migrations live

All SQL migration files are in `supabase/migrations/`, numbered sequentially:

```
supabase/migrations/
├── 00001_core_schema.sql    → All tables, indexes
├── 00002_seed_dhf.sql       → DHF seed data (pace groups, locations, tags, weather rules)
├── 00003_rls_policies.sql   → Row Level Security policies + helper functions
```

## How to run migrations

### First time setup

1. Go to your Supabase dashboard → **SQL Editor** → **New Query**
2. Copy and paste each migration file **in order** (00001, then 00002, then 00003)
3. Click **Run** for each one
4. Verify in **Table Editor** that tables and data appear

### Adding new migrations

1. Create a new file: `supabase/migrations/00004_description.sql`
2. Write your SQL (CREATE TABLE, ALTER TABLE, etc.)
3. Run it in the Supabase SQL Editor
4. Commit the file to git

### Naming convention

`NNNNN_short_description.sql` — zero-padded number, underscore-separated description.

## Checking what's been run

Supabase doesn't track which migration files have been run (unless you use the Supabase CLI). For now, the migrations are idempotent where possible, but avoid running seed data twice.

## Future: Supabase CLI

When the project matures, consider using `supabase db push` and `supabase db diff` for proper migration tracking. For now, manual SQL Editor execution is fine.

## Common operations

### Add a new table

```sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  -- columns...
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Always add RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Add read policy for members
CREATE POLICY "Members can view my_table"
  ON my_table FOR SELECT
  USING (is_club_member(club_id, auth.uid()));
```

### Add a column

```sql
ALTER TABLE rides ADD COLUMN weather_forecast JSONB;
```

### Add an index

```sql
CREATE INDEX idx_rides_created_by ON rides(created_by);
```
