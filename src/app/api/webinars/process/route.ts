import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import OpenAI from 'openai';
import { createCanvas, ImageData, Image, registerFont, loadImage } from 'canvas';
import { readPsd, writePsd, initializeCanvas } from 'ag-psd';
import { updateJob, getJob } from '@/lib/jobs-store';

const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'templates');
const FONT_PATH = path.join(TEMPLATE_DIR, 'druktextwidecyr-medium.ttf');

// --- ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ ДО ХОЛСТА (Железобетонный метод) ---
const FONT_FAMILY = 'AntigravityFont';
if (fs.existsSync(FONT_PATH)) {
    try {
        registerFont(FONT_PATH, { family: FONT_FAMILY });
        console.log(`[System] Font registered globally: ${FONT_FAMILY}`);
    } catch (e) {
        console.error('[System] Global font registration failed:', e);
    }
}

// Initialize canvas for ag-psd (required in Node.js for text/image operations)
initializeCanvas(createCanvas as any, (w, h) => new ImageData(w, h) as any);

let isFontRegistered = true; // Mark as done since we did it globally

const TMP_DIR = path.join(process.cwd(), 'tmp');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-') // Remove invalid chars
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .trim();
}

// Helper: Recursively find and update a text layer in PSD
function updateTextLayer(layers: any[], targetLayerName: string, newText: string): boolean {
  for (const layer of layers) {
    if (layer.name === targetLayerName && (layer.type === 'text' || layer.text)) {
      if (layer.text) {
        layer.text.text = newText;
        return true;
      }
    }
    if (layer.children) {
      if (updateTextLayer(layer.children, targetLayerName, newText)) {
        return true;
      }
    }
  }
  return false;
}

