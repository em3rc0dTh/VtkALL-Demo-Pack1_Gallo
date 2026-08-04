import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { uploadLandingAsset } from '../../services/landing/landingAssetUpload.service';

const multipart = (boundary: string, fieldName: string, fileName: string, contentType: string, content: Buffer) => Buffer.concat([
  Buffer.from(`--${boundary}\r\n`),
  Buffer.from(`Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n`),
  Buffer.from(`Content-Type: ${contentType}\r\n\r\n`),
  content,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

const run = async () => {
  const uploadsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'landing-assets-'));
  process.env.BUSINESS_UPLOADS_DIR = uploadsDir;
  const boundary = '----landing-asset-test';
  const content = Buffer.from('fake-png-content');
  const result = await uploadLandingAsset(
    `multipart/form-data; boundary=${boundary}`,
    multipart(boundary, 'file', 'iris-avatar.png', 'image/png', content),
  );

  assert.match(result.url, /^\/uploads\/landing\/\d+-iris-avatar\.png$/);
  assert.equal(result.contentType, 'image/png');
  assert.equal(result.size, content.length);
  const saved = await fs.stat(path.join(uploadsDir, result.url.replace('/uploads/', '')));
  assert.equal(saved.isFile(), true);
  assert.equal(saved.size, content.length);

  await assert.rejects(
    () => uploadLandingAsset(
      `multipart/form-data; boundary=${boundary}`,
      multipart(boundary, 'file', 'avatar.txt', 'text/plain', Buffer.from('x')),
    ),
    /Solo se permiten imagenes y videos web/,
  );

  console.log('Landing asset upload acceptance passed.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
