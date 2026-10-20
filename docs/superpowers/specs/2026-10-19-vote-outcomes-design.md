# Vote Tracker: motion outcomes, quorum calls, and session mode

Date: 2026-10-19. Owner: Dan Pittman (Faculty Senate Secretary, AY 2026-2027).

## Intent

The Vote Tracker makes the graphics that report Faculty Senate votes. Today it shows one thing: how many Senators voted against how many were signed in. The minutes and the Senate need the outcome of each motion: how the vote split and whether the motion passed.

The workflow has no live step. After a meeting, the Secretary takes the Microsoft Forms totals for each ballot, enters them, exports the graphics, and they are shown at the next Senate meeting and used in the minutes. The tool serves the person entering the numbers and the audience reading the graphic.

## The counting rule

Bylaws Art. II §1.2.11: the ballot offers Yes, No, or Present, and "the totality of the votes will be comprised of the Yes and No votes only." Present means the Senator votes neither for nor against. Abstention no longer exists as a ballot choice.

- Passage by majority: Yes > No, counted over Yes + No. A tie fails.
- Passage by two-thirds: Yes >= 2/3 of (Yes + No). The two-thirds cases in the governing documents include changing the order of business (Bylaws Art. II §5), holding a meeting electronically (Art. II §1), and initiating a Constitution amendment (Constitution Art. VI).
- Quorum: a majority of the Senate's members (Bylaws Art. II §3), established from the attendance sheet count (Art. II §1.2.4). With 108 voting members the threshold is 55; it is `floor(n/2) + 1`.

## Goals

1. **Motion outcome graphic.** Inputs: motion title, Yes, No, Present, threshold (majority or two-thirds). Output: Yes and No as percentages of Yes + No, Present shown with its count and set visibly apart from the decision, and a clear PASSED or FAILED. Optionally, the number of eligible voters, so the graphic can also state ballots cast as a share of eligible voters.
2. **Quorum call graphic.** Inputs: voting members (roster size), Senators signed in. The quorum threshold is computed from the roster size, with a manual override. Output: signed in against the threshold, and MET or NOT MET. A failed quorum produces a graphic, never an error.
3. **Optional session mode.** One page can hold one motion or a whole meeting: meeting title and date, the quorum call entered once, and any number of motions added in order. Each motion exports on its own, and the session also exports one combined summary for the minutes. A single permalink reopens the whole session. Using the tool for a single motion stays as simple as it is today.
4. **Share links fixed.** The title is encoded once, not twice.
5. **Works offline, as the README says.** Chart.js and html2canvas are bundled into the repo at pinned versions and loaded locally, and the README describes what the page actually does.

## Non-goals

- Anything real-time or live during the meeting.
- Pulling results from Microsoft Forms automatically. Totals are typed in.
- Roster management, sign-in, or storing data anywhere but the URL and the exported image.
- A build step, framework, or server. It stays static files on GitHub Pages from `main`.

## Anti-goals (a failure even if it works)

- A graphic whose PASSED or FAILED disagrees with §1.2.11, for example by counting Present in the denominator.
- Breaking links already shared or pasted into past minutes (`?title=&attendance=&quorum=&votes=`). Those must still open and render as they do now.
- Pass or fail carried by color alone. The words PASSED and FAILED, and MET and NOT MET, appear in the graphic and in its alt text.
- Using "Present" for attendance. A past change renamed the attendance label to "In Attendance" for exactly this reason. In this tool, "Present" means only the ballot choice.

## Constraints

- The live site is GitHub Pages from the root of `main`. Work happens on a branch and lands through one pull request.
- Mobile-first layout that also prints and exports cleanly at desktop width, matching the existing look.
- Exported images carry generated alt text, as the current export does.

## Decided by Dan (2026-10-19 and 2026-10-20)

- Build all of goals 1 to 5.
- Session mode is optional: one motion or many.
- Fix the code rather than the README for the offline claim.
- No real-time requirement; graphics are made after the meeting.
- **The tool's original job is preserved in every mode.** For every vote, in single-motion and session mode alike, the Secretary can export that vote's own graphic as a PNG with the visualization in it and copy its generated alt text, so it can be pasted into the PowerPoint for the next meeting. The quorum call graphic exports the same way. New modes add to this; none replaces it. The plan carries a regression check for it, and the verify exercises it end to end (export the PNG, copy the alt text, confirm both match the numbers entered).
- **Quorum and the vote are separate checks.** Quorum is presence, established by the sign-in count (Bylaws Art. II §3, §1.2.4); passage is Yes against No (§1.2.11).
  - When the session's quorum call is NOT MET, every motion in that session shows NO QUORUM instead of PASSED or FAILED, in the graphic, the summary and the alt text.
  - When quorum was met but fewer ballots came back than the quorum number, the motion still shows PASSED or FAILED on Yes against No, with participation stated beside it. Ballots cast are never compared with the quorum number to decide validity.
  - A single-motion graphic has an optional quorum line (signed in, threshold, MET or NOT MET); when it is filled in and NOT MET, that motion shows NO QUORUM too.
- **Old single-vote links** keep rendering the existing participation view (ballots received against attendance, with its quorum marker), so graphics in past minutes still reproduce.

## Participation and eligible voters (settled)

Convention adopted by Dan for the Senate record (2026-09-09): participation is measured against eligible voters, where **eligible voters = Senators signed in minus Senators who could not cast a ballot**. A ballot cast is any returned ballot, so **ballots cast = Yes + No + Present**. This reproduces the published 9/2 figures: Final Grade Availability 69 + 7 + 9 = 85 ballots of 93 eligible is 91.4 percent; Graduate Academic Recovery 72 + 0 + 11 = 83 of 93 is 89.2 percent. Present counts toward participation but never toward the pass or fail decision.

In session mode, eligible voters defaults to the session's signed-in count, and each motion can override it (a Senator who leaves mid-meeting, or one who could not vote on that item). In single-motion mode it is an optional field; without it, the participation line is omitted.

## Calls made by the planner (Dan may overrule)

- **Session summary format.** Two exports: one summary image for showing at the next meeting (quorum call plus one row per motion with Yes, No, Present, percentages and PASSED or FAILED, with generated alt text), and a "copy as text" table for pasting into the minutes. A long meeting stays readable because the summary is a compact table, not stacked charts. Each motion still exports its own full graphic.
- **Inconsistent counts warn, never block.** If Yes + No + Present exceeds eligible voters, or signed in exceeds the roster size, the form shows a visible warning naming the mismatch, and the graphic still renders. Forms totals can legitimately exceed sign-ins (someone votes without signing in), and the Secretary needs a graphic for a real but messy ballot. Only impossible input blocks: negative numbers, or no title.

## Left to the builder

- Layout and chart type for each graphic, within the existing visual style.
- The permalink format for sessions, as long as one link carries the whole session and the old single-vote links still work.
- How to tell an old double-encoded title from a new one when reading links.
- Whether the existing participation view stays as its own mode or becomes part of the motion graphic, as long as old links render as they do now.
- Keeping the vote arithmetic in a small separate script so it can be tested on its own, and the test for it.
