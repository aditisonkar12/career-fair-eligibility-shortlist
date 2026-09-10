// Application entry point: state, event handling, and DOM rendering.
//
// This module coordinates the existing domain modules — it does not
// implement validation, normalization, or eligibility rules itself.
//   data.js        -> fixed data (BUILT_IN_STUDENT_PROFILE, ROLES)
//   validation.js   -> validateStudentProfile / normalizeStudentProfile
//   eligibility.js  -> evaluateEligibilityForRoles / sortEligibilityResults

import { createInitialStudentProfile, ROLES } from "./data.js";
import { validateStudentProfile, normalizeStudentProfile } from "./validation.js";
import {
  evaluateEligibilityForRoles,
  sortEligibilityResults,
  ELIGIBILITY_STATUS,
} from "./eligibility.js";

// --- DOM references ----------------------------------------------------------

const form = document.getElementById("profile-form");
const branchInput = document.getElementById("profile-branch");
const cgpaInput = document.getElementById("profile-cgpa");
const graduationYearInput = document.getElementById("profile-graduation-year");
const activeBacklogsInput = document.getElementById("profile-active-backlogs");
const skillsInput = document.getElementById("profile-skills");

const loadSampleButton = document.getElementById("load-sample-button");
const resetButton = document.getElementById("reset-button");

const validationMessageEl = document.getElementById("validation-message");
const roleRequirementsListEl = document.getElementById("role-requirements-list");
const resultsListEl = document.getElementById("results-list");
const eligibleCountEl = document.getElementById("eligible-count");
const ineligibleCountEl = document.getElementById("ineligible-count");

const RESULTS_PLACEHOLDER = "Click Evaluate to check eligibility for the current profile.";

// --- Form <-> profile conversion --------------------------------------------

function fillFormFromProfile(profile) {
  branchInput.value = profile.branch;
  cgpaInput.value = profile.cgpa;
  graduationYearInput.value = profile.graduationYear;
  activeBacklogsInput.value = profile.activeBacklogs;
  skillsInput.value = profile.skills.join(", ");
}

// Converts a raw form-field string into a number for validation, per the
// Evaluate contract ("convert numeric input values into the appropriate
// JavaScript numeric representation before validation"). An empty or
// non-numeric string becomes NaN, which validation.js correctly rejects.
function toNumericValue(rawValue) {
  const trimmed = String(rawValue).trim();
  if (trimmed === "") return NaN;
  return Number(trimmed);
}

// Reads the current form values into a candidate StudentProfile shape.
// Skills are passed through as the raw comma-separated string — splitting
// and trimming is normalizeSkills()'s job (js/validation.js), not this
// module's, so UI-side normalization is never duplicated here.
function readCandidateProfileFromForm() {
  return {
    branch: branchInput.value,
    cgpa: toNumericValue(cgpaInput.value),
    graduationYear: toNumericValue(graduationYearInput.value),
    activeBacklogs: toNumericValue(activeBacklogsInput.value),
    skills: skillsInput.value,
  };
}

// --- Rendering: fixed role requirements (static, driven by ROLES) ----------

function renderRoleRequirements(roles) {
  roleRequirementsListEl.innerHTML = "";

  for (const role of roles) {
    const card = document.createElement("article");
    card.className = "role-card";
    card.innerHTML = `
      <h3>${role.id} — ${role.title}</h3>
      <dl>
        <div><dt>Allowed branches</dt><dd>${role.allowedBranches.join(", ")}</dd></div>
        <div><dt>Minimum CGPA</dt><dd>${role.minimumCgpa}</dd></div>
        <div><dt>Allowed graduation years</dt><dd>${role.allowedGraduationYears.join(", ")}</dd></div>
        <div><dt>Maximum active backlogs</dt><dd>${role.maximumActiveBacklogs}</dd></div>
        <div><dt>Required skills</dt><dd>${role.requiredSkills.join(", ")}</dd></div>
      </dl>
    `;
    roleRequirementsListEl.appendChild(card);
  }
}

