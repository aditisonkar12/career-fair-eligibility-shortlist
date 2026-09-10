// Exercises the exact algorithm js/app.js's handleEvaluate() runs — numeric
// coercion of form-field strings, then validate -> normalize -> evaluate ->
// sort — using the real domain modules. app.js itself calls
// document.getElementById() at import time and can only run inside a
// browser DOM, so this test reproduces its logic against plain string
// inputs (what real <input> elements hand back via .value) instead.
import test from "node:test";
import assert from "node:assert/strict";

import { ROLES, createInitialStudentProfile } from "../js/data.js";
import { validateStudentProfile, normalizeStudentProfile } from "../js/validation.js";
import { evaluateEligibilityForRoles, sortEligibilityResults } from "../js/eligibility.js";

// Mirrors js/app.js's toNumericValue exactly.
function toNumericValue(rawValue) {
  const trimmed = String(rawValue).trim();
  if (trimmed === "") return NaN;
  return Number(trimmed);
}

// Mirrors js/app.js's handleEvaluate, minus DOM reads/writes.
function simulateEvaluate(formFields) {
  const candidateProfile = {
    branch: formFields.branch,
    cgpa: toNumericValue(formFields.cgpa),
    graduationYear: toNumericValue(formFields.graduationYear),
    activeBacklogs: toNumericValue(formFields.activeBacklogs),
    skills: formFields.skills,
  };
  const validation = validateStudentProfile(candidateProfile);
  if (!validation.isValid) {
    return { validation, results: null };
  }
  const normalized = normalizeStudentProfile(candidateProfile);
  const results = sortEligibilityResults(evaluateEligibilityForRoles(normalized, ROLES));
  return { validation, results };
}

function builtInFormFields(overrides = {}) {
  const profile = createInitialStudentProfile();
  return {
    branch: profile.branch,
    cgpa: String(profile.cgpa),
    graduationYear: String(profile.graduationYear),
    activeBacklogs: String(profile.activeBacklogs),
    skills: profile.skills.join(", "),
    ...overrides,
  };
}

test("built-in form values evaluate to the required built-in result", () => {
  const { validation, results } = simulateEvaluate(builtInFormFields());
  assert.equal(validation.isValid, true);

  const eligible = results.filter((r) => r.status === "ELIGIBLE").map((r) => r.role.id);
  const ineligible = results.filter((r) => r.status === "INELIGIBLE").map((r) => r.role.id);
  assert.deepEqual(eligible, ["CF01", "CF02"]);
  assert.deepEqual(ineligible, ["CF03", "CF04", "CF05"]);
});

test("changing only CGPA to 8.5 (as typed text) makes CF04 eligible with the required ordering", () => {
  const { validation, results } = simulateEvaluate(builtInFormFields({ cgpa: "8.5" }));
  assert.equal(validation.isValid, true);

  const eligible = results.filter((r) => r.status === "ELIGIBLE").map((r) => r.role.id);
  assert.deepEqual(eligible, ["CF01", "CF04", "CF02"]);
  assert.equal(results.filter((r) => r.status === "INELIGIBLE").length, 2);
});

test("CGPA 10.5 reports INVALID_CGPA and produces no eligibility results", () => {
  const { validation, results } = simulateEvaluate(builtInFormFields({ cgpa: "10.5" }));
  assert.equal(validation.isValid, false);
  assert.deepEqual(validation.errors, ["INVALID_CGPA"]);
  assert.equal(results, null, "an invalid profile must never reach the eligibility engine");
});

test("a blank required numeric field is invalid and never reaches the eligibility engine", () => {
  const { validation, results } = simulateEvaluate(builtInFormFields({ activeBacklogs: "" }));
  assert.equal(validation.isValid, false);
  assert.ok(validation.errors.includes("INVALID_BACKLOG_COUNT"));
  assert.equal(results, null);
});

// Regression test for "Load Sample": loading the built-in profile must run
// the same validate -> normalize -> evaluate -> sort pipeline Evaluate uses
// (js/app.js's handleLoadSample calls the shared evaluateCurrentForm()
// helper, not a separate/duplicated code path), so it must produce exactly
// the same result as evaluating that same profile directly.
test("loading the built-in sample runs the same pipeline as evaluating it directly", () => {
  const viaSimulatedLoadSample = simulateEvaluate(builtInFormFields());

  const builtInProfile = createInitialStudentProfile();
  const normalizedDirect = normalizeStudentProfile(builtInProfile);
  const viaDirectEvaluation = sortEligibilityResults(
    evaluateEligibilityForRoles(normalizedDirect, ROLES)
  );

  assert.equal(viaSimulatedLoadSample.validation.isValid, true);
  assert.deepEqual(viaSimulatedLoadSample.results, viaDirectEvaluation);

  const eligible = viaSimulatedLoadSample.results.filter((r) => r.status === "ELIGIBLE").map((r) => r.role.id);
  assert.deepEqual(eligible, ["CF01", "CF02"]);
});
