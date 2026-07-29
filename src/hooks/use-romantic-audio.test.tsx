// @vitest-environment jsdom

import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRomanticAudio } from "@/hooks/use-romantic-audio";

type OscillatorMock = {
  stop: ReturnType<typeof vi.fn>;
};

const originalAudioContext = window.AudioContext;
const originalAudio = window.Audio;
const oscillators: OscillatorMock[] = [];
const contexts: AudioContextMock[] = [];
const audioElements: AudioElementMock[] = [];

class AudioElementMock {
  currentTime = 0;
  loop = false;
  paused = true;
  preload = "";
  src: string;
  volume = 1;

  load = vi.fn();
  pause = vi.fn().mockImplementation(() => {
    this.paused = true;
  });
  play = vi.fn().mockImplementation(async () => {
    this.paused = false;
  });

  constructor(src = "") {
    this.src = src;
    audioElements.push(this);
  }
}

class AudioContextMock {
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  state: AudioContextState = "running";

  constructor() {
    contexts.push(this);
  }

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

class SuspendedAudioContextMock extends AudioContextMock {
  override state: AudioContextState = "suspended";
  override resume = vi.fn().mockImplementation(async () => {
    this.state = "running";
  });
}

function AudioHarness() {
  const {
    enabled,
    playFinalMusic,
    playLock,
    playTransition,
    prepareFinalMusic,
    toggle,
  } = useRomanticAudio(true);

  return (
    <>
      <button onClick={toggle} type="button">
        {enabled ? "Выключить" : "Включить"}
      </button>
      <button onClick={playLock} type="button">
        Проиграть замок
      </button>
      <button onClick={playTransition} type="button">
        Проиграть переход
      </button>
      <button onClick={prepareFinalMusic} type="button">
        Подготовить финал
      </button>
      <button onClick={playFinalMusic} type="button">
        Показать финал
      </button>
    </>
  );
}

beforeEach(() => {
  Object.defineProperty(window, "Audio", {
    configurable: true,
    value: AudioElementMock,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  oscillators.length = 0;
  contexts.length = 0;
  audioElements.length = 0;
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    value: originalAudioContext,
  });
  Object.defineProperty(window, "Audio", {
    configurable: true,
    value: originalAudio,
  });
});

describe("useRomanticAudio", () => {
  it("plays the supplied lock sample directly from the user action", () => {
    render(
      <StrictMode>
        <AudioHarness />
      </StrictMode>,
    );

    expect(
      screen.getByRole("button", { name: "Выключить" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Проиграть замок" }),
    );

    const audio = audioElements
      .filter((item) => item.src === "/audio/closed-metal-latch.mp3")
      .at(-1);
    expect(audio?.src).toBe("/audio/closed-metal-latch.mp3");
    expect(audio?.preload).toBe("auto");
    expect(audio?.play).toHaveBeenCalledOnce();
  });

  it("stops the lock sample when sound is disabled", () => {
    render(<AudioHarness />);
    const audio = audioElements.at(-1);

    fireEvent.click(
      screen.getByRole("button", { name: "Проиграть замок" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Выключить" }));

    expect(audio?.pause).toHaveBeenCalled();
    expect(audio?.currentTime).toBe(0);
  });

  it("plays the MP3 even when Web Audio is unavailable", () => {
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: undefined,
    });
    render(<AudioHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: "Проиграть замок" }),
    );

    const lockAudio = audioElements
      .filter((audio) => audio.src === "/audio/closed-metal-latch.mp3")
      .at(-1);
    expect(lockAudio?.play).toHaveBeenCalledOnce();
  });

  it("unlocks final music on the direct gesture and fades it in", () => {
    vi.useFakeTimers();
    render(<AudioHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: "Подготовить финал" }),
    );
    const music = audioElements.find(
      (audio) => audio.src === "/audio/final-romantic.mp3",
    );

    expect(music?.loop).toBe(true);
    expect(music?.volume).toBe(0);
    expect(music?.play).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Показать финал" }));
    act(() => vi.advanceTimersByTime(1_600));

    expect(music?.volume).toBeCloseTo(0.28);
  });

  it("resumes a suspended mobile audio context before the transition tone", async () => {
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: SuspendedAudioContextMock,
    });
    render(<AudioHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: "Проиграть переход" }),
    );

    await waitFor(() => expect(oscillators).toHaveLength(1));
    expect(contexts[0].resume).toHaveBeenCalledOnce();
    expect(contexts[0].state).toBe("running");
  });
});
