const DEFAULT_API_BASE_URL = "https://aegis-crisis-system-production-5fb2.up.railway.app";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "/api" : DEFAULT_API_BASE_URL)
).replace(/\/+$/, "");
