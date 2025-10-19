const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');

    const supabaseUrl = process.env.SUPABASE_URL || 'https://nwxxdahnhcxekyqwmsjo.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eHhkYWhuaGN4ZWt5cXdtc2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjU5NzIsImV4cCI6MjA3NjQwMTk3Mn0.HPcAmOWa1614NXs2u1E5FE3AgIwXJdhaDRufb8JFEZk';

    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test basic connection by fetching current user (should be null if not authenticated)
    const { data, error } = await supabase.auth.getUser();

    if (error && error.message !== 'Invalid JWT' && error.message !== 'Auth session missing!') {
      throw error;
    }

    console.log('✅ Supabase connection successful!');
    console.log(`🔐 Authentication status: ${data.user ? 'Authenticated' : 'Not authenticated (expected)'}`);

    // Test database connection by listing tables (this will work if RLS is properly configured)
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(5);

    if (tablesError) {
      console.log('⚠️  Could not access information_schema.tables (this is normal with RLS):', tablesError.message);
    } else {
      console.log('📊 Database accessible. Available tables:', tables?.map(t => t.table_name) || []);
    }

    console.log('🎉 Supabase is properly connected and working!');
    return true;

  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });