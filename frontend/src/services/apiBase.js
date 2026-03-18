const configuredBase = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

const runtimeDefaultBase =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const API_BASE = configuredBase || runtimeDefaultBase;
