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

### Step 4 — UI + Result Rendering

**What was implemented**

- `index.html` rewritten as the real primary screen: a header, a Student
  Profile form (Branch, CGPA, Graduation Year, Active Backlogs, Skills,
  plus Evaluate/Load Sample/Reset buttons), a validation-message region,
  a Fixed Role Requirements section (empty container, populated from
  `ROLES` at runtime), and a Results section with an eligible/ineligible
  summary and a results list. The Step 1–3 temporary debug `<pre>` was
  removed now that real rendering exists.
- `js/app.js` rewritten as the coordination layer: reads DOM elements,
  wires the three actions, converts form input to a candidate profile,
  and renders whatever `validation.js`/`eligibility.js` return. It
  contains no validation or eligibility rules of its own.
- `css/styles.css` rewritten with card-based sections, a responsive
  two-column form grid, role-requirement cards, color-coded
  eligible/ineligible result cards and status badges, and a mobile
  breakpoint — plain CSS, no framework.
- No routing, ranking, tracking, backend, or optional features beyond the
  role-card-style results view were added.

**Prompt used for this iteration**

> Build the primary screen for the Career Fair Eligibility Shortlist
> (Step 4 of 5) and wire it to the existing `data.js`, `validation.js`,
> and `eligibility.js` modules — do not duplicate their rules in
> `app.js`. One page: an editable profile form, the five fixed roles
> rendered from `ROLES` (not hardcoded), Evaluate/Load Sample/Reset
> actions, a validation-message area, and a results view with
> eligible/ineligible counts. Evaluate must convert numeric form values
> to real JavaScript numbers before calling `validateStudentProfile`; on
> invalid input, show the validation error codes verbatim and clear any
> previous results/counts instead of leaving them stale; on valid input,
> normalize, evaluate all five roles, sort with the existing
> `sortEligibilityResults`, and render that output unmodified — no
> re-sorting or filtering of failure reasons in the UI. Reproduce the
> built-in scenario (CF01/CF02 eligible; CF03/CF04/CF05 ineligible with
> their exact failure reasons) and the CGPA-8.5 boundary scenario
> exactly. Plain CSS only, compact and professional, no frameworks or
> icon libraries.

**How the UI connects to validation.js and eligibility.js**

`app.js` imports `validateStudentProfile` / `normalizeStudentProfile`
from `validation.js` and `evaluateEligibilityForRoles` /
`sortEligibilityResults` from `eligibility.js`. `handleEvaluate` calls
them in sequence — validate, then (only if valid) normalize, evaluate,
sort — and hands the *unmodified* return values to the render functions.
`renderResults` iterates `result.failureReasons` and prints each string
as-is; it never reorders, filters, or regenerates a reason. The Fixed
Role Requirements section is built once from the imported `ROLES` array
via `renderRoleRequirements`, so role data is never duplicated as
hardcoded HTML.

**How Evaluate works**

On submit: read the five raw form values; convert `cgpa`,
`graduationYear`, and `activeBacklogs` from strings to numbers with a
small `toNumericValue` helper (blank or non-numeric input becomes `NaN`,
which `validateStudentProfile` correctly rejects) while leaving `branch`
and `skills` as raw strings for `validation.js`/`normalizeSkills` to
handle; call `validateStudentProfile`. If invalid, render every returned
error code and clear results/counts. If valid, normalize, evaluate all
five roles, sort, and render both the results list and the counts.

**How Load Sample and Reset work**

