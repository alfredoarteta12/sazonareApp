// Utilidad de audio con Web Audio API para alertas de cocina
// 100% independiente de archivos externos, funciona offline y con latencia cero

class KitchenAudioAlert {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sazonare_cocina_sonido');
      if (saved !== null) {
        this.soundEnabled = saved === 'true';
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    return this.ctx;
  }

  public isUnlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sazonare_cocina_sonido', String(enabled));
    }
  }

  // Activa el AudioContext con la interacción del usuario
  public async unlock(): Promise<boolean> {
    const ctx = this.getContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('Error al reanudar AudioContext:', e);
      }
    }
    return ctx.state === 'running';
  }

  // Campanilla de restaurante (D5 -> A5 -> D6 chime)
  public playOrderChime() {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Definición de las notas del acorde de campana
      const notes = [
        { freq: 587.33, start: 0.0, duration: 0.5, gain: 0.35 },  // Re (D5)
        { freq: 880.0, start: 0.12, duration: 0.6, gain: 0.4 },   // La (A5)
        { freq: 1174.66, start: 0.25, duration: 1.5, gain: 0.5 }, // Re agudo (D6)
      ];

      notes.forEach(({ freq, start, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        // Curva de ataque y decaimiento suave (campana de bronce)
        gainNode.gain.setValueAtTime(0, now + start);
        gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });

      // Vibración háptica en tablets y teléfonos
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } catch (err) {
      console.warn('Error al reproducir alerta de cocina:', err);
    }
  }

  // Doble campanilla de servicio para el mesero (Ding-Ding agudo de mostrador 🛎️)
  public playReadyBell() {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Doble repique agudo y metálico de timbre de cocina para llamar al mesero
      const strikes = [
        { time: 0.0, freq: 2093.0, duration: 0.75, gain: 0.45 }, // Primer Ding (Do agudo)
        { time: 0.2, freq: 2637.0, duration: 1.1, gain: 0.5 },   // Segundo Ding (Mi agudo)
      ];

      strikes.forEach(({ time, freq, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Tono triangular para sonido de campana de servicio metálica
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gainNode.gain.setValueAtTime(0, now + time);
        gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });

      // Vibración de aviso en el celular del mesero
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([250, 100, 250]);
      }
    } catch (err) {
      console.warn('Error al reproducir timbre de mesero:', err);
    }
  }
}

export const kitchenAudio = new KitchenAudioAlert();

class WaiterAudioAlert extends KitchenAudioAlert {
  constructor() {
    super();
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sazonare_mesero_sonido');
      if (saved !== null) {
        this.setEnabled(saved === 'true');
      }
    }
  }

  public override setEnabled(enabled: boolean) {
    super.setEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sazonare_mesero_sonido', String(enabled));
    }
  }
}

export const waiterAudio = new WaiterAudioAlert();

