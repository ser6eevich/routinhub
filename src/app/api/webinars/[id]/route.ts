import { NextRequest } from 'next/server';
import { getJob, deleteJob } from '@/lib/jobs-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
  return Response.json(job);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteJob(id);
  return Response.json({ success: true });
}
