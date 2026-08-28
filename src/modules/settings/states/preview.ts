import { atomWithStorage } from "jotai/utils";

export enum PreviewModeType {
	Standard = "standard",
	AMLL = "amll",
	Toxi = "toxi",
	Spicy = "spicy",
	Timing = "timing",
}

export const previewModeTypeAtom = atomWithStorage<PreviewModeType>(
	"previewModeType",
	PreviewModeType.Standard,
);

export const showTranslationLinesAtom = atomWithStorage(
	"showTranslationLines",
	false,
);
export const showRomanLinesAtom = atomWithStorage("showRomanLines", false);
export const hideObsceneWordsAtom = atomWithStorage("hideObsceneWords", false);
export const lyricWordFadeWidthAtom = atomWithStorage(
	"lyricWordFadeWidth",
	0.5,
);
export const vsyncAtom = atomWithStorage("vsync", false);
export const showFpsCounterAtom = atomWithStorage("showFpsCounter", false);
export const editorAutoScrollEnabledAtom = atomWithStorage(
	"editorAutoScrollEnabled",
	false,
);
export const instantHighlightFadeAtom = atomWithStorage(
	"instantHighlightFade",
	true,
);
export const spicySimpleLyricsModeAtom = atomWithStorage(
	"spicySimpleLyricsMode",
	false,
);
export const spicyForceLineSyncedAtom = atomWithStorage(
	"spicyForceLineSynced",
	false,
);
export type SpicyBackgroundMode = "animated" | "color" | "static";
export const spicyBackgroundModeAtom = atomWithStorage<SpicyBackgroundMode>(
	"spicyBackgroundMode",
	"animated",
);

export const previewFollowsPlaybackAtom = atomWithStorage(
	"previewFollowsPlayback",
	true,
);

export const useOriginalPreviewStyleAtom = atomWithStorage(
	"useOriginalPreviewStyle",
	false,
);

export enum TimeStretchAlgorithm {
	WSOLA = "wsola",
	PhaseVocoder = "phase_vocoder",
	Hybrid = "hybrid",
}

export const timeStretchAlgorithmAtom = atomWithStorage<TimeStretchAlgorithm>(
	"timeStretchAlgorithm",
	TimeStretchAlgorithm.Hybrid,
);

export const syllableSmoothingEnabledAtom = atomWithStorage(
	"syllableSmoothingEnabled",
	false,
);

export const syllableSmoothingFactorAtom = atomWithStorage(
	"syllableSmoothingFactor",
	0.5,
);

export enum TranslationType {
	Subtitle = "subtitle",
	Ruby = "ruby",
	Sidecar = "sidecar",
}

export const translationTypeAtom = atomWithStorage<TranslationType>(
	"translationType",
	TranslationType.Subtitle,
);

export interface ForkFeatureFlags {
	folderProjects: boolean;
	dualFormatSupport: boolean;
	lyricsfileEngine: boolean;
	hoverSync: boolean;
	reversePlayback: boolean;
}

export const FORK_FEATURE_FLAG_DEFAULTS: ForkFeatureFlags = {
	folderProjects: true,
	dualFormatSupport: true,
	lyricsfileEngine: true,
	hoverSync: true,
	reversePlayback: true,
};

export const featureFlagsAtom = atomWithStorage<ForkFeatureFlags>(
	"featureFlags",
	FORK_FEATURE_FLAG_DEFAULTS,
);

export const pendingRestartFlagsAtom = atomWithStorage<string[]>(
	"pendingRestartFlags",
	[],
);
