import fs from 'node:fs/promises';
import path from 'node:path';

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

const extensionFor = (fileName: string, mimeType: string) => {
  const fromName = path.extname(fileName || '').toLowerCase();
  if (/^\.[a-z0-9]+$/.test(fromName)) return fromName.slice(1);
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'video/mp4') return 'mp4';
  if (mimeType === 'video/webm') return 'webm';
  if (mimeType === 'video/ogg') return 'ogg';
  return '';
};

const safeBaseName = (name: string) =>
  String(name || 'asset')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 64) || 'asset';

const parseMultipartAsset = (contentType: string, buffer: Buffer) => {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) {
    const error: any = new Error('Missing multipart boundary.');
    error.status = 422;
    error.code = 'LANDING_ASSET_UPLOAD_INVALID';
    throw error;
  }

  const delimiter = Buffer.from(`--${boundary}`);
  let cursor = buffer.indexOf(delimiter);
  while (cursor !== -1) {
    const next = buffer.indexOf(delimiter, cursor + delimiter.length);
    if (next === -1) break;
    const part = buffer.subarray(cursor + delimiter.length, next);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd !== -1) {
      const headers = part.subarray(0, headerEnd).toString('utf8');
      const partName = /name=(?:"([^"]+)"|([^;\r\n]+))/i.exec(headers);
      if ((partName?.[1] || partName?.[2]) === 'file') {
        const filename = /filename=(?:"([^"]+)"|([^;\r\n]+))/i.exec(headers);
        const mimeType = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim().toLowerCase() || '';
        return {
          filename: filename?.[1] || filename?.[2] || 'asset',
          mimeType,
          content: part.subarray(headerEnd + 4, part.length - 2),
        };
      }
    }
    cursor = next;
  }

  const error: any = new Error('Archivo requerido.');
  error.status = 400;
  error.code = 'LANDING_ASSET_UPLOAD_MISSING_FILE';
  throw error;
};

export const uploadLandingAsset = async (contentType: string, buffer: Buffer) => {
  const parsed = parseMultipartAsset(contentType, buffer);
  if (!allowedTypes.has(parsed.mimeType)) {
    const error: any = new Error('Solo se permiten imagenes y videos web.');
    error.status = 415;
    error.code = 'LANDING_ASSET_UPLOAD_UNSUPPORTED_MEDIA_TYPE';
    throw error;
  }
  if (parsed.content.length > maxBytes) {
    const error: any = new Error('El archivo supera 25 MB.');
    error.status = 413;
    error.code = 'LANDING_ASSET_UPLOAD_FILE_TOO_LARGE';
    throw error;
  }

  const extension = extensionFor(parsed.filename, parsed.mimeType);
  const publicDir = path.resolve(process.env.BUSINESS_UPLOADS_DIR || path.join(process.cwd(), 'uploads'), 'landing');
  await fs.mkdir(publicDir, { recursive: true });
  const fileName = `${Date.now()}-${safeBaseName(parsed.filename)}.${extension}`;
  const filePath = path.join(publicDir, fileName);
  await fs.writeFile(filePath, parsed.content);
  const stats = await fs.stat(filePath);
  if (!stats.isFile() || stats.size !== parsed.content.length) {
    const error: any = new Error('No se pudo verificar el archivo subido.');
    error.status = 500;
    error.code = 'LANDING_ASSET_UPLOAD_VERIFY_FAILED';
    throw error;
  }

  return {
    url: `/uploads/landing/${fileName}`,
    fileName,
    contentType: parsed.mimeType,
    size: stats.size,
  };
};
