# Vote Outcomes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add motion outcome graphics, quorum call graphics and an optional session mode to the Vote Tracker, while every vote still exports its own PNG with copyable alt text.

**Architecture:** Static files on GitHub Pages, no build step. Vote arithmetic, alt text and link encoding move into `tally.js`, a dependency-free script that the page loads as `window.Tally` and Node's test runner loads with `require`. UI code moves from the inline `<script>` into `app.js`. Chart.js and html2canvas are vendored under `vendor/`.

**Tech Stack:** HTML, CSS, plain JavaScript (ES2020, no modules), Chart.js 4.5.1, html2canvas 1.4.1, Node 22 `node:test` for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-19-vote-outcomes-design.md`

## Global Constraints

- Branch `feature/vote-outcomes` off `main`. Never push to `main`; Pages deploys from it.
- No build step, no framework, no npm dependencies. `node --test tests/` is the only tooling.
- Counting rule (Bylaws Art. II §1.2.11): the decision counts Yes and No only. Majority passes when `yes > no`. Two-thirds passes when `3 * yes >= 2 * (yes + no)`. Either rule fails when `yes + no === 0`.
- Quorum threshold is `Math.floor(members / 2) + 1` unless overridden.
- Status words are exactly `PASSED`, `FAILED`, `NO QUORUM`, `MET`, `NOT MET`, and they appear as text in the graphic and the alt text, never as color alone.
- "Present" means only the ballot choice. Attendance is labeled "Signed In" or "In Attendance".
- Participation: `ballotsCast = yes + no + present`; `participation = ballotsCast / eligible`. 9/2 check values: 69/7/9 of 93 gives 91.4; 72/0/11 of 93 gives 89.2.
- Inconsistent counts warn and still render. Only a missing title or a negative or non-integer count blocks.
- Every graphic (classic, motion, quorum, each motion in a session, the session summary) has an Export PNG button and a Copy Alt Text button. Export also copies the alt text, as today.
- Old links `?title=&attendance=&quorum=&votes=` render the classic participation view exactly as today.
- Percentages display with one decimal place.
- Comments state constraints, not history (no dates, ticket ids or narration in code).

## Review Focus

1. All ballots Present (`yes = no = 0`): FAILED under both rules, percentages show 0.0, never NaN or PASSED. Test in Task 2.
2. Threshold edges: majority tie 10/10 FAILED; two-thirds 20/10 PASSED, 19/10 FAILED. Test in Task 2.
3. Titles with `&`, `%`, apostrophes and accented letters survive a new share link, and an old double-encoded link (`title=Final%2520Grade`) still shows "Final Grade". Test in Task 2.
4. Optional fields left blank (eligible, quorum line): no participation or quorum line, and no "NaN" or "undefined" anywhere in the graphic or alt text. Test in Task 2; exercised in Task 4.
5. A malformed or truncated session link (`?s=garbage`) shows a readable error and an empty session, never a blank page or console exception. Test in Task 2; exercised in Task 5.

---

### Task 1: Vendor the libraries and move the script out of the page

**Files:**
- Create: `vendor/chart.umd.min.js` (Chart.js 4.5.1, from `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js`), `vendor/html2canvas.min.js` (from `https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js`), `vendor/README.md` (source URL, version, license line for each)
- Create: `app.js` (the current inline script, moved verbatim)
- Modify: `index.html:7-8` (local script tags), `index.html:474-782` (replace inline script with `<script src="tally.js"></script><script src="app.js"></script>`; `tally.js` may start as an empty file)

- [ ] **Step 1:** Download both libraries at those exact versions; confirm each file starts with its library banner and record its sha256 in `vendor/README.md`.
- [ ] **Step 2:** Move the inline script into `app.js` unchanged and point the page at local files.
- [ ] **Step 3:** Serve with `./serve.sh`, open `http://localhost:8000/?title=Final%2520Grade&attendance=96&quorum=55&votes=85` with network requests to `cdn.jsdelivr.net` blocked. Expected: the classic graphic renders, Export as Image downloads a PNG, no console errors.
- [ ] **Step 4:** Commit: `chore: vendor Chart.js 4.5.1 and html2canvas 1.4.1, move script to app.js`.

### Task 2: Vote arithmetic, alt text and link encoding in `tally.js`

**Files:**
- Create: `tally.js`, `tests/tally.test.js`

