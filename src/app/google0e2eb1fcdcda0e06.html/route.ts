export const dynamic = 'force-static';

export async function GET() {
  return new Response('google-site-verification: google0e2eb1fcdcda0e06.html', {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
