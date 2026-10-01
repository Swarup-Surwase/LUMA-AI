export interface CameraStreamResult {
  stream: MediaStream | null;
  isSimulated: boolean;
  error?: string;
}

export async function initAccessibleCamera(
  facingMode: 'user' | 'environment' = 'user'
): Promise<CameraStreamResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      isSimulated: true,
      error: 'Media devices API not available in this browser.'
    };
  }

  try {
    let stream: MediaStream | null = null;

    // 1. Try simple constraints first (most compatible with macOS Safari & Chrome)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode === 'environment' ? 'environment' : 'user'
        },
        audio: false
      });
    } catch {
      // 2. Fallback to basic { video: true }
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
    }

    return { stream, isSimulated: false };
  } catch (err: any) {
    console.warn('Camera access error:', err);
    let errorMsg = err.message || 'Camera permission denied or camera not available.';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMsg = 'Camera permission was denied. Please allow camera access in your browser settings (Safari -> Settings -> Websites -> Camera -> Allow).';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMsg = 'No camera device found on this system.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMsg = 'Camera is already in use by another application (e.g. FaceTime, Zoom).';
    }

    return {
      stream: null,
      isSimulated: true,
      error: errorMsg
    };
  }
}

export function stopAccessibleCamera(
  stream: MediaStream | null,
  videoElement?: HTMLVideoElement | null
): void {
  try {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  } catch (err) {
    console.warn('Error stopping camera:', err);
  }
}
