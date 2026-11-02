const { createClient } = require('@supabase/supabase-js');

const missing = [];
if (!process.env.SUPABASE_URL?.trim()) missing.push('SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length) {
  const message = `Supabase is not configured. Missing: ${missing.join(', ')}`;

  console.warn(`\nWarning: ${message}`);
  console.warn('Database-backed API routes will return 503 until .env is completed.\n');

  const throwMissingConfig = () => {
    const error = new Error(message);
    error.statusCode = 503;
    throw error;
  };

  module.exports = new Proxy({}, {
    get: () => throwMissingConfig,
  });
} else {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // service role — server-side only, never expose to client
  );

  module.exports = supabase;
}