**Interfaces (Produces, all on `Tally`; the file ends with `if (typeof module !== 'undefined') module.exports = Tally; else window.Tally = Tally;`):**
- `quorumThreshold(members: number) -> number`
- `quorumCall({members, signedIn, threshold?}) -> {members, signedIn, threshold, met: boolean}`
- `motionOutcome({yes, no, present, rule: 'majority'|'two-thirds', eligible?: number, quorumMet?: boolean|null}) -> {yes, no, present, rule, decided, ballotsCast, yesPct, noPct, presentPct, participationPct: number|null, status: 'PASSED'|'FAILED'|'NO QUORUM'}` (`presentPct` is of ballotsCast; `status` is `NO QUORUM` only when `quorumMet === false`)
- `checkCounts({yes, no, present, eligible?, members?, signedIn?}) -> {errors: string[], warnings: string[]}`
- `fmtPct(n: number) -> string` (one decimal, `'0.0'` for 0 or non-finite)
- `motionAltText(title: string, outcome, quorum?: object|null) -> string`
- `quorumAltText(title: string, call) -> string`
- `classicAltText({title, attendance, quorum, votes}) -> string` (the current `generateAltText` text, made pure)
- `sessionSummaryText(session) -> string` (tab-separated table: header row, quorum row, one row per motion)
- `encodeSession(session) -> string` and `decodeSession(s: string) -> {session, error: string|null}` (base64url of JSON `{v: 1, ...}`; UTF-8 safe)
- `readTitle(raw: string|null) -> string` (decodes once more only when the value contains a `%XX` escape and `decodeURIComponent` succeeds; a new title that literally contains `%41`-style text is the accepted boundary)
- Session shape: `{v: 1, title: string, date: string, members?: number, signedIn?: number, threshold?: number, motions: [{title, yes, no, present, rule, eligible?}]}`

- [ ] **Step 1: Write the failing tests** in `tests/tally.test.js` with `node:test` and `node:assert/strict`:
  - `quorumThreshold(108) === 55`, `quorumThreshold(109) === 55`, `quorumThreshold(110) === 56`
  - `quorumCall({members: 108, signedIn: 96}).met === true`; `quorumCall({members: 108, signedIn: 48}).met === false`
  - 9/2 values: `motionOutcome({yes: 69, no: 7, present: 9, rule: 'majority', eligible: 93})` gives `status 'PASSED'`, `fmtPct(yesPct) === '90.8'`, `fmtPct(participationPct) === '91.4'`; the 72/0/11 case gives `'89.2'`
  - Review Focus 1: `{yes: 0, no: 0, present: 12}` is `FAILED` under both rules and `fmtPct(yesPct) === '0.0'`
  - Review Focus 2: majority 10/10 `FAILED`; two-thirds 20/10 `PASSED`, 19/10 `FAILED`
  - `quorumMet: false` gives `NO QUORUM`; `quorumMet: null` or omitted decides on votes
  - `checkCounts({yes: 50, no: 40, present: 10, eligible: 93})` warns, does not error; `{yes: -1, ...}` errors
  - Review Focus 3: `decodeSession(encodeSession(s))` round-trips titles `"Q&A: 50% rule"`, `"Café d'Été"`; `readTitle('Final%20Grade') === 'Final Grade'`; `readTitle('Final Grade') === 'Final Grade'`
  - Review Focus 4: `motionAltText('X', motionOutcome({yes: 5, no: 1, present: 0, rule: 'majority'}))` contains `PASSED` and does not match `/NaN|undefined|null/`
  - Review Focus 5: `decodeSession('garbage').error` is a non-empty string and `.session.motions` is `[]`
  - `sessionSummaryText` for a two-motion session has 4 lines (header, quorum, two motions), tab-separated
