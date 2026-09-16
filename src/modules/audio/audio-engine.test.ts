// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { audioEngine } from "./audio-engine";

describe("audioEngine playback and completion", () => {
	beforeEach(() => {
		if (typeof window.AudioContext === "undefined") {
			(window as any).AudioContext = class {
				baseLatency = 0;
				outputLatency = 0;
				currentTime = 0;
				state = "running";
				resume = vi.fn().mockResolvedValue(undefined);
				createGain = vi.fn().mockReturnValue({
					gain: { value: 1, setTargetAtTime: vi.fn() },
					connect: vi.fn(),
				});
				createBiquadFilter = vi.fn().mockReturnValue({
					frequency: { value: 0 },
					gain: { value: 0, setTargetAtTime: vi.fn() },
					Q: { value: 1 },
					connect: vi.fn(),
				});
				createAnalyser = vi.fn().mockReturnValue({
					fftSize: 512,
					smoothingTimeConstant: 0.78,
					connect: vi.fn(),
				});
				createMediaElementSource = vi.fn().mockReturnValue({
					connect: vi.fn(),
				});
				decodeAudioData = vi.fn();
			};
		}
		audioEngine.unloadMusic();
	});

	it("computes duration with buffer preference and finite checks", () => {
		expect(audioEngine.musicDuration).toBe(0);

		const el = audioEngine.audioEl;
		Object.defineProperty(el, "duration", { value: 120.5, configurable: true });
		expect(audioEngine.musicDuration).toBe(120.5);

		const buffer = { duration: 121.2 } as AudioBuffer;
		(audioEngine as any).musicBuffer = buffer;
		expect(audioEngine.musicDuration).toBe(121.2);
	});

	it("clamps interpolatedCurrentTime to duration and triggers handlePlaybackEnded", () => {
		const el = audioEngine.audioEl;
		Object.defineProperty(el, "duration", { value: 100, configurable: true });
		Object.defineProperty(el, "paused", { value: false, configurable: true });
		Object.defineProperty(el, "ended", { value: false, configurable: true });
		Object.defineProperty(el, "currentTime", { value: 99.98, configurable: true, writable: true });

		const pauseSpy = vi.fn();
		const endedSpy = vi.fn();
		audioEngine.addEventListener("music-pause", pauseSpy);
		audioEngine.addEventListener("music-ended", endedSpy);

		const time = audioEngine.interpolatedCurrentTime;
		expect(time).toBe(100);
		expect(pauseSpy).toHaveBeenCalled();
		expect(endedSpy).toHaveBeenCalled();

		audioEngine.removeEventListener("music-pause", pauseSpy);
		audioEngine.removeEventListener("music-ended", endedSpy);
	});

	it("restarts from 0:00 if resumeOrSeekMusic is called at or near duration", async () => {
		const el = audioEngine.audioEl;
		Object.defineProperty(el, "duration", { value: 100, configurable: true });
		Object.defineProperty(el, "currentTime", { value: 99.95, configurable: true, writable: true });
		el.play = vi.fn().mockResolvedValue(undefined);

		await audioEngine.resumeOrSeekMusic();

		expect(el.currentTime).toBe(0);
		expect(el.play).toHaveBeenCalled();
	});

	it("holds pending seek time during seekMusic", () => {
		const el = audioEngine.audioEl;
		Object.defineProperty(el, "duration", { value: 100, configurable: true });
		Object.defineProperty(el, "currentTime", { value: 20, configurable: true, writable: true });

		audioEngine.seekMusic(45.5);

		expect(audioEngine.musicCurrentTime).toBe(45.5);
		expect(audioEngine.interpolatedCurrentTime).toBe(45.5);
		expect(el.currentTime).toBe(45.5);
	});
});
