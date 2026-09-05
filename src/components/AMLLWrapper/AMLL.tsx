import { 
    LyricPlayer, 
    BackgroundRender,
    MeshGradientRenderer,
} from "@applemusic-like-lyrics/react";
import "@applemusic-like-lyrics/core/style.css";
import { useAtomValue, useSetAtom } from "jotai";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { audioEngine } from "$/modules/audio/audio-engine";
import { audioCoverArtAtom, audioPlayingAtom, currentTimeAtom } from "$/modules/audio/states/index.ts";
import { isDarkThemeAtom, lyricLinesAtom, selectedLinesAtom } from "$/states/main.ts";
import { customBackgroundImageAtom } from "$/modules/settings/modals/customBackground";
import { findMetadataCoverArt } from "$/utils/color-extract";
import styles from "./AMLL.module.css";
import classNames from "classnames";

/**
 * @description The high-performance AMLL player utilizing the local rendering engine.
 * Features: Mesh Warp background, spring animation physics, and full Apple Music styling.
 */
export const AMLL = memo(() => {
	const { t } = useTranslation();
	const lyrics = useAtomValue(lyricLinesAtom);
	const darkMode = useAtomValue(isDarkThemeAtom);
	const embeddedCoverArt = useAtomValue(audioCoverArtAtom);
	const customBackgroundImage = useAtomValue(customBackgroundImageAtom);
	const isPlaying = useAtomValue(audioPlayingAtom);
	const setCurrentTimeAtom = useSetAtom(currentTimeAtom);
	const setSelectedLines = useSetAtom(selectedLinesAtom);

	const coverArtFromMetadata = useMemo(
		() => findMetadataCoverArt(lyrics.metadata),
		[lyrics.metadata],
	);
	const albumImg = embeddedCoverArt ?? coverArtFromMetadata ?? customBackgroundImage;

	const amllLines = useMemo(() => {
		if (!lyrics?.lyricLines) return [];
		return lyrics.lyricLines.map((line) => ({
			...line,
			words: line.words || [],
			startTime: line.startTime,
			endTime: line.endTime,
		}));
	}, [lyrics]);

	const [currentTime, setCurrentTime] = useState(0);

	useEffect(() => {
		let rafId = 0;
		let lastAudioTime = audioEngine.musicCurrentTime;
		let interpolatedTime = lastAudioTime;
		let lastRealTime = performance.now();

		const loop = () => {
			const now = performance.now();
			const audioTime = audioEngine.musicCurrentTime;
			const playing = audioEngine.musicPlaying;

			if (!playing) {
				setCurrentTime(audioTime * 1000);
				lastAudioTime = audioTime;
				interpolatedTime = audioTime;
				lastRealTime = now;
			} else {
				if (audioTime !== lastAudioTime) {
					interpolatedTime = audioTime;
					lastAudioTime = audioTime;
				} else {
					const dt = (now - lastRealTime) / 1000;
					interpolatedTime += dt * audioEngine.musicPlayBackRate;
				}
				lastRealTime = now;
				setCurrentTime(interpolatedTime * 1000);
			}

			rafId = requestAnimationFrame(loop);
		};

		rafId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(rafId);
	}, []);

	return (
		<div className={classNames(styles.amllContainer, darkMode && styles.isDark)}>
            {/* Fluid Background Layer */}
            <div className={styles.bgLayer}>
                <BackgroundRender 
					key={albumImg || "default"}
                    album={albumImg || undefined}
                    playing={isPlaying}
                    fps={60}
                    renderScale={0.7}
                    renderer={MeshGradientRenderer}
                />
            </div>

            {/* Lyrics Content Layer */}
            <div className={styles.lyricsLayer}>
                {amllLines.length > 0 ? (
                    <LyricPlayer
                        lyricLines={amllLines}
                        currentTime={currentTime}
                        className="amll-player-instance"
                        enableSpring={true}
                        enableBlur={true}
                        enableScale={true}
                        playing={isPlaying}
                        onLyricLineClick={(clicked) => {
                            const line = clicked?.line || clicked;
                            if (line && typeof line.startTime === "number") {
                                setCurrentTimeAtom(line.startTime);
                                setSelectedLines(new Set([line.id]));
                                audioEngine.seekMusic(line.startTime / 1000);
                            }
                        }}
                    />
                ) : (
					<div className={styles.noLyrics}>{t("amll.noLyrics", "No lyrics available in store")}</div>
                )}
            </div>
		</div>
	);
});

export default AMLL;
