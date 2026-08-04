export const runtime = 'nodejs';

const backendBaseUrl = (process.env.NEXT_BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_DEMO_TEST_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function POST(request) {
  const formData = await request.formData();
  const response = await fetch(`${backendBaseUrl}/api/v1/admin/landing-assets`, {
    method: 'POST',
    headers: {
      'X-Demo-Test-Admin-Token': process.env.NEXT_PUBLIC_DEMO_TEST_ADMIN_WRITE_TOKEN || 'local-dev-admin',
    },
    body: formData,
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
    },
  });
}
