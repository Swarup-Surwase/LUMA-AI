import { Language } from '../types/luma';

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private isSpeakingState = false;
  private recognition: any = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public speak(text: string, language: Language = 'en', onEnd?: () => void) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      onEnd?.();
      return;
    }

    this.stop();

    // Ensure voices are loaded
    if (!this.voices.length) {
      this.loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // slightly calmer, accessible rate
    utterance.pitch = 1.0;

    const langCodeMap: Record<Language, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      mr: 'mr-IN'
    };

    const targetLang = langCodeMap[language] || 'en-US';
    utterance.lang = targetLang;

    // Try finding matching voice
    const matchingVoice = this.voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      onEnd?.();
    };

    utterance.onerror = (e: any) => {
      if (e.error === 'interrupted' || e.error === 'canceled' || e.error === 'not-allowed') {
        this.isSpeakingState = false;
        onEnd?.();
        return;
      }
      this.isSpeakingState = false;
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeakingState = false;
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState || (this.synth?.speaking ?? false);
  }

  // Voice Speech Recognition
  public startListening(
    language: Language = 'en',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError(new Error('Speech recognition is not supported in this browser.'));
      return () => {};
    }

    let isManuallyStopped = false;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      const langMap: Record<Language, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN'
      };
      this.recognition.lang = langMap[language] || 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          onResult(text, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        // Ignore normal conversational pauses
        if (event.error === 'no-speech' || event.error === 'network') {
          return;
        }
        console.warn('SpeechRecognition error:', event.error);
        onError(event.error);
      };

      this.recognition.onend = () => {
        // Auto restart if not manually stopped
        if (!isManuallyStopped) {
          try {
            this.recognition?.start();
          } catch {
            // ignore
          }
        }
      };

      this.recognition.start();

      return () => {
        isManuallyStopped = true;
        try {
          this.recognition?.stop();
        } catch {
          // ignore
        }
      };
    } catch (e) {
      onError(e);
      return () => {};
    }
  }
}

export const speechEngine = new SpeechEngine();
