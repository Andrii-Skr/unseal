// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRomanticAudio } from "@/hooks/use-romantic-audio";

type OscillatorMock = {
  stop: ReturnType<typeof vi.fn>;
};

const originalAudioContext = window.AudioContext;
const oscillators: OscillatorMock[] = [];

class AudioContextMock {
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  state: AudioContextState = "running";

  close = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);

  createGain() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: {
        exponentialRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
      },
    } as unknown as GainNode;
  }

  createOscillator() {
    const oscillator = {
      addEventListener: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      frequency: {
        exponentialRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
      },
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine",
    };
    oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }
}

function AudioHarness() {
  const { enabled, playLock, toggle } = useRomanticAudio(true);

  return (
    <>
      <button onClick={toggle} type="button">
        {enabled ? "Выключить" : "Включить"}
      </button>
      <button onClick={playLock} type="button">
        Проиграть
      </button>
    </>
  );
}

afterEach(() => {
  vi.useRealTimers();
  oscillators.length = 0;
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    value: originalAudioContext,
  });
});

describe("useRomanticAudio", () => {
  it("cancels active and delayed tones when sound is disabled", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: AudioContextMock,
    });
    render(<AudioHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Включить" }));
    fireEvent.click(screen.getByRole("button", { name: "Проиграть" }));
    expect(oscillators).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Выключить" }));
    expect(oscillators[0].stop).toHaveBeenLastCalledWith();

    act(() => vi.advanceTimersByTime(100));
    expect(oscillators).toHaveLength(1);
  });

  it("stays disabled when Web Audio is unavailable", () => {
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: undefined,
    });
    render(<AudioHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Включить" }));

    expect(
      screen.getByRole("button", { name: "Включить" }),
    ).toBeInTheDocument();
    expect(oscillators).toHaveLength(0);
  });
});