// Helper: run ffmpeg as a Promise with progress support
function runFfmpeg(
  command: ffmpeg.FfmpegCommand,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    command
      .on('progress', (progress) => {
        if (onProgress && progress.percent !== undefined) {
          onProgress(progress.percent);
        }
      })
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

// Helper: get video duration
function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

export async function POST(request: NextRequest) {
  let jobId = '';
  try {
    const body = await request.json();
    jobId = body.jobId;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = getJob(jobId);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobDir = path.join(TMP_DIR, jobId);

    // Find the original file
    const files = fs.readdirSync(jobDir);
    const originalFile = files.find((f) => f.startsWith('original'));
    if (!originalFile) {
      return Response.json({ error: 'Original file not found' }, { status: 404 });
    }

    const inputPath = path.join(jobDir, originalFile);
    const renderedPath = path.join(jobDir, 'rendered.mp4');
    const audioPath = path.join(jobDir, 'audio.mp3');

    // ==========================================
    // STEP 0.5: Generate Webinar Cover (Antigravity Render v2.0)
    // ==========================================
    try {
      const BACKGROUND_PATH = path.join(TEMPLATE_DIR, 'background.png');
      if (fs.existsSync(BACKGROUND_PATH)) {
        console.log(`[Render] Starting Canvas generation for ${jobId}...`);
        
        const bgImage = await loadImage(BACKGROUND_PATH);
        const canvas = createCanvas(bgImage.width, bgImage.height);
        const ctx = canvas.getContext('2d');

        // 1. Draw pure background
        ctx.drawImage(bgImage, 0, 0);

        // 2. Register font (Self-healing registration)
        if (!isFontRegistered && fs.existsSync(FONT_PATH)) {
          try {
            registerFont(FONT_PATH, { family: FONT_FAMILY });
            isFontRegistered = true;
          } catch (e) { 
            console.error('[Render] Font registration failed:', e); 
          }
        }

        if (job.coverDate) {
          ctx.save();

          // FULL TRANSFORM MATRIX (Derived from PSD diagnostics for Skew + Rotation + Scale)
          const a = 1.6920234010259916;
          const b = -0.176767846213198;
          const c = 0.01694748564273534;
          const d = 1.700746352813113;
          let tx = 640; // Forced center for 1280px width
          const ty = 459.436; // Constant Y position from PSD

          // Apply Skew, Scale, and Rotate in one go
          ctx.setTransform(a, b, c, d, tx, ty);

          // 4. DROP SHADOW (Photoshop style)
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 6;

          // 5. SMART FONT RESIZE
          let fSize = 84;
          const maxW = 1100; // Safe width within 1280p template
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.font = `${fSize}px 'AntigravityFont'`;
          // Note: text width measurement is affected by the current transform scale (a ~ 1.7x)
          while (ctx.measureText(job.coverDate).width > maxW && fSize > 40) {
            fSize -= 2;
            ctx.font = `${fSize}px 'AntigravityFont'`;
          }

          // 6. DRAW TEXT (at relative 0,0 due to translate in transform)
          ctx.fillText(job.coverDate, 0, 0);
          
          ctx.restore();
        }

        const pngFilename = `cover_${jobId}.png`;
        fs.writeFileSync(path.join(UPLOADS_DIR, pngFilename), canvas.toBuffer('image/png'));
        updateJob(jobId, { coverUrl: `/uploads/${pngFilename}` });
        console.log(`[Render] Finished cover generation: ${pngFilename}`);
      }
    } catch (renderErr) {
      console.error('[Antigravity Render] Failed:', renderErr);
    }

    // ==========================================
    // STEP 1: Rendering + Audio extraction (parallel)
    // ==========================================
    const needsRender = !fs.existsSync(renderedPath) || !fs.existsSync(audioPath);

    if (needsRender) {
      updateJob(jobId, { status: 'rendering', progress: 0 });

      const duration = await getVideoDuration(inputPath).catch(() => 0);
      updateJob(jobId, { duration });

      const renderCommand = ffmpeg(inputPath)
        .size('1920x1080')
        .autopad()
        .videoCodec('libx264')
        .outputOptions(['-preset fast', '-crf 23'])
        .output(renderedPath);

      const audioCommand = ffmpeg(inputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioChannels(1)
        .audioBitrate('32k')
        .output(audioPath);

      await Promise.all([
        runFfmpeg(renderCommand, (percent) => {
          // Slow down updates to avoid disk thrashing
          updateJob(jobId, { progress: Math.round(percent) });
        }),
        runFfmpeg(audioCommand),
      ]);
    } else {
      console.log(`Skipping rendering for jobId ${jobId}, files already exist.`);
    }

    // ==========================================
    // STEP 2: Transcribe (Chunked OpenAI Whisper)
    // ==========================================
    updateJob(jobId, { status: 'transcribing' });
    
    // Create chunks directory
    const chunksDir = path.join(jobDir, 'chunks');
    if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir);

    // Split into 15-minute (900s) chunks
    await new Promise((resolve, reject) => {
      ffmpeg(audioPath)
        .outputOptions([
          '-f segment',
          '-segment_time 900',
          '-reset_timestamps 1',
          '-c copy'
        ])
        .output(path.join(chunksDir, 'chunk_%d.mp3'))
        .on('progress', (progress) => {
          if (progress.percent) {
            updateJob(jobId, { progress: Math.round(progress.percent) });
          }
        })
        .on('end', () => {
          updateJob(jobId, { progress: 100 });
          resolve(true);
        })
        .on('error', reject)
        .run();
    });

    const chunkFiles = fs.readdirSync(chunksDir).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });

    console.log(`Processing ${chunkFiles.length} chunks with OpenAI Whisper...`);
    let fullTranscription = '';
    updateJob(jobId, { progress: 0 });

    for (const [index, chunkFile] of chunkFiles.entries()) {
      const chunkPath = path.join(chunksDir, chunkFile);
      console.log(`Transcribing chunk ${index + 1}/${chunkFiles.length}: ${chunkFile}`);
      
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(chunkPath),
          model: 'whisper-1',
          language: 'ru',
        });
        fullTranscription += transcription.text + ' ';
        
        // Update progress per chunk
        const currentProgress = Math.round(((index + 1) / chunkFiles.length) * 100);
        updateJob(jobId, { progress: currentProgress });
      } catch (err) {
        console.error(`Error transcribing chunk ${chunkFile}:`, err);
      }
    }

    if (!fullTranscription.trim()) {
      throw new Error('Transcription failed: No text was generated from any chunks.');
    }

    // ==========================================
    // STEP 3: OpenAI Assistant Analysis
    // ==========================================
    updateJob(jobId, { status: 'analyzing', progress: 10 });

    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID is not configured');
    }

    // Save transcription to a temporary file
    const transFilePath = path.join(jobDir, 'transcription.txt');
    fs.writeFileSync(transFilePath, fullTranscription);

    // Upload to OpenAI
    const file = await openai.files.create({
      file: fs.createReadStream(transFilePath),
      purpose: 'assistants',
    });

    // Create a thread and send the transcription as an attachment
    const thread = await openai.beta.threads.create();
    
    const systemPrompt = `Ты — контент-ассистент образовательного клуба. 
По загруженной транскрибации вебинара ты обязан выдавать результат СТРОГО В ФОРМАТЕ JSON.

Структура JSON-объекта:
{
  "title": "Название вебинара",
  "description": "Краткое описание (3-6 предложений)",
  "timecodes": "Тайм-коды (каждый тайм-код СТРОГО с новой строки через \\n)",
  "postDescription": "Готовый Telegram-пост",
  "tags": ["тег1", "тег2"]
}

ВАЖНО:
1. В поле "timecodes" каждый пункт должен начинаться с новой строки (используй символ переноса строки \\n).
2. Ответ должен быть СТРОГО валидным JSON, без markdown-разметки (\`\`\`json) и лишнего текста.
...`;

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: systemPrompt,
      attachments: [{ file_id: file.id, tools: [{ type: 'file_search' }] }],
    });

    // Add a progress update interval for analysis as it can be slow
    const analysisProgressInterval = setInterval(() => {
      const currentJob = getJob(jobId);
      if (currentJob && currentJob.status === 'analyzing' && (currentJob.progress || 0) < 90) {
        updateJob(jobId, { progress: (currentJob.progress || 0) + 5 });
      } else {
        clearInterval(analysisProgressInterval);
      }
    }, 5000);

    // Initial check loop for run completion
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      run = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
    }

    clearInterval(analysisProgressInterval);

    // Cleanup: Delete the file from OpenAI
    await openai.files.delete(file.id).catch(console.error);

    if (run.status !== 'completed') {
      throw new Error(`Assistant run failed with status: ${run.status}`);
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find((m) => m.role === 'assistant');
    let responseText =
      assistantMessage?.content?.[0]?.type === 'text'
        ? assistantMessage.content[0].text.value
        : '';

    // Remove markdown code blocks if the assistant included them
    responseText = responseText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();

    // Parse the response
    let title = '';
    let description = '';
    let timecodes = '';
    let postDescription = '';
    let tags: string[] = [];

    try {
      const parsed = JSON.parse(responseText);
      title = parsed.title || '';
      description = parsed.description || '';
      timecodes = parsed.timecodes || '';
      postDescription = parsed.post || '';
      tags = Array.isArray(parsed.tags) ? parsed.tags : [];
    } catch (e) {
      console.error('JSON Parse error, falling back to raw text:', e);
      postDescription = responseText;
    }

    // ==========================================
    // STEP 4: Move rendered video & cleanup
    // ==========================================
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    
    // Determine final filename based on project title
    const safeTitle = sanitizeFilename(job.projectTitle || job.title || jobId);
    const finalFilename = `${safeTitle}.mp4`;
    const finalVideoPath = path.join(UPLOADS_DIR, finalFilename);
    const renderedUrl = `/uploads/${finalFilename}`;

    // Check if the file exists before copying (rendering might have been skipped)
    if (fs.existsSync(renderedPath)) {
      // If file with same name exists, we might want to append jobId or overwrite.
      // User asked for the name, so we overwrite or just use it.
      fs.copyFileSync(renderedPath, finalVideoPath);
    }

    // Clean up tmp files
    fs.rmSync(jobDir, { recursive: true, force: true });

    // Update job with results
    updateJob(jobId, {
      status: 'done',
      renderedUrl,
      title,
      description,
      timecodes,
      postDescription,
      tags,
    });

    return Response.json({
      status: 'done',
      title,
      description,
      timecodes,
      postDescription,
      tags,
      renderedUrl,
    });
  } catch (error) {
    console.error('Process error:', error);
    if (jobId) {
      updateJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
