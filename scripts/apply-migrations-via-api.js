#!/usr/bin/env node

/**
 * Apply migrations via Supabase Management API
 *
 * Uses the SUPABASE_ACCESS_TOKEN to execute SQL migrations
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration(projectRef, sql, migrationName) {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('SUPABASE_ACCESS_TOKEN not found in .env.local');
  }

  console.log(`\n📝 Applying migration: ${migrationName}`);
  console.log(`Project: ${projectRef}`);

  // Use Supabase Management API to execute SQL
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: sql
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Migration failed: ${response.status} ${response.statusText}\n${error}`);
  }

  const result = await response.json();
  console.log('✅ Migration applied successfully!');
  return result;
}

async function main() {
  // Extract project ref from SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL not found in .env.local');
  }

  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    throw new Error('Could not extract project reference from SUPABASE_URL');
  }

  console.log(`🚀 Starting migration process for project: ${projectRef}`);

  // Read migration files
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const migrations = [
    {
      file: '20251026000001_create_prompts_table.sql',
      name: 'Create prompts table with RLS'
    },
    {
      file: '20251026000002_add_prompt_fields.sql',
      name: 'Add expected_output and version_counter fields'
    }
  ];

  for (const migration of migrations) {
    const sqlPath = path.join(migrationsDir, migration.file);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
      await applyMigration(projectRef, sql, migration.name);
    } catch (error) {
      console.error(`\n❌ Failed to apply ${migration.name}:`);
      console.error(error.message);

      // If it's a "relation already exists" error, that's okay
      if (error.message.includes('already exists')) {
        console.log('⚠️  Migration already applied, continuing...');
      } else {
        process.exit(1);
      }
    }
  }

  console.log('\n✨ All migrations applied successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify tables in Supabase Dashboard → Table Editor');
  console.log('2. Create a test user in Authentication → Users');
  console.log('3. Run the app: npm run dev');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
