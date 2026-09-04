# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Folder Projects & Workspace System** — Open, create, and save lyrics as project folders with `project.json` manifest, workspace scanning, and persistent project history.
- **Dual Format Support (TTML + Lyricsfile YAML)** — Companion `.ttml` and `.lyricsfile.yaml` side-by-side files, format switching directly from the File menu with dirty-state protection and "Save & Switch", plus dual format badges.
- **Lyricsfile 1.1 Engine & Community Alignment** — Bidirectional YAML 1.1 parser and writer aligned with upstream proposals (#1 to #9 in `tranxuanthang/lyricsfile`):
  - Preserved `metadata.duration_ms`, `offset_ms`, and `instrumental` across round-trips.
  - Top-level `sections[]` (`kind`, `label`, `start_ms`, `end_ms`) mapped from TTML song structure.
  - Explicit word `trailing_separator: " "` keeping character timestamps strictly on sung letters for cleaner karaoke highlight interpolation.
  - Sub-word musical timing with `words[].syllables[]` (per issue #4).
  - Ruby / CJK pronunciation annotations with `words[].segments[]` (per issue #8).
  - Standardized vocalist mapping to `v1` (lead), `v2` (duet), `v3` (middle), and `v4` (group harmony) with `-bg` and `role: background`, plus positional fallback for foreign IDs.
  - Preserved transliteration and translation across lines, words, segments, and top-level block scalars (`plain_transliteration`, `plain_translation`).
  - Namespaced `x_amll_tool` vendor block to avoid losing extra metadata (`created_by_discord`, `reversed_sync_lines`, `extra_metadata`).
- **Lyricsfile Converter Dialog** — Dedicated converter under Tools → Lyricsfile Converter (TTML ↔ YAML) with drag-and-drop, validation, and real-time preview.
- **CC0 Demo & Real-World Testbeds** — 100% CC0 fictional demo track ("Starlight Horizons" by Nova & Orion) complying strictly with `CONTRIBUTING.md` for upstream submission, alongside real-world converted testbeds for English duets (*White Ball*) and word-synced Japanese lyrics (*Yoru ni Kakeru* from AMLL TTML DB).
- **Split Spectrogram Multi-Track** — Two synchronized tracks for duet and overlapping editing, "Show on Top Track" action, floating close button, and auto-reset.
- **Reverse Playback Zones & Reverse Sync** — Reverse zones with Ctrl+F/H, sample-reversed virtual transport playback, mirrored rendering, and per-line reverse sync with snapshot restore.
- **Spectrogram Hover Sync (F/G/H)** — Keyboard shortcuts to snap lyric timestamps directly to the spectrogram hover position.
- **Smooth Auto-Scroll & Active Highlight** — `easeInOutCubic` smooth scroll container (350–750ms) for the editor and TimingOverview, pausing on manual user scroll and opening right at the current song position.
- **Onboarding & Welcome Dialog** — Empty editor Projects shortcut, Start Guide workflow, and project primer.
- **Vocalist Real Names Editor** — Dynamic RibbonBar controls and context menus to rename `v1`–`v4` vocalists with inline editing and i18n fallbacks.
- **Preview Enhancements** — SpicyBackground mesh-warp in Standard/Toxi previews, cover palette extraction with NetEase fallback, harmony `isDuetGroup` layout, and auto-scroll toggle.
- **Dynamic Save Destinations** — Save routing to active project folder, or system Downloads via dynamic `downloadDir()` (Tauri) or File System Access API (web).
- **Projects & History Enhancements** — 1-hour bucket deduplication, Clear History, and workspace persistence.
- **Desktop Executable & Windows Installer Distribution** — Tauri desktop builds targeting Windows, producing standalone `.exe` binaries and NSIS installer packages for GitHub Releases.

### Changed

- Unified TTML exports through a shared `exportTTMLText` contract with normalization and `allowConsecutiveBackgroundLines` handling.
- Refactored file dialogs to use dynamic path resolution (`path.split(/[/\\]/).pop()`) and English fallbacks.
- Defaulted background vocals to standalone `<p><span ttm:role="x-bg">` with `v3`/`v4` agent round-trip.

### Fixed

- **TTML Parser XML Namespace Resolution** — Fallback query using `localName()` for `<meta>` and `<agent>` elements when TTML root or parent nodes lack default namespace prefixes.
- **Background Role Matching Across DOM Engines** — Case-insensitive `localName(el).toLowerCase() === "span"` and unified `getAttr(el, "role") === "x-bg"`, fixing missed background vocals in XHTML/HTML DOM trees where tag names are uppercase (`SPAN`).
- **Timestamp Monotonicity in Lyricsfile Exports** — Fixed zero-start anomalies (`start_ms: 0` on late lines) in duet and background vocal streams, ensuring strictly monotonic timeline ordering.
- **CSS Build Artifact Cleanup** — Removed stray merge conflict marker from `src/index.css`.
- Isolated background timing: line `endTime` now derives from its own words, and non-overlapping backgrounds export as independent `<p>` elements.
- Removed ghost duet agents from all export paths.
- Fixed reverse zone mirroring and overlay stability for virtual positions.
- Fixed smooth scroll jank and TimingOverview auto-scroll positioning.
- Fixed divider resizing with `MIN_WORD_DURATION_MS` and virtual drag in reverse zones.
- Fixed save dialog paths to use dynamic Downloads without hardcoded temp paths.
- Cleaned legacy comments while preserving GPL headers and `biome-ignore` directives.

### Technical

- 13 vitest unit tests in `src/modules/lyricsfile-processor/lyricsfile-processor.test.ts` verifying 100% round-trip fidelity between TTML and Lyricsfile YAML formats (32 test suites, 187 passing tests).
- Build and storage configuration updates including `pnpm` allowlist and Tauri capabilities.
