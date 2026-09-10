// Data model for the Career Fair Eligibility Shortlist.
// Pure data only. Validation, normalization, and eligibility evaluation
// are added in later steps — this module has no logic beyond constructing
// plain data objects.

// The built-in student profile, exactly as specified in the problem statement.
// Treated as read-only: the editable working copy is created via
// createInitialStudentProfile() below, and Reset re-creates it from here.
export const BUILT_IN_STUDENT_PROFILE = Object.freeze({
  branch: "CSE",
  cgpa: 8.1,
  graduationYear: 2027,
  activeBacklogs: 1,
  skills: Object.freeze(["Git", "Python", "SQL"]),
});

// The five fixed local career-fair roles. Role requirements are not
// user-editable, so this list is frozen.
export const ROLES = Object.freeze([
  Object.freeze({
    id: "CF01",
    title: "Data Operations Intern",
    allowedBranches: Object.freeze(["CSE", "IT"]),
    minimumCgpa: 7.5,
    allowedGraduationYears: Object.freeze([2027]),
    maximumActiveBacklogs: 1,
    requiredSkills: Object.freeze(["Python", "SQL"]),
  }),
  Object.freeze({
    id: "CF02",
    title: "QA Automation Intern",
    allowedBranches: Object.freeze(["CSE", "ECE", "IT"]),
    minimumCgpa: 7.0,
    allowedGraduationYears: Object.freeze([2027, 2028]),
    maximumActiveBacklogs: 1,
    requiredSkills: Object.freeze(["Git"]),
  }),
  Object.freeze({
    id: "CF03",
    title: "Embedded Systems Intern",
    allowedBranches: Object.freeze(["ECE", "EEE"]),
    minimumCgpa: 7.5,
    allowedGraduationYears: Object.freeze([2027]),
    maximumActiveBacklogs: 1,
    requiredSkills: Object.freeze(["Git"]),
  }),
  Object.freeze({
    id: "CF04",
    title: "Machine Learning Intern",
    allowedBranches: Object.freeze(["CSE", "IT"]),
    minimumCgpa: 8.5,
    allowedGraduationYears: Object.freeze([2027]),
    maximumActiveBacklogs: 1,
    requiredSkills: Object.freeze(["Python"]),
  }),
  Object.freeze({
    id: "CF05",
    title: "Platform Engineering Intern",
    allowedBranches: Object.freeze(["CSE", "ECE"]),
    minimumCgpa: 7.0,
    allowedGraduationYears: Object.freeze([2026]),
    maximumActiveBacklogs: 0,
    requiredSkills: Object.freeze(["Docker", "Git"]),
  }),
]);

// Returns a fresh, mutable copy of the built-in student profile.
// Used to seed the editable working profile on load and on Reset.
export function createInitialStudentProfile() {
  return {
    branch: BUILT_IN_STUDENT_PROFILE.branch,
    cgpa: BUILT_IN_STUDENT_PROFILE.cgpa,
    graduationYear: BUILT_IN_STUDENT_PROFILE.graduationYear,
    activeBacklogs: BUILT_IN_STUDENT_PROFILE.activeBacklogs,
    skills: [...BUILT_IN_STUDENT_PROFILE.skills],
  };
}
