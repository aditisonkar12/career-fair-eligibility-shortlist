// Application entry point.
//
// Step 1 scope: load the data model into an application state object only.
// Validation, normalization, eligibility evaluation, and result rendering
// are implemented in later steps and are intentionally absent here.

import { createInitialStudentProfile, ROLES } from "./data.js";

const state = {
  studentProfile: createInitialStudentProfile(),
  roles: ROLES,
};

// Temporary checkpoint output for this step only — confirms the data model
// loaded correctly. Replaced by real result rendering in a later step.
console.log("Career Fair Eligibility Shortlist — Step 1 data checkpoint", state);

const debugOutput = document.getElementById("debug-output");
if (debugOutput) {
  debugOutput.textContent = JSON.stringify(state, null, 2);
}
