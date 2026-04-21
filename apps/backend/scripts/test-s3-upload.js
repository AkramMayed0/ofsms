/**
 * test-s3-upload.js — Verify S3 integration works end-to-end
 * Usage (from apps/backend): node scripts/test-s3-upload.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { uploadFile, getSignedUrl, deleteFile } = require('../src/config/s3');

async function main() {
  console.log('🪣  Bucket:', process.env.S3_BUCKET_NAME);
  console.log('🌍  Region:', process.env.AWS_REGION);

  // 1. Upload a small test file
  console.log('\n1️⃣  Uploading test file...');
  const testBuffer = Buffer.from('OFSMS S3 test file — ' + new Date().toISOString());

  const { key, url } = await uploadFile({
    buffer:       testBuffer,
    originalName: 'test.txt',
    mimetype:     'text/plain',
    folder:       'documents',
  });

  console.log('   ✅ Uploaded!');
  console.log('   Key:', key);
  console.log('   Signed URL:', url);

  // 2. Generate a fresh signed URL for the same key
  console.log('\n2️⃣  Generating signed URL...');
  const freshUrl = await getSignedUrl(key, 300); // 5-min expiry
  console.log('   ✅ Signed URL (5 min):', freshUrl);

  // 3. Delete the test file
  console.log('\n3️⃣  Deleting test file...');
  await deleteFile(key);
  console.log('   ✅ Deleted:', key);

  console.log('\n🎉 S3 integration working correctly!');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ S3 test failed:', err.message);
  console.error('   Check your AWS_* and S3_BUCKET_NAME env vars in apps/backend/.env');
  process.exit(1);
});
