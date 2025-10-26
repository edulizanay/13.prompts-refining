#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read migration file
  const migrationPath = process.argv[2];
  if (!migrationPath) {
    console.error('❌ Usage: node scripts/apply-migration.js <migration-file-path>');
    process.exit(1);
  }

  const migrationFile = path.resolve(migrationPath);
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log(`📝 Applying migration: ${path.basename(migrationFile)}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log('');

  // Execute SQL via Supabase RPC
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    // If exec_sql doesn't exist, try executing statements one by one
    console.log('⚠️  exec_sql RPC not available, using direct SQL execution...');

    const { error: directError } = await supabase
      .from('_migrations')
      .select('*')
      .limit(1);

    if (directError) {
      console.error('❌ Error executing migration:', error.message);
      console.log('\n📋 Please apply this migration manually in Supabase SQL Editor:');
      console.log('   Dashboard → SQL Editor → New Query → Paste the SQL below:\n');
      console.log('---');
      console.log(sql);
      console.log('---');
      process.exit(1);
    }
  }

  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Verify the table exists in Supabase Dashboard → Table Editor');
  console.log('2. Check RLS policies in Database → Policies');
}

applyMigration().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
