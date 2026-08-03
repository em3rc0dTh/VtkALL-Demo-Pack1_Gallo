import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg',
]);

const maxBytes = 25 * 1024 * 1024;

const extensionFor = (file) => {
  const fromName = path.extname(file.name || '').toLowerCase();
  if (/^\.[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/jpeg') return '.jpg';
  if (file.type === 'image/png') return '.png';
  if (file.type === 'image/webp') return '.webp';
  if (file.type === 'image/gif') return '.gif';
  if (file.type === 'video/mp4') return '.mp4';
  if (file.type === 'video/webm') return '.webm';
  if (file.type === 'video/ogg') return '.ogg';
  return '';
};

const safeBaseName = (name) =>
  String(name || 'asset')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 64) || 'asset';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ ok: false, code: 'MISSING_FILE', message: 'Archivo requerido.' }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return Response.json({ ok: false, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Solo se permiten imagenes y videos web.' }, { status: 415 });
  }

  if (file.size > maxBytes) {
    return Response.json({ ok: false, code: 'FILE_TOO_LARGE', message: 'El archivo supera 25 MB.' }, { status: 413 });
  }

  const ext = extensionFor(file);
  const baseName = safeBaseName(file.name);
  const fileName = `${Date.now()}-${baseName}${ext}`;
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'landing');
  const targetPath = path.join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

  return Response.json({
    ok: true,
    data: {
      url: `/uploads/landing/${fileName}`,
      fileName,
      contentType: file.type,
      size: file.size,
    },
  });
}
