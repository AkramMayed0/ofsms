/**
 * fileScanner.js
 * 
 * Middleware to simulate ClamAV by scanning the actual raw bytes (magic numbers) 
 * of uploaded files to detect disguised executables and enforce strict MIME whitelisting.
 */

// Known magic numbers (hex signatures)
const SIGNATURES = {
  EXE: '4d5a', // MZ
  PDF: '25504446', // %PDF
  JPG: 'ffd8ff', 
  PNG: '89504e47',
};

/**
 * Helper to get the hex signature of a buffer (first 4 bytes)
 */
const getHexSignature = (buffer) => {
  if (!buffer || buffer.length < 4) return '';
  return buffer.toString('hex', 0, 4).toLowerCase();
};

/**
 * Scans a single file buffer.
 * Returns { valid: boolean, error?: string }
 */
const scanBuffer = (buffer) => {
  if (!buffer) return { valid: true };

  const hex = getHexSignature(buffer);

  // 1. Explicitly block executables (simulate malware scan)
  if (hex.startsWith(SIGNATURES.EXE)) {
    return { valid: false, error: 'Malware detected: Executable file signature (MZ) found' };
  }

  // 2. Enforce strict whitelist based on magic numbers
  const isPdf = hex.startsWith(SIGNATURES.PDF);
  const isJpg = hex.startsWith(SIGNATURES.JPG);
  const isPng = hex.startsWith(SIGNATURES.PNG);

  if (!isPdf && !isJpg && !isPng) {
    return { valid: false, error: 'نوع الملف غير مدعوم أو تالف. المسموح به: PDF، JPG، PNG فقط' };
  }

  return { valid: true };
};

/**
 * Express middleware to scan files populated by Multer (`req.file` or `req.files`)
 */
const scanUploadedFiles = (req, res, next) => {
  try {
    const filesToScan = [];

    if (req.file) {
      filesToScan.push(req.file);
    } else if (req.files) {
      // req.files could be an array or an object of arrays
      if (Array.isArray(req.files)) {
        filesToScan.push(...req.files);
      } else {
        Object.values(req.files).forEach(fileArray => {
          filesToScan.push(...fileArray);
        });
      }
    }

    for (const file of filesToScan) {
      const result = scanBuffer(file.buffer);
      if (!result.valid) {
        // Return 400 Bad Request immediately upon detecting malware/invalid file
        return res.status(400).json({ error: result.error });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scanUploadedFiles,
  scanBuffer
};
