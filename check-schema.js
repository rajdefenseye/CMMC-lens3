// check-schema.js
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Initialize dotenv
config();

async function main() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
    
    // Try to get a row from the table to see its structure
    const { data, error } = await supabase
      .from('security_findings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying table:', error);
    } else {
      if (data && data.length > 0) {
        console.log('Table columns:', Object.keys(data[0]));
      } else {
        console.log('Table exists but has no rows. Trying to get column information...');
        
        // Try to get column information directly
        try {
          const { data: columns, error: columnsError } = await supabase.rpc('execute_sql', {
            sql_query: `
              SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = 'security_findings'
            `
          });
          
          if (columnsError) {
            console.error('Error getting columns:', columnsError);
          } else {
            console.log('Table columns from information_schema:', columns);
          }
        } catch (rpcError) {
          console.error('Error executing RPC:', rpcError);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();