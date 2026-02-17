const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const getTableName = () => process.env.DB_TABLE_NAME;

module.exports = { supabase, getTableName };
