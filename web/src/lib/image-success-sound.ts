"use client";

import type { AiConfig } from "@/stores/use-config-store";

type SoundConfig = Pick<AiConfig, "imageSuccessSoundEnabled" | "imageSuccessSoundUrl">;

export function playImageSuccessSound(config: SoundConfig) {
    if (typeof window === "undefined" || config.imageSuccessSoundEnabled === "false") return;

    const soundUrl = config.imageSuccessSoundUrl.trim();
    if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.volume = 0.55;
        void audio.play().catch(() => {});
        return;
    }

    playDefaultSuccessTone();
}

function playDefaultSuccessTone() {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
        const context = new AudioContextCtor();
        const now = context.currentTime;
        const master = context.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        master.connect(context.destination);

        [659.25, 987.77].forEach((frequency, index) => {
            const start = now + index * 0.1;
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.7, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
            oscillator.connect(gain);
            gain.connect(master);
            oscillator.start(start);
            oscillator.stop(start + 0.26);
        });

        window.setTimeout(() => void context.close().catch(() => {}), 700);
    } catch {
        // Sound is optional; browser autoplay or device restrictions should never block generation.
    }
}
