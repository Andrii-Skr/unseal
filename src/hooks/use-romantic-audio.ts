"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type WebkitWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const FINAL_MUSIC_VOLUME = 0.2;
const FINAL_MUSIC_FADE_STEPS = 16;
const FINAL_MUSIC_FADE_STEP_MS = 100;

export function useRomanticAudio(available: boolean) {
  const [enabled, setEnabled] = useState(available);
  const contextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(available);
  const finalAudioRef = useRef<HTMLAudioElement | null>(null);
  const finalFadeTimersRef = useRef<Set<number>>(new Set());
  const lockAudioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<Set<number>>(new Set());
  const voicesRef = useRef<
    Set<{ oscillator: OscillatorNode; gain: GainNode }>
  >(new Set());

  const getLockAudio = useCallback(() => {
    if (lockAudioRef.current) return lockAudioRef.current;

    const audio = new window.Audio("/audio/closed-metal-latch.mp3");
    audio.preload = "auto";
    audio.volume = 0.9;
    lockAudioRef.current = audio;
    return audio;
  }, []);

  const getFinalAudio = useCallback(() => {
    if (finalAudioRef.current) return finalAudioRef.current;

    const audio = new window.Audio("/audio/final-romantic.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    finalAudioRef.current = audio;
    return audio;
  }, []);

  const getContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;

    const AudioContextClass =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;

    if (!AudioContextClass) return null;

    contextRef.current = new AudioContextClass();
    return contextRef.current;
  }, []);

  const cancelFinalMusicFade = useCallback(() => {
    for (const timer of finalFadeTimersRef.current) {
      window.clearTimeout(timer);
    }
    finalFadeTimersRef.current.clear();
  }, []);

  const stopFinalMusic = useCallback(() => {
    cancelFinalMusicFade();
    const finalAudio = finalAudioRef.current;

    if (finalAudio) {
      finalAudio.pause();
      finalAudio.volume = 0;
      try {
        finalAudio.currentTime = 0;
      } catch {
        // The media metadata may not be available yet.
      }
    }
  }, [cancelFinalMusicFade]);

  const stopPlayback = useCallback(() => {
    for (const timer of timersRef.current) {
      window.clearTimeout(timer);
    }
    timersRef.current.clear();

    for (const voice of voicesRef.current) {
      try {
        voice.oscillator.stop();
      } catch {
        // The oscillator may already have ended.
      }
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }
    voicesRef.current.clear();

    const lockAudio = lockAudioRef.current;
    if (lockAudio) {
      lockAudio.pause();
      try {
        lockAudio.currentTime = 0;
      } catch {
        // The media metadata may not be available yet.
      }
    }
    stopFinalMusic();
  }, [stopFinalMusic]);

  useEffect(() => {
    enabledRef.current = available;
    if (available) {
      getLockAudio().load();
      getFinalAudio().load();
    }

    return () => {
      enabledRef.current = false;
      stopPlayback();
      const context = contextRef.current;
      contextRef.current = null;
      void context?.close();
      finalAudioRef.current = null;
      lockAudioRef.current = null;
    };
  }, [available, getFinalAudio, getLockAudio, stopPlayback]);

  const toggle = useCallback(() => {
    if (!available) return;
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);

    if (next) {
      getLockAudio();
      getFinalAudio();
    } else {
      stopPlayback();
    }
  }, [available, getFinalAudio, getLockAudio, stopPlayback]);

  const playTone = useCallback(
    async (frequency: number, duration: number, gainValue: number) => {
      if (!enabledRef.current) return;
      let context: AudioContext | null;

      try {
        context = getContext();
        if (!context) return;

        if (context.state !== "running" && context.state !== "closed") {
          await context.resume();
        }
      } catch {
        return;
      }

      if (!enabledRef.current || context.state === "closed") return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const voice = { oscillator, gain };
      const now = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 1.08,
        now + duration,
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);
      voicesRef.current.add(voice);
      oscillator.addEventListener(
        "ended",
        () => {
          oscillator.disconnect();
          gain.disconnect();
          voicesRef.current.delete(voice);
        },
        { once: true },
      );
      oscillator.start(now);
      oscillator.stop(now + duration + 0.05);
    },
    [getContext],
  );

  const scheduleTone = useCallback(
    (
      frequency: number,
      duration: number,
      gainValue: number,
      delay: number,
    ) => {
      const timer = window.setTimeout(() => {
        timersRef.current.delete(timer);
        void playTone(frequency, duration, gainValue);
      }, delay);
      timersRef.current.add(timer);
    },
    [playTone],
  );

  const playLock = useCallback(() => {
    if (!enabledRef.current) return;

    const audio = getLockAudio();
    audio.pause();

    try {
      audio.currentTime = 0;
      const playback = audio.play();
      if (playback) void playback.catch(() => undefined);
    } catch {
      // Safari can reject playback when the page has lost user activation.
    }
  }, [getLockAudio]);

  const prepareFinalMusic = useCallback(() => {
    if (!enabledRef.current) return;

    const audio = getFinalAudio();
    cancelFinalMusicFade();
    audio.pause();
    audio.volume = 0;

    try {
      audio.currentTime = 0;
      const playback = audio.play();
      if (playback) void playback.catch(() => undefined);
    } catch {
      // The later final-stage attempt remains available as a fallback.
    }
  }, [cancelFinalMusicFade, getFinalAudio]);

  const playFinalMusic = useCallback(() => {
    if (!enabledRef.current) return;

    const audio = getFinalAudio();
    cancelFinalMusicFade();

    if (audio.paused) {
      try {
        const playback = audio.play();
        if (playback) void playback.catch(() => undefined);
      } catch {
        return;
      }
    }

    const initialVolume = audio.volume;
    for (let step = 1; step <= FINAL_MUSIC_FADE_STEPS; step += 1) {
      const timer = window.setTimeout(() => {
        finalFadeTimersRef.current.delete(timer);
        audio.volume =
          initialVolume +
          (FINAL_MUSIC_VOLUME - initialVolume) *
            (step / FINAL_MUSIC_FADE_STEPS);
      }, step * FINAL_MUSIC_FADE_STEP_MS);
      finalFadeTimersRef.current.add(timer);
    }
  }, [cancelFinalMusicFade, getFinalAudio]);

  const playTransition = useCallback(() => {
    void playTone(329.63, 1.35, 0.05);
    scheduleTone(493.88, 1.5, 0.036, 240);
  }, [playTone, scheduleTone]);

  return {
    enabled,
    playFinalMusic,
    playLock,
    playTransition,
    prepareFinalMusic,
    stopFinalMusic,
    toggle,
  };
}
