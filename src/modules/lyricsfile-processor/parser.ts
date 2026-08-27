import { parse as parseYaml } from "yaml";
import { uid } from "uid";
import type {
	LyricLine,
	LyricSection,
	LyricWord,
	TTMLLyric,
	TTMLMetadata,
} from "../../types/ttml.ts";
import { LYRIC_SECTION_CATEGORIES } from "../../types/ttml.ts";
import type {
	LyricsfileDocument,
	LyricsfileLine,
	LyricsfileWord,
} from "./types.ts";
import {
	LYRICSSFILE_CREATOR_METADATA_KEY,
	VOCALIST_BG_SUFFIX,
	VOCALIST_ID_DUET,
	VOCALIST_ID_GROUP,
	VOCALIST_ID_MAIN,
	VOCALIST_ID_MIDDLE,
} from "./writer.ts";

const METADATA_TITLE_KEY = "musicName";
const METADATA_ARTIST_KEY = "artists";
const METADATA_ALBUM_KEY = "album";
const METADATA_LANGUAGE_KEY = "language";
const SUPPORTED_VERSIONS = ["1.0", "1.1"];

function asNumber(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.round(value);
	}
	return 0;
}

function asString(value: unknown): string | undefined {
	if (typeof value === "string" && value.trim().length > 0) {
		return value.trim();
	}
	return undefined;
}

function pushMetadata(
	metadata: TTMLMetadata[],
	key: string,
	value: string,
) {
	const existing = metadata.find((m) => m.key === key);
	if (existing) {
		existing.value.push(value);
	} else {
		metadata.push({ key, value: [value] });
	}
}

function parseSegment(raw: unknown): LyricWordBase | null {
	if (!raw || typeof raw !== "object") return null;
	const rec = raw as Record<string, unknown>;
	const text = asString(rec.text);
	if (!text) return null;
	const seg: LyricWordBase = {
		word: text,
		startTime: asNumber(rec.start_ms),
		endTime: asNumber(rec.end_ms),
	};
	const segTrans = asString(rec.transliteration);
	if (segTrans) seg.romanWord = segTrans;
	const segTrans2 = asString(rec.translation);
	if (segTrans2) seg.translation = segTrans2;
	return seg;
}

function parseWord(raw: LyricsfileWord): LyricWord {
	const rawRec = raw as Record<string, unknown>;
	const trailingSepRaw = rawRec.trailing_separator;
	const trailingSep =
		typeof trailingSepRaw === "string" ? trailingSepRaw : undefined;
	const baseText = typeof raw.text === "string" ? raw.text : "";
	const word: LyricWord = {
		id: uid(),
		word: trailingSep !== undefined ? baseText + trailingSep : baseText,
		startTime: asNumber(raw.start_ms),
		endTime: asNumber(raw.end_ms),
		obscene: false,
		emptyBeat: 0,
		romanWord: "",
	};
	const transliteration = asString(raw.transliteration);
	if (transliteration) word.romanWord = transliteration;
	const translation = asString(raw.translation);
	if (translation) word.translation = translation;
	if (trailingSep !== undefined) word.trailingSeparator = trailingSep;
	if (Array.isArray(raw.segments) && raw.segments.length > 0) {
		const segs = raw.segments
			.map(parseSegment)
			.filter((s): s is LyricWordBase => s !== null);
		if (segs.length > 0) word.ruby = segs;
	}
	if (Array.isArray(raw.syllables) && raw.syllables.length > 0) {
		const syls = raw.syllables
			.map(parseSegment)
			.filter((s): s is LyricWordBase => s !== null);
		if (syls.length > 0) word.segments = syls;
	}
	return word;
}

interface VocalistIdSlots {
	mainVocalistId?: string;
	duetVocalistId?: string;
	middleVocalistId?: string;
	groupVocalistId?: string;
}

