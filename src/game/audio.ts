export class ArcadeAudio {
    ctx: AudioContext | null = null;
    isMuted: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
    }

    private ensureContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playKick() {
        if (!this.ctx || this.isMuted) return;
        this.ensureContext();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle'; // Softer than square
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.start(t);
        osc.stop(t + 0.1);
    }

    playWall() {
        if (!this.ctx || this.isMuted) return;
        this.ensureContext();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        osc.start(t);
        osc.stop(t + 0.05);
    }

    playScore(isHome: boolean) {
        if (!this.ctx || this.isMuted) return;
        this.ensureContext();

        const t = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.6);

        // Arpeggio
        const notes = isHome ? [523.25, 659.25, 783.99, 1046.50] : [220, 196, 164, 130]; // C Major vs descending minor-ish

        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            osc.connect(gain);
            osc.type = isHome ? 'square' : 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + i * 0.1);
            osc.start(t + i * 0.1);
            osc.stop(t + i * 0.1 + 0.2);
        });
    }
}
