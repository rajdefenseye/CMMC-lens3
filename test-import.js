// test-import.js
import { config } from 'dotenv';
import { SecurityCenterClient } from '@google-cloud/security-center';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize dotenv
config();

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Starting import process...');
  
  try {
    // Set the credentials file path to your existing file
    const credentialsPath = path.join(__dirname, 'd5assistant-6c0b4c1a871e.json');
    
    // Set environment variable to point to credentials file
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    console.log(`Using credentials file: ${credentialsPath}`);
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
    
    // Initialize Security Center client
    console.log('Initializing Security Center client...');
    const securityCenter = new SecurityCenterClient({
      keyFilename: credentialsPath,
      projectId: 'd5assistant'
    });
    console.log('Security Center client initialized');
    
    // Get organization ID from environment or use default
    const organizationId = process.env.GOOGLE_ORGANIZATION_ID || '382379904232';
    console.log(`Using organization ID: ${organizationId}`);
    
    // Set the parent resource for the request
    const parent = `organizations/${organizationId}/sources/-`;
    console.log(`Using parent: ${parent}`);
    
    // Test the connection by listing sources
    console.log('Testing connection by listing sources...');
    try {
      const [sources] = await securityCenter.listSources({
        parent: `organizations/${organizationId}`,
      });
      console.log(`Successfully connected! Found ${sources.length} sources.`);
    } catch (error) {
      console.error('Error listing sources:', error.message);
      console.log('Continuing with findings fetch anyway...');
    }
    
    // Get findings
    console.log('Fetching findings...');
    const [findings] = await securityCenter.listFindings({
      parent: parent,
      filter: 'state="ACTIVE"',
      pageSize: 10 // Start with a small number for testing
    });
    
    console.log(`Found ${findings.length} findings`);
    
    // Inspect the structure of the findings data
    console.log('Findings data structure:');
    if (findings.length > 0) {
      // Check if findings is an array of objects or something else
      console.log('Type of findings:', typeof findings);
      console.log('Is findings an array?', Array.isArray(findings));
      
      // Look at the first finding
      const firstFinding = findings[0];
      console.log('First finding type:', typeof firstFinding);
      
      if (firstFinding) {
        console.log('First finding keys:', Object.keys(firstFinding));
        
        // Check if finding has a 'finding' property (nested structure)
        if (firstFinding.finding) {
          console.log('Finding is nested under "finding" property');
          console.log('Nested finding keys:', Object.keys(firstFinding.finding));
        }
        
        // Try to extract a finding ID safely
        let findingId = 'unknown';
        
        if (firstFinding.name) {
          console.log('Name property exists:', firstFinding.name);
          const findingIdMatch = firstFinding.name.match(/findings\/(.+)$/);
          findingId = findingIdMatch ? findingIdMatch[1] : firstFinding.name;
        } else if (firstFinding.finding && firstFinding.finding.name) {
          console.log('Nested name property exists:', firstFinding.finding.name);
          const findingIdMatch = firstFinding.finding.name.match(/findings\/(.+)$/);
          findingId = findingIdMatch ? findingIdMatch[1] : firstFinding.finding.name;
        } else {
          // Generate a random ID if we can't find one
          findingId = `unknown-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          console.log('No name property found, using generated ID:', findingId);
        }
        
        // Create a processed finding with safe property access
        const processedFinding = {
          finding_id: findingId,
          category: (firstFinding.category || firstFinding.finding?.category || ''),
          resource_name: (firstFinding.resourceName || firstFinding.finding?.resourceName || ''),
          severity: (firstFinding.severity || firstFinding.finding?.severity || ''),
          state: (firstFinding.state || firstFinding.finding?.state || ''),
          event_time: new Date().toISOString(), // Default to current time
          create_time: new Date().toISOString(), // Default to current time
          update_time: new Date().toISOString(),
          source_properties: (firstFinding.sourceProperties || firstFinding.finding?.sourceProperties || {}),
          parent_name: (firstFinding.parent || firstFinding.finding?.parent || ''),
          raw_finding: JSON.stringify(firstFinding)
        };
        
        console.log('Processed finding:', processedFinding);
        
        console.log('Inserting test finding into Supabase...');
        const { data, error } = await supabase
          .from('security_findings')
          .upsert([processedFinding], { onConflict: 'finding_id' });
        
        if (error) {
          console.error('Error inserting finding:', error);
        } else {
          console.log('Successfully inserted/updated test finding');
        }
      } else {
        console.log('First finding is undefined or null');
      }
    } else {
      console.log('No findings to process');
    }
    
    console.log('Test import completed successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

main();