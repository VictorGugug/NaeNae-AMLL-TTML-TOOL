/*
 * Copyright 2023-2026 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * Use of this source code is governed by the GNU GPLv3 license.
 */

export const easeInOutCubic = (x: number): number => {
	return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

/**
 * Smoothly scrolls an element to a target scrollTop with easeInOutCubic.
 * Captures user interactions (wheel, touch, pointer, mousedown) to immediately
 * cancel the animation without lag when the user takes manual control.
 */
export const smoothScrollContainer = (
	element: HTMLElement,
	targetScrollTop: number,
	onStart?: () => void,
	onFinish?: () => void,
	durationMs?: number,
): (() => void) => {
	const start = element.scrollTop;
	const distance = targetScrollTop - start;
	if (Math.abs(distance) < 2) {
		onFinish?.();
		return () => {};
	}

	const duration =
		durationMs ?? Math.min(750, Math.max(350, Math.abs(distance) * 0.45));
	const startTime = performance.now();
	let cancelled = false;
	let animId = 0;

	onStart?.();

	const cancel = () => {
		if (cancelled) return;
		cancelled = true;
		if (animId) cancelAnimationFrame(animId);
		cleanup();
		onFinish?.();
	};

	const cleanup = () => {
		element.removeEventListener("wheel", cancel, true);
		element.removeEventListener("touchmove", cancel, true);
		element.removeEventListener("touchstart", cancel, true);
		element.removeEventListener("pointerdown", cancel, true);
		element.removeEventListener("mousedown", cancel, true);
		window.removeEventListener("wheel", cancel, true);
		window.removeEventListener("touchmove", cancel, true);
		window.removeEventListener("touchstart", cancel, true);
		window.removeEventListener("pointerdown", cancel, true);
		window.removeEventListener("mousedown", cancel, true);
	};

	element.addEventListener("wheel", cancel, { capture: true, passive: true });
	element.addEventListener("touchmove", cancel, { capture: true, passive: true });
	element.addEventListener("touchstart", cancel, { capture: true, passive: true });
	element.addEventListener("pointerdown", cancel, { capture: true, passive: true });
	element.addEventListener("mousedown", cancel, { capture: true, passive: true });
	window.addEventListener("wheel", cancel, { capture: true, passive: true });
	window.addEventListener("touchmove", cancel, { capture: true, passive: true });
	window.addEventListener("touchstart", cancel, { capture: true, passive: true });
	window.addEventListener("pointerdown", cancel, { capture: true, passive: true });
	window.addEventListener("mousedown", cancel, { capture: true, passive: true });

	const step = (now: number) => {
		if (cancelled) return;
		const elapsed = now - startTime;
		const progress = Math.min(1, elapsed / duration);
		const ease = easeInOutCubic(progress);
		element.scrollTop = start + distance * ease;

		if (progress < 1) {
			animId = requestAnimationFrame(step);
		} else {
			cleanup();
			onFinish?.();
		}
	};

	animId = requestAnimationFrame(step);
	return cancel;
};
