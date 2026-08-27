import { stringify } from "yaml";
import type {
	LyricLine,
	LyricSection,
	TTMLLyric,
	TTMLMetadata,
} from "../../types/ttml.ts";
import type {
	LyricsfileDocument,
	LyricsfileLine,
	LyricsfileSection,
	LyricsfileVocalist,
	LyricsfileWord,
} from "./types.ts";

const METADATA_TITLE_KEY = "musicName";
const METADATA_ARTIST_KEY = "artists";
const METADATA_ALBUM_KEY = "album";
const METADATA_LANGUAGE_KEY = "language";
const METADATA_CREATOR_KEY = "lyricsfileCreatedByDiscord";

export const LYRICSSFILE_CREATOR_METADATA_KEY = METADATA_CREATOR_KEY;

export const VOCALIST_ID_MAIN = "v1";
export const VOCALIST_ID_DUET = "v2";
export const VOCALIST_ID_MIDDLE = "v3";
export const VOCALIST_ID_GROUP = "v4";
export const VOCALIST_BG_SUFFIX = "-bg";

const VOCALIST_DEFAULT_NAMES: Record<string, string> = {
	[VOCALIST_ID_MAIN]: "Lead",
	[VOCALIST_ID_DUET]: "Duet",
	[VOCALIST_ID_MIDDLE]: "Middle",
	[VOCALIST_ID_GROUP]: "Harmony",
};

const SECTION_KIND_OVERRIDES: Record<string, string> = {
	hook: "chorus",
	break: "instrumental",
	solo: "instrumental",
	interlude: "instrumental",
	skit: "spoken",
	sample: "other",
};

function metadataValue(metadata: TTMLMetadata[], key: string): string | undefined {
	const entry = metadata.find((m) => m.key === key);
	const value = entry?.value.find((v) => v.trim().length > 0)?.trim();
	return value || undefined;
}

function metadataValues(metadata: TTMLMetadata[], key: string): string[] {
	const entry = metadata.find((m) => m.key === key);
	if (!entry) return [];
	return entry.value
		.map((v) => v.trim())
		.filter((v) => v.length > 0);
}

function lineText(line: LyricLine): string {
	return line.words.map((word) => word.word).join("");
}

function buildWord(word: LyricLine["words"][number]): LyricsfileWord {
	const hasTrailing = typeof word.trailingSeparator === "string";
	const text = hasTrailing
		? word.word.endsWith(word.trailingSeparator!)
			? word.word.slice(0, -word.trailingSeparator!.length)
			: word.word
		: word.word;
	const out: LyricsfileWord = {
		text,
		start_ms: Math.round(word.startTime),
		end_ms: Math.round(word.endTime),
	};
	if (word.romanWord && word.romanWord.trim().length > 0) {
		out.transliteration = word.romanWord;
	}
	if (word.translation && word.translation.trim().length > 0) {
		out.translation = word.translation;
	}
	if (hasTrailing && word.trailingSeparator!.length > 0) {
		out.trailing_separator = word.trailingSeparator;
	}
	if (Array.isArray(word.ruby) && word.ruby.length > 0) {
		out.segments = word.ruby.map((ruby) => {
			const seg: LyricsfileWord["segments"] extends (infer U)[] | undefined ? U : never = {
				text: ruby.word,
				start_ms: Math.round(ruby.startTime),
				end_ms: Math.round(ruby.endTime),
			} as unknown as NonNullable<NonNullable<LyricsfileWord["segments"]>[number]>;
			if (ruby.romanWord && ruby.romanWord.trim().length > 0) {
				(seg as Record<string, unknown>).transliteration = ruby.romanWord;
			}
			if (ruby.translation && ruby.translation.trim().length > 0) {
				(seg as Record<string, unknown>).translation = ruby.translation;
			}
			return seg;
		});
	}
	if (Array.isArray(word.segments) && word.segments.length > 0) {
		const syls = word.segments.map((seg) => {
			const s: NonNullable<NonNullable<LyricsfileWord["syllables"]>[number]> = {
				text: seg.word,
				start_ms: Math.round(seg.startTime),
				end_ms: Math.round(seg.endTime),
			};
			if (seg.romanWord && seg.romanWord.trim().length > 0) {
				(s as Record<string, unknown>).transliteration = seg.romanWord;
			}
			if (seg.translation && seg.translation.trim().length > 0) {
				(s as Record<string, unknown>).translation = seg.translation;
			}
			return s;
		});
		if (syls.length > 0) {
			if (out.segments) {
				out.syllables = syls;
			} else {
				out.syllables = syls;
			}
		}
	}
	return out;
}

