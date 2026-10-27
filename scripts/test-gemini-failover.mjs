/**
 * NPL Hub Nepal — Test Suite: Gemini Multi-Key Failover & Model Fallback Engine
 *
 * Validates:
 * 1. Successful execution on primary key
 * 2. Rate-limit failover (429) to secondary key
 * 3. All configured keys exhausted (quota error)
 * 4. Missing keys detection
 * 5. Permanent authentication error (401/403) non-rotation
 * 6. Secret redaction (only slot names like "key 1" exposed)
 * 7. HTTP 404 Model Not Found fails immediately without key rotation
 * 8. Transient 5xx server errors rotate keys with backoff
 * 9. Model fallback chain: skips 404 model immediately and succeeds on next candidate
 * 10. Quota exhaustion across all keys halts model loop early
 * 11. All models returning 404 gracefully reports failure
 *
 * Run: node --experimental-strip-types scripts/test-gemini-failover.mjs
 */

import assert from "node:assert/strict";
import {
  getConfiguredGeminiKeys,
  isTransientOrRateLimitError,
  executeWithKeyFailover,
} from "../src/lib/agent/gemini-keys.ts";
import {
  generateNewsArticleFromItem,
  DEFAULT_MODELS,
} from "../src/lib/agent/gemini-news-generator.ts";

