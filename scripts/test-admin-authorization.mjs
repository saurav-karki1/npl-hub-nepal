/**
 * NPL Hub Nepal — Test Suite: Admin Authorization & Session Verification
 *
 * Validates:
 * 1. Email normalization (whitespace trimming, lowercase conversion)
 * 2. Parsing comma-separated allowlist from environment variable
 * 3. Allowlist membership checking
 * 4. Unauthenticated requests (missing/malformed Authorization header -> 401)
 * 5. Invalid/expired session tokens (Supabase auth error -> 401)
 * 6. Missing or empty ADMIN_ALLOWED_EMAILS configuration -> 403 (fail closed)
 * 7. Authenticated non-allowlisted users -> 403 Forbidden
 * 8. Authenticated user without email -> 403 Forbidden
 * 9. Authorized allowlisted users (including case and whitespace insensitivity) -> 200 OK
 * 10. Multi-email allowlists with comma separation
 * 11. Secret redaction (allowlist values are never disclosed in errors)
 *
 * Run: npx tsx scripts/test-admin-authorization.mjs
 */

import assert from "node:assert/strict";
import {
  AuthError,
  normalizeEmail,
  parseAllowedEmails,
  isEmailAllowed,
  verifyAdminSession,
} from "../src/lib/auth/admin-authorization";

console.log("====================================================");
console.log("Testing Admin Authorization & Session Verification");
console.log("====================================================\n");

let passed = 0;
let total = 0;

function runSyncTest(name, fn) {
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

function createMockRequest(authHeaderValue) {
  return {
    headers: {
      get(name) {
        if (name.toLowerCase() === "authorization") {
          return authHeaderValue ?? null;
        }
        return null;
      },
    },
  };
}

function createMockSupabase(userResponse, errorResponse = null) {
  return {
    auth: {
      async getUser(token) {
        if (errorResponse || !userResponse) {
          return { data: { user: null }, error: errorResponse || new Error("Invalid token") };
        }
        return { data: { user: userResponse }, error: null };
      },
    },
  };
}

// 1. Email Normalization Tests
runSyncTest("Email normalization: trims leading and trailing whitespace", () => {
  assert.equal(normalizeEmail("  admin@example.com  "), "admin@example.com");
  assert.equal(normalizeEmail("\tnplhubnepal@gmail.com\n"), "nplhubnepal@gmail.com");
});

runSyncTest("Email normalization: converts to lowercase", () => {
  assert.equal(normalizeEmail("NPLHubNepal@Gmail.Com"), "nplhubnepal@gmail.com");
  assert.equal(normalizeEmail("ADMIN@EXAMPLE.ORG"), "admin@example.org");
});

runSyncTest("Email normalization: combined whitespace and casing", () => {
  assert.equal(normalizeEmail("   NPLHubNepal@Gmail.COM   "), "nplhubnepal@gmail.com");
});

// 2. Allowlist Parsing Tests
runSyncTest("Allowlist parsing: returns empty array for empty, undefined, or whitespace string", () => {
  assert.deepEqual(parseAllowedEmails(undefined), []);
  assert.deepEqual(parseAllowedEmails(""), []);
  assert.deepEqual(parseAllowedEmails("   "), []);
  assert.deepEqual(parseAllowedEmails("  ,  ,  "), []);
});

runSyncTest("Allowlist parsing: single email parsed and normalized", () => {
  assert.deepEqual(
    parseAllowedEmails("  NPLHubNepal@Gmail.com "),
    ["nplhubnepal@gmail.com"]
  );
});

runSyncTest("Allowlist parsing: comma-separated list with spaces and mixed case", () => {
  const result = parseAllowedEmails(
    " admin1@example.com, NPLHubNepal@Gmail.com ,  admin2@EXAMPLE.COM , , "
  );
  assert.deepEqual(result, [
    "admin1@example.com",
    "nplhubnepal@gmail.com",
    "admin2@example.com",
  ]);
});

// 3. Email Membership Checking Tests
runSyncTest("Membership check: matches exact, case-insensitive, and trimmed", () => {
  const allowed = ["nplhubnepal@gmail.com", "second@example.com"];
  assert.equal(isEmailAllowed("nplhubnepal@gmail.com", allowed), true);
  assert.equal(isEmailAllowed("  NplHubNepal@Gmail.com ", allowed), true);
  assert.equal(isEmailAllowed("SECOND@EXAMPLE.COM", allowed), true);
});

runSyncTest("Membership check: rejects unlisted, null, or empty email", () => {
  const allowed = ["nplhubnepal@gmail.com"];
  assert.equal(isEmailAllowed("intruder@example.com", allowed), false);
  assert.equal(isEmailAllowed(null, allowed), false);
  assert.equal(isEmailAllowed(undefined, allowed), false);
  assert.equal(isEmailAllowed("", allowed), false);
  assert.equal(isEmailAllowed("   ", allowed), false);
});

// 4. Unauthenticated Requests (401)
await runAsyncTest("verifyAdminSession: rejects request with missing Authorization header (401)", async () => {
  const req = createMockRequest(null);
  await assert.rejects(
    async () => {
      await verifyAdminSession(req, { allowedEmails: "nplhubnepal@gmail.com" });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 401);
      assert.match(err.message, /Missing or malformed Authorization header/i);
      return true;
    }
  );
});

