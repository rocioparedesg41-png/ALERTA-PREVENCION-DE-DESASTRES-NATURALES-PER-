// Emergency Alarm Controller using Web Audio API + HTML5 Audio Fallback
import { reproducirAlarma, detenerAlarma as detenerAlarmaServicio } from '../servicios/alarma';

class AlarmController {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;
  private listeners: Set<(playing: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioElement = new Audio('/alarma.mp3');
        this.audioElement.loop = true;
        this.audioElement.volume = 1.0;
        this.audioElement.preload = 'auto';
      } catch (e) {
        console.warn('HTML5 Audio not available, will use Web Audio API', e);
      }
    }
  }

  public subscribe(cb: (playing: boolean) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isPlaying));
  }

  public async startAlarm(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.notify();

    // 1. Try to play via pure TS module servicios/alarma
    let playedViaService = false;
    try {
      playedViaService = await reproducirAlarma();
    } catch (e) {
      console.warn('Error en servicio de alarma:', e);
    }

    // 2. Try to play standard audio file directly if service had autoplay restriction
    let audioFilePlayed = playedViaService;
    if (!audioFilePlayed && this.audioElement) {
      try {
        this.audioElement.currentTime = 0;
        await this.audioElement.play();
        audioFilePlayed = true;
      } catch (err) {
        console.info('Audio element play restricted or failed, activating Web Audio synthesizer', err);
      }
    }

    // 3. Always activate Web Audio synthesizer if audio file didn't start or as backup
    if (!audioFilePlayed) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new AudioCtx();
          }
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          const ctx = this.audioContext;
          this.gainNode = ctx.createGain();
          this.gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
          this.gainNode.connect(ctx.destination);

          this.osc1 = ctx.createOscillator();
          this.osc2 = ctx.createOscillator();

          this.osc1.type = 'sawtooth';
          this.osc2.type = 'sine';

          this.osc1.frequency.setValueAtTime(480, ctx.currentTime);
          this.osc2.frequency.setValueAtTime(480, ctx.currentTime);

          this.osc1.connect(this.gainNode);
          this.osc2.connect(this.gainNode);

          this.osc1.start();
          this.osc2.start();

          // Modulate frequency to create authentic smooth rising & falling civil defense emergency siren (480Hz <-> 920Hz)
          const startTime = ctx.currentTime;
          let intervalTick = 0;
          this.intervalId = setInterval(() => {
            if (!this.isPlaying || !this.osc1 || !this.osc2 || !this.audioContext) return;
            intervalTick++;
            const t = this.audioContext.currentTime - startTime;
            // 2.4s period oscillation
            const cycle = (Math.sin((2 * Math.PI * t) / 2.4 - Math.PI / 2) + 1) / 2;
            const targetFreq = 480 + 440 * Math.pow(cycle, 1.1);

            this.osc1.frequency.setTargetAtTime(targetFreq, this.audioContext.currentTime, 0.08);
            this.osc2.frequency.setTargetAtTime(targetFreq * 1.01, this.audioContext.currentTime, 0.08);
          }, 60);
        }
      } catch (synthErr) {
        console.error('Failed to initialize Web Audio synth:', synthErr);
      }
    }

    // Vibrate device if supported (emergency cadence)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 600, 300]);
      } catch (e) {
        // ignore vibration permission errors
      }
    }
  }

  public stopAlarm(): void {
    this.isPlaying = false;

    // Detener servicio de alarma
    try {
      detenerAlarmaServicio();
    } catch (e) {}

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        // ignore
      }
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.osc1) {
      try {
        this.osc1.stop();
        this.osc1.disconnect();
      } catch (e) {}
      this.osc1 = null;
    }

    if (this.osc2) {
      try {
        this.osc2.stop();
        this.osc2.disconnect();
      } catch (e) {}
      this.osc2 = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }

    this.notify();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const alarmManager = new AlarmController();
