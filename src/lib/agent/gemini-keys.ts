/**
 * NPL Hub Nepal — AI News Agent: Gemini Key Management & Failover Engine
 *
 * Manages multiple server-side Gemini API keys for high reliability and quota resilience.
 *
 * ENVIRONMENT VARIABLES:
 * - Primary: GEMINI_API_KEY
 * - Failover: GEMINI_API_KEY_2, GEMINI_API_KEY_3, GEMINI_API_KEY_4, GEMINI_API_KEY_5, GEMINI_API_KEY_6 ... GEMINI_API_KEY_20
 *
 * SAFETY & SECURITY:
 * - Server-side ONLY. Never expose keys to client bundles, API responses, or logs.
 * - Only slot names (e.g., "key 1", "key 2") are recorded in logs and audit trails.
 * - Key failover ONLY triggers on temporary rate limits (429), quota limits, or transient 5xx errors.
 * - Permanent client errors (400 Bad Request, 401/403 Authentication) fail immediately without rotation.
 * - Model Not Found (404) fails immediately with isModelNotFound=true so the caller skips to the next model candidate.
 */

export interface GeminiKeySlot {
  index: number;
  slotName: string; // e.g. "key 1", "key 2"
  key: string;
}

export interface GeminiExecuteResult<T> {
  success: boolean;
  data?: T;
  slotUsed?: string;
  tokensUsed?: number;
  error?: string;
  isQuotaExhausted?: boolean;
  isModelNotFound?: boolean;
  statusCode?: number;
}

/**
 * Collect all configured Gemini API keys from environment variables.
 * Scans GEMINI_API_KEY, then GEMINI_API_KEY_2 through GEMINI_API_KEY_20.
 * Explicitly supports GEMINI_API_KEY_4, GEMINI_API_KEY_5, GEMINI_API_KEY_6.
 * Server-only.
 */
export function getConfiguredGeminiKeys(): GeminiKeySlot[] {
  const keys: GeminiKeySlot[] = [];
  const seenKeys = new Set<string>();

  const addKey = (index: number, slotName: string, val: string | undefined) => {
    if (!val) return;
    const trimmed = val.trim();
    if (!trimmed || seenKeys.has(trimmed)) return;
    seenKeys.add(trimmed);
    keys.push({
      index,
      slotName,
      key: trimmed,
    });
  };

  // Key 1: Primary GEMINI_API_KEY or GEMINI_API_KEY_1
  addKey(1, "key 1", process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1);

  // Numbered keys: GEMINI_API_KEY_2 through GEMINI_API_KEY_20
  // Specifically supports GEMINI_API_KEY_4, GEMINI_API_KEY_5, GEMINI_API_KEY_6
  for (let i = 2; i <= 20; i++) {
    addKey(i, `key ${i}`, process.env[`GEMINI_API_KEY_${i}`]);
  }

  // Also dynamically scan process.env for any GEMINI_API_KEY_\d+ that might be set
  for (const [envKey, envVal] of Object.entries(process.env)) {
    const match = envKey.match(/^GEMINI_API_KEY_(\d+)$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      addKey(idx, `key ${idx}`, envVal);
    }
  }

  return keys;
}

/**
 * Get any single valid Gemini API key (from primary or failovers 2..20).
 */
export function getFirstConfiguredGeminiKey(): string | undefined {
  const keys = getConfiguredGeminiKeys();
  return keys[0]?.key;
}

/**
 * Determine if an HTTP status or error message represents a temporary
 * rate-limit or transient server error that warrants failing over to another key.
 */
export function isTransientOrRateLimitError(status: number, errorBody = ""): boolean {
  // 429 Too Many Requests (Rate limit / Quota exceeded)
  if (status === 429) return true;

  // 5xx Transient server errors (500, 502, 503, 504)
  if (status >= 500 && status <= 504) return true;

  // Quota exceeded indicators inside JSON error bodies
  const lower = errorBody.toLowerCase();
  if (
    lower.includes("resource_exhausted") ||
    lower.includes("quota exceeded") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return true;
  }

  return false;
}