function parseLine(
	raw: LyricsfileLine,
	slots: VocalistIdSlots,
): LyricLine {
	const rawVocalistValue = (raw as { vocalist?: unknown }).vocalist;
	const rawVocalistIds: string[] = Array.isArray(rawVocalistValue)
		? (rawVocalistValue.filter((v) => typeof v === "string") as string[])
		: typeof rawVocalistValue === "string"
			? [rawVocalistValue]
			: [];
	const baseVocalistIds = rawVocalistIds.map((id) =>
		id.endsWith(VOCALIST_BG_SUFFIX)
			? id.slice(0, -VOCALIST_BG_SUFFIX.length)
			: id,
	);
	const isBGFromVocalist = rawVocalistIds.some((id) =>
		id.endsWith(VOCALIST_BG_SUFFIX),
	);

	const { mainVocalistId, duetVocalistId, middleVocalistId, groupVocalistId } =
		slots;

	const hasDuetGroupExplicit =
		!!groupVocalistId && baseVocalistIds.includes(groupVocalistId);
	const hasDuetGroupLegacy =
		!groupVocalistId &&
		!!mainVocalistId &&
		!!duetVocalistId &&
		baseVocalistIds.includes(mainVocalistId) &&
		baseVocalistIds.includes(duetVocalistId);
	const hasDuetGroup = hasDuetGroupExplicit || hasDuetGroupLegacy;

	const hasMiddle = !!middleVocalistId && baseVocalistIds.includes(middleVocalistId);
	const hasDuet =
		!!duetVocalistId &&
		baseVocalistIds.includes(duetVocalistId) &&
		!hasDuetGroup;

	const rawWords = Array.isArray(raw.words) ? raw.words : [];
	const words = rawWords.map(parseWord);

	const startMs = asNumber(raw.start_ms);
	const endMs = asNumber(raw.end_ms);

	const line: LyricLine = {
		id: uid(),
		words,
		translatedLyric: asString(raw.translation) ?? "",
		romanLyric: asString(raw.transliteration) ?? "",
		isBG: raw.role === "background" || isBGFromVocalist,
		isDuet: hasDuet,
		isMiddle: hasMiddle,
		isDuetGroup: hasDuetGroup,
		startTime: startMs,
		endTime: endMs,
		ignoreSync: false,
		isLineSynced: rawWords.length === 0,
	};

	if (rawWords.length === 0 && raw.text) {
		line.words.push({
			id: uid(),
			word: raw.text,
			startTime: startMs,
			endTime: endMs,
			obscene: false,
			emptyBeat: 0,
			romanWord: "",
		});
	}

	return line;
}

function assignLineSections(
	parsedLines: LyricLine[],
	sections: LyricSection[] | undefined,
	rawSections: LyricsfileDocument["sections"] | undefined,
) {
	if (!sections || sections.length === 0 || !rawSections) return;
	const sectionStartTimes = rawSections.map((s) => asNumber(s.start_ms));
	for (let i = 0; i < parsedLines.length; i++) {
		const line = parsedLines[i];
		const lineStart = line.startTime;
		let bestIndex = -1;
		for (let s = 0; s < sectionStartTimes.length; s++) {
			const start = sectionStartTimes[s];
			const end = asNumber(rawSections[s].end_ms);
			if (lineStart >= start && (end === 0 || lineStart < end)) {
				bestIndex = s;
			}
		}
		if (bestIndex !== -1) {
			line.sectionId = sections[bestIndex].id;
		}
	}
}

