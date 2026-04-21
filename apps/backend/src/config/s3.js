/**
 * s3.js — OFSMS S3 Storage Helper
 *
 * Wraps AWS SDK v2 for:
 *   uploadFile(file, folder)  → uploads buffer/stream, returns public URL
 *   getSignedUrl(key)         → returns a time-limited download URL
 *   deleteFile(key)           → removes a file from the bucket
 *
 * Supported folders (by convention):
 *   documents/   — orphan/family registration docs (death certs, birth certs)
 *   biometrics/  — fingerprint confirmation images
 *   avatars/     — profile photos (future)
 *
 * Compatible with: AWS S3, Supabase Storage (S3-compatible), MinIO (local dev)
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// ── S3 client config ──────────────────────────────────────────────────────────
const s3 = new AWS.S3({
  accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region:          process.env.AWS_REGION || 'us-east-1',
  // For Supabase Storage or MinIO, override the endpoint:
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
  ...(process.env.S3_ENDPOINT && { s3ForcePathStyle: true }),
});

const BUCKET = process.env.S3_BUCKET_NAME;

// ── Upload a file ─────────────────────────────────────────────────────────────
/**
 * Upload a file buffer to S3.
 * @param {Object} options
 * @param {Buffer}  options.buffer       - File buffer (from multer memoryStorage)
 * @param {string}  options.originalName - Original filename (for extension)
 * @param {string}  options.mimetype     - MIME type (e.g. 'application/pdf')
 * @param {string}  options.folder       - Destination folder (e.g. 'documents')
 * @returns {Promise<{ key: string, url: string }>}
 */
const uploadFile = async ({ buffer, originalName, mimetype, folder = 'documents' }) => {
  const ext      = path.extname(originalName).toLowerCase();
  const key      = `${folder}/${uuidv4()}${ext}`;

  const params = {
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: mimetype,
    // Files are private by default — use getSignedUrl to share
  };

  await s3.upload(params).promise();

  // Return key (stored in DB) and a short-lived URL for immediate use
  const url = await getSignedUrl(key);
  return { key, url };
};

// ── Generate a signed (time-limited) download URL ────────────────────────────
/**
 * @param {string} key     - S3 object key (stored in DB)
 * @param {number} expires - Seconds until expiry (default: 1 hour)
 * @returns {Promise<string>}
 */
const getSignedUrl = (key, expires = 3600) => {
  return s3.getSignedUrlPromise('getObject', {
    Bucket:  BUCKET,
    Key:     key,
    Expires: expires,
  });
};

// ── Delete a file ─────────────────────────────────────────────────────────────
/**
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
const deleteFile = async (key) => {
  await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
};

module.exports = { uploadFile, getSignedUrl, deleteFile };
