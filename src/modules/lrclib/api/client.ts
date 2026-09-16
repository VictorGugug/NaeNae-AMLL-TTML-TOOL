import { GIT_REPO_URL } from "virtual:buildmeta";
import packageMetadata from "../../../../package.json";
import type { LrcLibTrack } from "../types";

const BASE_URL = "https://lrclib.net/api";
const clientId = `${packageMetadata.name} ${packageMetadata.version} (${GIT_REPO_URL})`;

const clientHeaders = (): HeadersInit => ({
	"Lrclib-Client": clientId,
});

async function describeError(
	response: Response,
	action: string,
): Promise<string> {
	if (response.status === 429) {
		const retryAfter = Number(response.headers.get("Retry-After"));
		const delay =
			Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : 0;
		return `LRCLIB ${action} failed: rate limited, retry in ${delay}s (429)`;
	}
	let detail = "";
	try {
		detail = (await response.text()).slice(0, 160).trim();
	} catch {
		detail = "";
	}
	return `LRCLIB ${action} failed: ${response.status}${detail ? ` (${detail})` : ""}`;
}

function describeNetworkError(error: unknown, action: string): string {
	const reason = error instanceof Error ? error.message : String(error);
	return `LRCLIB ${action} failed: ${reason}`;
}

export const LrcLibApi = {
	async search(query: string): Promise<LrcLibTrack[]> {
		if (!query.trim()) return [];

		let response: Response;
		try {
			response = await fetch(
				`${BASE_URL}/search?q=${encodeURIComponent(query)}`,
				{
					headers: clientHeaders(),
				},
			);
		} catch (error) {
			throw new Error(describeNetworkError(error, "search"));
		}
		if (!response.ok) {
			throw new Error(await describeError(response, "search"));
		}
		return (await response.json()) as LrcLibTrack[];
	},

	async getById(id: number): Promise<LrcLibTrack> {
		let response: Response;
		try {
			response = await fetch(`${BASE_URL}/get/${id}`, {
				headers: clientHeaders(),
			});
		} catch (error) {
			throw new Error(describeNetworkError(error, "get"));
		}
		if (!response.ok) {
			throw new Error(await describeError(response, "get"));
		}
		return (await response.json()) as LrcLibTrack;
	},
};