await runAsyncTest("verifyAdminSession: rejects request with malformed Authorization header (401)", async () => {
  const req = createMockRequest("Basic dXNlcjpwYXNz");
  await assert.rejects(
    async () => {
      await verifyAdminSession(req, { allowedEmails: "nplhubnepal@gmail.com" });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 401);
      assert.match(err.message, /Missing or malformed Authorization header/i);
      return true;
    }
  );
});

await runAsyncTest("verifyAdminSession: rejects request with empty Bearer token (401)", async () => {
  const req = createMockRequest("Bearer   ");
  await assert.rejects(
    async () => {
      await verifyAdminSession(req, { allowedEmails: "nplhubnepal@gmail.com" });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 401);
      return true;
    }
  );
});

// 5. Invalid / Expired Session Token (401)
await runAsyncTest("verifyAdminSession: rejects request when Supabase token validation fails (401)", async () => {
  const req = createMockRequest("Bearer expired-or-invalid-token");
  const mockSupabase = createMockSupabase(null, new Error("JWT expired"));

  await assert.rejects(
    async () => {
      await verifyAdminSession(req, {
        allowedEmails: "nplhubnepal@gmail.com",
        supabaseClient: mockSupabase,
      });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 401);
      assert.match(err.message, /Invalid or expired session token/i);
      return true;
    }
  );
});

// 6. Missing or Empty Configuration (403 Fail-Closed)
await runAsyncTest("verifyAdminSession: denies access if ADMIN_ALLOWED_EMAILS is missing (403)", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "user-123", email: "nplhubnepal@gmail.com" });

  await assert.rejects(
    async () => {
      await verifyAdminSession(req, {
        allowedEmails: "", // empty config
        supabaseClient: mockSupabase,
      });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 403);
      assert.match(err.message, /Insufficient administrative privileges/i);
      return true;
    }
  );
});

await runAsyncTest("verifyAdminSession: denies access if ADMIN_ALLOWED_EMAILS is whitespace-only (403)", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "user-123", email: "nplhubnepal@gmail.com" });

  await assert.rejects(
    async () => {
      await verifyAdminSession(req, {
        allowedEmails: "   ,   ", // whitespace only
        supabaseClient: mockSupabase,
      });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

// 7. Authenticated Non-Allowlisted Users (403)
await runAsyncTest("verifyAdminSession: denies valid user not on the allowlist (403)", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "user-other", email: "unauthorized.user@gmail.com" });

  await assert.rejects(
    async () => {
      await verifyAdminSession(req, {
        allowedEmails: "nplhubnepal@gmail.com",
        supabaseClient: mockSupabase,
      });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 403);
      assert.match(err.message, /Insufficient administrative privileges/i);
      return true;
    }
  );
});

await runAsyncTest("verifyAdminSession: denies authenticated user with missing email attribute (403)", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "user-no-email", email: null });

  await assert.rejects(
    async () => {
      await verifyAdminSession(req, {
        allowedEmails: "nplhubnepal@gmail.com",
        supabaseClient: mockSupabase,
      });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

// 8. Authorized Allowlisted Users (Success)
await runAsyncTest("verifyAdminSession: authorizes allowlisted admin user", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "admin-user", email: "nplhubnepal@gmail.com" });

  const user = await verifyAdminSession(req, {
    allowedEmails: "nplhubnepal@gmail.com",
    supabaseClient: mockSupabase,
  });

  assert.equal(user.id, "admin-user");
  assert.equal(user.email, "nplhubnepal@gmail.com");
});

await runAsyncTest("verifyAdminSession: authorizes when case or whitespace varies", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "admin-user", email: "  NPLHubNepal@Gmail.COM  " });

  const user = await verifyAdminSession(req, {
    allowedEmails: "  nplhubnepal@gmail.com  ",
    supabaseClient: mockSupabase,
  });

  assert.equal(user.id, "admin-user");
});

await runAsyncTest("verifyAdminSession: authorizes member of a multi-email allowlist", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "second-admin", email: "admin2@example.com" });

  const user = await verifyAdminSession(req, {
    allowedEmails: "admin1@example.com, admin2@example.com, admin3@example.com",
    supabaseClient: mockSupabase,
  });

  assert.equal(user.id, "second-admin");
});

// 9. Secret Protection (Allowlist Never Exposed in Errors)
await runAsyncTest("verifyAdminSession: never exposes allowlist contents in error messages", async () => {
  const req = createMockRequest("Bearer valid-jwt-token");
  const mockSupabase = createMockSupabase({ id: "user-unknown", email: "attacker@gmail.com" });
  const secretAllowlist = "secret-admin@company.com, ceo@company.com";

  await assert.rejects(
    async () => {
      await verifyAdminSession(req, {
        allowedEmails: secretAllowlist,
        supabaseClient: mockSupabase,
      });
    },
    (err) => {
      assert(err instanceof AuthError);
      assert(!err.message.includes("secret-admin@company.com"));
      assert(!err.message.includes("ceo@company.com"));
      return true;
    }
  );
});

console.log("\n====================================================");
console.log(`Test Results: ${passed}/${total} passed`);
console.log("====================================================");

if (passed !== total) {
  process.exit(1);
}
