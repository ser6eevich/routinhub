import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { saveJob, updateJob } from '@/lib/jobs-store';
import { Job } from '@/lib/types';

const TMP_DIR = path.join(process.cwd(), 'tmp');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const videoUrl = formData.get('videoUrl') as string | null;
    const projectTitle = formData.get('projectTitle') as string | null;
    const coverDate = formData.get('coverDate') as string | null;

    if (!file && !videoUrl) {
      return Response.json({ error: 'No video file or URL provided' }, { status: 400 });
    }

    const jobId = uuidv4();
    const jobDir = path.join(TMP_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    let originalName = '';
    let ext = '.mp4';

    if (file) {
      originalName = file.name;
      ext = path.extname(file.name) || '.mp4';
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(path.join(jobDir, `original${ext}`), Buffer.from(arrayBuffer));
    } else if (videoUrl) {
      let downloadUrl = videoUrl;
      originalName = videoUrl.split('/').pop() || 'video.mp4';

      // Yandex Disk Support
      if (videoUrl.includes('disk.yandex.ru') || videoUrl.includes('yadi.sk')) {
        try {
          const apiRes = await fetch(`https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(videoUrl)}`);
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.href) {
              downloadUrl = data.href;
              const urlParams = new URLSearchParams(downloadUrl.split('?')[1]);
              const nameParam = urlParams.get('filename');
              if (nameParam) originalName = nameParam;
            }
          }
        } catch (e) {
          console.error('Yandex Disk resolve error:', e);
        }
      }

      if (!originalName.includes('.')) originalName += '.mp4';
      ext = path.extname(originalName) || '.mp4';
      
      // Keep only the visual status update
      const job: Job = {
        id: jobId,
        status: 'downloading',
        originalName,
        projectTitle: projectTitle || undefined,
        coverDate: coverDate || undefined,
        videoUrl: videoUrl || undefined,
        createdAt: new Date().toISOString(),
      };
      saveJob(job);

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
      
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;
      let lastUpdate = 0;

      const dest = fs.createWriteStream(path.join(jobDir, `original${ext}`));
      const reader = response.body?.getReader();
      
      if (!reader) {
        // Fallback if reader is not available (should not happen in node 18+)
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(path.join(jobDir, `original${ext}`), Buffer.from(arrayBuffer));
      } else {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          loaded += value.length;
          dest.write(value);
          
          if (total > 0) {
            const progress = Math.round((loaded / total) * 100);
            // Update store every 1% for smoother UI
            if (progress >= lastUpdate + 1 || progress === 100) {
              lastUpdate = progress;
              updateJob(jobId, { progress });
            }
          }
        }
        dest.end();
      }
      
      return Response.json({ jobId, originalName });
    }

    // Create job record (for file upload case)
    const job: Job = {
      id: jobId,
      status: 'uploading',
      originalName,
      projectTitle: projectTitle || undefined,
      coverDate: coverDate || undefined,
      videoUrl: videoUrl || undefined,
      createdAt: new Date().toISOString(),
    };
    saveJob(job);

    return Response.json({ jobId, originalName });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
