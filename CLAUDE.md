# Vote Tracker

Static site served by GitHub Pages from the root of `main`. No build step, no framework, no npm dependencies.

- Run the unit tests with `node --test` (Node 22 does not accept the `tests/` directory as an argument; `node --test tests/*.test.js` also works).
- Serve locally with `./serve.sh` (port 8000).
- Vote arithmetic, alt text and link encoding live in `tally.js` and must stay free of DOM access. Interface code lives in `app.js`.
- Counting rule: Yes and No only decide the outcome (Bylaws Art. II 1.2.11). "Present" means only the ballot choice.
- Every graphic needs an Export PNG and a Copy Alt Text button, and old `?title=&attendance=&quorum=&votes=` links must keep rendering the classic view.
- Libraries under `vendor/` are pinned downloads; see `vendor/README.md` for versions and checksums.
- Never push to `main`. Work on a branch and open one pull request.
- How to test a change in the browser: `docs/how-to-test.md`.
