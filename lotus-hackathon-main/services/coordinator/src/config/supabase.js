const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

/**
 * Supabase Client Configuration
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  logger.info('Supabase client initialized', {
    url: supabaseUrl,
    hasKey: !!supabaseKey
  });
} else {
  logger.warn('Supabase credentials not found - using in-memory storage', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
}

module.exports = supabase;


