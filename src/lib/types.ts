export type JobStatus =
  | 'uploading'
  | 'downloading'
  | 'rendering'
  | 'transcribing'
  | 'analyzing'
  | 'done'
  | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  originalName: string;
  projectTitle?: string;
  customFilename?: string;
  videoUrl?: string;
  renderedUrl?: string;
  title?: string;
  description?: string;
  postDescription?: string;
  timecodes?: string;
  tags?: string[];
  coverDate?: string;
  coverUrl?: string;
  psdUrl?: string;
  error?: string;
  duration?: number;
  progress?: number;
  createdAt: string;
}
