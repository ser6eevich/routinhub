import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'templates', 'cover-template.png');

export async function POST(request: NextRequest) {
  try {
    const { title, date, jobId } = await request.json();

    if (!jobId) return Response.json({ error: 'jobId is required' }, { status: 400 });

    const width = 1280;
    const height = 720;

    let baseImage;
    if (fs.existsSync(TEMPLATE_PATH)) {
      baseImage = sharp(TEMPLATE_PATH).resize(width, height);
    } else {
      // Fallback to generated gradient if no template provided
      baseImage = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        }
      });
    }

    const background = await baseImage
    .composite([
      {
        input: Buffer.from(`
          <svg width="${width}" height="${height}">
            <text x="80" y="400" font-family="Inter, sans-serif" font-size="84" font-weight="900" fill="white" style="font-style: italic;">
              ${title.toUpperCase()}
            </text>
            <rect x="80" y="440" width="120" height="8" fill="#4f46e5" rx="4" />
            <text x="80" y="520" font-family="Inter, sans-serif" font-size="48" font-weight="700" fill="#94a3b8">
              ${date}
            </text>
          </svg>
        `),
        top: 0,
        left: 0,
      }
    ])
    .png()
    .toBuffer();

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const coverFilename = `cover_${jobId}.png`;
    const coverPath = path.join(UPLOADS_DIR, coverFilename);
    fs.writeFileSync(coverPath, background);

    return Response.json({ coverUrl: `/uploads/${coverFilename}` });
  } catch (error: any) {
    console.error('Cover generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
