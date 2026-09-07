import { createClient } from '@insforge/sdk';

// Safe Environment variables configuration
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  const globalProc = (globalThis as unknown as { process?: { env?: Record<string, string> } })?.process;
  if (globalProc && globalProc.env && globalProc.env[key]) {
    return globalProc.env[key];
  }
  return fallback;
};

const INSFORGE_URL = getEnvVar('VITE_INSFORGE_URL', 'https://agrichain-demo.insforge.app');
const INSFORGE_ANON_KEY = getEnvVar('VITE_INSFORGE_ANON_KEY', 'agrichain-anon-key-hackathon-2026');

/**
 * InsForge SDK Client instance
 */
export const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

export const config = {
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
  isMockMode: !getEnvVar('VITE_INSFORGE_URL', ''),
};
