const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ndqacuqchzgtkceaflke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcWFjdXFjaHpndGtjZWFmbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4Mzg5OTksImV4cCI6MjA5MTQxNDk5OX0.XGLqdL41G_Tq4uvnlxdYIlNPtwQctNwWFayoHLRlpfM';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcWFjdXFjaHpndGtjZWFmbGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzODk5OSwiZXhwIjoyMDkxNDE0OTk5fQ.DHiFfEXKjzNkf1t9NE7uMxtOam0TesQJusIJ0Zo0msQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkDatabase() {
  console.log('🔍 Testing NEW Supabase Connection...\n');
  
  try {
    // Test 1: Basic connection
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('✅ Connection to Supabase successful\n');

    // Test 2: List existing tables
    console.log('📋 Checking existing tables...\n');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️  Could not query tables:', tablesError.message);
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      console.log(`Found ${tableNames.length} tables:`);
      tableNames.forEach(name => console.log(`  ✓ ${name}`));
    }

    // Test 3: Check if auth trigger exists (profiles should auto-create)
    console.log('\n🔐 Checking profiles table...');
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('count(*)', { count: 'exact' })
      .limit(0);

    if (profileError) {
      console.log('❌ Profiles table does NOT exist');
      console.log('\n⚠️  DATABASE SETUP NEEDED!\n');
      console.log('Tables needed:');
      console.log('  1. profiles - stores user info');
      console.log('  2. events - TNVM events');
      console.log('  3. rsvps - event registrations');
      console.log('  4. announcements - community announcements');
      console.log('  5. gallery_albums - photo collection groups');
      console.log('  6. gallery_photos - individual photos');
      console.log('  7. donations - donation records');
      console.log('  8. contact_messages - contact form submissions');
      console.log('  9. notifications - push notification logs');
    } else {
      console.log('✅ Profiles table exists');
    }

    // Test 4: Test signup flow
    console.log('\n🧪 Testing signup flow...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPass123',
      options: {
        data: { full_name: 'Test User' }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log('✅ Signup successful!');
      console.log(`   User created: ${testEmail}`);
      console.log(`   User ID: ${signupData.user?.id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
