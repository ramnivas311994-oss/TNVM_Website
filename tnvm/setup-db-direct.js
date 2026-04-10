const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://ndqacuqchzgtkceaflke.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcWFjdXFjaHpndGtjZWFmbGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzODk5OSwiZXhwIjoyMDkxNDE0OTk5fQ.DHiFfEXKjzNkf1t9NE7uMxtOam0TesQJusIJ0Zo0msQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupDatabase() {
  console.log('🎯 Creating TNVM Database\n');
  console.log('Step-by-step table creation:\n');

  // Step 1: Profiles table
  console.log('1️⃣  Creating profiles table...');
  const { error: profilesError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        role TEXT DEFAULT 'member',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    `
  }).then(() => ({ error: null })).catch(e => ({ error: e }));

  if (profilesError) {
    console.log('  → Using direct endpoint instead...\n');
    
    // Use REST API directly
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({
            query: 'SELECT 1' // Test query
          })
        }
      );
      
      console.log('  Testing direct API...');
      if (response.ok) {
        console.log('✅ API connection working');
      } else {
        console.log('⚠️  API returned:', response.status);
      }
    } catch (e) {
      console.log('  → Direct API also not available');
      console.log('\n📋 Tables setup requires Supabase SQL Editor:\n');
      console.log('  1. Go to: https://ndqacuqchzgtkceaflke.supabase.co');
      console.log('  2. Click: SQL Editor');
      console.log('  3. New Query');
      console.log('  4. Copy entire content from: supabase-setup.sql');
      console.log('  5. Paste and click Run\n');
    }
  } else {
    console.log('✅ Profiles created');
  }

  // List all tables
  console.log('\n✨ Checking current tables...\n');
  
  const tables = [
    'profiles', 'events', 'rsvps', 'announcements',
    'gallery_albums', 'gallery_photos', 'donations',
    'contact_messages', 'notifications'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);
      
      if (!error) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table}`);
      }
    } catch (e) {
      console.log(`❌ ${table}`);
    }
  }
}

setupDatabase();
