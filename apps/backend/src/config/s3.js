/**
 * s3.js — OFSMS S3 Storage Helper
 *
 * Fixed: replaced s3.upload() with s3.putObject() for aws-sdk v2 compatibility.
 * Also added LOCAL_STORAGE fallback — if S3_BUCKET_NAME is not set or
 * NODE_ENV=development with no real AWS creds, files are skipped and a
 * fake key is returned so the rest of the app keeps working.
 *
 * Compatible with: AWS S3, Supabase Storage (S3-compatible), MinIO (local dev)
 */

const AWS  = require('aws-sdk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ── S3 client ─────────────────────────────────────────────────────────────────
const s3 = new AWS.S3({
  accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region:          process.env.AWS_REGION || 'us-east-1',
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
  ...(process.env.S3_ENDPOINT && { s3ForcePathStyle: true }),
});

const BUCKET = process.env.S3_BUCKET_NAME;

// ── Local dev mode detection ──────────────────────────────────────────────────
// If bucket is not configured or creds are dummy, skip real S3 calls
const isLocalDev = () =>
  !BUCKET ||
  process.env.AWS_ACCESS_KEY_ID === 'dummy' ||
  process.env.AWS_ACCESS_KEY_ID === 'test';

// ── uploadFile ────────────────────────────────────────────────────────────────
/**
 * Upload a file buffer to S3 using putObject (compatible with all aws-sdk v2).
 *
 * @param {Object} options
 * @param {Buffer}  options.buffer       - File buffer (from multer memoryStorage)
 * @param {string}  options.originalName - Original filename (for extension)
 * @param {string}  options.mimetype     - MIME type
 * @param {string}  options.folder       - Destination folder (e.g. 'documents')
 * @returns {Promise<{ key: string, url: string }>}
 */
const uploadFile = async ({ buffer, originalName, mimetype, folder = 'documents' }) => {
  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${uuidv4()}${ext}`;

  // ── Local dev: skip real S3 upload, return fake key ───────────────────────
  if (isLocalDev()) {
    // eslint-disable-next-line no-console
    console.log(`[S3 LOCAL] Skipping upload — fake key: ${key}`);
    return { key, url: `http://localhost:4000/local-files/${key}` };
  }

  // ── Production: use putObject (works in all aws-sdk v2 versions) ──────────
  const params = {
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimetype,
  };

  await s3.putObject(params).promise();

  const url = await getSignedUrl(key);
  return { key, url };
};

// ── getSignedUrl ──────────────────────────────────────────────────────────────
/**
 * @param {string} key     - S3 object key
 * @param {number} expires - Seconds until expiry (default: 1 hour)
 * @returns {Promise<string>}
 */
const getSignedUrl = (key, expires = 3600) => {
  if (isLocalDev()) {
    return Promise.resolve(`http://localhost:4000/local-files/${key}`);
  }

  return s3.getSignedUrlPromise('getObject', {
    Bucket:  BUCKET,
    Key:     key,
    Expires: expires,
  });
};

// ── deleteFile ────────────────────────────────────────────────────────────────
/**
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
const deleteFile = async (key) => {
  if (isLocalDev()) {
    // eslint-disable-next-line no-console
    console.log(`[S3 LOCAL] Skipping delete — key: ${key}`);
    return;
  }

  await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
};

module.exports = { uploadFile, getSignedUrl, deleteFile };
