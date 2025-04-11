// Updated test-supabase.js
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function testSupabaseInsertion() {
  try {
    console.log("Creating Supabase client");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log("Supabase client created successfully");
    
    // Test data with a unique ID we can search for
    const uniqueId = `test-${Date.now()}`;
    const testFinding = {
      finding_id: uniqueId,
      name: "Test Finding",
      category: "TEST",
      severity: "LOW",
      state: "ACTIVE",
      create_time: new Date().toISOString(),
      event_time: new Date().toISOString(),
      source_properties: { test: true },
      resource_name: "Test Resource",
      parent_name: `organizations/${process.env.GOOGLE_ORGANIZATION_ID}`,
      organization_id: process.env.GOOGLE_ORGANIZATION_ID
    };
    
    console.log("Attempting to insert test finding into Supabase");
    console.log("Unique ID for this test:", uniqueId);
    
    const { data: insertData, error: insertError } = await supabase
      .from('security_findings')
      .insert([testFinding])
      .select();
    
    if (insertError) {
      console.error("Error inserting into Supabase:", insertError);
    } else {
      console.log("Insert response:", insertData);
    }
    
    // Verify the insertion by querying for the record
    console.log("Verifying insertion by querying for the record...");
    const { data: queryData, error: queryError } = await supabase
      .from('security_findings')
      .select('*')
      .eq('finding_id', uniqueId);
    
    if (queryError) {
      console.error("Error querying Supabase:", queryError);
    } else {
      console.log("Query response:", queryData);
      if (queryData.length > 0) {
        console.log("Record found in database!");
      } else {
        console.log("Record NOT found in database!");
      }
    }
    
    // List all records in the table
    console.log("Listing all records in the table...");
    const { data: allData, error: allError } = await supabase
      .from('security_findings')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error("Error listing records:", allError);
    } else {
      console.log(`Found ${allData.length} records in the table`);
      if (allData.length > 0) {
        console.log("Sample record:", allData[0]);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testSupabaseInsertion();