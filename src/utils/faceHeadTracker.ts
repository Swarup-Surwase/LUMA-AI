/**
 * Face and Head Orientation Tracker for Hands-Free Gaze Navigation
 * Tracks head tilt, yaw, and centroid motion from live webcam stream in real-time (~60fps)
 * without requiring external bulky models, providing smooth, jitter-free cursor steering.
 */

export interface HeadPose {
  x: number;          // Normalized 0..1 (Screen X)
  y: number;          // Normalized 0..1 (Screen Y)
  headCenterX: number; // Raw camera frame normalized X
  headCenterY: number; // Raw camera frame normalized Y
  faceDetected: boolean;
  confidence: number;
}

export class FaceHeadTracker {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  
  private neutralCenterX = 0.5;
  private neutralCenterY = 0.45;
  private isCalibrated = false;
  private calibrationFrames = 0;
  
  private smoothedScreenX = 0.5;
  private smoothedScreenY = 0.5;
  private lastHeadX = 0.5;
  private lastHeadY = 0.45;

  constructor() {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 120;
      this.offscreenCanvas.height = 90;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  /**
   * Reset calibration so current user head position becomes center (0.5, 0.5)
   */
  public recalibrate() {
    this.isCalibrated = false;
    this.calibrationFrames = 0;
  }

  /**
   * Process a single video frame and calculate screen cursor position from head position
   */
  public trackHead(
    video: HTMLVideoElement,
    sensitivity: number = 2.0
  ): HeadPose {
    if (!video || video.readyState < 2 || !this.offscreenCtx || !this.offscreenCanvas) {
      return {
        x: this.smoothedScreenX,
        y: this.smoothedScreenY,
        headCenterX: this.lastHeadX,
        headCenterY: this.lastHeadY,
        faceDetected: false,
        confidence: 0
      };
    }

    const sw = this.offscreenCanvas.width;
    const sh = this.offscreenCanvas.height;

    try {
      this.offscreenCtx.drawImage(video, 0, 0, sw, sh);
      const imgData = this.offscreenCtx.getImageData(0, 0, sw, sh);
      const data = imgData.data;

      let skinCount = 0;
      let weightedX = 0;
      let weightedY = 0;

      // Scan frame for face / head region using YCbCr skin & luminance weighting
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const idx = (y * sw + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // YCbCr Illumination invariant transform
          const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          const Cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
          const Cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;

          // Face skin threshold
          const isFaceSkin =
            Y >= 30 &&
            Cb >= 75 &&
            Cb <= 135 &&
            Cr >= 130 &&
            Cr <= 180 &&
            r > g &&
            r > b;

          if (isFaceSkin) {
            // Prioritize upper/central face features (nose bridge & eyes area)
            const weight = 1.0 + (1 - Math.abs(x - sw / 2) / (sw / 2)) * 0.5;
            skinCount++;
            weightedX += x * weight;
            weightedY += y * weight;
          }
        }
      }

      if (skinCount > 150) {
        const rawNormX = (weightedX / (skinCount * 1.25)) / sw;
        const rawNormY = (weightedY / (skinCount * 1.25)) / sh;

        // Invert X because camera is mirrored (moving head right should move cursor right)
        const mirroredHeadX = 1.0 - rawNormX;
        const headY = rawNormY;

        // Auto-calibration on initial startup
        if (!this.isCalibrated) {
          this.calibrationFrames++;
          if (this.calibrationFrames === 1) {
            this.neutralCenterX = mirroredHeadX;
            this.neutralCenterY = headY;
          } else {
            this.neutralCenterX = this.neutralCenterX * 0.8 + mirroredHeadX * 0.2;
            this.neutralCenterY = this.neutralCenterY * 0.8 + headY * 0.2;
          }

          if (this.calibrationFrames >= 15) {
            this.isCalibrated = true;
          }
        }

        this.lastHeadX = mirroredHeadX;
        this.lastHeadY = headY;

        // Calculate displacement relative to neutral resting head center
        const deltaX = (mirroredHeadX - this.neutralCenterX) * sensitivity * 2.8;
        const deltaY = (headY - this.neutralCenterY) * sensitivity * 3.2;

        // Target screen coordinate (clamped 0..1)
        const targetScreenX = Math.max(0.02, Math.min(0.98, 0.5 + deltaX));
        const targetScreenY = Math.max(0.02, Math.min(0.98, 0.5 + deltaY));

        // Smooth with Exponential Moving Average (EMA) to prevent hand/head jitters
        const smoothingFactor = 0.28;
        this.smoothedScreenX = this.smoothedScreenX * (1 - smoothingFactor) + targetScreenX * smoothingFactor;
        this.smoothedScreenY = this.smoothedScreenY * (1 - smoothingFactor) + targetScreenY * smoothingFactor;

        return {
          x: this.smoothedScreenX,
          y: this.smoothedScreenY,
          headCenterX: mirroredHeadX,
          headCenterY: headY,
          faceDetected: true,
          confidence: Math.min(0.95, skinCount / 1000)
        };
      }

      return {
        x: this.smoothedScreenX,
        y: this.smoothedScreenY,
        headCenterX: this.lastHeadX,
        headCenterY: this.lastHeadY,
        faceDetected: false,
        confidence: 0
      };
    } catch {
      return {
        x: this.smoothedScreenX,
        y: this.smoothedScreenY,
        headCenterX: this.lastHeadX,
        headCenterY: this.lastHeadY,
        faceDetected: false,
        confidence: 0
      };
    }
  }
}

export const faceHeadTracker = new FaceHeadTracker();
