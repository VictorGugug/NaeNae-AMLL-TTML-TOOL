import { isTauri } from "@tauri-apps/api/core";
import saveFileFromLib from "save-file";
import { error } from "./logging";

export interface SaveFileOptions {
	suggestedName?: string;
	types?: {
		description: string;
		accept: Record<string, string[]>;
	}[];
}

export async function saveFile(
	content: Blob | string,
	options: SaveFileOptions | string,
) {
	const suggestedName =
		typeof options === "string" ? options : options.suggestedName;
	const types = typeof options === "string" ? undefined : options.types;

	if (isTauri()) {
		try {
			const { save } = await import("@tauri-apps/plugin-dialog");
			const { downloadDir, join } = await import("@tauri-apps/api/path");
			const { writeFile, writeTextFile } = await import("@tauri-apps/plugin-fs");
			const baseDir = await downloadDir();
			const defaultPath = suggestedName ? await join(baseDir, suggestedName) : undefined;
			const filters = types?.map((t) => ({
				name: t.description,
				extensions: Object.values(t.accept).flat().map((e) => e.replace(/^\./, "")),
			}));
			const picked = await save({
				defaultPath,
				filters,
			});
			if (!picked) return null;
			if (typeof content === "string") {
				await writeTextFile(picked, content);
			} else {
				const buf = new Uint8Array(await content.arrayBuffer());
				await writeFile(picked, buf);
			}
			return picked.split(/[/\\]/).pop() ?? suggestedName ?? null;
		} catch (e: any) {
			if (String(e).includes("cancelled") || e?.name === "AbortError") return null;
			error("Failed to save file via Tauri dialog", e);
		}
	}

	if ("showSaveFilePicker" in window) {
		try {
			// @ts-ignore
			const handle = await window.showSaveFilePicker({
				suggestedName,
				types,
			});
			const writable = await handle.createWritable();
			await writable.write(content);
			await writable.close();
			return handle.name as string;
		} catch (e: any) {
			if (e.name === "AbortError") return null;
			error("Failed to save file via File System Access API", e);
		}
	}

	const b =
		typeof content === "string" ? new Blob([content], { type: "text/plain" }) : content;
	await saveFileFromLib(b, suggestedName || "file");
	return suggestedName;
}
