const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const runtimeOrigin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const environment = {
  production: false,
  apiUrl: isLocalhost ? "http://localhost:3000" : runtimeOrigin,
  socketUrl: isLocalhost ? "http://localhost:3000" : runtimeOrigin,
};
