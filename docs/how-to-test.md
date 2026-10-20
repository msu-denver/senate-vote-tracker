# How to test a change

## Unit tests

```bash
node --test
```

All tests must pass. They cover the counting rule, thresholds, alt text, link encoding and session summary.

## Serve the page

```bash
./serve.sh
```

Open http://localhost:8000. No sign-in exists; the page keeps no data outside the URL.

## Sample links

Each link should render a graphic with no console errors.

| Mode | Link | Expect |
|---|---|---|
| Classic, old double-encoded title | http://localhost:8000/?title=Final%2520Grade&attendance=96&quorum=55&votes=85 | Title "Final Grade", 88.5% participation |
| Motion, 9/2 figures | http://localhost:8000/?mode=motion&title=Final+Grade+Availability&yes=69&no=7&present=9&rule=majority&eligible=93 | PASSED, Yes 90.8%, No 9.2%, ballots cast 85 of 93 (91.4%) |
| Motion, no quorum | http://localhost:8000/?mode=motion&title=Order+of+Business&yes=69&no=7&present=9&rule=majority&members=108&signedin=48 | NO QUORUM, quorum line NOT MET |
| Motion, all Present | http://localhost:8000/?mode=motion&title=All+Present&yes=0&no=0&present=12&rule=two-thirds | FAILED, 0.0% for Yes and No, no NaN |
| Quorum, met | http://localhost:8000/?mode=quorum&title=Roll+Call&members=108&signedin=96&threshold=55 | MET |
| Quorum, not met | http://localhost:8000/?mode=quorum&title=Roll+Call&members=108&signedin=48&threshold=55 | NOT MET |
| Damaged session | http://localhost:8000/?s=garbage | Readable error, one empty motion row, no results |

For a session, choose "Meeting session", enter a title, a date, 108 members and 96 signed in, add several motions, and press Update Session. Use Copy Link on the summary and open it in a new tab: the same session reloads.

## Export and alt-text check

For every graphic in every mode (classic, motion, quorum, each motion in a session, the session summary):

1. Press Export PNG. A PNG downloads and shows the same numbers as the screen.
2. Paste from the clipboard into a text editor. It holds the alt text, which names the title, every count, the percentages, the rule and the status word.
3. Press Copy Alt Text on its own and confirm the same text.

## Phone width and keyboard

- Resize the window to about 390 px wide. Nothing scrolls sideways, buttons are full width and tables fit.
- Check desktop width too.
- Tab through a mode using only the keyboard: the mode selector responds to the arrow keys, every field and button takes focus in reading order, and Enter activates the buttons.
- Check the browser console for errors.
- Optional accessibility audit: `npx lighthouse <url> --only-categories=accessibility`. The pages score 100 today.

## Clipboard in automated browsers

Automated browsers often deny clipboard access. Stub it before pressing buttons:

```js
window.__clip = [];
navigator.clipboard.writeText = async t => { window.__clip.push(t); };
```
