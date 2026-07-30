type RuntimeConfig = {
  apiUrl?: string;
  socketUrl?: string;
};

const runtimeConfig =
  typeof globalThis !== "undefined"
    ? ((globalThis as typeof globalThis & { __MEETMIDWAY_CONFIG__?: RuntimeConfig }).__MEETMIDWAY_CONFIG__ || {})
    : {};

const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const defaultApiUrl =
  typeof window !== "undefined"
    ? isLocalhost
      ? "http://localhost:3000"
      : window.location.origin
    : "http://localhost:3000";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const resolvedApiUrl = runtimeConfig.apiUrl ? normalizeUrl(runtimeConfig.apiUrl) : defaultApiUrl;
const resolvedSocketUrl = runtimeConfig.socketUrl
  ? normalizeUrl(runtimeConfig.socketUrl)
  : resolvedApiUrl;

export const environment = {
  production: false,
  apiUrl: resolvedApiUrl,
  socketUrl: resolvedSocketUrl,
};
