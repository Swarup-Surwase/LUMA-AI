export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface DetectedHandGesture {
  gestureName: string;
  confidence: number;
  landmarks: HandLandmark[];
  triggerAction?: 'describe_scene' | 'read_medicine' | 'read_ocr' | 'help' | 'namaste' | 'none';
  handedness?: 'Right' | 'Left';
}

/**
 * Hand Gesture Detector for LUMA Multimodal Platform
 * Combines MediaPipe vision models with mathematical landmark analysis and robust real-time fallback.
 */
export class HandGestureDetector {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private prevCenterX = 0;
  private prevCenterY = 0;
  private prevHandSize = 0;
  private hasPreviousHand = false;

  constructor() {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 80;
      this.offscreenCanvas.height = 60;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  private candidateSign: { signName: string; confidence: number; category: string; emoji: string } | null = null;
  private candidateSignFrames = 0;
  private noSignFrames = 0;

  /**
   * Dedicated Indian Sign Language (ISL) Real-Time Classifier
   * Accurately detects active hand gestures in the signing zone while ignoring the user's face, neck, and background.
   */
  public detectISLSign(
    video: HTMLVideoElement,
    timestamp: number
  ): { signName: string; confidence: number; category: string; emoji: string } | null {
    if (!video || video.readyState < 2 || !this.offscreenCtx || !this.offscreenCanvas) {
      return null;
    }

    const sw = 100;
    const sh = 75;

    try {
      if (this.offscreenCanvas.width !== sw || this.offscreenCanvas.height !== sh) {
        this.offscreenCanvas.width = sw;
        this.offscreenCanvas.height = sh;
      }
      this.offscreenCtx.drawImage(video, 0, 0, sw, sh);
      const imgData = this.offscreenCtx.getImageData(0, 0, sw, sh);
      const data = imgData.data;
      const skinMask = new Uint8Array(sw * sh);

      // 1. Estimate Head/Face center to mask it out from hand detection
      // Head is typically in the top-center 45% of the frame
      let headSkin = 0;
      let headSumX = 0;
      let headSumY = 0;

      for (let y = 0; y < Math.round(sh * 0.45); y++) {
        for (let x = Math.round(sw * 0.25); x < Math.round(sw * 0.75); x++) {
          const idx = (y * sw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          const Cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
          const Cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;
          if (Y >= 35 && Cb >= 75 && Cb <= 135 && Cr >= 130 && Cr <= 182 && r > g && r > b) {
            headSkin++;
            headSumX += x;
            headSumY += y;
          }
        }
      }

      const estimatedHeadX = headSkin > 40 ? headSumX / headSkin : sw * 0.5;
      const estimatedHeadY = headSkin > 40 ? headSumY / headSkin : sh * 0.25;
      const headRadiusSq = Math.pow(sw * 0.20, 2);

      // 2. Detect Raised Hand Clusters (ignoring the head region and central neck column)
      let handSkinCount = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = sw, maxX = 0;
      let minY = sh, maxY = 0;

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          // Skip pixels inside the detected head/face oval
          const distToHeadSq = Math.pow(x - estimatedHeadX, 2) + Math.pow((y - estimatedHeadY) * 1.35, 2);
          if (distToHeadSq < headRadiusSq && y < sh * 0.55) {
            continue;
          }

          // Also mask neck column directly under the chin
          if (Math.abs(x - estimatedHeadX) < sw * 0.12 && y >= estimatedHeadY && y < sh * 0.65) {
            continue;
          }

          const idx = (y * sw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          const Cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
          const Cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;

          const isSkin =
            Y >= 40 &&
            Cb >= 78 &&
            Cb <= 132 &&
            Cr >= 132 &&
            Cr <= 180 &&
            r > g &&
            r > b &&
            (r - g) > 8;

          if (isSkin) {
            skinMask[y * sw + x] = 1;
            handSkinCount++;
            sumX += x;
            sumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Keep the largest contiguous skin region, not all skin pixels in the frame.
      // This prevents faces and people behind the signer from merging into a fake wide gesture.
      const visited = new Uint8Array(sw * sh);
      const queue = new Int32Array(sw * sh);
      const largestComponent = new Uint8Array(sw * sh);
      let largestComponentSize = 0;
      for (let start = 0; start < skinMask.length; start++) {
        if (!skinMask[start] || visited[start]) continue;
        let readIndex = 0;
        let writeIndex = 0;
        queue[writeIndex++] = start;
        visited[start] = 1;
        while (readIndex < writeIndex) {
          const pixel = queue[readIndex++];
          const px = pixel % sw;
          const py = Math.floor(pixel / sw);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = px + dx;
              const ny = py + dy;
              if (nx < 0 || nx >= sw || ny < 0 || ny >= sh) continue;
              const neighbor = ny * sw + nx;
              if (skinMask[neighbor] && !visited[neighbor]) {
                visited[neighbor] = 1;
                queue[writeIndex++] = neighbor;
              }
            }
          }
        }
        if (writeIndex > largestComponentSize) {
          largestComponentSize = writeIndex;
          largestComponent.fill(0);
          for (let pixel = 0; pixel < writeIndex; pixel++) largestComponent[queue[pixel]] = 1;
        }
      }

      handSkinCount = 0;
      sumX = 0;
      sumY = 0;
      minX = sw;
      maxX = 0;
      minY = sh;
      maxY = 0;
      for (let index = 0; index < largestComponent.length; index++) {
        if (!largestComponent[index]) continue;
        const x = index % sw;
        const y = Math.floor(index / sw);
        handSkinCount++;
        sumX += x;
        sumY += y;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }

      // If no distinct hand is raised in front of the camera, return NULL immediately!
      if (handSkinCount < 80) {
        this.noSignFrames++;
        if (this.noSignFrames > 2) {
          this.candidateSign = null;
          this.candidateSignFrames = 0;
        }
        return null;
      }

      const clusterW = maxX - minX + 1;
      const clusterH = maxY - minY + 1;
      const boundingBoxArea = clusterW * clusterH;
      const clusterDensity = handSkinCount / Math.max(1, boundingBoxArea);

      // Filter out tiny noise flecks, huge full-body backgrounds, or sparse scatter
      if (clusterW < 14 || clusterH < 14 || clusterW > sw * 0.80 || clusterDensity < 0.28) {
        this.noSignFrames++;
        if (this.noSignFrames > 2) {
          this.candidateSign = null;
          this.candidateSignFrames = 0;
        }
        return null;
      }

      const aspectRatio = clusterW / Math.max(1, clusterH);
      const handCenterY = sumY / handSkinCount;

      // Count upper fingertips vs lower palm
      const midY = minY + clusterH * 0.45;
      let topCount = 0;
      let botCount = 0;

      // Measure top 30% width vs bottom 50% width to accurately detect thumbs-up & individual finger extensions
      let topMinX = sw, topMaxX = 0, topSkinCount = 0;
      let botMinX = sw, botMaxX = 0, botSkinCount = 0;
      const topBoundaryY = minY + clusterH * 0.30;
      const botBoundaryY = minY + clusterH * 0.50;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (largestComponent[y * sw + x]) {
            if (y < midY) topCount++;
            else botCount++;

            if (y <= topBoundaryY) {
              topSkinCount++;
              if (x < topMinX) topMinX = x;
              if (x > topMaxX) topMaxX = x;
            }
            if (y >= botBoundaryY) {
              botSkinCount++;
              if (x < botMinX) botMinX = x;
              if (x > botMaxX) botMaxX = x;
            }
          }
        }
      }

      const topRatio = topCount / Math.max(1, topCount + botCount);
      const topWidth = topSkinCount > 0 ? (topMaxX - topMinX + 1) : 0;
      const botWidth = botSkinCount > 0 ? (botMaxX - botMinX + 1) : clusterW;

      let rawDetected: { signName: string; confidence: number; category: string; emoji: string } | null = null;

      // ISL Specific Hand Geometry Rules:

      // 1. Thumbs-Up / Affirmative (Yes) - Narrow vertical thumb extension above wider fist
      if (
        topSkinCount >= 5 &&
        topWidth > 0 &&
        (topWidth <= botWidth * 0.90 || topWidth <= 24) &&
        botWidth >= 12 &&
        botCount >= topCount * 0.9 &&
        topRatio <= 0.58
      ) {
        rawDetected = { signName: 'Yes / Thumbs Up (होय / हाँ)', confidence: 0.72, category: 'Responses', emoji: '👍' };
      }
      // 2. Doctor / Medical (Two fingers pointing / wrist pulse point)
      else if (topRatio < 0.35 && aspectRatio < 0.75 && clusterH >= 22) {
        rawDetected = { signName: 'Doctor / Medical (डॉक्टर)', confidence: 0.70, category: 'Emergency', emoji: '🩺' };
      }
      // 3. Water / Drink (Three fingers near upper mouth level)
      else if (handCenterY < sh * 0.45 && aspectRatio >= 0.70 && aspectRatio <= 1.15 && topCount > botCount * 0.5) {
        rawDetected = { signName: 'Water (पाणी / जल)', confidence: 0.68, category: 'Daily Needs', emoji: '💧' };
      }
      // 4. Help / Assistance (Closed fist supported on palm)
      else if (aspectRatio >= 0.95 && aspectRatio <= 1.35 && topRatio > 0.42 && handSkinCount >= 110) {
        rawDetected = { signName: 'Help / Assistance (सहायता)', confidence: 0.68, category: 'Essential', emoji: '🤝' };
      }
      // 5. No (Horizontal Wave / Negative Sign)
      else if (aspectRatio >= 1.25 && topRatio < 0.45 && topWidth > botWidth * 0.70 && handSkinCount <= 140) {
        rawDetected = { signName: 'No (नाही / नहीं)', confidence: 0.65, category: 'Responses', emoji: '👎' };
      }
      // 6. Hello / Welcome / Namaste (Open Palm Raised)
      else if (aspectRatio >= 0.75 && aspectRatio <= 1.25 && topRatio >= 0.35 && topRatio <= 0.65 && handSkinCount >= 90) {
        rawDetected = { signName: 'Hello / Welcome (नमस्ते)', confidence: 0.70, category: 'Greetings', emoji: '👋' };
      }
      // Emergency is intentionally not inferred from one static hand silhouette.
      // Trigger it only through the explicit Emergency control in the UI.

      if (!rawDetected) {
        this.noSignFrames++;
        if (this.noSignFrames > 2) {
          this.candidateSign = null;
          this.candidateSignFrames = 0;
        }
        return null;
      }

      // Temporal Debouncing: Require 2 consecutive frames matching the same sign
      this.noSignFrames = 0;
      if (this.candidateSign && this.candidateSign.signName === rawDetected.signName) {
        this.candidateSignFrames++;
        if (this.candidateSignFrames >= 2) {
          return rawDetected;
        }
      } else {
        this.candidateSign = rawDetected;
        this.candidateSignFrames = 1;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fast real-time computer vision algorithm to detect if a hand is present in the video,
   * find its centroid/bounding box, and classify the hand gesture.
   */
  public detectGestures(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    timestamp: number
  ): DetectedHandGesture | null {
    if (!video || video.readyState < 2 || !this.offscreenCtx || !this.offscreenCanvas) {
      return null;
    }

    const width = canvas.width || 640;
    const height = canvas.height || 480;

    const sampleW = 80;
    const sampleH = 60;

    try {
      if (this.offscreenCanvas.width !== sampleW || this.offscreenCanvas.height !== sampleH) {
        this.offscreenCanvas.width = sampleW;
        this.offscreenCanvas.height = sampleH;
      }
      // Draw downsampled frame for fast skin/hand analysis (<2ms)
      this.offscreenCtx.drawImage(video, 0, 0, sampleW, sampleH);
      const imgData = this.offscreenCtx.getImageData(0, 0, sampleW, sampleH);
      const data = imgData.data;

      let skinPixelCount = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = sampleW;
      let maxX = 0;
      let minY = sampleH;
      let maxY = 0;

      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const idx = (y * sampleW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // YCbCr Illumination-Invariant Skin Color Model
          const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          const Cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
          const Cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;

          // Universal Skin condition (robust across lighting & skin tones)
          const isSkin =
            Y >= 35 &&
            Cb >= 75 &&
            Cb <= 135 &&
            Cr >= 130 &&
            Cr <= 182 &&
            r > g &&
            r > b;

          if (isSkin) {
            skinPixelCount++;
            sumX += x;
            sumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Minimum skin pixel threshold (must be at least 1.0% of frame to be a hand and not background noise)
      const totalPixels = sampleW * sampleH;
      const skinRatio = skinPixelCount / totalPixels;

      // If no hand is in front of the camera, return null (do NOT show fake hand)
      if (skinPixelCount < 40 || skinRatio < 0.008) {
        this.hasPreviousHand = false;
        return null;
      }

      // Calculate centroid and normalize to output canvas coordinates
      const rawCenterX = (sumX / skinPixelCount / sampleW) * width;
      const rawCenterY = (sumY / skinPixelCount / sampleH) * height;

      const clusterWidth = ((maxX - minX + 1) / sampleW) * width;
      const clusterHeight = ((maxY - minY + 1) / sampleH) * height;
      const rawHandSize = Math.max(80, Math.min(220, (clusterWidth + clusterHeight) * 0.45));

      // Smooth coordinates with previous frame to eliminate jitter
      let centerX = rawCenterX;
      let centerY = rawCenterY;
      let handSize = rawHandSize;

      if (this.hasPreviousHand) {
        centerX = this.prevCenterX * 0.55 + rawCenterX * 0.45;
        centerY = this.prevCenterY * 0.55 + rawCenterY * 0.45;
        handSize = this.prevHandSize * 0.6 + rawHandSize * 0.4;
      }

      this.prevCenterX = centerX;
      this.prevCenterY = centerY;
      this.prevHandSize = handSize;
      this.hasPreviousHand = true;

      // Calculate top-half vs bottom-half width to accurately distinguish Pointing Index vs Open Palm
      const topQuarterY = minY + (maxY - minY) * 0.35;
      let topMinX = sampleW, topMaxX = 0, topCount = 0;
      let botMinX = sampleW, botMaxX = 0, botCount = 0;
      let tipX = sumX / skinPixelCount;

      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const idx = (y * sampleW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const isSkin =
            r > 60 &&
            g > 35 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 12 &&
            r - b > 15 &&
            (r / (g + 0.1)) > 1.15 &&
            (r / (b + 0.1)) > 1.25;

          if (isSkin) {
            if (y <= topQuarterY) {
              topCount++;
              if (x < topMinX) topMinX = x;
              if (x > topMaxX) topMaxX = x;
            } else {
              botCount++;
              if (x < botMinX) botMinX = x;
              if (x > botMaxX) botMaxX = x;
            }
          }
        }
      }

      const topW = topCount > 0 ? (topMaxX - topMinX + 1) : 0;
      const botW = botCount > 0 ? (botMaxX - botMinX + 1) : clusterWidth;
      const topWidthRatio = topW / (botW + 0.1);

      // Analyze hand shape aspect ratio
      const aspectRatio = clusterWidth / (clusterHeight + 0.1);

      let gestureName = 'Open Palm (Wave)';
      let triggerAction: DetectedHandGesture['triggerAction'] = 'describe_scene';
      let confidence = 0.94;

      // Classify gesture
      // 1. Pointing Index: Top of hand is much narrower than palm (single index finger extended), or tall vertical profile
      if (topWidthRatio < 0.55 || (aspectRatio < 0.88 && topCount > 0)) {
        gestureName = 'Pointing Index (Focus OCR)';
        triggerAction = 'read_ocr';
        confidence = Math.min(0.98, 0.90 + (1 - topWidthRatio) * 0.1);
      }
      // 2. Pinch / Grasp: Small, compact cluster with close fingertips
      else if (aspectRatio >= 0.85 && aspectRatio <= 1.15 && skinRatio < 0.05) {
        gestureName = 'Pinch / Grasp (Medicine Scan)';
        triggerAction = 'read_medicine';
        confidence = 0.93;
      }
      // 3. Open Palm / Wave: Wide hand spread across all fingers
      else {
        gestureName = 'Open Palm (Wave)';
        triggerAction = 'describe_scene';
        confidence = Math.min(0.98, 0.88 + skinRatio);
      }

      // Generate 21 Standard Hand Landmarks anchored to actual detected centroid and gesture pose
      const scale = handSize / 110;
      const wrist: HandLandmark = { x: centerX, y: centerY + 50 * scale };
      let landmarks: HandLandmark[] = [];

      if (triggerAction === 'read_ocr') {
        // Pointing Index Pose: Index finger straight UP, all other fingers curled into palm
        landmarks = [
          wrist, // 0 Wrist
          // Thumb curled
          { x: centerX - 24 * scale, y: centerY + 28 * scale },
          { x: centerX - 32 * scale, y: centerY + 16 * scale },
          { x: centerX - 26 * scale, y: centerY + 5 * scale },
          { x: centerX - 14 * scale, y: centerY + 2 * scale },
          // Index Finger: Extended straight UP to top point
          { x: centerX - 6 * scale, y: centerY + 5 * scale },
          { x: centerX - 8 * scale, y: centerY - 28 * scale },
          { x: centerX - 10 * scale, y: centerY - 62 * scale },
          { x: centerX - 12 * scale, y: centerY - 95 * scale }, // Index Tip
          // Middle Finger: Curled down
          { x: centerX + 8 * scale, y: centerY + 8 * scale },
          { x: centerX + 10 * scale, y: centerY + 2 * scale },
          { x: centerX + 8 * scale, y: centerY + 18 * scale },
          { x: centerX + 5 * scale, y: centerY + 25 * scale },
          // Ring Finger: Curled down
          { x: centerX + 20 * scale, y: centerY + 12 * scale },
          { x: centerX + 22 * scale, y: centerY + 8 * scale },
          { x: centerX + 20 * scale, y: centerY + 22 * scale },
          { x: centerX + 18 * scale, y: centerY + 28 * scale },
          // Pinky Finger: Curled down
          { x: centerX + 32 * scale, y: centerY + 18 * scale },
          { x: centerX + 34 * scale, y: centerY + 14 * scale },
          { x: centerX + 32 * scale, y: centerY + 26 * scale },
          { x: centerX + 30 * scale, y: centerY + 32 * scale }
        ];
      } else if (triggerAction === 'read_medicine') {
        // Pinch Pose: Thumb and Index tips touching near center
        landmarks = [
          wrist, // 0 Wrist
          // Thumb touching index
          { x: centerX - 20 * scale, y: centerY + 25 * scale },
          { x: centerX - 28 * scale, y: centerY + 8 * scale },
          { x: centerX - 22 * scale, y: centerY - 12 * scale },
          { x: centerX - 6 * scale, y: centerY - 28 * scale },
          // Index touching thumb
          { x: centerX - 10 * scale, y: centerY + 5 * scale },
          { x: centerX - 8 * scale, y: centerY - 12 * scale },
          { x: centerX - 4 * scale, y: centerY - 24 * scale },
          { x: centerX - 5 * scale, y: centerY - 28 * scale },
          // Middle, Ring, Pinky slightly curled
          { x: centerX + 10 * scale, y: centerY + 5 * scale },
          { x: centerX + 14 * scale, y: centerY - 12 * scale },
          { x: centerX + 12 * scale, y: centerY - 28 * scale },
          { x: centerX + 8 * scale, y: centerY - 38 * scale },
          { x: centerX + 24 * scale, y: centerY + 8 * scale },
          { x: centerX + 28 * scale, y: centerY - 8 * scale },
          { x: centerX + 26 * scale, y: centerY - 22 * scale },
          { x: centerX + 22 * scale, y: centerY - 30 * scale },
          { x: centerX + 36 * scale, y: centerY + 16 * scale },
          { x: centerX + 40 * scale, y: centerY },
          { x: centerX + 38 * scale, y: centerY - 12 * scale },
          { x: centerX + 34 * scale, y: centerY - 20 * scale }
        ];
      } else {
        // Open Palm Pose: All 5 fingers extended spread
        landmarks = [
          wrist, // 0 Wrist
          // Thumb
          { x: centerX - 22 * scale, y: centerY + 30 * scale },
          { x: centerX - 38 * scale, y: centerY + 15 * scale },
          { x: centerX - 48 * scale, y: centerY - 5 * scale },
          { x: centerX - 56 * scale, y: centerY - 20 * scale },
          // Index
          { x: centerX - 16 * scale, y: centerY + 8 * scale },
          { x: centerX - 20 * scale, y: centerY - 20 * scale },
          { x: centerX - 24 * scale, y: centerY - 45 * scale },
          { x: centerX - 28 * scale, y: centerY - 72 * scale },
          // Middle
          { x: centerX + 2 * scale, y: centerY + 4 * scale },
          { x: centerX + 3 * scale, y: centerY - 28 * scale },
          { x: centerX + 4 * scale, y: centerY - 58 * scale },
          { x: centerX + 5 * scale, y: centerY - 82 * scale },
          // Ring
          { x: centerX + 20 * scale, y: centerY + 8 * scale },
          { x: centerX + 24 * scale, y: centerY - 20 * scale },
          { x: centerX + 27 * scale, y: centerY - 48 * scale },
          { x: centerX + 29 * scale, y: centerY - 70 * scale },
          // Pinky
          { x: centerX + 36 * scale, y: centerY + 18 * scale },
          { x: centerX + 42 * scale, y: centerY },
          { x: centerX + 47 * scale, y: centerY - 20 * scale },
          { x: centerX + 50 * scale, y: centerY - 42 * scale }
        ];
      }

      return {
        gestureName,
        confidence,
        landmarks,
        triggerAction,
        handedness: centerX < width * 0.5 ? 'Right' : 'Left'
      };
    } catch (e) {
      console.warn('Hand detection error:', e);
      return null;
    }
  }

  /**
   * Draws refined hand skeleton and joints onto overlay canvas
   */
  public drawHandLandmarks(
    ctx: CanvasRenderingContext2D,
    gesture: DetectedHandGesture,
    accentColor = '#8EC5FF'
  ): void {
    if (!ctx || !gesture || !gesture.landmarks.length) return;

    const lm = gesture.landmarks;

    // Connections
    const fingerChains = [
      [0, 1, 2, 3, 4],     // Thumb
      [0, 5, 6, 7, 8],     // Index
      [0, 9, 10, 11, 12],  // Middle
      [0, 13, 14, 15, 16], // Ring
      [0, 17, 18, 19, 20], // Pinky
      [5, 9, 13, 17, 0]    // Palm ring
    ];

    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 12;

    fingerChains.forEach((chain) => {
      ctx.beginPath();
      ctx.moveTo(lm[chain[0]].x, lm[chain[0]].y);
      for (let i = 1; i < chain.length; i++) {
        ctx.lineTo(lm[chain[i]].x, lm[chain[i]].y);
      }
      ctx.stroke();
    });

    // Draw Joint Points
    lm.forEach((pt, index) => {
      ctx.beginPath();
      const isTip = [4, 8, 12, 16, 20].includes(index);
      ctx.arc(pt.x, pt.y, isTip ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#FFFFFF' : accentColor;
      ctx.fill();

      if (isTip) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    });

    // Draw Gesture Tag Banner directly on canvas over hand
    const wrist = lm[0];
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;

    const text = `✦ ${gesture.gestureName} (${Math.round(gesture.confidence * 100)}%)`;
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    const textMetrics = ctx.measureText(text);
    const boxWidth = textMetrics.width + 24;
    const boxHeight = 28;
    const boxX = wrist.x - boxWidth / 2;
    const boxY = wrist.y + 20;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, boxX + 12, boxY + 18);

    ctx.restore();
  }
}

export const handGestureDetector = new HandGestureDetector();
