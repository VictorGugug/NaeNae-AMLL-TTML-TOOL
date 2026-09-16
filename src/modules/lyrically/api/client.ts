import type { LyricallyTrack } from "../types";

type DeezerTrack = {
	title: string;
	artist?: { name: string };
	album?: { title: string; cover_xl?: string; cover_medium?: string };
};

const secureCover = (rawCover: string): string =>
	rawCover.replace("http://", "https://");

const describeNetworkError = (error: unknown, action: string): string => {
	const reason = error instanceof Error ? error.message : String(error);
	return `Lyrics ${action} failed: ${reason}`;
};

export const LyricallyApi = {
	async search(query: string): Promise<LyricallyTrack[]> {
		if (!query.trim()) return [];

		let res: Response;
		try {
			res = await fetch(
				`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`,
			);
		} catch (error) {
			throw new Error(describeNetworkError(error, "search"));
		}
		if (!res.ok) throw new Error(`Lyrics search failed: ${res.status}`);
		const json = await res.json();

		return (json.data || []).map((track: DeezerTrack) => {
			const rawCover = track.album?.cover_xl || track.album?.cover_medium || "";
			return {
				name: track.title,
				artist: track.artist?.name || "Unknown Artist",
				album: track.album?.title || "",
				cover: secureCover(rawCover),
				source: "lyrics.ovh",
				lyrics: "",
			};
		});
	},

	async getLyrics(name: string, artist: string): Promise<LyricallyTrack> {
		let res: Response;
		try {
			res = await fetch(
				`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(name)}`,
			);
		} catch (error) {
			throw new Error(describeNetworkError(error, "fetch"));
		}
		if (!res.ok)
			throw new Error(`Lyrics not found on public database (${res.status}).`);

		const data = await res.json();
		return {
			name,
			artist,
			source: "lyrics.ovh",
			lyrics: data.lyrics || "",
		};
	},
};
