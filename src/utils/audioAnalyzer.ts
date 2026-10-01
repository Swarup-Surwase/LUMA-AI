export class AudioLevelAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private isRunning = false;
  private animId: number | null = null;

  public async start(
    streamOrCallback?: MediaStream | ((level: number) => void),
    callback?: (level: number) => void
  ): Promise<void> {
    try {
      if (this.isRunning) return;

      let userStream: MediaStream;
      let onLevelCallback: ((level: number) => void) | undefined;

      if (typeof streamOrCallback === 'function') {
        onLevelCallback = streamOrCallback;
        userStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else if (streamOrCallback instanceof MediaStream) {
        userStream = streamOrCallback;
        onLevelCallback = callback;
      } else {
        userStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        onLevelCallback = callback;
      }

      this.stream = userStream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.mediaStreamSource = this.audioContext.createMediaStreamSource(userStream);
      this.mediaStreamSource.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.isRunning = true;

      if (onLevelCallback) {
        const loop = () => {
          if (!this.isRunning) return;
          const level = this.getAudioLevel();
          onLevelCallback!(level);
          this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
      }
    } catch (err) {
      console.warn('Audio analyzer init fallback:', err);
    }
  }

  public getAudioLevel(): number {
    if (!this.isRunning || !this.analyser || !this.dataArray) {
      return 0;
    }

    this.analyser.getByteFrequencyData(this.dataArray as unknown as Uint8Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;
    return Math.min(1.0, average / 128); // Normalized 0.0 to 1.0
  }

  public stop(): void {
    try {
      this.isRunning = false;
      if (this.animId !== null) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      this.mediaStreamSource?.disconnect();
      this.audioContext?.close();
      this.stream?.getTracks().forEach(track => track.stop());
    } catch {
      // ignore
    }
  }
}

export const audioAnalyzer = new AudioLevelAnalyzer();
