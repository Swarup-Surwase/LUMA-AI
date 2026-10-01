import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
  lines: string[];
  summary: string;
  detectedType: 'medicine' | 'document' | 'general';
}

/**
 * Quality metric for OCR text candidate
 */
function scoreOcrCandidate(text: string, confidence: number): number {
  if (!text || text.trim().length === 0) return 0;
  
  const totalChars = text.length;
  const alphanumericChars = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const letterRatio = alphanumericChars / Math.max(1, totalChars);
  
  // Severe penalty if the string is predominantly noise/symbols (like dashes, brackets, tildes)
  if (letterRatio < 0.45) return 0;
  
  const words = text.split(/\s+/).filter(w => /^[a-zA-Z0-9%.,/()\-:]{2,}$/.test(w));
  const validWordCount = words.length;
  if (validWordCount === 0) return 0;
  
  // Quality Score: confidence weighted by letter ratio and valid word density
  return confidence * (letterRatio * 1.5) * Math.log2(validWordCount + 2);
}

/**
 * Clean and normalize OCR lines (strips out lone noise symbols, isolated dashes, broken unicode)
 */
function cleanOcrText(rawText: string): string {
  const lines = rawText.split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length === 0) return false;
      const alphaChars = (line.match(/[a-zA-Z0-9]/g) || []).length;
      // Drop lines that are mostly punctuation or repetitive symbols like "--- - - =="
      if (alphaChars === 0) return false;
      if (alphaChars / line.length < 0.35 && line.length > 3) return false;
      return true;
    });

  return lines.join('\n');
}

/**
 * Enhanced Image Preprocessor for Mobile Screens, Documents, and Design Tables
 */
async function preprocessImageForOcr(imageBase64: string): Promise<string[]> {
  if (typeof document === 'undefined') return [imageBase64];

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const variants: string[] = [];

        // 1. Raw original image
        variants.push(imageBase64);

        // 2. High-Resolution Scaled & Grayscale Canvas
        const scale = Math.max(1.5, Math.min(2.5, 1800 / Math.max(img.width, img.height)));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(variants);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const total = data.length / 4;

        // Compute Grayscale & Histogram for Otsu's Thresholding
        const lumArray = new Uint8Array(total);
        const histogram = new Int32Array(256);

        for (let i = 0; i < total; i++) {
          const idx = i * 4;
          const lum = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
          lumArray[i] = lum;
          histogram[lum]++;
        }

        // Otsu's Method to compute optimal global threshold
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];

        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVar = 0;
        let otsuThreshold = 128;

        for (let t = 0; t < 256; t++) {
          wB += histogram[t];
          if (wB === 0) continue;
          wF = total - wB;
          if (wF === 0) break;

          sumB += t * histogram[t];
          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const betweenVar = wB * wF * (mB - mF) * (mB - mF);

          if (betweenVar > maxVar) {
            maxVar = betweenVar;
            otsuThreshold = t;
          }
        }

        // Variant A: High Contrast Grayscale (Clamped & Linear Stretched)
        const grayData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < total; i++) {
          const idx = i * 4;
          const l = lumArray[i];
          grayData.data[idx] = l;
          grayData.data[idx + 1] = l;
          grayData.data[idx + 2] = l;
          grayData.data[idx + 3] = 255;
        }
        ctx.putImageData(grayData, 0, 0);
        variants.push(canvas.toDataURL('image/jpeg', 0.90));

        // Variant B: Otsu Binarization (Standard black on white)
        const binarizedData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < total; i++) {
          const idx = i * 4;
          const val = lumArray[i] < otsuThreshold ? 0 : 255;
          binarizedData.data[idx] = val;
          binarizedData.data[idx + 1] = val;
          binarizedData.data[idx + 2] = val;
          binarizedData.data[idx + 3] = 255;
        }
        ctx.putImageData(binarizedData, 0, 0);
        variants.push(canvas.toDataURL('image/jpeg', 0.90));

        // Variant C: Inverted (for white text on dark background / mobile dark mode)
        const invertedData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < total; i++) {
          const idx = i * 4;
          const val = lumArray[i] < otsuThreshold ? 255 : 0;
          invertedData.data[idx] = val;
          invertedData.data[idx + 1] = val;
          invertedData.data[idx + 2] = val;
          invertedData.data[idx + 3] = 255;
        }
        ctx.putImageData(invertedData, 0, 0);
        variants.push(canvas.toDataURL('image/jpeg', 0.90));

        resolve(variants);
      } catch (e) {
        console.warn('Preprocessing fallback:', e);
        resolve([imageBase64]);
      }
    };
    img.onerror = () => resolve([imageBase64]);
    img.src = imageBase64;
  });
}

/**
 * Optical Character Recognition Engine
 * Multi-pass neural OCR that extracts the EXACT text displayed on screens or paper.
 */
export async function recognizeTextFromImage(
  imageBase64: string,
  mode: 'ocr' | 'medicine' | 'scene' = 'ocr'
): Promise<OcrResult> {
  try {
    // 1. Generate optimized image variants (Raw, Grayscale, Otsu Binarized, Inverted)
    const imageVariants = await preprocessImageForOcr(imageBase64);

    let bestText = '';
    let bestConfidence = 0;
    let bestScore = 0;

    // 2. Evaluate variants to find the highest-quality readable text extraction
    for (const variant of imageVariants) {
      try {
        const result = await Tesseract.recognize(variant, 'eng', {
          logger: () => {}
        });

        const rawText = result.data.text ? result.data.text.trim() : '';
        const conf = Math.round(result.data.confidence || 0);
        const cleaned = cleanOcrText(rawText);
        const score = scoreOcrCandidate(cleaned, conf);

        if (score > bestScore || (score > 0 && conf > bestConfidence && cleaned.length >= 10)) {
          bestScore = score;
          bestText = cleaned;
          bestConfidence = conf;
        }

        // If we achieved an exceptionally strong read, we can return early
        if (bestConfidence >= 80 && bestText.length > 40 && score > 300) {
          break;
        }
      } catch {
        // try next variant
      }
    }

    const cleanedLines = bestText.split('\n').map(l => l.trim()).filter(Boolean);
    const finalText = cleanedLines.join('\n');

    if (finalText.length > 0 && bestConfidence >= 40) {
      let summary = '';
      if (mode === 'medicine') {
        summary = `Identified medicine text: "${cleanedLines.slice(0, 2).join(' ')}"`;
      } else {
        summary = `Extracted ${cleanedLines.length} lines of text (${finalText.split(/\s+/).length} words).`;
      }

      return {
        text: finalText,
        confidence: bestConfidence,
        lines: cleanedLines,
        summary,
        detectedType: mode === 'medicine' ? 'medicine' : 'document'
      };
    }

    return {
      text: '',
      confidence: 0,
      lines: [],
      summary: 'No clear text detected in this frame. Hold your mobile phone or document steady, parallel to the lens with adequate lighting.',
      detectedType: 'general'
    };
  } catch (err) {
    console.warn('Tesseract OCR error:', err);
    return {
      text: '',
      confidence: 0,
      lines: [],
      summary: 'Could not process text from camera image.',
      detectedType: 'general'
    };
  }
}
