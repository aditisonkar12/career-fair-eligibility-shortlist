import test from "node:test";
import assert from "node:assert/strict";

import { createInitialStudentProfile } from "../js/data.js";
import {
  isValidCgpa,
  isValidGraduationYear,
  isValidActiveBacklogs,
  isValidBranch,
  validateStudentProfile,
  normalizeSkills,
  normalizeStudentProfile,
} from "../js/validation.js";

test("built-in profile passes validation", () => {
  const result = validateStudentProfile(createInitialStudentProfile());
  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test("CGPA boundaries: 0 and 10 accepted, 10.5 rejected", () => {
  assert.equal(isValidCgpa(0), true);
  assert.equal(isValidCgpa(10), true);
  assert.equal(isValidCgpa(8.1), true);
  assert.equal(isValidCgpa(10.5), false);

  const invalid = validateStudentProfile({ ...createInitialStudentProfile(), cgpa: 10.5 });
  assert.equal(invalid.isValid, false);
  assert.deepEqual(invalid.errors, ["INVALID_CGPA"]);
});

test("graduation year boundaries: 2000 and 2100 accepted, out-of-range/non-whole rejected", () => {
  assert.equal(isValidGraduationYear(2000), true);
  assert.equal(isValidGraduationYear(2100), true);
  assert.equal(isValidGraduationYear(1999), false);
  assert.equal(isValidGraduationYear(2101), false);
  assert.equal(isValidGraduationYear(2027.5), false);
});

test("active backlogs: 0 accepted, negative/non-whole rejected", () => {
  assert.equal(isValidActiveBacklogs(0), true);
  assert.equal(isValidActiveBacklogs(-1), false);
  assert.equal(isValidActiveBacklogs(1.5), false);
});

test("blank or whitespace-only branch is invalid", () => {
  assert.equal(isValidBranch(""), false);
  assert.equal(isValidBranch("   "), false);

  const result = validateStudentProfile({ ...createInitialStudentProfile(), branch: "   " });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.includes("INVALID_BRANCH"));
});

test("multiple simultaneous invalid fields are all reported", () => {
  const result = validateStudentProfile({
    branch: "",
    cgpa: -1,
    graduationYear: 1999,
    activeBacklogs: -3,
    skills: [],
  });
  assert.deepEqual(result.errors, [
    "INVALID_BRANCH",
    "INVALID_CGPA",
    "INVALID_GRADUATION_YEAR",
    "INVALID_BACKLOG_COUNT",
  ]);
});

test("normalizeSkills splits, trims, drops empties, and collapses case-insensitive duplicates", () => {
  assert.deepEqual(
    normalizeSkills(" Git, Python, git, , SQL, Python "),
    ["Git", "Python", "SQL"]
  );
});

test("normalizeSkills does not infer aliases", () => {
  assert.deepEqual(normalizeSkills("JS"), ["JS"]);
});

test("normalizeStudentProfile trims branch and normalizes skills, leaves numbers untouched", () => {
  const normalized = normalizeStudentProfile({
    branch: "  CSE  ",
    cgpa: 8.1,
    graduationYear: 2027,
    activeBacklogs: 1,
    skills: " Git, Python, git, , SQL, Python ",
  });
  assert.equal(normalized.branch, "CSE");
  assert.deepEqual(normalized.skills, ["Git", "Python", "SQL"]);
  assert.equal(normalized.cgpa, 8.1);
});