export function parseLyricsfile(text: string): TTMLLyric {
	const raw = parseYaml(text) as LyricsfileDocument | null;
	if (!raw || typeof raw !== "object") {
		throw new Error("Lyricsfile document must be a YAML mapping");
	}
	if (!SUPPORTED_VERSIONS.includes(raw.version)) {
		throw new Error(`Unsupported lyricsfile version: ${raw.version}`);
	}

	const metadata: TTMLMetadata[] = [];
	const rawMetadata = raw.metadata;
	let durationMs: number | undefined;
	let offsetMs: number | undefined;
	let instrumental: boolean | undefined;
	if (rawMetadata && typeof rawMetadata === "object") {
		const title = asString(rawMetadata.title);
		if (title) pushMetadata(metadata, METADATA_TITLE_KEY, title);
		const artist = asString(rawMetadata.artist);
		if (artist) pushMetadata(metadata, METADATA_ARTIST_KEY, artist);
		const album = asString(rawMetadata.album);
		if (album) pushMetadata(metadata, METADATA_ALBUM_KEY, album);
		const language = asString(rawMetadata.language);
		if (language) pushMetadata(metadata, METADATA_LANGUAGE_KEY, language);
		if (
			typeof (rawMetadata as Record<string, unknown>).duration_ms === "number" &&
			Number.isFinite((rawMetadata as Record<string, unknown>).duration_ms as number) &&
			(rawMetadata as Record<string, unknown>).duration_ms as number >= 0
		) {
			durationMs = Math.round(
				(rawMetadata as Record<string, unknown>).duration_ms as number,
			);
		}
		if (
			typeof (rawMetadata as Record<string, unknown>).offset_ms === "number" &&
			Number.isFinite((rawMetadata as Record<string, unknown>).offset_ms as number)
		) {
			offsetMs = Math.round(
				(rawMetadata as Record<string, unknown>).offset_ms as number,
			);
		}
		if (typeof (rawMetadata as Record<string, unknown>).instrumental === "boolean") {
			instrumental = (rawMetadata as Record<string, unknown>).instrumental as boolean;
		}
	}

	let mainVocalistId: string | undefined;
	let duetVocalistId: string | undefined;
	let middleVocalistId: string | undefined;
	let groupVocalistId: string | undefined;
	const vocalistNames: Record<string, string> = {};
	const rawMetadataVocalists =
		rawMetadata && typeof rawMetadata === "object"
			? (rawMetadata as { vocalists?: unknown }).vocalists
			: undefined;
	const rawVocalists = Array.isArray(rawMetadataVocalists)
		? rawMetadataVocalists
		: [];
	for (const vocalist of rawVocalists) {
		if (!vocalist || typeof vocalist !== "object") continue;
		const id = asString((vocalist as { id?: unknown }).id);
		if (!id) continue;

		if (id === VOCALIST_ID_MAIN) {
			mainVocalistId = mainVocalistId ?? id;
		} else if (id === VOCALIST_ID_DUET) {
			duetVocalistId = duetVocalistId ?? id;
		} else if (id === VOCALIST_ID_MIDDLE) {
			middleVocalistId = middleVocalistId ?? id;
		} else if (id === VOCALIST_ID_GROUP) {
			groupVocalistId = groupVocalistId ?? id;
		} else if (!mainVocalistId) {
			mainVocalistId = id;
		} else if (!duetVocalistId) {
			duetVocalistId = id;
		} else if (!middleVocalistId) {
			middleVocalistId = id;
		} else if (!groupVocalistId) {
			groupVocalistId = id;
		}

		const name = asString((vocalist as { name?: unknown }).name);
		if (name) {
			vocalistNames[id] = name;
		}
	}
	if (mainVocalistId && mainVocalistId !== VOCALIST_ID_MAIN && vocalistNames[mainVocalistId] && !vocalistNames[VOCALIST_ID_MAIN]) {
		vocalistNames[VOCALIST_ID_MAIN] = vocalistNames[mainVocalistId];
	}
	if (duetVocalistId && duetVocalistId !== VOCALIST_ID_DUET && vocalistNames[duetVocalistId] && !vocalistNames[VOCALIST_ID_DUET]) {
		vocalistNames[VOCALIST_ID_DUET] = vocalistNames[duetVocalistId];
	}
	if (middleVocalistId && middleVocalistId !== VOCALIST_ID_MIDDLE && vocalistNames[middleVocalistId] && !vocalistNames[VOCALIST_ID_MIDDLE]) {
		vocalistNames[VOCALIST_ID_MIDDLE] = vocalistNames[middleVocalistId];
	}
	if (groupVocalistId && groupVocalistId !== VOCALIST_ID_GROUP && vocalistNames[groupVocalistId] && !vocalistNames[VOCALIST_ID_GROUP]) {
		vocalistNames[VOCALIST_ID_GROUP] = vocalistNames[groupVocalistId];
	}

	let sections: LyricSection[] | undefined;
	const rawSections = Array.isArray(raw.sections) ? raw.sections : undefined;
	if (rawSections && rawSections.length > 0) {
		sections = rawSections.map((section) => {
			const kind = asString(section.kind) ?? "other";
			const category = (
				LYRIC_SECTION_CATEGORIES as readonly string[]
			).includes(kind)
				? (kind as LyricSection["category"])
				: "other";
			return {
				id: uid(),
				label: asString(section.label) ?? "",
				category,
			};
		});
	}

	const vocalistSlots: VocalistIdSlots = {
		mainVocalistId,
		duetVocalistId,
		middleVocalistId,
		groupVocalistId,
	};
	const rawLines = Array.isArray(raw.lines) ? raw.lines : [];
	const lyricLines = rawLines.map((line) => parseLine(line, vocalistSlots));

	assignLineSections(lyricLines, sections, rawSections);

	let reversedSyncLineIds: string[] | undefined;
	const xTool = raw.x_amll_tool;
	if (xTool && typeof xTool === "object") {
		const creator = asString(xTool.created_by_discord);
		if (creator) {
			pushMetadata(metadata, LYRICSSFILE_CREATOR_METADATA_KEY, creator);
		}
		const reversedIndices = Array.isArray(xTool.reversed_sync_lines)
			? xTool.reversed_sync_lines
				.map((v) => (typeof v === "number" ? Math.round(v) : -1))
				.filter((v) => v >= 0 && v < lyricLines.length)
			: [];
		if (reversedIndices.length > 0) {
			reversedSyncLineIds = reversedIndices.map(
				(i) => lyricLines[i].id,
			);
		}
		if (xTool.extra_metadata && typeof xTool.extra_metadata === "object") {
			for (const [key, values] of Object.entries(xTool.extra_metadata)) {
				if (!key || !Array.isArray(values)) continue;
				for (const value of values) {
					const v = asString(value);
					if (!v) continue;
					if (key === METADATA_ARTIST_KEY) {
						const existing = metadata.find(
							(m) => m.key === METADATA_ARTIST_KEY,
						);
						if (existing?.value.includes(v)) continue;
					}
					pushMetadata(metadata, key, v);
				}
			}
		}
	}

	return {
		metadata,
		lyricLines,
		sections,
		reversedSyncLineIds,
		vocalistNames,
		plain: typeof raw.plain === "string" ? raw.plain : undefined,
		plainTransliteration:
			typeof raw.plain_transliteration === "string"
				? raw.plain_transliteration
				: undefined,
		plainTranslation:
			typeof raw.plain_translation === "string" ? raw.plain_translation : undefined,
		durationMs,
		offsetMs,
		instrumental,
	};
}
