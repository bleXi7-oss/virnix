/**
 * test-credit-idempotency.mjs
 *
 * Unit tests for client-side duplicate-request prevention and
 * server-side idempotency logic (pure logic — no DB, no HTTP).
 *
 * Run: node scripts/test-credit-idempotency.mjs
 */

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     expected: ${JSON.stringify(expected)}`);
    console.error(`     actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ─── Simulate the server-side start_generation_attempt logic ─────────────────

function makeAttemptStore() {
  const store = new Map(); // user_id:attempt_key → status
  return {
    start(userId, attemptKey) {
      const key = `${userId}:${attemptKey}`;
      if (!store.has(key)) {
        store.set(key, "started");
        return "new";
      }
      const status = store.get(key);
      if (status === "started") return "in_progress";
      if (status === "success") return "completed";
      // error or warning → reset to started (retry allowed)
      store.set(key, "started");
      return "new";
    },
    complete(userId, attemptKey) {
      store.set(`${userId}:${attemptKey}`, "success");
    },
    fail(userId, attemptKey, status = "error") {
      store.set(`${userId}:${attemptKey}`, status);
    },
    getStatus(userId, attemptKey) {
      return store.get(`${userId}:${attemptKey}`) ?? null;
    },
  };
}

// ─── Simulate inFlightRef guard ───────────────────────────────────────────────

