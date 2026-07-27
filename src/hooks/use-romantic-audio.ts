"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type WebkitWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function useRomanticAudio(available: boolean) {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(false);
  const timersRef = useRef<Set<number>>(new Set());
  const toggleOperationRef = useRef(0);
  const voicesRef = useRef<
    Set<{ oscillator: OscillatorNode; gain: GainNode }>
  >(new Set());

  const getContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;

    const AudioContextClass =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;

    if (!AudioContextClass) return null;

    contextRef.current = new AudioContextClass();
    return contextRef.current;
  }, []);

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
  }, []);

  useEffect(
    () => () => {
      toggleOperationRef.current += 1;
      enabledRef.current = false;
      stopPlayback();
      void contextRef.current?.close();
    },
    [stopPlayback],
  );

  const toggle = useCallback(async () => {
    if (!available) return;
    const next = !enabledRef.current;
    const operation = toggleOperationRef.current + 1;
    toggleOperationRef.current = operation;

    if (!next) {
      enabledRef.current = false;
      setEnabled(false);
      stopPlayback();
      return;
    }

    try {
      const context = getContext();
      if (!context) return;

      enabledRef.current = true;
      setEnabled(true);
      if (context?.state === "suspended") await context.resume();
    } catch {
      if (toggleOperationRef.current !== operation) return;
      enabledRef.current = false;
      setEnabled(false);
      stopPlayback();
    }
  }, [available, getContext, stopPlayback]);

  const playTone = useCallback(
    (frequency: number, duration: number, gainValue: number) => {
      if (!enabledRef.current) return;
      const context = getContext();
      if (!context) return;

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
        playTone(frequency, duration, gainValue);
      }, delay);
      timersRef.current.add(timer);
    },
    [playTone],
  );

  const playLock = useCallback(() => {
    playTone(659.25, 0.52, 0.045);
    scheduleTone(987.77, 0.62, 0.026, 90);
  }, [playTone, scheduleTone]);

  const playTransition = useCallback(() => {
    playTone(329.63, 1.35, 0.032);
    scheduleTone(493.88, 1.5, 0.025, 240);
  }, [playTone, scheduleTone]);

  return { enabled, toggle, playLock, playTransition };
}