function hasRuby(word: LyricLine["words"][number]): boolean {
	return (
		(Array.isArray(word.ruby) && word.ruby.length > 0) ||
		(Array.isArray(word.segments) && word.segments.length > 0)
	);
}

function buildWords(words: LyricLine["words"]): LyricsfileWord[] | undefined {
	const out: LyricsfileWord[] = [];
	for (const word of words) {
		const hasContent =
			word.word.trim().length > 0 ||
			(Array.isArray(word.ruby) && word.ruby.length > 0) ||
			(Array.isArray(word.segments) && word.segments.length > 0) ||
			(word.trailingSeparator && word.trailingSeparator.length > 0);
		if (!hasContent) {
			if (out.length > 0) {
				out[out.length - 1].text += word.word;
			}
			continue;
		}
		out.push(buildWord(word));
	}
	return out.length > 0 ? out : undefined;
}

function resolveBaseVocalistId(line: LyricLine): string {
	if (line.isDuetGroup) return VOCALIST_ID_GROUP;
	if (line.isMiddle) return VOCALIST_ID_MIDDLE;
	if (line.isDuet) return VOCALIST_ID_DUET;
	return VOCALIST_ID_MAIN;
}

function resolveVocalistIds(line: LyricLine): string[] {
	const base = resolveBaseVocalistId(line);
	return line.isBG ? [`${base}${VOCALIST_BG_SUFFIX}`] : [base];
}

function buildSectionTimes(
	section: LyricSection,
	lyricLines: LyricLine[],
): LyricsfileSection | null {
	const sectionLines = lyricLines.filter((l) => l.sectionId === section.id);
	if (sectionLines.length === 0) return null;
	const startMs = Math.round(
		Math.min(...sectionLines.map((l) => l.startTime)),
	);
	const endMs = Math.round(Math.max(...sectionLines.map((l) => l.endTime)));
	const kind = SECTION_KIND_OVERRIDES[section.category] ?? section.category;
	const out: LyricsfileSection = {
		kind,
		start_ms: startMs,
		end_ms: endMs,
	};
	if (section.label && section.label.trim().length > 0) {
		out.label = section.label;
	}
	return out;
}

function buildLine(
	line: LyricLine,
	hasVocalists: boolean,
): LyricsfileLine {
	const out: LyricsfileLine = {
		text: lineText(line),
		start_ms: Math.round(line.startTime),
		end_ms: Math.round(line.endTime),
	};
	if (hasVocalists) {
		out.vocalist = resolveVocalistIds(line);
	}
	if (line.isBG) {
		out.role = "background";
	}
	if (line.translatedLyric && line.translatedLyric.trim().length > 0) {
		out.translation = line.translatedLyric;
	}
	if (line.romanLyric && line.romanLyric.trim().length > 0) {
		out.transliteration = line.romanLyric;
	}
	if (!line.isLineSynced) {
		const words = buildWords(line.words);
		if (words) {
			out.words = words;
		}
	}
	return out;
}