`Load Sample` re-fills the form with `createInitialStudentProfile()` and
clears any validation message and previous results/counts back to the
placeholder state, so the visible profile always matches what will be
evaluated next. `Reset` does the same and additionally re-renders the
Fixed Role Requirements from `ROLES` (a no-op today since roles never
change, but included to literally satisfy "restore the fixed role
list/state"). Neither action runs Evaluate automatically — the user
clicks Evaluate to see results for whatever profile is currently loaded.
This was a judgment call (flagged below) since the problem statement's
"load the built-in profile in one action" is ambiguous about whether
loading also evaluates.

**How results and counts are rendered**

`renderResults` builds one card per `EligibilityResult` in the exact
array order it receives (already sorted by `sortEligibilityResults`):
role ID + title, an ELIGIBLE/INELIGIBLE badge, and — only for ineligible
roles — a `<ul>` of `failureReasons` in their original order. `renderCounts`
derives both counts by filtering the same sorted results array by
`status`, so the displayed counts can never disagree with the visible
list.

**How invalid profiles clear stale results**

`handleEvaluate` branches on `validation.isValid` before doing anything
eligibility-related: on the invalid path it never calls
`normalizeStudentProfile` or the eligibility engine, and immediately
calls `clearResultsAndCounts()`, which replaces the results list with the
placeholder message and resets both count displays to a `–` placeholder
(distinct from an actual `0`, since zero eligible roles is a valid result
and must not look like "no evaluation happened").

**Verification performed**

Real interactive browser automation was not available in this
environment for this step (no browser-automation tooling and no new
dependencies were to be installed), so the following was verified
instead, without fabricating browser-level claims:

- Served the app with `python3 -m http.server` and confirmed
  `index.html`, `css/styles.css`, and all four `js/*.js` files return
  HTTP 200.
- Cross-referenced every `document.getElementById(...)` call in
  `app.js` against the `id` attributes in `index.html` — all resolve;
  no missing element would cause a runtime `null` error.
- Wrote a Node script that reproduces `handleEvaluate`'s exact algorithm
  (the same numeric-coercion helper, then the real
  `validateStudentProfile` → `normalizeStudentProfile` →
  `evaluateEligibilityForRoles` → `sortEligibilityResults` calls) against
  form-field values supplied as strings, the way real `<input>` elements
  return them. All 13 checks passed: the built-in scenario (2
  eligible / 3 ineligible, CF03/CF04/CF05's exact failure reasons), the
  CGPA-8.5 scenario (3 eligible / 2 ineligible, eligible order CF01,
  CF04, CF02), the CGPA-10.5 invalid case (exactly `INVALID_CGPA`, no
  results object produced), and a blank numeric field
  (`INVALID_BACKLOG_COUNT`).
- Manually re-read `app.js`'s render functions and confirmed by
  inspection that they only display values from `EligibilityResult`
  objects and validation error codes verbatim, with no re-sorting or
  rewording.

**Not verified**: actual on-screen rendering, button click behavior, and
absence of browser console errors — that requires opening `index.html` in
a real browser, which I did not do. **Recommend the user open the app in
a browser (e.g. via `python3 -m http.server` from the project folder) and
click through the Evaluate / Load Sample / Reset / invalid-CGPA scenarios
before treating Step 4 as fully verified.**

**Issues found**

None in the domain modules. `js/app.js` was updated to reference
`eligibility.js`'s `ELIGIBILITY_STATUS` constant instead of the string
literals `"ELIGIBLE"`/`"INELIGIBLE"`, purely to avoid duplicating those
identifiers by hand.

### Step 5 — Testing + Final Verification

**Automated/static checks performed**

- `node --check` on all four JS modules (`data.js`, `validation.js`,
  `eligibility.js`, `app.js`) — no syntax errors.
- Cross-referenced every `document.getElementById(...)` call in `app.js`
  against the `id` attributes in `index.html` — all resolve; no dangling
  DOM references.
- Cross-referenced every CSS class name `app.js` applies at runtime
  against the class selectors defined in `styles.css` — all used classes
  are styled, no orphaned selectors.
- Cross-referenced every named import in `app.js` against the actual
  `export` statements in `data.js`, `validation.js`, and `eligibility.js`
  — all imports resolve to real exports.
- Verified `BUILT_IN_STUDENT_PROFILE` and all five `ROLES` entries in
  `data.js` field-for-field against the problem statement's tables — no
  drift since Step 1.
- Confirmed `index.html` has balanced tags and no duplicate `id`
  attributes.
- Added a permanent, committed automated test suite under `tests/`
  (`validation.test.mjs`, `eligibility.test.mjs`,
  `evaluate-pipeline.test.mjs`), run with Node's built-in test runner
  (`node --test`, exposed as `npm test` via a new minimal `package.json`
  with **zero dependencies**). This formalizes the ad-hoc checks used to
  verify Steps 2–4 into a suite anyone can re-run. **26/26 tests pass**,
  covering:
  - the built-in profile's exact result (CF01/CF02 eligible; CF03 only
    `BRANCH_NOT_ALLOWED`; CF04 only `CGPA_BELOW_MINIMUM`; CF05 exactly
    `GRADUATION_YEAR_NOT_ALLOWED`, `TOO_MANY_ACTIVE_BACKLOGS`,
    `MISSING_SKILL: Docker` in order);
  - the CGPA-8.5 boundary scenario (eligible order `CF01, CF04, CF02`);
  - CGPA/graduation-year/backlog boundaries (0, 10, 2000, 2100, 0);
  - independent evaluation of all five checks with every simultaneous
    failure collected, in the required order;
  - case-insensitive branch and skill comparisons, with no alias
    inference;
  - skill normalization (split/trim/dedupe) exactly matching the
    problem statement's example;
  - result ordering, including a synthetic same-title tie-break by role
    ID;
  - the invalid-CGPA (`10.5`) and blank-field cases, confirmed to never
    reach the eligibility engine;
  - the additional manually-reported scenario (CSE, CGPA 8.5, 2027, 1
    backlog, Python + Git → only CF02 and CF04 eligible).

**Manual browser testing**

Performed by the user directly in a browser (not by me — no browser
automation was set up or attempted per instructions for this step):
boundary values, the CGPA-8.5/Python+Git scenario (CF02 and CF04 only),
the CF05 multi-failure scenario, multiple simultaneous failure reasons,
case-insensitive skill normalization, and blank/invalid fields combined
with Reset. All six were reported as passing.

**Issues discovered and fixed**

None. Every check above — data fidelity, module wiring, DOM/CSS
consistency, and the full acceptance-criteria test suite — passed on the
first run against the existing Step 1–4 implementation. No changes were
made to `data.js`, `validation.js`, `eligibility.js`, `app.js`,
`index.html`, or `styles.css` in this step; the only additions are the
new `tests/` suite and a minimal `package.json` to run it.

**Final verification status**

All automated checks pass (26/26), all cross-module/DOM/CSS consistency
checks pass, the data model matches the problem statement exactly, and
the user's manual browser testing (6 scenarios) passed. The
implementation satisfies the problem statement's contracts, eligibility
rules, ordering rules, and UI requirements as verified. This is the
final step; no further steps are planned.

**Final acceptance-criteria refinement: Load Sample now auto-evaluates**

Step 4 had left one open question (flagged at the time): whether "Load
Sample" should immediately show the built-in result or merely populate
the form and wait for a separate Evaluate click. This was resolved in
favor of the problem statement's "load the built-in profile in one
action and show CF01 and CF02 as ELIGIBLE..." phrasing — clicking Load
Sample now fills the form **and** immediately evaluates it, so the
built-in result is visible without an extra click.

Implementation: `js/app.js`'s Evaluate logic was extracted into a single
`evaluateCurrentForm()` function (reads the form, validates, and on
success normalizes/evaluates/sorts/renders); `handleEvaluate` and
`handleLoadSample` both call it, so Load Sample reuses the exact same
pipeline instead of a second implementation. `handleReset` was left
untouched and still does not auto-evaluate, matching the explicit
requirement that Reset return to a clean, unevaluated initial state.

A regression test, `loading the built-in sample runs the same pipeline
as evaluating it directly`, was added to `tests/evaluate-pipeline.test.mjs`
asserting the Load-Sample-simulated result is `deepEqual` to evaluating
the same profile directly through `eligibility.js`, and that it produces
`CF01`/`CF02` as the eligible set. **Full suite: 27/27 passing** (26
previous + 1 new). No other files were changed for this refinement.
