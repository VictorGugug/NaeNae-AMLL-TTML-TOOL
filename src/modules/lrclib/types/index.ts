export interface LrcLibTrack {
	id: number;
	name: string;
	trackName?: string;
	artistName: string;
	albumName: string;
	duration: number;
	instrumental: boolean;
	plainLyrics: string | null;
	syncedLyrics: string | null;
	lyricsfile?: string;
}
