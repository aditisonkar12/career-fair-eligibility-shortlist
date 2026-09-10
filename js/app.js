// Application entry point.
//
// Step 2 scope: load the data model and run it through validation and
// normalization. Eligibility evaluation and result rendering are
// implemented in later steps and are intentionally absent here.

import { createInitialStudentProfile, ROLES } from "./data.js";
import { validateStudentProfile, normalizeStudentProfile } from "./validation.js";

const state = {
  studentProfile: createInitialStudentProfile(),
  roles: ROLES,
};

const validation = validateStudentProfile(state.studentProfile);
const normalizedProfile = validation.isValid
  ? normalizeStudentProfile(state.studentProfile)
  : null;

// Temporary checkpoint output for this step only — confirms validation and
// normalization run correctly against the loaded profile. Replaced by real
// result rendering in a later step.
console.log("Career Fair Eligibility Shortlist — Step 2 validation checkpoint", {
  state,
  validation,
  normalizedProfile,
});

const debugOutput = document.getElementById("debug-output");
if (debugOutput) {
  debugOutput.textContent = JSON.stringify({ state, validation, normalizedProfile }, null, 2);
}
