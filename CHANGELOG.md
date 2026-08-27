# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Folder Projects & Workspace System** — Open, create and save lyrics as project folders with `project.json` manifest, workspace scanner, recent projects history with persistence.
- **Dual Format Support (TTML + Lyricsfile YAML)** — Companion `.ttml` and `.lyricsfile.yaml` files side-by-side, format switching from File menu with dirty-state guard and Save & Switch, dual badges in browsers.
- **Lyricsfile Engine 1.1** — Bidirectional YAML 1.1 parser/writer: `metadata.duration_ms/offset_ms/instrumental`, `plain`/`plain_transliteration`/`plain_translation` preservation, `word.translation`/`trailing_separator`, `words[].segments` (ruby) and `words[].syllables` (sub-word timing) with `transliteration`/`translation` per segment, `vocalist: string | string[]` with `-bg` and `role: background`, positional fallback for foreign ids with name mapping, and `x_amll_tool` extension (`created_by_discord`, `reversed_sync_lines`, `extra_metadata`).
- **Lyricsfile Converter Dialog** — Tools → Lyricsfile Converter (TTML ↔ YAML) with drag-and-drop and live preview.
- **Split Spectrogram Multi-Track** — Two synchronized tracks for overlapping/duet editing, Show on Top Track action, floating close button and auto-reset.
- **Reverse Playback Zones & Reverse Sync** — Mark zones with Ctrl+F/H, virtual transport with sample-reversed playback, mirrored rendering and per-line reverse sync with snapshot restore.
- **Spectrogram Hover Sync (F/G/H)** — Sync lyric timestamps to spectrogram hover position.
- **Smooth Auto-Scroll & Active Highlight** — `easeInOutCubic` smooth container (350–750ms) for editor and TimingOverview, pause on user scroll and immediate open at song position.
- **Onboarding** — Empty editor Projects shortcut, Start Guide workflow and separate project primer with Welcome dialog.
- **Vocalist Real Names Editor** — Dynamic RibbonBar section and context menu for renaming `v1`–`v4` vocalists, inline editing with i18n fallbacks.
- **Preview Enhancements** — SpicyBackground mesh-warp in Standard/Toxi previews, cover palette chain with NetEase fallback and multi-host upload, harmony `isDuetGroup` layout and auto-scroll toggle.
- **Dynamic Save Destinations** — Project folder when a project is active, otherwise system Downloads via dynamic `downloadDir()` (Tauri) or File System Access API (web).
- **Projects & History Enhancements** — 1-hour bucket deduplication, Clear History and workspace directory persistence.

### Changed

- TTML exports now go through a shared `exportTTMLText` contract with normalization and `allowConsecutiveBackgroundLines` handling.
- File dialogs use dynamic path handling (`path.split(/[/\\]/).pop()`) and English fallbacks for all UI strings.
- Background vocals default to standalone `<p><span ttm:role="x-bg">` with `v3`/`v4` agent round-trip.

### Fixed

- Background timing isolation: line `endTime` derived from words and non-overlapping backgrounds exported as independent `<p>` elements.
- Ghost duet agents removed from all export paths.
- Reverse zone mirroring and overlay stability for virtual positions.
- Smooth scroll jank and TimingOverview auto-scroll positioning.
- Divider resizing with `MIN_WORD_DURATION_MS` and virtual drag in reverse zones.
- Save dialog now uses dynamic Downloads location without hardcoded temp paths.
- Vocalist labels now use i18n with English fallbacks and legacy comments cleaned, keeping GPL headers and `biome-ignore` directives.

### Technical

- Build and storage configuration updates including `pnpm` allowlist and Tauri capabilities.
