/**
 * NPL Hub Nepal — Cricket API Provider Factory
 *
 * Provides a unified entry point to obtain the active cricket data provider.
 * Allows switching providers (TheSportsDB, SportMonks, Mock) via CRICKET_DATA_PROVIDER env variable.
 */

import { ICricketDataProvider, CricketProviderName, ProviderVerificationResult } from "./types";
import { TheSportsDbProvider } from "./thesportsdb-provider";
import { SportMonksProvider } from "./sportmonks-provider";
import { MockCricketProvider } from "./mock-provider";

export * from "./types";
export { TheSportsDbProvider } from "./thesportsdb-provider";
export { SportMonksProvider } from "./sportmonks-provider";
export { MockCricketProvider } from "./mock-provider";

/**
 * Returns the currently active cricket data provider based on environment configuration.
 * Defaults to 'thesportsdb' if configured, with graceful fallback to 'mock'.
 */
export function getCricketProvider(providerName?: CricketProviderName): ICricketDataProvider {
  const chosen = (providerName ||
    process.env.CRICKET_DATA_PROVIDER ||
    "thesportsdb") as CricketProviderName;

  switch (chosen) {
    case "sportmonks":
      return new SportMonksProvider();
    case "mock":
      return new MockCricketProvider();
    case "thesportsdb":
    default:
      return new TheSportsDbProvider();
  }
}

/**
 * Verifies coverage for the currently configured provider.
 */
export async function verifyActiveProvider(): Promise<ProviderVerificationResult> {
  const provider = getCricketProvider();
  return provider.verifyCoverage();
}
