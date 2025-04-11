// Replace the hardcoded credentials with environment variables
const credentials = {
  projectId: Deno.env.get('GOOGLE_PROJECT_ID') || 'd5assistant',
  credentials: {
    client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL') || '',
    private_key: Deno.env.get('GOOGLE_PRIVATE_KEY') || ''
  }
};

// Replace hardcoded organization ID with environment variable
const organizationId = Deno.env.get('GOOGLE_ORGANIZATION_ID') || '382379904232';

// Then update the listFindings call
const [findings] = await securityCenter.listFindings({
  parent: `organizations/${organizationId}/sources/-`,
  filter: 'state="ACTIVE"'
});