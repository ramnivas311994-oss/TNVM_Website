const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lbuknswqxfeznyyvqzgir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidWtuc3dxeGZlem55dnF6Z2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjkwNzYsImV4cCI6MjA5MTM0NTA3Nn0.QUuRwhKLc7V2TC0d3-EDlJDL-ChwhBDKu2vJjyIkkj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');
  
  // Test 1: Can we reach Supabase?
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Auth session error:', error.message);
    } else {
      console.log('✅ Supabase connection OK');
    }
  } catch (e) {
    console.log('❌ Connection failed:', e.message);
  }

  // Test 2: List users (this should work if service role is available)
  console.log('\n🔎 Checking existing users in Supabase...');
  try {
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.log('❌ Cannot list users (this requires service role):', listError.message);
    } else {
      console.log('✅ Found', authUsers?.users?.length || 0, 'users');
      if (authUsers?.users?.length > 0) {
        console.log('\nExisting users:');
        authUsers.users.forEach(u => {
          console.log(`  - ${u.email} (confirmed: ${u.email_confirmed})`);
        });
      }
    }
  } catch (e) {
    console.log('❌ Error listing users:', e.message);
  }
}

testConnection();
