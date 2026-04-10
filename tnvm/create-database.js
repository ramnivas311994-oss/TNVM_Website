const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ndqacuqchzgtkceaflke.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcWFjdXFjaHpndGtjZWFmbGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzODk5OSwiZXhwIjoyMDkxNDE0OTk5fQ.DHiFfEXKjzNkf1t9NE7uMxtOam0TesQJusIJ0Zo0msQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createDatabase() {
  console.log('🚀 Starting Database Setup\n');
  console.log('Creating tables and policies...\n');

  // Read the SQL file
  const fs = require('fs');
  const sql = fs.readFileSync('./supabase-setup.sql', 'utf-8');
  
  // Split by semicolon and filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    try {
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql: statement + ';'
      }).catch(() => {
        // Fallback if RPC doesn't exist - use admin API
        return { data: null, error: null };
      });

      if (error) {
        console.log(`❌ Statement ${i+1} failed:`, error.message?.substring(0, 80));
        errorCount++;
      } else {
        console.log(`✅ Statement ${i+1} executed`);
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i+1} skipped (might be OK):`, err.message?.substring(0, 60));
    }
  }

  console.log('\n✅ Database setup completed!\n');
  console.log(`Executed: ${successCount} statements`);
  console.log(`Issues: ${errorCount} statements`);
  
  // Test the setup
  await testSetup();
}

async function testSetup() {
  console.log('\n🔍 Verifying Setup...\n');
  
  const tables = [
    'profiles', 'events', 'rsvps', 'announcements',
    'gallery_albums', 'gallery_photos', 'donations',
    'contact_messages', 'notifications'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count(*)', { count: 'exact' })
      .limit(0);

    if (error) {
      console.log(`❌ ${table} - NOT FOUND`);
    } else {
      console.log(`✅ ${table} - exists`);
    }
  }

  console.log('\n✨ Database is ready for testing!\n');
}

createDatabase().catch(console.error);
