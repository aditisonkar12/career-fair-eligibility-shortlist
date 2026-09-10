// Validation and normalization for the student profile.
//
// Scope for this module, strictly:
//   - Field-level validation of the student profile (independent of any role).
//   - Normalization of branch and skills into a clean shape the Step 3
//     eligibility engine can consume safely.
//
// Out of scope (added in later steps): role eligibility evaluation, failure
// reasons (BRANCH_NOT_ALLOWED, CGPA_BELOW_MINIMUM, etc.), sorting, counts,
// and all UI rendering. This module has no knowledge of ROLES.

export const VALIDATION_ERRORS = Object.freeze({
  INVALID_BRANCH: "INVALID_BRANCH",
  INVALID_CGPA: "INVALID_CGPA",
  INVALID_GRADUATION_YEAR: "INVALID_GRADUATION_YEAR",
  INVALID_BACKLOG_COUNT: "INVALID_BACKLOG_COUNT",
});

// --- Field-level validators -------------------------------------------------
// Numeric fields are validated as JavaScript numbers, matching how the
// profile is represented in js/data.js. Converting raw text-input strings
// into numbers is a UI-layer concern for a later step, not this module's.

export function isValidBranch(branch) {
  return typeof branch === "string" && branch.trim().length > 0;
}

export function isValidCgpa(cgpa) {
  return typeof cgpa === "number" && Number.isFinite(cgpa) && cgpa >= 0 && cgpa <= 10;
}

export function isValidGraduationYear(graduationYear) {
  return (
    typeof graduationYear === "number" &&
    Number.isInteger(graduationYear) &&
    graduationYear >= 2000 &&
    graduationYear <= 2100
  );
}

export function isValidActiveBacklogs(activeBacklogs) {
  return (
    typeof activeBacklogs === "number" &&
    Number.isInteger(activeBacklogs) &&
    activeBacklogs >= 0
  );
}

// Validates the full student profile independently of any role. Returns
// every applicable error so a caller can decide how much to surface.
export function validateStudentProfile(profile) {
  const errors = [];

  if (!isValidBranch(profile.branch)) {
    errors.push(VALIDATION_ERRORS.INVALID_BRANCH);
  }
  if (!isValidCgpa(profile.cgpa)) {
    errors.push(VALIDATION_ERRORS.INVALID_CGPA);
  }
  if (!isValidGraduationYear(profile.graduationYear)) {
    errors.push(VALIDATION_ERRORS.INVALID_GRADUATION_YEAR);
  }
  if (!isValidActiveBacklogs(profile.activeBacklogs)) {
    errors.push(VALIDATION_ERRORS.INVALID_BACKLOG_COUNT);
  }

  return { isValid: errors.length === 0, errors };
}

// --- Normalization -----------------------------------------------------------

// Trims a branch value. Case is preserved; case-insensitive comparison is
// the eligibility engine's responsibility (Step 3), not normalization's.
export function normalizeBranch(branch) {
  return typeof branch === "string" ? branch.trim() : "";
}

// Case-insensitive, trim-insensitive equality for two text values (branches
// or individual skills). Shared here so Step 3 doesn't re-implement it.
export function equalsCaseInsensitive(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

// Accepts either a comma-separated string (e.g. raw text-input value) or an
// array of skill strings. Splits on commas when given a string, trims each
// entry, drops empty pieces, and collapses duplicates case-insensitively
// while keeping the first-seen casing. Does not infer aliases or related
// skills (e.g. "JS" is never treated as "JavaScript").
export function normalizeSkills(skills) {
  const rawEntries = Array.isArray(skills)
    ? skills
    : String(skills ?? "").split(",");

  const seenKeys = new Set();
  const normalized = [];

  for (const entry of rawEntries) {
    const trimmed = String(entry).trim();
    if (trimmed === "") continue;

    const key = trimmed.toLowerCase();
    if (seenKeys.has(key)) continue;

    seenKeys.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

// Returns a new profile with branch and skills normalized. CGPA, graduation
// year, and active backlogs are passed through unchanged — they are plain
// numbers already and are not part of the Normalization Requirements for
// this step.
export function normalizeStudentProfile(profile) {
  return {
    ...profile,
    branch: normalizeBranch(profile.branch),
    skills: normalizeSkills(profile.skills),
  };
}
