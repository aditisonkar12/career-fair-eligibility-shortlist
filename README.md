# Career Fair Eligibility Shortlist

A compact tool for a university placement team to compare one student's
academic profile against five fixed career-fair role requirements and show
eligibility results.

## AI-Assisted Development

### Step 1 — Data + Application Structure

**What was implemented**

- Basic project skeleton: `index.html`, `css/styles.css`, `js/data.js`, `js/app.js`.
- `js/data.js`: the data model only —
  - `BUILT_IN_STUDENT_PROFILE`, a frozen object matching the spec exactly
    (branch `CSE`, CGPA `8.1`, graduation year `2027`, active backlogs `1`,
    skills `Git, Python, SQL`).
  - `ROLES`, a frozen array of the five fixed role requirements (CF01–CF05),
    each with `id`, `title`, `allowedBranches`, `minimumCgpa`,
    `allowedGraduationYears`, `maximumActiveBacklogs`, and `requiredSkills`,
    matching the problem statement's table exactly.
  - `createInitialStudentProfile()`, a factory that returns a fresh, mutable
    copy of the built-in profile — the basis for the editable working
    profile and for Reset in a later step.
- `js/app.js`: loads the data into a minimal `state` object
  (`{ studentProfile, roles }`) and prints it to the console and to a
  temporary `<pre id="debug-output">` block, purely to confirm the data
  loads correctly at this checkpoint.
- No validation, normalization, eligibility evaluation, sorting, failure
  reasons, result counts, or final UI are implemented yet — those are
  scoped to later steps.

**Prompt used for this iteration**

> Set up the basic project structure and data model for the Career Fair
> Eligibility Shortlist app (Step 1 of 5 in our plan). Represent the
> built-in student profile and the five fixed roles exactly as specified in
> the problem statement. Keep data structures simple and readable
> (StudentProfile: branch, cgpa, graduationYear, activeBacklogs, skills;
> Role: id, title, allowedBranches, minimumCgpa, allowedGraduationYears,
> maximumActiveBacklogs, requiredSkills). Do not implement validation,
> eligibility evaluation, sorting, or the final UI yet — this step is data
> and structure only. Inspect the existing repo first and preserve any
> useful existing files rather than assuming an empty project.

**Why this change was made**

This is the first step of the approved five-step plan (data + structure →
validation + normalization → eligibility engine → UI + rendering →
testing + polish). Establishing the data shapes first, before any logic
touches them, keeps business logic (added in later steps) cleanly
separated from UI rendering and gives every later step a single, correct
source of truth for the profile and role data.

**Important design decision**

The application uses local JavaScript data structures only — no backend,
database, API, or authentication. `ROLES` is a fixed, in-memory constant
and the student profile is a plain in-memory object; everything the app
needs is loaded synchronously from `js/data.js`. This matches the problem
statement's constraint that no backend, network service, or external job
feed is required.

**What should be verified at this checkpoint**

- Opening `index.html` (served over `http://`, since it uses ES modules)
  logs `Career Fair Eligibility Shortlist — Step 1 data checkpoint` to the
  browser console and prints the loaded `state` object.
- The debug output shows exactly one student profile with the five
  built-in field values listed above.
- The debug output shows exactly five roles, IDs `CF01`–`CF05`, each with
  the allowed branches, minimum CGPA, allowed graduation years, maximum
  active backlogs, and required skills matching the problem statement's
  table.
- No eligibility results, counts, or validation messages appear anywhere
  — none are implemented yet.

No automated tests exist yet; testing is introduced in Step 5 per the plan.

### Step 2 — Validation + Normalization

**What was implemented**