console.log("====================================================");
console.log("Testing Gemini Multi-Key Failover & Model Fallback Engine");
console.log("====================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Test 1: Configured keys extraction
// ---------------------------------------------------------------------------
runTest("Detects primary and numbered environment keys correctly", () => {
  const origEnv = { ...process.env };
  try {
    process.env.GEMINI_API_KEY = "test-key-primary";
    process.env.GEMINI_API_KEY_2 = "test-key-secondary";
    process.env.GEMINI_API_KEY_3 = "test-key-tertiary";
    delete process.env.GEMINI_API_KEY_4;

    const keys = getConfiguredGeminiKeys();
    assert.equal(keys.length, 3);
    assert.equal(keys[0].slotName, "key 1");
    assert.equal(keys[0].key, "test-key-primary");
    assert.equal(keys[1].slotName, "key 2");
    assert.equal(keys[1].key, "test-key-secondary");
    assert.equal(keys[2].slotName, "key 3");
    assert.equal(keys[2].key, "test-key-tertiary");
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 2: Transient error detection
// ---------------------------------------------------------------------------
runTest("Correctly classifies transient rate-limits vs permanent errors", () => {
  // Rate limit & transient
  assert.equal(isTransientOrRateLimitError(429), true);
  assert.equal(isTransientOrRateLimitError(500), true);
  assert.equal(isTransientOrRateLimitError(503), true);
  assert.equal(isTransientOrRateLimitError(200, "RESOURCE_EXHAUSTED"), true);
  assert.equal(isTransientOrRateLimitError(200, "Quota exceeded for quota metric"), true);

  // Permanent
  assert.equal(isTransientOrRateLimitError(400), false);
  assert.equal(isTransientOrRateLimitError(401), false);
  assert.equal(isTransientOrRateLimitError(403), false);
  assert.equal(isTransientOrRateLimitError(404), false);
});

// ---------------------------------------------------------------------------
// Test 3: Successful request on primary key
// ---------------------------------------------------------------------------
await runAsyncTest("Executes successfully on primary key (key 1)", async () => {
  const origEnv = { ...process.env };
  try {
    process.env.GEMINI_API_KEY = "dummy-secret-1";
    process.env.GEMINI_API_KEY_2 = "dummy-secret-2";

    const result = await executeWithKeyFailover(
      async (slot) => {
        assert.equal(slot.slotName, "key 1");
        return {
          status: 200,
          data: { article: "Cricket news title" },
          tokensUsed: 142,
        };
      },
      { backoffMs: 0 }
    );

    assert.equal(result.success, true);
    assert.equal(result.slotUsed, "key 1");
    assert.equal(result.tokensUsed, 142);
    assert.equal(result.data.article, "Cricket news title");
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 4: Rate-limit failover to secondary key
// ---------------------------------------------------------------------------
await runAsyncTest("Fails over to key 2 when key 1 encounters HTTP 429", async () => {
  const origEnv = { ...process.env };
  try {
    process.env.GEMINI_API_KEY = "dummy-secret-1";
    process.env.GEMINI_API_KEY_2 = "dummy-secret-2";

    const callLog = [];

    const result = await executeWithKeyFailover(
      async (slot) => {
        callLog.push(slot.slotName);
        if (slot.slotName === "key 1") {
          return { status: 429, errorText: "Rate limit exceeded" };
        }
        return {
          status: 200,
          data: { article: "Successfully generated with backup key" },
          tokensUsed: 195,
        };
      },
      { backoffMs: 0 }
    );

    assert.deepEqual(callLog, ["key 1", "key 2"]);
    assert.equal(result.success, true);
    assert.equal(result.slotUsed, "key 2");
    assert.equal(result.data.article, "Successfully generated with backup key");
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 5: All keys exhausted
// ---------------------------------------------------------------------------
await runAsyncTest("Stops gracefully when all configured keys are rate-limited", async () => {
  const origEnv = { ...process.env };
  try {
    process.env.GEMINI_API_KEY = "dummy-secret-1";
    process.env.GEMINI_API_KEY_2 = "dummy-secret-2";

    const callLog = [];

    const result = await executeWithKeyFailover(
      async (slot) => {
        callLog.push(slot.slotName);
        return { status: 429, errorText: "Rate limit exceeded" };
      },
      { backoffMs: 0 }
    );

    assert.deepEqual(callLog, ["key 1", "key 2"]);
    assert.equal(result.success, false);
    assert.equal(result.isQuotaExhausted, true);
    assert.match(result.error, /exhausted/i);
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 6: Missing keys handling
// ---------------------------------------------------------------------------
await runAsyncTest("Handles missing environment keys without unhandled exceptions", async () => {
  const origEnv = { ...process.env };
  try {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_1;
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.GEMINI_API_KEY_3;

    const result = await executeWithKeyFailover(
      async () => ({ status: 200, data: {} }),
      { backoffMs: 0 }
    );

    assert.equal(result.success, false);
    assert.match(result.error, /No Gemini API keys configured/i);
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 7: Permanent auth errors do NOT rotate
// ---------------------------------------------------------------------------
await runAsyncTest("Permanent errors (401/403) fail immediately without key rotation", async () => {
  const origEnv = { ...process.env };
  try {
    process.env.GEMINI_API_KEY = "bad-key";
    process.env.GEMINI_API_KEY_2 = "backup-key";

    const callLog = [];

    const result = await executeWithKeyFailover(
      async (slot) => {
        callLog.push(slot.slotName);
        return { status: 401, errorText: "API_KEY_INVALID" };
      },
      { backoffMs: 0 }
    );

    // Only key 1 should be attempted — do not rotate on auth failure
    assert.deepEqual(callLog, ["key 1"]);
    assert.equal(result.success, false);
    assert.match(result.error, /permanent error/i);
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 8: Secret redaction
// ---------------------------------------------------------------------------
await runAsyncTest("Never leaks raw API keys in result objects or error messages", async () => {
  const origEnv = { ...process.env };
  const sensitiveKey = "AIzaSySecretTokenShouldNeverBeLeaked_xyz789";
  try {
    process.env.GEMINI_API_KEY = sensitiveKey;

    const result = await executeWithKeyFailover(
      async () => {
        return {
          status: 200,
          data: { generated: true },
        };
      },
      { backoffMs: 0 }
    );

    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes(sensitiveKey), false, "Raw API key found in result string!");
    assert.equal(result.slotUsed, "key 1");
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 9: HTTP 404 Model Not Found fails immediately without key rotation
// ---------------------------------------------------------------------------
await runAsyncTest("HTTP 404 (model not found) fails immediately without key rotation", async () => {
  const origEnv = { ...process.env };
  try {
    process.env.GEMINI_API_KEY = "key-1";
    process.env.GEMINI_API_KEY_2 = "key-2";
    process.env.GEMINI_API_KEY_3 = "key-3";

    const callLog = [];

    const result = await executeWithKeyFailover(
      async (slot) => {
        callLog.push(slot.slotName);
        return {
          status: 404,
          errorText: '{"error": {"message": "models/gemini-1.5-flash is not found"}}',
        };
      },
      { backoffMs: 0 }
    );

    // Crucial: Only key 1 should be attempted. Do NOT waste key 2 or key 3 on a missing model!
    assert.deepEqual(callLog, ["key 1"]);
    assert.equal(result.success, false);
    assert.equal(result.isModelNotFound, true);
    assert.equal(result.statusCode, 404);
    assert.match(result.error, /model unavailable \(404\)/i);
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 10: Transient 5xx server errors rotate keys
// ---------------------------------------------------------------------------
await runAsyncTest("Transient 5xx server errors rotate to the next key", async () => {
  const origEnv = { ...process.env };
  try {
    process.env.GEMINI_API_KEY = "key-1";
    process.env.GEMINI_API_KEY_2 = "key-2";

    const callLog = [];

    const result = await executeWithKeyFailover(
      async (slot) => {
        callLog.push(slot.slotName);
        if (slot.slotName === "key 1") {
          return { status: 503, errorText: "Service Unavailable" };
        }
        return {
          status: 200,
          data: { generated: true },
        };
      },
      { backoffMs: 0 }
    );

    assert.deepEqual(callLog, ["key 1", "key 2"]);
    assert.equal(result.success, true);
    assert.equal(result.slotUsed, "key 2");
  } finally {
    process.env = origEnv;
  }
});

// ---------------------------------------------------------------------------
// Test 11: Model fallback chain in generateNewsArticleFromItem
// ---------------------------------------------------------------------------
await runAsyncTest("Model fallback: skips 404 model immediately and generates on next model", async () => {
  const item = {
    title: "Lumbini Lions Announce Squad for NPL 2026",
    snippet: "Lumbini Lions have finalized their 16-player squad.",
    sourceName: "Google News",
    sourceUrl: "https://news.google.com/sample",
    publishedAt: "2026-10-27T10:00:00Z",
  };

  const modelCallLog = [];

  // Mock execution function
  const mockExecFn = async (requestFn) => {
    // Determine which model is being queried by inspecting the fetch call or running requestFn
    const res = await requestFn({ index: 1, slotName: "key 1", key: "mock-key" });
    if (res.status === 404) {
      return {
        success: false,
        error: "Gemini model unavailable (404) on key 1: Model not found",
        isModelNotFound: true,
        statusCode: 404,
      };
    }
    return {
      success: true,
      data: res.data,
      tokensUsed: 150,
      slotUsed: "key 1",
    };
  };

  // Test models: Model 1 returns 404, Model 2 succeeds
  const testModels = [
    { id: "retired-model-404", api: "v1beta" },
    { id: "gemini-3.5-flash-lite", api: "v1beta" },
  ];

  let attemptCount = 0;
  const customExec = async () => {
    attemptCount++;
    if (attemptCount === 1) {
      modelCallLog.push("retired-model-404");
      return {
        success: false,
        error: "Gemini model unavailable (404) on key 1: Model not found",
        isModelNotFound: true,
        statusCode: 404,
      };
    }
    modelCallLog.push("gemini-3.5-flash-lite");
    return {
      success: true,
      data: {
        title: "Lumbini Lions Finalize Squad",
        excerpt: "Squad confirmed for NPL Season 3.",
        category: "Teams",
        blocks: [{ type: "paragraph", text: "Lumbini Lions have confirmed their team." }],
        tokensUsed: 120,
        keySlotUsed: "key 1",
      },
    };
  };

  const outcome = await generateNewsArticleFromItem(item, {
    models: testModels,
    executeFn: customExec,
  });

  assert.equal(outcome.success, true);
  assert.equal(outcome.result.title, "Lumbini Lions Finalize Squad");
  assert.deepEqual(modelCallLog, ["retired-model-404", "gemini-3.5-flash-lite"]);
});

// ---------------------------------------------------------------------------
// Test 12: Quota exhaustion halts model loop early
// ---------------------------------------------------------------------------
await runAsyncTest("Model fallback: quota exhaustion halts subsequent model attempts", async () => {
  const item = {
    title: "Biratnagar Kings Match Preview",
    snippet: "Biratnagar Kings gear up for Match 2.",
    sourceName: "Google News",
    sourceUrl: "https://news.google.com/sample2",
    publishedAt: "2026-10-27T10:00:00Z",
  };

  const modelsAttempted = [];

  const customExec = async () => {
    modelsAttempted.push("model-1");
    return {
      success: false,
      error: "All 3 configured Gemini API key(s) exhausted (rate-limited / quota).",
      isQuotaExhausted: true,
    };
  };

  const outcome = await generateNewsArticleFromItem(item, {
    models: [
      { id: "gemini-2.5-flash", api: "v1beta" },
      { id: "gemini-3.5-flash-lite", api: "v1beta" },
      { id: "gemini-3.8-flash", api: "v1beta" },
    ],
    executeFn: customExec,
  });

  assert.equal(outcome.success, false);
  // Only 1 model should be attempted because quota exhaustion breaks early
  assert.equal(modelsAttempted.length, 1);
  assert.match(outcome.error, /exhausted/i);
});

// ---------------------------------------------------------------------------
// Test 13: Default models array verification
// ---------------------------------------------------------------------------
runTest("DEFAULT_MODELS contains active verified models without gemini-1.5-flash", () => {
  const ids = DEFAULT_MODELS.map((m) => m.id);
  assert.equal(ids.includes("gemini-1.5-flash"), false, "gemini-1.5-flash must NOT be present!");
  assert.equal(ids.includes("gemini-3.5-flash-lite"), true, "gemini-3.5-flash-lite must be present!");
  assert.equal(ids.includes("gemini-3.8-flash"), true, "gemini-3.8-flash must be present!");
});

console.log(`\n====================================================`);
console.log(`Test Results: ${passed}/${total} passed`);
console.log(`====================================================`);

if (passed !== total) {
  process.exit(1);
}
