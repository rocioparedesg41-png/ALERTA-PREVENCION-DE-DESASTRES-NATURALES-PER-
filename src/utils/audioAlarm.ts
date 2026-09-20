// Emergency Alarm Controller using Web Audio API + HTML5 Audio (/alarma_sismo.mp3 & /alarma.mp3)
import { reproducirAlarma, detenerAlarma as detenerAlarmaServicio } from '../servicios/alarma';

class AlarmController {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;
  private vibrationIntervalId: any = null;
  private wakeLockSentinel: any = null;
  private listeners: Set<(playing: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Precarga perezosa del buffer de audio si es posible
      this.precargarBufferAudio();
    }
  }

  private async precargarBufferAudio(): Promise<void> {
    try {
      let res = await fetch('/alarma_sismo.mp3');
      if (!res.ok) res = await fetch('/alarma.mp3');
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const tempCtx = new AudioCtx();
          this.audioBuffer = await tempCtx.decodeAudioData(arrayBuf);
          if (tempCtx.state !== 'closed') {
            await tempCtx.close().catch(() => {});
          }
        }
      }
    } catch {
      // Si falla la precarga (p.ej. offline inicial), se cargará al sonar
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

    // 1. Iniciar reproducción directa del archivo de audio oficial (/alarma_sismo.mp3 o /alarma.mp3)
    let audioPlayed = false;
    try {
      audioPlayed = await reproducirAlarma();
    } catch (e) {
      console.warn('Error en reproducirAlarma():', e);
    }

    // 2. Elemento HTMLAudioElement directo de respaldo en el controlador
    if (!this.audioElement && typeof window !== 'undefined') {
      try {
        this.audioElement = new Audio('/alarma_sismo.mp3');
        this.audioElement.loop = true;
        this.audioElement.volume = 1.0;
        this.audioElement.addEventListener('error', () => {
          if (this.audioElement) {
            this.audioElement.src = '/alarma.mp3';
            this.audioElement.load();
            this.audioElement.play().catch(() => {});
          }
        });
      } catch (e) {
        console.warn('No se pudo crear HTMLAudioElement:', e);
      }
    }

    if (this.audioElement) {
      try {
        this.audioElement.currentTime = 0;
        await this.audioElement.play();
        audioPlayed = true;
      } catch (err) {
        console.info('AudioElement play restringido, activando decodificación Web Audio:', err);
      }
    }

    // 3. Web Audio API con AudioBuffer del archivo MP3 (Garantiza sonido incluso en iframes con políticas estrictas)
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
        this.gainNode.gain.setValueAtTime(0.9, ctx.currentTime);
        this.gainNode.connect(ctx.destination);

        // Si tenemos el audioBuffer precargado del archivo mp3 oficial, reproducirlo en bucle
        if (this.audioBuffer) {
          this.bufferSource = ctx.createBufferSource();
          this.bufferSource.buffer = this.audioBuffer;
          this.bufferSource.loop = true;
          this.bufferSource.connect(this.gainNode);
          this.bufferSource.start(0);
          audioPlayed = true;
          console.log('[audioAlarm] Archivo mp3 decodificado reproduciéndose en Web Audio API con éxito.');
        } else {
          // Intentar decodificar el mp3 en caliente
          fetch('/alarma_sismo.mp3')
            .catch(() => fetch('/alarma.mp3'))
            .then((r) => (r.ok ? r.arrayBuffer() : null))
            .then(async (ab) => {
              if (ab && this.isPlaying && this.audioContext) {
                this.audioBuffer = await this.audioContext.decodeAudioData(ab);
                if (this.isPlaying && this.gainNode) {
                  this.bufferSource = this.audioContext.createBufferSource();
                  this.bufferSource.buffer = this.audioBuffer;
                  this.bufferSource.loop = true;
                  this.bufferSource.connect(this.gainNode);
                  this.bufferSource.start(0);
                }
              }
            })
            .catch(() => {});
        }

        // Si el archivo mp3 no pudo sonar de inmediato, usar osciladores de sirena en paralelo
        if (!audioPlayed) {
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

          const startTime = ctx.currentTime;
          this.intervalId = setInterval(() => {
            if (!this.isPlaying || !this.osc1 || !this.osc2 || !this.audioContext) return;
            const t = this.audioContext.currentTime - startTime;
            const cycle = (Math.sin((2 * Math.PI * t) / 2.4 - Math.PI / 2) + 1) / 2;
            const targetFreq = 480 + 440 * Math.pow(cycle, 1.1);

            this.osc1.frequency.setTargetAtTime(targetFreq, this.audioContext.currentTime, 0.08);
            this.osc2.frequency.setTargetAtTime(targetFreq * 1.01, this.audioContext.currentTime, 0.08);
          }, 60);
        }
      }
    } catch (synthErr) {
      console.error('Error al iniciar Web Audio:', synthErr);
    }

    // 4. MediaSession API: Mantener audio en segundo plano incluso con pantalla bloqueada
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: '🚨 ¡ALARMA SÍSMICA NACIONAL - PERÚ!',
          artist: 'Red Sísmica SASPE / IGP / INDECI',
          album: 'Alerta Temprana de Emergencia Sísmica',
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (e) {}
    }

    // 5. Wake Lock API: Mantener la pantalla encendida
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      } catch (e) {}
    }

    // 6. Vibración de emergencia continua y persistente
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 200, 600, 200, 800]);
        if (this.vibrationIntervalId) clearInterval(this.vibrationIntervalId);
        this.vibrationIntervalId = setInterval(() => {
          if (!this.isPlaying) return;
          try {
            navigator.vibrate([600, 200, 600, 200, 800]);
          } catch {}
        }, 2500);
      } catch (e) {}
    }
  }

  public stopAlarm(): void {
    this.isPlaying = false;

    // Detener servicio de alarma HTML5
    try {
      detenerAlarmaServicio();
    } catch (e) {}

    // Detener elemento de audio local
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
    }

    // Detener AudioBufferSourceNode del archivo mp3
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch (e) {}
      this.bufferSource = null;
    }

    // Detener osciladores sintéticos
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

    // Detener MediaSession
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    // Liberar WakeLock
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }

    // Detener vibración
    if (this.vibrationIntervalId) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
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
