import { GIT_REPO_URL } from "virtual:buildmeta";
import { afterEach, describe, expect, it, vi } from "vitest";
import packageMetadata from "../../../../package.json";
import { LrcLibApi } from "./client";

const sampleTrack = {
	id: 3396226,
	name: "I Want to Live",
	artistName: "Borislav Slavov",
	albumName: "Baldur's Gate 3 (Original Game Soundtrack)",
	duration: 233,
	instrumental: false,
	plainLyrics: "First line\nSecond line",
	syncedLyrics: null,
};

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
	fetchMock.mockReset();
});

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
	new Response(JSON.stringify(body), init);

describe("LrcLibApi.search", () => {
	it("returns an empty list without fetching for blank queries", async () => {
		await expect(LrcLibApi.search("   ")).resolves.toEqual([]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("identifies the client from the package metadata", async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse([sampleTrack], { status: 200 }),
		);
		await LrcLibApi.search("still alive portal");
		const [, init] = fetchMock.mock.calls[0];
		const headers = init?.headers as Record<string, string>;
		expect(headers["Lrclib-Client"]).toBe(
			`${packageMetadata.name} ${packageMetadata.version} (${GIT_REPO_URL})`,
		);
	});

	it("reports the HTTP status when search fails", async () => {
		fetchMock.mockResolvedValueOnce(new Response("oops", { status: 500 }));
		await expect(LrcLibApi.search("query")).rejects.toThrow(
			"LRCLIB search failed: 500",
		);
	});

	it("reports the retry delay when rate limited", async () => {
		fetchMock.mockResolvedValueOnce(
			new Response("slow down", {
				status: 429,
				headers: { "Retry-After": "7" },
			}),
		);
		await expect(LrcLibApi.search("query")).rejects.toThrow(
			"retry in 7s (429)",
		);
	});

	it("reports network failures without an empty message", async () => {
		fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
		await expect(LrcLibApi.search("query")).rejects.toThrow(
			"LRCLIB search failed: Failed to fetch",
		);
	});
});

describe("LrcLibApi.getById", () => {
	it("reports the HTTP status when detail fetch fails", async () => {
		fetchMock.mockResolvedValueOnce(new Response("missing", { status: 404 }));
		await expect(LrcLibApi.getById(1)).rejects.toThrow(
			"LRCLIB get failed: 404",
		);
	});
});
