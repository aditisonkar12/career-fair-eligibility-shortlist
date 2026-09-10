// Eligibility evaluation for the Career Fair Eligibility Shortlist.
//
// Scope for this module, strictly:
//   - Comparing a valid, normalized StudentProfile against a single fixed
//     Role across all five eligibility dimensions.
//   - Producing an ordered EligibilityResult per role.
//   - Sorting a collection of EligibilityResults for display.
//
// This module assumes its input profile has already passed
// validateStudentProfile() and normalizeStudentProfile() from
// js/validation.js — it does not validate or re-normalize anything, and it
// has no knowledge of the DOM, forms, or rendering.

import { equalsCaseInsensitive } from "./validation.js";

export const ELIGIBILITY_STATUS = Object.freeze({
  ELIGIBLE: "ELIGIBLE",
  INELIGIBLE: "INELIGIBLE",
});

export const FAILURE_REASONS = Object.freeze({
  BRANCH_NOT_ALLOWED: "BRANCH_NOT_ALLOWED",
  CGPA_BELOW_MINIMUM: "CGPA_BELOW_MINIMUM",
  GRADUATION_YEAR_NOT_ALLOWED: "GRADUATION_YEAR_NOT_ALLOWED",
  TOO_MANY_ACTIVE_BACKLOGS: "TOO_MANY_ACTIVE_BACKLOGS",
});

function missingSkillReason(skill) {
  return `MISSING_SKILL: ${skill}`;
}

// --- Individual rules, each evaluated independently -------------------------

function isBranchAllowed(studentBranch, role) {
  return role.allowedBranches.some((allowedBranch) =>
    equalsCaseInsensitive(studentBranch, allowedBranch)
  );
}

function isCgpaSufficient(studentCgpa, role) {
  return studentCgpa >= role.minimumCgpa;
}

function isGraduationYearAllowed(studentGraduationYear, role) {
  return role.allowedGraduationYears.includes(studentGraduationYear);
}

function isBacklogCountWithinLimit(studentActiveBacklogs, role) {
  return studentActiveBacklogs <= role.maximumActiveBacklogs;
}

// Returns the role's required skills the student is missing, sorted
// alphabetically case-insensitively. Comparison uses the normalized skill
// representation from Step 2; no aliases or related skills are inferred.
function findMissingSkills(studentSkills, role) {
  const missing = role.requiredSkills.filter(
    (requiredSkill) =>
      !studentSkills.some((studentSkill) => equalsCaseInsensitive(studentSkill, requiredSkill))
  );

  return missing
    .slice()
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

// Evaluates one role against one student profile. All five dimensions are
// checked independently — evaluation never stops at the first failure — and
// every applicable failure reason is returned in the required order:
// BRANCH_NOT_ALLOWED, CGPA_BELOW_MINIMUM, GRADUATION_YEAR_NOT_ALLOWED,
// TOO_MANY_ACTIVE_BACKLOGS, then one MISSING_SKILL entry per missing skill.
export function evaluateRoleEligibility(studentProfile, role) {
  const failureReasons = [];

  if (!isBranchAllowed(studentProfile.branch, role)) {
    failureReasons.push(FAILURE_REASONS.BRANCH_NOT_ALLOWED);
  }
  if (!isCgpaSufficient(studentProfile.cgpa, role)) {
    failureReasons.push(FAILURE_REASONS.CGPA_BELOW_MINIMUM);
  }
  if (!isGraduationYearAllowed(studentProfile.graduationYear, role)) {
    failureReasons.push(FAILURE_REASONS.GRADUATION_YEAR_NOT_ALLOWED);
  }
  if (!isBacklogCountWithinLimit(studentProfile.activeBacklogs, role)) {
    failureReasons.push(FAILURE_REASONS.TOO_MANY_ACTIVE_BACKLOGS);
  }
  for (const skill of findMissingSkills(studentProfile.skills, role)) {
    failureReasons.push(missingSkillReason(skill));
  }

  return {
    role,
    status: failureReasons.length === 0 ? ELIGIBILITY_STATUS.ELIGIBLE : ELIGIBILITY_STATUS.INELIGIBLE,
    failureReasons,
  };
}

// Evaluates every role against the same student profile. Order matches the
// input roles list — display ordering is a separate concern, handled by
// sortEligibilityResults below.
export function evaluateEligibilityForRoles(studentProfile, roles) {
  return roles.map((role) => evaluateRoleEligibility(studentProfile, role));
}

// Orders eligibility results per the problem statement: ELIGIBLE before
// INELIGIBLE, then by role title ascending case-insensitively, then by role
// ID ascending. Returns a new array; does not mutate the input.
export function sortEligibilityResults(results) {
  return results.slice().sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === ELIGIBILITY_STATUS.ELIGIBLE ? -1 : 1;
    }

    const titleComparison = a.role.title.toLowerCase().localeCompare(b.role.title.toLowerCase());
    if (titleComparison !== 0) {
      return titleComparison;
    }

    return a.role.id.localeCompare(b.role.id);
  });
}
