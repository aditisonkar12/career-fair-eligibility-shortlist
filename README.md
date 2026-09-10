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
