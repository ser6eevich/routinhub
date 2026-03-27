import { getJobs } from '@/lib/jobs-store';

export async function GET() {
  const jobs = getJobs();
  // Return most recent first
  const sorted = jobs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return Response.json(sorted);
}