export function exportLyricsfileText(ttmlLyric: TTMLLyric): string {
	const { metadata, lyricLines, sections } = ttmlLyric;
	const instrumentalFlag = ttmlLyric.instrumental;
	const durationMs = ttmlLyric.durationMs;
	const offsetMs = ttmlLyric.offsetMs;

	const hasDuet = lyricLines.some((l) => l.isDuet && !l.isDuetGroup);
	const hasMiddle = lyricLines.some((l) => l.isMiddle);
	const hasGroup = lyricLines.some((l) => l.isDuetGroup);
	const hasVocalists = hasDuet || hasMiddle || hasGroup;

	const vocalistIds: string[] = [VOCALIST_ID_MAIN];
	if (hasDuet) vocalistIds.push(VOCALIST_ID_DUET);
	if (hasMiddle) vocalistIds.push(VOCALIST_ID_MIDDLE);
	if (hasGroup) vocalistIds.push(VOCALIST_ID_GROUP);

	const vocalistNames = ttmlLyric.vocalistNames ?? {};
	const vocalists: LyricsfileVocalist[] = hasVocalists
		? vocalistIds.map((id) => ({
				id,
				name:
					(vocalistNames[id] && vocalistNames[id].trim().length > 0
						? vocalistNames[id].trim()
						: undefined) ??
					VOCALIST_DEFAULT_NAMES[id] ??
					id,
				type: "person" as const,
			}))
		: [];

	const metadataDoc: LyricsfileDocument["metadata"] = {
		title: metadataValue(metadata, METADATA_TITLE_KEY),
		artist: metadataValue(metadata, METADATA_ARTIST_KEY),
		album: metadataValue(metadata, METADATA_ALBUM_KEY),
		language: metadataValue(metadata, METADATA_LANGUAGE_KEY),
	};
	if (typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs >= 0) {
		metadataDoc.duration_ms = Math.round(durationMs);
	}
	if (typeof offsetMs === "number" && Number.isFinite(offsetMs)) {
		metadataDoc.offset_ms = Math.round(offsetMs);
	}
	if (instrumentalFlag === true) {
		metadataDoc.instrumental = true;
	}
	if (hasVocalists) {
		metadataDoc.vocalists = vocalists;
	}

	const doc: LyricsfileDocument = {
		lyricsfile: "1.1",
		version: "1.1",
		metadata: metadataDoc,
	};

	const xTool: LyricsfileDocument["x_amll_tool"] = {};

	const creator = metadataValue(metadata, METADATA_CREATOR_KEY);
	if (creator) {
		xTool.created_by_discord = creator;
	}

	const reversedSyncIndices =
		ttmlLyric.reversedSyncLineIds
			?.map((id) => lyricLines.findIndex((l) => l.id === id))
			.filter((index) => index !== -1) ?? [];
	if (reversedSyncIndices.length > 0) {
		xTool.reversed_sync_lines = reversedSyncIndices;
	}

	const KNOWN_KEYS = new Set([
		METADATA_TITLE_KEY,
		METADATA_ARTIST_KEY,
		METADATA_ALBUM_KEY,
		METADATA_LANGUAGE_KEY,
		METADATA_CREATOR_KEY,
	]);
	const extraMetadata: Record<string, string[]> = {};
	for (const entry of metadata) {
		if (KNOWN_KEYS.has(entry.key)) continue;
		const values = entry.value.filter((v) => v.trim().length > 0);
		if (values.length > 0) {
			extraMetadata[entry.key] = values;
		}
	}
	if (Object.keys(extraMetadata).length > 0) {
		xTool.extra_metadata = extraMetadata;
	}

	const artistValues = metadataValues(metadata, METADATA_ARTIST_KEY);
	if (artistValues.length > 1) {
		xTool.extra_metadata = xTool.extra_metadata ?? {};
		xTool.extra_metadata[METADATA_ARTIST_KEY] = artistValues.slice(1);
	}

	if (Object.keys(xTool).length > 0) {
		doc.x_amll_tool = xTool;
	}

	if (sections && sections.length > 0) {
		const emitted: LyricsfileSection[] = [];
		for (const section of sections) {
			const built = buildSectionTimes(section, lyricLines);
			if (built) emitted.push(built);
		}
		if (emitted.length > 0) {
			doc.sections = emitted;
		}
	}

	if (instrumentalFlag === true) {
		doc.lines = [];
		if (typeof ttmlLyric.plain === "string") doc.plain = ttmlLyric.plain;
		else doc.plain = "";
	} else if (lyricLines.length > 0) {
		doc.lines = lyricLines.map((line) => buildLine(line, hasVocalists));
		if (typeof ttmlLyric.plain === "string") doc.plain = ttmlLyric.plain;
		else doc.plain = lyricLines.map(lineText).join("\n");
		if (typeof ttmlLyric.plainTransliteration === "string" && ttmlLyric.plainTransliteration.length > 0) {
			doc.plain_transliteration = ttmlLyric.plainTransliteration;
		}
		if (typeof ttmlLyric.plainTranslation === "string" && ttmlLyric.plainTranslation.length > 0) {
			doc.plain_translation = ttmlLyric.plainTranslation;
		}
	} else {
		if (typeof ttmlLyric.plain === "string") doc.plain = ttmlLyric.plain;
		if (typeof ttmlLyric.plainTransliteration === "string" && ttmlLyric.plainTransliteration.length > 0) {
			doc.plain_transliteration = ttmlLyric.plainTransliteration;
		}
		if (typeof ttmlLyric.plainTranslation === "string" && ttmlLyric.plainTranslation.length > 0) {
			doc.plain_translation = ttmlLyric.plainTranslation;
		}
	}

	return stringify(doc, {
		indent: 2,
		lineWidth: 0,
		defaultStringType: "PLAIN",
		singleQuote: false,
	});
}
