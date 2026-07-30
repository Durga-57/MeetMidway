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

const defaultApiUrl = isLocalhost ? "http://localhost:3000" : "";

export const environment = {
  production: false,
  apiUrl: runtimeConfig.apiUrl || defaultApiUrl,
  socketUrl: runtimeConfig.socketUrl || defaultApiUrl,
};
