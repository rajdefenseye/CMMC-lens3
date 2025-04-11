import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Synchronizes security findings from Google Cloud to Supabase
 * 
 * Triggers the sync-security-findings Edge Function to fetch and store
 * security findings for a specific user.
 * 
 * @param {string} userId - The ID of the user to sync findings for
 * @returns {Promise<Object>} The sync results containing success status and data
 * @throws {Error} If the sync operation fails
 */
export const syncSecurityFindings = async (userId: string) => {
  try {
    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('Failed to get user session');
    }

    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-security-findings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync security findings');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error syncing security findings:', error);
    throw error;
  }
};

/**
 * Retrieves security findings for a specific user
 * 
 * Fetches findings from the Supabase security_findings table,
 * ordered by severity and detection date.
 * 
 * @param {string} userId - The ID of the user to fetch findings for
 * @returns {Promise<Array>} Array of security findings
 * @throws {Error} If the database query fails
 */
export const getSecurityFindings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('security_findings')
      .select('*')
      .eq('user_id', userId)
      .order('severity', { ascending: false })
      .order('last_detected', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching security findings:', error);
    throw error;
  }
};