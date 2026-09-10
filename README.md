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

### Step 3 — Eligibility Engine

**What was implemented**

- New `js/eligibility.js`, containing only the logic that compares a
  valid, normalized `StudentProfile` against a single `Role`:
  - `evaluateRoleEligibility(studentProfile, role)` — checks branch, CGPA,
    graduation year, active backlogs, and required skills independently
    and returns `{ role, status, failureReasons }`.
  - `evaluateEligibilityForRoles(studentProfile, roles)` — maps
    `evaluateRoleEligibility` over a list of roles, in input order.
  - `sortEligibilityResults(results)` — a separate, pure sort step:
    `ELIGIBLE` before `INELIGIBLE`, then role title ascending
    case-insensitively, then role ID ascending as a tiebreaker.
  - `ELIGIBILITY_STATUS` and `FAILURE_REASONS` exported as frozen constant
    objects, matching the identifiers from the problem statement exactly
    (`BRANCH_NOT_ALLOWED`, `CGPA_BELOW_MINIMUM`,
    `GRADUATION_YEAR_NOT_ALLOWED`, `TOO_MANY_ACTIVE_BACKLOGS`; each
    missing skill produces its own `MISSING_SKILL: <skill>` string).
  - Reuses `equalsCaseInsensitive` from `js/validation.js` for branch and
    skill comparisons instead of re-implementing it.
- `js/app.js` extended to run the existing validated/normalized profile
  through `evaluateEligibilityForRoles` + `sortEligibilityResults` and log
  the sorted results to the same temporary debug checkpoint used in
  Steps 1–2.
- No form handling, DOM rendering, result cards, counters, Load
  Sample/Reset behavior, or styling were added — those remain scoped to
  Step 4.

**Prompt used for this iteration**

> Implement the reusable eligibility engine for comparing a valid,
> normalized student profile against one fixed role (Step 3 of 5). Create
> `js/eligibility.js` only if appropriate. Evaluate all five dimensions
> (branch, CGPA, graduation year, active backlogs, required skills)
> independently — never stop at the first failure — and return every
> applicable failure in this exact order: `BRANCH_NOT_ALLOWED`,
> `CGPA_BELOW_MINIMUM`, `GRADUATION_YEAR_NOT_ALLOWED`,
> `TOO_MANY_ACTIVE_BACKLOGS`, then one `MISSING_SKILL: <skill>` per missing
> skill sorted alphabetically case-insensitively. Keep sorting of a result
> collection (eligible-first, then title, then role ID) as a separate
> function from the per-role checks. Assume the input profile is already
> validated and normalized by `js/validation.js` — do not duplicate that
> logic here, and do not touch the DOM, forms, or rendering.

**Why eligibility logic was separated from validation and UI**

Validation answers "is this profile field usable at all?"; eligibility
answers "does this specific role's requirements match this profile?" —
a different question with a different input shape (it needs `ROLES`,
which validation never touches) and a different output shape
(`failureReasons` per role vs. a flat validation-error list). Keeping
`eligibility.js` free of DOM/form/rendering code also means Step 4 can
render its output however it wants (list, cards, table) without touching
this module, and this module can be unit-tested in complete isolation, as
done below.

**Evaluating all five rules independently**

`evaluateRoleEligibility` runs all five checks unconditionally — there is
no early return on the first failure. Each check pushes its own failure
code onto an array only if it fails, so a role that fails, say, branch,
CGPA, and two skills at once reports all four failure reasons in one
result, not just the first. This was verified directly (see below) with a
synthetic profile that fails every check against `CF05` simultaneously.

**Failure reason ordering**

The four scalar checks are evaluated and pushed in a fixed sequence
(branch → CGPA → graduation year → backlogs) so their relative order in
`failureReasons` is guaranteed by construction, not by a separate sort.
Missing skills are collected afterward, sorted case-insensitively by
skill name, and appended last as `MISSING_SKILL: <skill>` strings — so
the fixed four scalar reasons always precede any missing-skill reasons,
exactly as the problem statement specifies.

**Verification performed**

Ran a standalone Node script (not part of the shipped app) exercising
`js/eligibility.js` directly, covering every case in the Step 3
verification scope:

- Built-in profile: `CF01` and `CF02` eligible with empty
  `failureReasons`; `CF03` ineligible with exactly
  `["BRANCH_NOT_ALLOWED"]`; `CF04` ineligible with exactly
  `["CGPA_BELOW_MINIMUM"]`; `CF05` ineligible with exactly
  `["GRADUATION_YEAR_NOT_ALLOWED", "TOO_MANY_ACTIVE_BACKLOGS",
  "MISSING_SKILL: Docker"]`, in that order.
- A synthetic profile failing branch, CGPA, graduation year, backlogs,
  and two skills against `CF05` returns all six failure reasons, in the
  required order, with the two missing skills alphabetized
  (`MISSING_SKILL: Docker` before `MISSING_SKILL: Git`).
- CGPA exactly at a role's minimum passes; backlog count exactly at a
  role's maximum passes (both boundaries inclusive).
- Graduation-year membership checked against a multi-year allowed set
  (`CF02`: `2028` accepted, `2029` rejected).
- Branch comparison confirmed case-insensitive (`"cse"` matches `"CSE"`).
- Skill comparison confirmed case-insensitive (`"python"`/`"sql"` satisfy
  `Python`/`SQL`).
- A profile missing one of two required skills reports exactly that one
  `MISSING_SKILL` reason.
- Eligible results confirmed to carry an empty `failureReasons` array.
- Full built-in-profile ordering reproduces the problem statement's
  required sequence: `CF01, CF02, CF03, CF04, CF05`.
- The CGPA-8.5 acceptance scenario reproduces the required reordering
  exactly: eligible group `CF01, CF04, CF02` by title, 3 eligible / 2
  ineligible.
- A synthetic same-title tie between two roles resolves by role ID
  ascending.

All 22 checks passed. The final UI, counts display, and validation
messaging are **not** implemented or claimed to work at this checkpoint —
only the eligibility engine and its sorting.

**Issues found**

None. No changes were needed to the Step 1 data model or the Step 2
validation/normalization module to support this step.