/**
 * Execute a Gemini API call with bounded key rotation and failover.
 *
 * @param requestFn - Callback that performs the fetch for a specific key slot.
 * @param options - Configuration options (maxRetries, backoffMs).
 */
export async function executeWithKeyFailover<T>(
  requestFn: (slot: GeminiKeySlot) => Promise<{
    status: number;
    data?: T;
    tokensUsed?: number;
    errorText?: string;
  }>,
  options: {
    backoffMs?: number;
  } = {}
): Promise<GeminiExecuteResult<T>> {
  const keys = getConfiguredGeminiKeys();

  if (keys.length === 0) {
    return {
      success: false,
      error:
        "No Gemini API keys configured. Set GEMINI_API_KEY in environment variables.",
      isQuotaExhausted: false,
    };
  }

  const backoffMs = options.backoffMs ?? 800;
  let lastError = "All Gemini requests failed.";
  let allRateLimited = true;
  let allServerUnavailable = true;

  // Bounded attempt loop: at most 1 attempt per configured key
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const slot = keys[attempt];

    try {
      const response = await requestFn(slot);

      // Successful call (2xx)
      if (response.status >= 200 && response.status < 300 && response.data) {
        return {
          success: true,
          data: response.data,
          slotUsed: slot.slotName,
          tokensUsed: response.tokensUsed ?? 0,
          statusCode: response.status,
        };
      }

      // Check for unavailable model (404 Not Found)
      // Rotating keys will NEVER resolve a missing model endpoint — return immediately
      if (response.status === 404) {
        return {
          success: false,
          error: `Gemini model unavailable (404) on ${slot.slotName}: ${response.errorText ?? "Model not found"}`,
          slotUsed: slot.slotName,
          isModelNotFound: true,
          statusCode: 404,
          isQuotaExhausted: false,
        };
      }

      // Check for permanent client errors (400 Bad Request, 401/403 Auth failure)
      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 403
      ) {
        // Do NOT rotate keys for invalid requests or authentication failures
        return {
          success: false,
          error: `Gemini permanent error (${response.status}) on ${slot.slotName}: ${response.errorText ?? "Permanent failure"}`,
          slotUsed: slot.slotName,
          statusCode: response.status,
          isQuotaExhausted: false,
        };
      }

      // Check if eligible for failover (429 or 5xx)
      if (isTransientOrRateLimitError(response.status, response.errorText)) {
        // Differentiate 429 quota exhaustion from 5xx server spikes (e.g. 503 high demand)
        if (response.status >= 500 && response.status <= 504) {
          allRateLimited = false; // It's server-side load, NOT key quota!
          lastError = `Google Gemini servers temporarily experiencing high demand (${response.status}) on ${slot.slotName}`;
        } else {
          allServerUnavailable = false;
          lastError = `Gemini rate limit or quota exceeded (${response.status}) on ${slot.slotName}`;
        }

        // If there are more keys to try, wait briefly and failover
        if (attempt < keys.length - 1) {
          if (backoffMs > 0) {
            await new Promise((res) => setTimeout(res, backoffMs));
          }
          continue; // Try next key
        }
      } else {
        allRateLimited = false;
        allServerUnavailable = false;
        lastError = `Gemini HTTP ${response.status} on ${slot.slotName}: ${response.errorText ?? "Unknown error"}`;
      }
    } catch (err: unknown) {
      allRateLimited = false;
      allServerUnavailable = false;
      const msg = err instanceof Error ? err.message : "Network error";
      lastError = `Network error on ${slot.slotName}: ${msg}`;

      // Network timeouts can be retried on next key
      if (attempt < keys.length - 1) {
        if (backoffMs > 0) {
          await new Promise((res) => setTimeout(res, backoffMs));
        }
        continue;
      }
    }
  }

  return {
    success: false,
    error: allRateLimited
      ? `All ${keys.length} configured Gemini API key(s) exhausted (rate-limited / quota).`
      : allServerUnavailable
      ? `Google Gemini servers are temporarily experiencing high demand (503 Service Unavailable) across configured keys.`
      : lastError,
    isQuotaExhausted: allRateLimited,
  };
}
