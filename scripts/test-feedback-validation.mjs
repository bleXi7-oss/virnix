// Zero-cost feedback API validation smoke test.
// Mirrors validation logic from app/api/feedback/route.ts.
// Run with: node scripts/test-feedback-validation.mjs
// No TypeScript compiler. No network. No Supabase.

// ─── Inline mirror of route validation ───────────────────────────────────────

const VALID_RESPONSES = new Set(["yes", "some", "no"]);

// Returns the same shape as the route would respond, minus the actual DB call.
// status 400 = invalid, status 401 = not authenticated, status 200 = would insert.
function validateFeedbackRequest({ user, body }) {
  if (!user) return { status: 401, ok: false, error: "Not authenticated" };

  const { response } = body ?? {};
  if (typeof response !== "string" || !VALID_RESPONSES.has(response)) {
    return { status: 400, ok: false, error: "response must be one of: yes, some, no" };
  }

  // Would call supabase.from("generation_feedback").insert(...)
  return { status: 200, ok: true, wouldInsert: { user_id: user.id, response } };
}

// ─── Assertions ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

const AUTHED = { user: { id: "user-uuid-1234" } };

// ─── Valid responses ──────────────────────────────────────────────────────────

console.log('valid responses → 200');
for (const response of ["yes", "some", "no"]) {
  const r = validateFeedbackRequest({ ...AUTHED, body: { response } });
  assert(r.status === 200, `"${response}" accepted`);
  assert(r.ok === true, `"${response}" ok=true`);
  assert(r.wouldInsert?.response === response, `"${response}" insert payload correct`);
  assert(r.wouldInsert?.user_id === AUTHED.user.id, `"${response}" user_id in insert`);
}

// ─── Invalid response values ──────────────────────────────────────────────────

console.log('\ninvalid response values → 400');
const INVALID = ["maybe", "Yes", "YES", "no ", " yes", "1", "", null, 0, false, {}, []];
for (const response of INVALID) {
  const r = validateFeedbackRequest({ ...AUTHED, body: { response } });
  assert(r.status === 400, `${JSON.stringify(response)} rejected with 400`);
  assert(r.ok === false, `${JSON.stringify(response)} ok=false`);
}

// ─── Missing response field ───────────────────────────────────────────────────

console.log('\nmissing or mangled body → 400');
{
  const r = validateFeedbackRequest({ ...AUTHED, body: {} });
  assert(r.status === 400, "empty body → 400");
}
{
  const r = validateFeedbackRequest({ ...AUTHED, body: { other: "yes" } });
  assert(r.status === 400, "response field absent → 400");
}
{
  const r = validateFeedbackRequest({ ...AUTHED, body: null });
  assert(r.status === 400, "null body → 400 (no crash)");
}

// ─── Unauthenticated ─────────────────────────────────────────────────────────

console.log('\nunauthenticated → 401');
{
  const r = validateFeedbackRequest({ user: null, body: { response: "yes" } });
  assert(r.status === 401, "null user → 401");
  assert(r.ok === false, "null user ok=false");
}
{
  const r = validateFeedbackRequest({ user: undefined, body: { response: "yes" } });
  assert(r.status === 401, "undefined user → 401");
}

// ─── Auth check runs before body validation ───────────────────────────────────

console.log('\nauth checked before body parsing');
{
  const r = validateFeedbackRequest({ user: null, body: { response: "invalid" } });
  assert(r.status === 401, "unauthenticated + invalid response → 401, not 400");
}

// ─── VALID_RESPONSES set membership ──────────────────────────────────────────

console.log('\nVALID_RESPONSES set completeness');
assert(VALID_RESPONSES.size === 3, "exactly 3 valid values");
assert(VALID_RESPONSES.has("yes"), 'set has "yes"');
assert(VALID_RESPONSES.has("some"), 'set has "some"');
assert(VALID_RESPONSES.has("no"), 'set has "no"');
assert(!VALID_RESPONSES.has("Yes"), 'case-sensitive: "Yes" not in set');
assert(!VALID_RESPONSES.has(""), '"" not in set');

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFAILED — see ✗ lines above");
  process.exit(1);
}
console.log("ALL PASSED");