- [ ] **Step 2:** Run `node --test tests/`. Expected: FAIL, `Tally` functions undefined.
- [ ] **Step 3:** Implement each function in `tally.js` to the interfaces above. Alt text names the title, every count, the percentages, the rule, and the status word.
- [ ] **Step 4:** Run `node --test tests/`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat: add tally.js vote arithmetic, alt text and link encoding with tests`.

### Task 3: Classic view through `Tally`, share link fixed

**Files:**
- Modify: `app.js` (`generateAltText` calls `Tally.classicAltText`; `generateShareLink` sets the raw title; `loadFromUrlParams` uses `Tally.readTitle`)
- Test: `tests/tally.test.js` (add: `classicAltText({title: 'T', attendance: 96, quorum: 55, votes: 85})` equals the string the old `generateAltText` produced for the same inputs, pasted as a literal)

- [ ] **Step 1:** Add the classic alt-text equality test; run; expected FAIL.
- [ ] **Step 2:** Implement; run `node --test tests/`; expected PASS.
- [ ] **Step 3:** Exercise in the browser: an old link (`title=Final%2520Grade`) and a new link copied from the page both show "Final Grade"; the copied new link contains `title=Final+Grade` or `Final%20Grade`, never `%2520`.
- [ ] **Step 4:** Commit: `fix: encode share-link title once and keep old links working`.

### Task 4: Mode switch with motion outcome and quorum call graphics

**Files:**
- Modify: `index.html` (a mode selector with three choices: "Participation (classic)", "Motion outcome", "Quorum call"; one input panel and one graphic area per mode; classic markup unchanged), `app.js` (render functions per mode)

**Interfaces:**
- Consumes: `Tally.motionOutcome`, `Tally.quorumCall`, `Tally.checkCounts`, `Tally.motionAltText`, `Tally.quorumAltText`, `Tally.fmtPct`
- Produces: `renderMotion(container: HTMLElement, title: string, outcome, quorum|null)` and `renderQuorum(container: HTMLElement, title: string, call)` in `app.js`, each drawing one self-contained graphic element that `exportElement(el: HTMLElement, fileName: string, altText: string)` can capture; Task 5 reuses all three.
- Motion inputs: title, Yes, No, Present, rule (Majority / Two-thirds), optional eligible voters, optional quorum line (voting members, signed in). Quorum inputs: title, voting members, signed in, optional threshold override (prefilled from `quorumThreshold`).
- Motion link params: `mode=motion&title=&yes=&no=&present=&rule=&eligible=&members=&signedin=`; quorum: `mode=quorum&title=&members=&signedin=&threshold=`. No `mode` param means classic.

- [ ] **Step 1:** Build the selector and the two new panels and graphics. Warnings from `checkCounts` show above the graphic in the form area and are not part of the exported image.
- [ ] **Step 2:** Exercise each mode in the browser at about 390 px and at desktop width: enter the 9/2 numbers (69/7/9, eligible 93; members 108, signed in 96), confirm the graphic shows 90.8 / 9.2, PASSED, participation 91.4; Export PNG downloads and the clipboard holds matching alt text; Copy Alt Text works alone; the share link reopens the same graphic. Repeat with a failed quorum (signed in 48): the quorum graphic shows NOT MET and the motion shows NO QUORUM. Blank optional fields show no NaN.
- [ ] **Step 3:** Keyboard-only pass through each mode; run Lighthouse accessibility on the page; fix anything below 90.
- [ ] **Step 4:** Commit: `feat: add motion outcome and quorum call graphics`.

### Task 5: Optional session mode

**Files:**
- Modify: `index.html` (fourth mode choice "Meeting session"), `app.js` (session editor, per-motion graphics, summary)

**Interfaces:**
- Consumes: Task 4's `renderMotion`, `renderQuorum`, `exportElement`; `Tally.encodeSession`, `Tally.decodeSession`, `Tally.sessionSummaryText`
- Session link: `?s=<encodeSession(session)>`.

- [ ] **Step 1:** Session editor: meeting title and date, quorum call (members, signed in, threshold) entered once, an "Add motion" button that appends a motion row (title, Yes, No, Present, rule, eligible defaulting to signed in), and remove buttons. Each motion renders its own graphic with its own Export PNG and Copy Alt Text; a NOT MET quorum makes every motion NO QUORUM.
- [ ] **Step 2:** Summary: a compact table graphic (quorum row plus one row per motion) with Export PNG and Copy Alt Text, and a "Copy as text" button that copies `sessionSummaryText`.
- [ ] **Step 3:** Exercise: build the 10/28 shape (quorum plus five motions), export one motion's PNG and the summary PNG, copy the summary text into a text editor and confirm tabs; copy the session link, open it in a new tab, confirm everything reloads; open `?s=garbage` and confirm a readable error with an empty session. Check phone width.
- [ ] **Step 4:** Commit: `feat: add optional meeting session mode with summary export`.

### Task 6: Documentation

**Files:**
- Modify: `README.md` (modes, the counting rule with the Bylaws citation, link formats, vendored libraries; remove "zero dependencies" and keep "works offline" now that it is true)
- Create: `CLAUDE.md` (short: static Pages from `main`, no build step, run `node --test tests/`, serve with `./serve.sh`), `docs/how-to-test.md` (serve, the sample links for each mode including an old link, the export and alt-text check, phone-width check)

- [ ] **Step 1:** Write the three files.
- [ ] **Step 2:** Follow `docs/how-to-test.md` from a fresh checkout of the branch; every link in it renders.
- [ ] **Step 3:** Commit: `docs: describe modes, counting rule and how to test`.
