import assert from 'node:assert/strict';
import {
  parseAndValidateBusinessLogoUpload,
  validateBusinessProfileSettingsPatch,
} from '../../services/businessProfileSettings.service';

const multipart = (mimeType: string, content: Buffer, filename = 'logo.png') => {
  const boundary = '----demo-test-logo-boundary';
  const head = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="logo"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    '',
    '',
  ].join('\r\n');
  const tail = `\r\n--${boundary}--\r\n`;
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([Buffer.from(head), content, Buffer.from(tail)]),
  };
};

const assertRejectsLogoUrl = (logoUrl: unknown) => {
  assert.throws(() => validateBusinessProfileSettingsPatch({
    expectedVersion: 1,
    changes: {
      brand: { logoUrl },
    },
  }));
};

validateBusinessProfileSettingsPatch({
  expectedVersion: 1,
  changes: {
    brand: {
      displayName: 'Turagua Racing Peru',
    },
  },
});

validateBusinessProfileSettingsPatch({
  expectedVersion: 1,
  changes: {
    brand: {
      logoUrl: '/uploads/business/turagua/logo-1785791234.webp',
    },
  },
});

validateBusinessProfileSettingsPatch({
  expectedVersion: 1,
  changes: {
    branding: {
      logoUrl: '/uploads/business/turagua/logo-1785791234.webp',
    },
  },
});

assertRejectsLogoUrl('');
assertRejectsLogoUrl('blob:http://localhost:3000/logo');
assertRejectsLogoUrl('data:image/png;base64,abc');
assertRejectsLogoUrl('C:\\fakepath\\logo.png');
assertRejectsLogoUrl({ name: 'logo.png', type: 'image/png' });

for (const [mimeType, extension] of [
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
] as const) {
  const upload = multipart(mimeType, Buffer.from('demo-image-bytes'), `logo.${extension}`);
  const parsed = parseAndValidateBusinessLogoUpload(upload.contentType, upload.body);
  assert.equal(parsed.mimeType, mimeType);
  assert.equal(parsed.extension, extension);
}

assert.throws(
  () => {
    const upload = multipart('application/pdf', Buffer.from('%PDF-1.4'), 'logo.pdf');
    parseAndValidateBusinessLogoUpload(upload.contentType, upload.body);
  },
  /PNG, JPEG o WebP/
);

assert.throws(
  () => {
    const upload = multipart('image/png', Buffer.alloc((3 * 1024 * 1024) + 1), 'too-large.png');
    parseAndValidateBusinessLogoUpload(upload.contentType, upload.body);
  },
  /3MB/
);

console.log('BusinessProfile logo contract passed.');
