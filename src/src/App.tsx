// COMPATIBILITY SHIM - Redirects old cached imports to correct location
// The actual App.tsx is at /App.tsx (project root)
// This file exists to handle cached references to /src/App.tsx

export { default } from "@/App";
export * from "@/App";