- New `js/validation.js`, containing only field-level validation and
  branch/skill normalization for the student profile — no eligibility
  logic and no knowledge of `ROLES`:
  - `isValidBranch`, `isValidCgpa`, `isValidGraduationYear`,
    `isValidActiveBacklogs` — pure per-field checks.
  - `validateStudentProfile(profile)` — runs all four checks and returns
    `{ isValid, errors }`, where `errors` lists every applicable code
    (`INVALID_BRANCH`, `INVALID_CGPA`, `INVALID_GRADUATION_YEAR`,
    `INVALID_BACKLOG_COUNT`) rather than stopping at the first failure.
  - `normalizeBranch(branch)` — trims surrounding whitespace.
  - `normalizeSkills(skills)` — accepts a comma-separated string (e.g. raw
    text-input value) or an array, splits on commas, trims each entry,
    drops empty pieces, and collapses duplicates case-insensitively while
    keeping the first-seen casing.
  - `equalsCaseInsensitive(a, b)` — a small shared helper for
    trim + case-insensitive comparison, so Step 3 doesn't re-implement it.
  - `normalizeStudentProfile(profile)` — returns a copy with `branch` and
    `skills` normalized; numeric fields pass through unchanged.
- `js/app.js` updated to run the loaded profile through
  `validateStudentProfile` and, when valid, `normalizeStudentProfile`,
  logging both to the console and the existing temporary debug output —
  the same checkpoint pattern used in Step 1, extended rather than
  replaced.
- No role eligibility evaluation, failure reasons, sorting, counts, or
  final UI were added — those remain scoped to Steps 3–4.

**Prompt used for this iteration**

> Implement the reusable validation and normalization layer for the
> student profile (Step 2 of 5). Create `js/validation.js` only if
> appropriate — keep it independent from the UI and from role eligibility
> evaluation. Validate branch (blank → `INVALID_BRANCH`), CGPA
> (finite, 0–10 → `INVALID_CGPA`), graduation year (whole number,
> 2000–2100 → `INVALID_GRADUATION_YEAR`), and active backlogs (whole
> number, ≥ 0 → `INVALID_BACKLOG_COUNT`). Normalize branch by trimming and
> skills by splitting on commas, trimming, dropping empty entries, and
> collapsing duplicates case-insensitively, without inferring aliases. Do
> not implement eligibility evaluation, failure reasons, sorting, counts,
> or the final UI in this step.

**Why validation/normalization was separated from eligibility logic**

The problem statement's contracts distinguish profile-level validity
(“is this field usable at all?”) from role-level eligibility (“does this
value satisfy a specific role's requirements?”). Keeping them in separate
modules means the eligibility engine in Step 3 can assume it only ever
receives an already-valid, already-normalized profile, and validation
never needs to know that roles exist. It also matches the contract that
"any invalid student-profile field clears earlier role results" — that
decision belongs to the application/UI layer reading `validation.isValid`,
not to validation.js itself.

**Important AI-assisted design decision**

Duplicate skills are collapsed using a case-insensitive key, but the
*first-seen* trimmed casing is kept in the output (e.g. `"Git, Python,
git, , SQL, Python"` → `["Git", "Python", "SQL"]`), since the problem
statement requires case-insensitive comparison but never states that
stored skill casing itself must change. This was a judgment call made
explicit here so it can be revisited if Step 3 or Step 4 needs a
different convention. Numeric fields (`cgpa`, `graduationYear`,
`activeBacklogs`) are validated strictly as JavaScript numbers, with no
string-to-number coercion — parsing raw form-input strings is treated as
a Step 4 UI concern, keeping this module decoupled from input handling.

**Verification performed**

Ran a standalone Node script (not part of the shipped app) exercising
`js/validation.js` directly:

- Built-in profile validates with zero errors.
- CGPA `8.1` valid; CGPA `10.5` invalid and reported as `INVALID_CGPA`.
- CGPA `0` and `10` both accepted (inclusive boundaries).
- Graduation years `2000` and `2100` accepted; `1999`, `2101`, and `2027.5`
  rejected.
- Active backlogs `0` accepted; `-1` and `1.5` rejected.
- Blank (`""`) and whitespace-only (`"   "`) branch both rejected as
  `INVALID_BRANCH`.
- `" Git, Python, git, , SQL, Python "` normalizes to exactly
  `["Git", "Python", "SQL"]`.
- Empty comma-separated entries are ignored.
- `"JS"` normalizes to `["JS"]`, confirming no alias is inferred into
  `"JavaScript"`.
- `normalizeStudentProfile` trims branch and normalizes skills while
  leaving `cgpa` untouched.

All 23 checks passed. Role eligibility is **not** verified or implemented
at this checkpoint — only field-level validation and normalization.

**Issues found**

None. No changes were needed to the Step 1 data model to support this
step.
