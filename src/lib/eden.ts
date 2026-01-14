import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
    return process.env.NEXT_SERVICE_BASE_URL ?? "http://localhost:3000";
};

// this require .api to enter /api prefix
export const api = treaty<App>(getBaseUrl(), {
	fetch: {
		credentials: "include",
	},
}).api;