// --- Rendering: validation message ------------------------------------------

function renderValidationErrors(errors) {
  validationMessageEl.innerHTML =
    `<p>The profile is invalid:</p><ul>${errors.map((code) => `<li>${code}</li>`).join("")}</ul>`;
  validationMessageEl.hidden = false;
}

function clearValidationMessage() {
  validationMessageEl.innerHTML = "";
  validationMessageEl.hidden = true;
}

// --- Rendering: eligibility results and counts ------------------------------
// Results are rendered exactly as produced by eligibility.js — this module
// does not recompute, reorder, or filter failureReasons.

function renderResults(sortedResults) {
  resultsListEl.innerHTML = "";

  for (const result of sortedResults) {
    const isEligible = result.status === ELIGIBILITY_STATUS.ELIGIBLE;
    const card = document.createElement("article");
    card.className = `result-card ${isEligible ? "result-card--eligible" : "result-card--ineligible"}`;

    const failureListMarkup = isEligible
      ? ""
      : `<ul class="failure-reasons">${result.failureReasons
          .map((reason) => `<li>${reason}</li>`)
          .join("")}</ul>`;

    card.innerHTML = `
      <div class="result-card__header">
        <span class="result-card__role">${result.role.id} — ${result.role.title}</span>
        <span class="status-badge ${isEligible ? "status-badge--eligible" : "status-badge--ineligible"}">
          ${result.status}
        </span>
      </div>
      ${failureListMarkup}
    `;
    resultsListEl.appendChild(card);
  }
}

function renderCounts(sortedResults) {
  const eligibleCount = sortedResults.filter((result) => result.status === ELIGIBILITY_STATUS.ELIGIBLE).length;
  const ineligibleCount = sortedResults.filter((result) => result.status === ELIGIBILITY_STATUS.INELIGIBLE).length;
  eligibleCountEl.textContent = String(eligibleCount);
  ineligibleCountEl.textContent = String(ineligibleCount);
}

function clearResultsAndCounts() {
  resultsListEl.innerHTML = `<p class="results-placeholder">${RESULTS_PLACEHOLDER}</p>`;
  eligibleCountEl.textContent = "–";
  ineligibleCountEl.textContent = "–";
}

// --- Actions -----------------------------------------------------------------

// Reads the current form values and runs the same validate -> normalize ->
// evaluate -> sort -> render pipeline used by Evaluate. Shared by the
// Evaluate button and Load Sample so neither duplicates this logic.
function evaluateCurrentForm() {
  const candidateProfile = readCandidateProfileFromForm();
  const validation = validateStudentProfile(candidateProfile);

  if (!validation.isValid) {
    renderValidationErrors(validation.errors);
    clearResultsAndCounts();
    return;
  }

  clearValidationMessage();
  const normalizedProfile = normalizeStudentProfile(candidateProfile);
  const sortedResults = sortEligibilityResults(
    evaluateEligibilityForRoles(normalizedProfile, ROLES)
  );
  renderResults(sortedResults);
  renderCounts(sortedResults);
}

function handleEvaluate(event) {
  event.preventDefault();
  evaluateCurrentForm();
}

function handleLoadSample() {
  fillFormFromProfile(createInitialStudentProfile());
  evaluateCurrentForm();
}

function handleReset() {
  fillFormFromProfile(createInitialStudentProfile());
  renderRoleRequirements(ROLES);
  clearValidationMessage();
  clearResultsAndCounts();
}

// --- Wiring --------------------------------------------------------------

form.addEventListener("submit", handleEvaluate);
loadSampleButton.addEventListener("click", handleLoadSample);
resetButton.addEventListener("click", handleReset);

// Initial state: form pre-filled with the built-in profile, role
// requirements rendered from data.js, no evaluation run yet.
fillFormFromProfile(createInitialStudentProfile());
renderRoleRequirements(ROLES);
clearValidationMessage();
clearResultsAndCounts();
