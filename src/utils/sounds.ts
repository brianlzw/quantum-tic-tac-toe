// Simple sound effects using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context on user interaction
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.warn('Web Audio API not supported');
        }
      };
      
      // Initialize on first user interaction
      document.addEventListener('click', initAudio, { once: true });
      document.addEventListener('touchstart', initAudio, { once: true });
    }
  }

  private ensureContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
    if (!this.enabled || !this.ensureContext() || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playMove() {
    // Short, pleasant click sound
    this.playTone(800, 0.1, 'sine', 0.15);
    setTimeout(() => {
      this.playTone(600, 0.1, 'sine', 0.1);
    }, 50);
  }

  playSelect() {
    // Subtle selection sound
    this.playTone(600, 0.08, 'sine', 0.12);
  }

  playCycle() {
    // Warning-like sound for cycle detection
    this.playTone(400, 0.2, 'sine', 0.2);
    setTimeout(() => {
      this.playTone(500, 0.2, 'sine', 0.15);
    }, 100);
  }

  playCollapse() {
    // Satisfying collapse sound
    this.playTone(300, 0.15, 'sine', 0.18);
    setTimeout(() => {
      this.playTone(400, 0.15, 'sine', 0.15);
    }, 50);
    setTimeout(() => {
      this.playTone(500, 0.15, 'sine', 0.12);
    }, 100);
  }

  playWin() {
    // Celebratory sound
    const notes = [523.25, 659.25, 783.99]; // C, E, G
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.2);
      }, i * 150);
    });
  }

  playError() {
    // Subtle error sound
    this.playTone(200, 0.2, 'sawtooth', 0.1);
  }
}

export const soundManager = new SoundManager();

