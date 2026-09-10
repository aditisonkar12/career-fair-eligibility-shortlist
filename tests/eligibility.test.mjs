import test from "node:test";
import assert from "node:assert/strict";

import { ROLES, createInitialStudentProfile } from "../js/data.js";
import { normalizeStudentProfile } from "../js/validation.js";
import {
  evaluateRoleEligibility,
  evaluateEligibilityForRoles,
  sortEligibilityResults,
} from "../js/eligibility.js";

function roleById(id) {
  return ROLES.find((role) => role.id === id);
}

const normalizedBuiltIn = normalizeStudentProfile(createInitialStudentProfile());

test("built-in profile: CF01 and CF02 eligible with no failure reasons", () => {
  const cf01 = evaluateRoleEligibility(normalizedBuiltIn, roleById("CF01"));
  const cf02 = evaluateRoleEligibility(normalizedBuiltIn, roleById("CF02"));
  assert.equal(cf01.status, "ELIGIBLE");
  assert.deepEqual(cf01.failureReasons, []);
  assert.equal(cf02.status, "ELIGIBLE");
  assert.deepEqual(cf02.failureReasons, []);
});

test("built-in profile: CF03 ineligible with only BRANCH_NOT_ALLOWED", () => {
  const cf03 = evaluateRoleEligibility(normalizedBuiltIn, roleById("CF03"));
  assert.equal(cf03.status, "INELIGIBLE");
  assert.deepEqual(cf03.failureReasons, ["BRANCH_NOT_ALLOWED"]);
});

test("built-in profile: CF04 ineligible with only CGPA_BELOW_MINIMUM", () => {
  const cf04 = evaluateRoleEligibility(normalizedBuiltIn, roleById("CF04"));
  assert.equal(cf04.status, "INELIGIBLE");
  assert.deepEqual(cf04.failureReasons, ["CGPA_BELOW_MINIMUM"]);
});

test("built-in profile: CF05 ineligible with exact ordered failures", () => {
  const cf05 = evaluateRoleEligibility(normalizedBuiltIn, roleById("CF05"));
  assert.equal(cf05.status, "INELIGIBLE");
  assert.deepEqual(cf05.failureReasons, [
    "GRADUATION_YEAR_NOT_ALLOWED",
    "TOO_MANY_ACTIVE_BACKLOGS",
    "MISSING_SKILL: Docker",
  ]);
});

test("all five checks are evaluated independently and every failure is collected", () => {
  const worstCase = {
    branch: "Mechanical",
    cgpa: 5.0,
    graduationYear: 2099,
    activeBacklogs: 10,
    skills: [],
  };
  const result = evaluateRoleEligibility(worstCase, roleById("CF05"));
  assert.deepEqual(result.failureReasons, [
    "BRANCH_NOT_ALLOWED",
    "CGPA_BELOW_MINIMUM",
    "GRADUATION_YEAR_NOT_ALLOWED",
    "TOO_MANY_ACTIVE_BACKLOGS",
    "MISSING_SKILL: Docker",
    "MISSING_SKILL: Git",
  ]);
});

test("CGPA exactly at minimum passes; backlog count exactly at maximum passes", () => {
  const cgpaBoundary = { branch: "CSE", cgpa: 7.5, graduationYear: 2027, activeBacklogs: 1, skills: ["Python", "SQL"] };
  assert.ok(!evaluateRoleEligibility(cgpaBoundary, roleById("CF01")).failureReasons.includes("CGPA_BELOW_MINIMUM"));

  const backlogBoundary = { branch: "CSE", cgpa: 9, graduationYear: 2026, activeBacklogs: 0, skills: ["Docker", "Git"] };
  assert.equal(evaluateRoleEligibility(backlogBoundary, roleById("CF05")).status, "ELIGIBLE");
});

test("graduation year membership: multi-year allowed set for CF02", () => {
  const eligibleYear = { branch: "IT", cgpa: 8, graduationYear: 2028, activeBacklogs: 0, skills: ["Git"] };
  assert.equal(evaluateRoleEligibility(eligibleYear, roleById("CF02")).status, "ELIGIBLE");

  const ineligibleYear = { ...eligibleYear, graduationYear: 2029 };
  assert.ok(evaluateRoleEligibility(ineligibleYear, roleById("CF02")).failureReasons.includes("GRADUATION_YEAR_NOT_ALLOWED"));
});

