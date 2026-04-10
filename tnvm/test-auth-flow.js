const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lbuknswqxfeznyyvqzgir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidWtuc3dxeGZlem55dnF6Z2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjkwNzYsImV4cCI6MjA5MTM0NTA3Nn0.QUuRwhKLc7V2TC0d3-EDlJDL-ChwhBDKu2vJjyIkkj4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthFlow() {
  console.log('🧪 Testing Auth Flow...\n');

  // Generate unique email for test
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';

  console.log(`📝 Test Email: ${testEmail}`);
  console.log(`🔐 Test Password: ${testPassword}\n`);

  // Test 1: Try Sign Up
  console.log('1️⃣  Attempting SIGN UP...');
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: 'Test User' }
    }
  });

  if (signupError) {
    console.log('❌ Sign up failed:', signupError.message);
    console.log('Error code:', signupError.code);
    return;
  }

  if (!signupData.user) {
    console.log('❌ No user returned from signup');
    return;
  }

  console.log('✅ Sign up successful!');
  console.log('   User ID:', signupData.user.id);
  console.log('   Email:', signupData.user.email);
  console.log('   Email confirmed:', signupData.user.email_confirmed);
  console.log('   User metadata:', signupData.user.user_metadata);

  // Test 2: Try Sign In
  console.log('\n2️⃣  Attempting SIGN IN...');
  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signinError) {
    console.log('❌ Sign in failed:', signinError.message);
    console.log('Error code:', signinError.code);
    return;
  }

  console.log('✅ Sign in successful!');
  console.log('   Access token:', signinData.session?.access_token?.substring(0, 20) + '...');
  console.log('   Session valid:', !!signinData.session);
}

testAuthFlow().catch(console.error);
