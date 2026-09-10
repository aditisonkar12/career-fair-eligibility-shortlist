// Application entry point.
//
// Step 3 scope: load the data model, validate and normalize the profile,
// then run the eligibility engine and sort its results. Result rendering
// and the final UI (forms, buttons, counts, validation messages) are
// implemented in a later step and are intentionally absent here.

import { createInitialStudentProfile, ROLES } from "./data.js";
import { validateStudentProfile, normalizeStudentProfile } from "./validation.js";
import { evaluateEligibilityForRoles, sortEligibilityResults } from "./eligibility.js";

const state = {
  studentProfile: createInitialStudentProfile(),
  roles: ROLES,
};

const validation = validateStudentProfile(state.studentProfile);
const normalizedProfile = validation.isValid
  ? normalizeStudentProfile(state.studentProfile)
  : null;

const eligibilityResults = normalizedProfile
  ? sortEligibilityResults(evaluateEligibilityForRoles(normalizedProfile, state.roles))
  : [];

// Temporary checkpoint output for this step only — confirms validation,
// normalization, and eligibility evaluation run correctly end to end.
// Replaced by real result rendering in a later step.
console.log("Career Fair Eligibility Shortlist — Step 3 eligibility checkpoint", {
  state,
  validation,
  normalizedProfile,
  eligibilityResults,
});

const debugOutput = document.getElementById("debug-output");
if (debugOutput) {
  debugOutput.textContent = JSON.stringify(
    { state, validation, normalizedProfile, eligibilityResults },
    null,
    2
  );
}