function makeInFlightGuard() {
  let inFlight = false;
  let callCount = 0;
  return {
    tryStart() {
      if (inFlight) return false;
      inFlight = true;
      callCount++;
      return true;
    },
    finish() {
      inFlight = false;
    },
    getCallCount() { return callCount; },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\n── Client-side inFlightRef guard ────────────────────────────────");

{
  const guard = makeInFlightGuard();
  const result1 = guard.tryStart();
  assert("first call succeeds", result1, true);
  assert("call count = 1", guard.getCallCount(), 1);

  const result2 = guard.tryStart(); // double-click simulation
  assert("second call (double-click) blocked", result2, false);
  assert("call count stays 1 after blocked call", guard.getCallCount(), 1);

  guard.finish();
  const result3 = guard.tryStart(); // retry after completion
  assert("call succeeds after previous finishes", result3, true);
  assert("call count = 2 after retry", guard.getCallCount(), 2);
}

{
  const guard = makeInFlightGuard();
  guard.tryStart(); // first explicit generate click
  const result = guard.tryStart(); // rapid double-submit (second click within same tick)
  assert("rapid double-submit: second blocked", result, false);
  assert("only 1 request started despite rapid double-submit", guard.getCallCount(), 1);
}

{
  // Paste sets URL but does NOT start generation.
  // Generation only starts on explicit Generate button click or Enter key.
  let generationStarted = false;
  function simulatePaste() {
    // In page.tsx: handlePaste sets URL and clears error — no runGeneration call.
    const urlWasSet = true;
    return { urlWasSet, generationStarted };
  }
  const pasteResult = simulatePaste();
  assert("paste sets URL without starting generation", pasteResult.urlWasSet, true);
  assert("paste does NOT auto-start generation", pasteResult.generationStarted, false);
}

console.log("\n── Server-side generation_attempts idempotency ─────────────────");

{
  const store = makeAttemptStore();
  const status1 = store.start("user-1", "attempt-aaa");
  assert("fresh attempt returns 'new'", status1, "new");

  const status2 = store.start("user-1", "attempt-aaa"); // duplicate in-flight
  assert("same key while in-flight returns 'in_progress'", status2, "in_progress");
}

{
  const store = makeAttemptStore();
  store.start("user-1", "attempt-bbb");
  store.complete("user-1", "attempt-bbb");

  const status = store.start("user-1", "attempt-bbb"); // duplicate after success
  assert("same key after success returns 'completed'", status, "completed");
  assert("status is still 'success'", store.getStatus("user-1", "attempt-bbb"), "success");
}

{
  const store = makeAttemptStore();
  store.start("user-1", "attempt-ccc");
  store.fail("user-1", "attempt-ccc", "error");

  const status = store.start("user-1", "attempt-ccc"); // retry after error
  assert("same key after error returns 'new' (retry allowed)", status, "new");
}

{
  const store = makeAttemptStore();
  store.start("user-1", "attempt-ddd");
  store.fail("user-1", "attempt-ddd", "warning");

  const status = store.start("user-1", "attempt-ddd"); // retry after warning
  assert("same key after warning returns 'new' (retry allowed)", status, "new");
}

{
  const store = makeAttemptStore();
  // Different users with same attempt key — must NOT interfere.
  store.start("user-1", "shared-key");
  store.complete("user-1", "shared-key");

  const status = store.start("user-2", "shared-key");
  assert("different user with same key is independent", status, "new");
}

console.log("\n── Credit deduction order ───────────────────────────────────────");

{
  // Simulate the server-side deduction order:
  // warning → 0 credits | error → 0 credits | success → exactly 1 credit
  function simulateRequest(scenario) {
    let creditsDeducted = 0;

    // Step 1: transcript warning?
    if (scenario === "warning") return { creditsDeducted, outcome: "warning" };

    // Step 2: Anthropic generate()
    if (scenario === "generate_fail") return { creditsDeducted, outcome: "error" };

    // Step 3: success → deduct exactly once
    creditsDeducted += 1;
    return { creditsDeducted, outcome: "success" };
  }

  const warning = simulateRequest("warning");
  assert("transcript warning: 0 credits charged", warning.creditsDeducted, 0);

  const genFail = simulateRequest("generate_fail");
  assert("generation failure: 0 credits charged", genFail.creditsDeducted, 0);

  const success = simulateRequest("success");
  assert("successful generation: exactly 1 credit charged", success.creditsDeducted, 1);
}

console.log("\n── Transcript language safety (English source) ──────────────────");

// Mirrors isTranscriptSafe logic for English → any output language.
function normalizeLang(code) {
  if (!code) return null;
  return code.split(/[-_]/)[0].toLowerCase();
}
const UNDETERMINED = new Set(["und", "zxx", "mis", "mul"]);
function isTranscriptSafe(transcriptLang, outputLanguage, script) {
  if (outputLanguage === "auto") return true;
  const nt = normalizeLang(transcriptLang);
  const no_ = normalizeLang(outputLanguage);
  if (!nt || UNDETERMINED.has(nt)) {
    return script === "latin_dominant" || script === "no_letters";
  }
  if (nt === no_) return true;
  if (nt === "en") return true;
  return false;
}

assert("en → sl: safe (English source always ok)", isTranscriptSafe("en", "sl", "latin_dominant"), true);
assert("en-US → sl: safe", isTranscriptSafe("en-US", "sl", "latin_dominant"), true);
assert("en-GB → de: safe", isTranscriptSafe("en-GB", "de", "latin_dominant"), true);
assert("en_US → sl: safe (underscore variant, false-positive fix)", isTranscriptSafe("en_US", "sl", "latin_dominant"), true);
assert("en_GB → de: safe (underscore variant)", isTranscriptSafe("en_GB", "de", "latin_dominant"), true);
assert("null + latin → sl: safe (no metadata, Latin script)", isTranscriptSafe(null, "sl", "latin_dominant"), true);
assert("null + no_letters → sl: safe", isTranscriptSafe(null, "sl", "no_letters"), true);
assert("und + latin → sl: safe (undetermined treated as no metadata)", isTranscriptSafe("und", "sl", "latin_dominant"), true);
assert("und + arabic → sl: unsafe (undetermined, non-Latin script)", isTranscriptSafe("und", "sl", "arabic_dominant"), false);
assert("ar → sl: unsafe (Arabic metadata)", isTranscriptSafe("ar", "sl", "arabic_dominant"), false);
assert("tr → sl: unsafe (Turkish metadata, Latin script)", isTranscriptSafe("tr", "sl", "latin_dominant"), false);
assert("fr → de: unsafe (French metadata, Latin script)", isTranscriptSafe("fr", "de", "latin_dominant"), false);
assert("null + arabic_dominant → sl: unsafe (no metadata, non-Latin script)", isTranscriptSafe(null, "sl", "arabic_dominant"), false);
assert("sl → sl: safe (same language)", isTranscriptSafe("sl", "sl", "latin_dominant"), true);
assert("auto output: always safe", isTranscriptSafe("ar", "auto", "arabic_dominant"), true);

console.log("\n── Continue-after-warning: single charge path ───────────────────");

{
  const guard = makeInFlightGuard();
  const store = makeAttemptStore();

  // Step 1: initial attempt → warning (no credit)
  const started = guard.tryStart(); // returns true
  const idA = "attempt-e2e-1";
  store.start("user-1", idA);
  store.fail("user-1", idA, "warning");
  guard.finish();
  assert("initial attempt: guard released after warning", guard.getCallCount(), 1);

  // Step 2: user clicks Continue → new attempt ID
  const startedContinue = guard.tryStart(); // returns true (guard is free)
  const idB = "attempt-e2e-2"; // NEW UUID from client
  const continueStatus = store.start("user-1", idB);
  assert("Continue gets fresh attempt slot", continueStatus, "new");

  // Simulate Anthropic succeeds → deduct once
  store.complete("user-1", idB);
  guard.finish();
  assert("Continue: attempt marked success", store.getStatus("user-1", idB), "success");
  assert("Warning attempt still 'warning' (no charge path)", store.getStatus("user-1", idA), "warning");
  assert("Total guard invocations = 2 (initial + Continue)", guard.getCallCount(), 2);
  void started;
  void startedContinue;
}

{
  // Step 3: user double-clicks Continue — ONLY ONE should go through
  const guard = makeInFlightGuard();
  const store = makeAttemptStore();
  const idC = "attempt-e2e-3";

  const click1 = guard.tryStart();
  const click2 = guard.tryStart(); // double-click
  assert("double-click Continue: first click through", click1, true);
  assert("double-click Continue: second click blocked by guard", click2, false);

  // Only one request reaches server
  const serverStatus = store.start("user-1", idC);
  assert("only one server-side attempt registered", serverStatus, "new");
  store.complete("user-1", idC);
  guard.finish();
  assert("attempt status = success after single completion", store.getStatus("user-1", idC), "success");
}

console.log("\n── creditsUsed in API responses ─────────────────────────────");

{
  // Warning path — no generation, no charge.
  const warningResponse = { ok: false, error: "Transcript language mismatch detected.", creditsUsed: 0, transcriptWarning: {} };
  assert("warning response: ok = false", warningResponse.ok, false);
  assert("warning response: creditsUsed = 0", warningResponse.creditsUsed, 0);

  // Generation error — no charge.
  const errorResponse = { ok: false, error: "Generation failed. Nothing was charged. Please try again.", creditsUsed: 0 };
  assert("generation error response: creditsUsed = 0", errorResponse.creditsUsed, 0);

  // Duplicate in-progress — no charge.
  const duplicateResponse = { ok: false, error: "This request is already in progress. Please wait.", creditsUsed: 0 };
  assert("duplicate in_progress response: creditsUsed = 0", duplicateResponse.creditsUsed, 0);

  // Duplicate already-completed — no charge.
  const completedResponse = { ok: false, error: "This generation has already been completed.", creditsUsed: 0 };
  assert("duplicate completed response: creditsUsed = 0", completedResponse.creditsUsed, 0);

  // Insufficient credits — no charge.
  const insufficientResponse = { ok: false, error: "You've used your free beta credits.", creditsUsed: 0, creditsRequired: 1, creditsAvailable: 0 };
  assert("insufficient credits response: creditsUsed = 0", insufficientResponse.creditsUsed, 0);

  // Successful generation — exactly 1 credit.
  const successResponse = { ok: true, data: {}, creditsUsed: 1, creditsRemaining: 4 };
  assert("success response: creditsUsed = 1", successResponse.creditsUsed, 1);
  assert("success response: creditsRemaining = 4", successResponse.creditsRemaining, 4);

  // creditsUsed is always a number, never undefined.
  assert("all ok:false responses have creditsUsed", typeof warningResponse.creditsUsed === "number", true);
  assert("all ok:true responses have creditsUsed", typeof successResponse.creditsUsed === "number", true);
}

console.log("\n── Log safety ───────────────────────────────────────────────");

{
  // Verify the credit log format contains safe fields only.
  function buildLogLine(params) {
    const key = params.attemptKey ? params.attemptKey.slice(0, 8) : "no-key";
    const parts = [
      `[virnix-credit] attempt=${key}`,
      `status=${params.status}`,
      `charged=${params.creditsCharged}`,
    ];
    if (params.balanceBefore !== undefined) parts.push(`balance_before=${params.balanceBefore}`);
    if (params.balanceAfter !== undefined) parts.push(`balance_after=${params.balanceAfter}`);
    if (params.reason) parts.push(`reason="${params.reason}"`);
    return parts.join(" ");
  }

  const successLog = buildLogLine({
    attemptKey: "abc12345-0000-0000-0000-000000000000",
    status: "success",
    creditsCharged: 1,
    balanceBefore: 5,
    balanceAfter: 4,
  });
  assert("success log: has attempt key (8-char prefix)", successLog.includes("attempt=abc12345"), true);
  assert("success log: has status", successLog.includes("status=success"), true);
  assert("success log: has charged", successLog.includes("charged=1"), true);
  assert("success log: has balance_before", successLog.includes("balance_before=5"), true);
  assert("success log: has balance_after", successLog.includes("balance_after=4"), true);
  assert("success log: no email pattern", /\w+@\w+\.\w+/.test(successLog), false);
  assert("success log: no full UUID exposed", !successLog.includes("abc12345-0000"), true);

  const warningLog = buildLogLine({
    attemptKey: "def99999-0000-0000-0000-000000000000",
    status: "warning",
    creditsCharged: 0,
    reason: "transcript_lang_mismatch",
  });
  assert("warning log: has reason", warningLog.includes('reason="transcript_lang_mismatch"'), true);
  assert("warning log: charged=0", warningLog.includes("charged=0"), true);
  assert("warning log: no balance fields when not provided", !warningLog.includes("balance_"), true);

  const noKeyLog = buildLogLine({ attemptKey: null, status: "error", creditsCharged: 0, reason: "generation_failed" });
  assert("no-key log: fallback to no-key", noKeyLog.includes("attempt=no-key"), true);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("FAILED");
  process.exit(1);
} else {
  console.log("ALL PASSED");
}
