export interface LyricsfileVocalist {
	id: string;
	name?: string;
	type?: "person" | "group" | "other";
}

export interface LyricsfileSection {
	kind: string;
	label?: string;
	start_ms: number;
	end_ms?: number;
}

export interface LyricsfileSegment {
	text: string;
	start_ms: number;
	end_ms?: number;
	transliteration?: string;
	translation?: string;
}

export interface LyricsfileWord {
	text: string;
	start_ms: number;
	end_ms?: number;
	transliteration?: string;
	translation?: string;
	trailing_separator?: string;
	segments?: LyricsfileSegment[];
	syllables?: LyricsfileSegment[];
}

export interface LyricsfileLine {
	text: string;
	start_ms: number;
	end_ms?: number;
	vocalist?: string | string[];
	role?: "lead" | "background";
	translation?: string;
	transliteration?: string;
	words?: LyricsfileWord[];
}

export interface LyricsfileMetadata {
	title?: string;
	artist?: string;
	album?: string;
	language?: string;
	duration_ms?: number;
	offset_ms?: number;
	instrumental?: boolean;
	vocalists?: LyricsfileVocalist[];
	[key: string]: unknown;
}

export interface LyricsfileToolExtension {
	created_by_discord?: string;
	reversed_sync_lines?: number[];
	extra_metadata?: Record<string, string[]>;
}

export interface LyricsfileDocument {
	lyricsfile?: string;
	version: string;
	metadata?: LyricsfileMetadata;
	lines?: LyricsfileLine[];
	sections?: LyricsfileSection[];
	plain?: string;
	plain_transliteration?: string;
	plain_translation?: string;
	x_amll_tool?: LyricsfileToolExtension;
}