test("branch and skill comparisons are case-insensitive", () => {
  const lowerBranch = { branch: "cse", cgpa: 9, graduationYear: 2027, activeBacklogs: 0, skills: ["Python", "SQL"] };
  assert.equal(evaluateRoleEligibility(lowerBranch, roleById("CF01")).status, "ELIGIBLE");

  const lowerSkills = { branch: "CSE", cgpa: 9, graduationYear: 2027, activeBacklogs: 0, skills: ["python", "sql"] };
  assert.equal(evaluateRoleEligibility(lowerSkills, roleById("CF01")).status, "ELIGIBLE");
});

test("every required skill must be present; missing skills sorted case-insensitively", () => {
  const partial = { branch: "CSE", cgpa: 9, graduationYear: 2027, activeBacklogs: 0, skills: ["Python"] };
  assert.deepEqual(evaluateRoleEligibility(partial, roleById("CF01")).failureReasons, ["MISSING_SKILL: SQL"]);

  const noneSkills = { branch: "CSE", cgpa: 9, graduationYear: 2026, activeBacklogs: 0, skills: [] };
  assert.deepEqual(evaluateRoleEligibility(noneSkills, roleById("CF05")).failureReasons, [
    "MISSING_SKILL: Docker",
    "MISSING_SKILL: Git",
  ]);
});

test("result ordering: built-in scenario sorts to CF01, CF02, CF03, CF04, CF05", () => {
  const sorted = sortEligibilityResults(evaluateEligibilityForRoles(normalizedBuiltIn, ROLES));
  assert.deepEqual(sorted.map((r) => r.role.id), ["CF01", "CF02", "CF03", "CF04", "CF05"]);
  assert.equal(sorted.filter((r) => r.status === "ELIGIBLE").length, 2);
  assert.equal(sorted.filter((r) => r.status === "INELIGIBLE").length, 3);
});

test("CGPA-8.5 boundary scenario: CF04 becomes eligible, eligible group ordered CF01, CF04, CF02", () => {
  const profile = { ...normalizedBuiltIn, cgpa: 8.5 };
  const sorted = sortEligibilityResults(evaluateEligibilityForRoles(profile, ROLES));
  const eligibleIds = sorted.filter((r) => r.status === "ELIGIBLE").map((r) => r.role.id);
  assert.deepEqual(eligibleIds, ["CF01", "CF04", "CF02"]);
  assert.equal(eligibleIds.length, 3);
  assert.equal(sorted.filter((r) => r.status === "INELIGIBLE").length, 2);
});

test("equal role titles tie-break by role ID ascending", () => {
  const tieRoleA = { id: "CF99", title: "Same Title", allowedBranches: ["CSE"], minimumCgpa: 0, allowedGraduationYears: [2027], maximumActiveBacklogs: 5, requiredSkills: [] };
  const tieRoleB = { id: "CF10", title: "Same Title", allowedBranches: ["CSE"], minimumCgpa: 0, allowedGraduationYears: [2027], maximumActiveBacklogs: 5, requiredSkills: [] };
  const sorted = sortEligibilityResults([
    evaluateRoleEligibility(normalizedBuiltIn, tieRoleA),
    evaluateRoleEligibility(normalizedBuiltIn, tieRoleB),
  ]);
  assert.deepEqual(sorted.map((r) => r.role.id), ["CF10", "CF99"]);
});

test("manual test case 2: CSE, CGPA 8.5, 2027, 1 backlog, Python + Git -> only CF02 and CF04 eligible", () => {
  const profile = {
    branch: "CSE",
    cgpa: 8.5,
    graduationYear: 2027,
    activeBacklogs: 1,
    skills: ["Python", "Git"],
  };
  const sorted = sortEligibilityResults(evaluateEligibilityForRoles(profile, ROLES));
  const eligibleIds = sorted.filter((r) => r.status === "ELIGIBLE").map((r) => r.role.id).sort();
  assert.deepEqual(eligibleIds, ["CF02", "CF04"]);
});
