# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).


### Added

- **Per-Surface Auto-Scroll Options & Tab Position Sync** : Independent Tracking, Auto-Scroll, Highlight Line, Wrap Words, and Sync Tab toggles in the Edit, Sync, and Preview RibbonBars with matching Settings cards, keeping song position when switching between Edit, Time, and Preview tabs.
- **Folder Projects & Workspace System** : Open, create, and save lyrics as project folders with `project.json` manifest, workspace scanning, and persistent project history.
- **Dual Format Support (TTML + Lyricsfile YAML)** : Companion `.ttml` and `.lyricsfile.yaml` side-by-side files, format switching directly from the File menu with dirty-state protection and "Save & Switch", plus dual format badges.
- **Lyricsfile 1.1 Engine & Community Alignment** : Bidirectional YAML 1.1 parser and writer aligned with upstream proposals (#1 to #9 in `tranxuanthang/lyricsfile`):
  - Preserved `metadata.duration_ms`, `offset_ms`, and `instrumental` across round-trips.
  - Top-level `sections[]` (`kind`, `label`, `start_ms`, `end_ms`) mapped from TTML song structure.
  - Explicit word `trailing_separator: " "` keeping character timestamps strictly on sung letters for cleaner karaoke highlight interpolation.
  - Sub-word musical timing with `words[].syllables[]` (per issue #4).
  - Ruby / CJK pronunciation annotations with `words[].segments[]` (per issue #8).
  - Standardized vocalist mapping to `v1` (lead), `v2` (duet), `v3` (middle), and `v4` (group harmony) with `-bg` and `role: background`, plus positional fallback for foreign IDs.
  - Preserved transliteration and translation across lines, words, segments, and top-level block scalars (`plain_transliteration`, `plain_translation`).
  - Namespaced `x_amll_tool` vendor block to avoid losing extra metadata (`created_by_discord`, `reversed_sync_lines`, `extra_metadata`).
- **Lyricsfile Converter Dialog** : Dedicated converter under Tools -> Lyricsfile Converter (TTML <-> YAML) with drag-and-drop, validation, and real-time preview.
- **CC0 Demo & Real-World Testbeds** : 100% CC0 fictional demo track ("Starlight Horizons" by Nova & Orion) complying strictly with `CONTRIBUTING.md` for upstream submission, alongside real-world converted testbeds for English duets (*White Ball*) and word-synced Japanese lyrics (*Yoru ni Kakeru* from AMLL TTML DB).
- **Split Spectrogram Multi-Track** : Two synchronized tracks for duet and overlapping editing, "Show on Top Track" action, floating close button, and auto-reset.
- **Reverse Playback Zones & Reverse Sync** : Reverse zones with Ctrl+F/H, sample-reversed virtual transport playback, mirrored rendering, and per-line reverse sync with snapshot restore.
- **Spectrogram Hover Sync (F/G/H)** : Keyboard shortcuts to snap lyric timestamps directly to the spectrogram hover position.
- **Smooth Auto-Scroll & Active Highlight** : `easeInOutCubic` smooth scroll container (350-750ms) for the editor and TimingOverview, pausing on manual user scroll and opening right at the current song position.
- **Onboarding & Welcome Dialog** : Empty editor Projects shortcut, Start Guide workflow, and project primer.
- **Vocalist Real Names Editor** : Dynamic RibbonBar controls and context menus to rename `v1`-`v4` vocalists with inline editing and i18n fallbacks.
- **Preview Enhancements** : SpicyBackground mesh-warp in Standard/Toxi previews, cover palette extraction with NetEase fallback, harmony `isDuetGroup` layout, and auto-scroll toggle.
- **Dynamic Save Destinations** : Save routing to active project folder, or system Downloads via dynamic `downloadDir()` (Tauri) or File System Access API (web).
- **Projects & History Enhancements** : 1-hour bucket deduplication, Clear History, and workspace persistence.
- **Time Mode Word Wrap & Reflow Animation** : Added `syncWordWrapAtom` (enabled by default) and a RibbonBar "Wrap Words" toggle with responsive CSS flex-wrap reflow, smooth `laneItemFadeIn` keyframe transitions, and seamless border styling on wrapped lines without timestamps (`aae71da`, `2ec9314`).
- **Desktop Executable & Windows Installer Distribution** : Tauri desktop builds targeting Windows, producing standalone `.exe` binaries and NSIS installer packages for GitHub Releases.

### Changed

- Unified TTML exports through a shared `exportTTMLText` contract with normalization and `allowConsecutiveBackgroundLines` handling.
- Refactored file dialogs to use dynamic path resolution (`path.split(/[/\\]/).pop()`) and English fallbacks.
- Defaulted background vocals to standalone `<p><span ttm:role="x-bg">` with `v3`/`v4` agent round-trip.
- Configured independent preview style persistence (`originalPreviewStyleByModeAtom`) so Standard and Toxi modes can independently select original vs spicy/blurred preview styles.

### Fixed

- **TimingOverview Word Group Activation** : Clicking a word pill or group seeks playback to the word, selects its line, and resets the auto-scroll pause state.
- **TimingOverview Auto-Scroll While Paused** : Follows the active or upcoming line after seeks while paused, with pointer-aware pausing, smooth centered scrolling.
- **LRCLIB Import Search Diagnostics** : Identify requests with a `Lrclib-Client` header derived from the package metadata, report HTTP status codes on search and detail failures, surface the `Retry-After` delay when rate limited, fall back to `trackName` for result titles, and label instrumental tracks.
- **AudioSpectrogram Settings & FFT Selector** : Removed `Tooltip` wrapper around `Popover.Trigger` to eliminate DOM node unmount errors when toggling spectrogram settings (`254464f`), and migrated the nested FFT size selector to an inline `SegmentedControl` (`7e89100`).
- **Spectrogram Touching Dividers Declutter** : Eliminated corner notch artifacts on adjacent segments and decluttered divider lines when touching adjacent boundaries (`4626c42`), applying zero border-radii on touching edges.
- **Active Word Synchronization in Time Mode** : Preserved imperative `.active` and `.animated` classes during React reconciliations with synchronous `useLayoutEffect` re-application, ensuring smooth sync highlighting and immediate ambient highlight opacity reset on disable/cleanup (`2ec9314`).
- **Technical Timing Overview Interactivity & Autoscroll** : Enabled direct line and word click navigation on `WordPill` and `WordGroup` with seek sync, reset auto-scroll pause states on row selection, added upcoming line fallback when no line is active, and added seek threshold handling for paused playback (`b708b9a`).
- **Audio Playback End State & Replay** : Handled playback termination deterministically when the track reaches its end, preventing `interpolatedCurrentTime` extrapolation past song duration, syncing clocks, and ensuring pressing Play at song end seamlessly restarts from 0:00 instead of stalling.
- **Audio Control Toggle Synchronization** : Guaranteed that `onTogglePlay` and `AudioPlaybackKeyBinding` evaluate both engine and atom playback states, preventing the Play/Pause button from locking in the active playing state at EOF.
- **Preview Lyric Seeking Continuity** : Updated lyric line and word click seeking across all preview components (`AMLLWrapper`, `AMLL`, `SpicyLyrics`, and `TimingOverview`) to continue playing seamlessly if audio was already playing, while tracking seek states to avoid visual snapping.
- **Spectrogram Boundary Clamping** : Dynamically clamped spectrogram maximum height (`getAvailableSpectrogramMaxHeight`) to prevent the panel from obscuring the top RibbonBar or pushing the audio playback controls off-screen.
- **Real-Time Viewport Scroll Adaptation** : Added `ResizeObserver` bindings across `LyricLinesView`, `AMLLWrapper`, and `SpicyLyrics` to instantaneously maintain centering on the active line when resizing panels or the window.
- **TTML Parser XML Namespace Resolution** : Fallback query using `localName()` for `<meta>` and `<agent>` elements when TTML root or parent nodes lack default namespace prefixes.
- **Background Role Matching Across DOM Engines** : Case-insensitive `localName(el).toLowerCase() === "span"` and unified `getAttr(el, "role") === "x-bg"`, fixing missed background vocals in XHTML/HTML DOM trees where tag names are uppercase (`SPAN`).
- **Timestamp Monotonicity in Lyricsfile Exports** : Fixed zero-start anomalies (`start_ms: 0` on late lines) in duet and background vocal streams, ensuring strictly monotonic timeline ordering.
- **CSS Build Artifact Cleanup** : Removed stray merge conflict marker from `src/index.css`.
- Isolated background timing: line `endTime` now derives from its own words, and non-overlapping backgrounds export as independent `<p>` elements.
- Removed ghost duet agents from all export paths.
- Fixed reverse zone mirroring and overlay stability for virtual positions.
- Fixed smooth scroll jank and TimingOverview auto-scroll positioning.
- Fixed divider resizing with `MIN_WORD_DURATION_MS` and virtual drag in reverse zones.
- Fixed save dialog paths to use dynamic Downloads without hardcoded temp paths.
- Cleaned legacy comments while preserving GPL headers and `biome-ignore` directives.

### Technical

- 13 vitest unit tests in `src/modules/lyricsfile-processor/lyricsfile-processor.test.ts` verifying 100% round-trip fidelity between TTML and Lyricsfile YAML formats.
- 5 vitest unit tests in `src/modules/audio/audio-engine.test.ts` verifying playback end event dispatch, duration boundary clamping, replay restart, and seek tracking (33 test suites, 194 passing tests).
- 100% TypeScript compilation and type safety verified via `pnpm build:tsc` (`tsc -b && vite build`).
- Build and storage configuration updates including `pnpm` allowlist and Tauri capabilities.

