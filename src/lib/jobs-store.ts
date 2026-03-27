import fs from 'fs';
import path from 'path';
import { Job } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, '[]', 'utf-8');
  }
}

export function getJobs(): Job[] {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(JOBS_FILE, 'utf8');
    return JSON.parse(raw) as Job[];
  } catch (err) {
    console.error('Error reading jobs:', err);
    return [];
  }
}

export function getJob(id: string): Job | undefined {
  const jobs = getJobs();
  return jobs.find((j) => j.id === id);
}

export function saveJob(job: Job): void {
  try {
    ensureDataDir();
    const jobs = getJobs();
    jobs.push(job);
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error saving job ${job.id}:`, err);
  }
}

export function updateJob(id: string, patch: Partial<Job>): void {
  try {
    ensureDataDir();
    const jobs = getJobs();
    const idx = jobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      jobs[idx] = { ...jobs[idx], ...patch };
      fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf8');
    }
  } catch (err) {
    console.error(`Error updating job ${id}:`, err);
  }
}

export function deleteJob(id: string): void {
  try {
    ensureDataDir();
    const jobs = getJobs();
    const filtered = jobs.filter((j) => j.id !== id);
    fs.writeFileSync(JOBS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error deleting job ${id}:`, err);
  }
}
