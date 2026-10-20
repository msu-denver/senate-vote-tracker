const test = require('node:test');
const assert = require('node:assert/strict');
const Tally = require('../tally.js');

test('quorum threshold is a majority of members', () => {
    assert.equal(Tally.quorumThreshold(108), 55);
    assert.equal(Tally.quorumThreshold(109), 55);
    assert.equal(Tally.quorumThreshold(110), 56);
});

test('quorum call meets or misses the threshold', () => {
    assert.equal(Tally.quorumCall({ members: 108, signedIn: 96 }).met, true);
    assert.equal(Tally.quorumCall({ members: 108, signedIn: 48 }).met, false);
    assert.equal(Tally.quorumCall({ members: 108, signedIn: 60, threshold: 70 }).met, false);
});

test('published 9/2 figures reproduce', () => {
    const a = Tally.motionOutcome({ yes: 69, no: 7, present: 9, rule: 'majority', eligible: 93 });
    assert.equal(a.status, 'PASSED');
    assert.equal(Tally.fmtPct(a.yesPct), '90.8');
    assert.equal(Tally.fmtPct(a.noPct), '9.2');
    assert.equal(Tally.fmtPct(a.participationPct), '91.4');
    const b = Tally.motionOutcome({ yes: 72, no: 0, present: 11, rule: 'majority', eligible: 93 });
    assert.equal(Tally.fmtPct(b.participationPct), '89.2');
});

test('all ballots Present fails under both rules with 0.0 percentages', () => {
    ['majority', 'two-thirds'].forEach((rule) => {
        const o = Tally.motionOutcome({ yes: 0, no: 0, present: 12, rule });
        assert.equal(o.status, 'FAILED');
        assert.equal(Tally.fmtPct(o.yesPct), '0.0');
        assert.equal(Tally.fmtPct(o.noPct), '0.0');
    });
});

test('threshold edges', () => {
    assert.equal(Tally.motionOutcome({ yes: 10, no: 10, present: 0, rule: 'majority' }).status, 'FAILED');
    assert.equal(Tally.motionOutcome({ yes: 11, no: 10, present: 0, rule: 'majority' }).status, 'PASSED');
    assert.equal(Tally.motionOutcome({ yes: 20, no: 10, present: 0, rule: 'two-thirds' }).status, 'PASSED');
    assert.equal(Tally.motionOutcome({ yes: 19, no: 10, present: 0, rule: 'two-thirds' }).status, 'FAILED');
});

test('quorum status overrides the vote only when quorum failed', () => {
    const base = { yes: 5, no: 1, present: 0, rule: 'majority' };
    assert.equal(Tally.motionOutcome({ ...base, quorumMet: false }).status, 'NO QUORUM');
    assert.equal(Tally.motionOutcome({ ...base, quorumMet: true }).status, 'PASSED');
    assert.equal(Tally.motionOutcome({ ...base, quorumMet: null }).status, 'PASSED');
    assert.equal(Tally.motionOutcome(base).status, 'PASSED');
});

test('participation is null without eligible voters', () => {
    assert.equal(Tally.motionOutcome({ yes: 1, no: 0, present: 0, rule: 'majority' }).participationPct, null);
});

test('checkCounts warns on mismatches and errors on impossible input', () => {
    const w = Tally.checkCounts({ yes: 50, no: 40, present: 10, eligible: 93 });
    assert.equal(w.errors.length, 0);
    assert.equal(w.warnings.length, 1);
    assert.ok(Tally.checkCounts({ yes: -1, no: 0, present: 0 }).errors.length > 0);
    assert.ok(Tally.checkCounts({ yes: 1.5, no: 0, present: 0 }).errors.length > 0);
    assert.ok(Tally.checkCounts({ yes: NaN, no: 0, present: 0 }).errors.length > 0);
    assert.equal(Tally.checkCounts({ yes: 1, no: 0, present: 0, members: 10, signedIn: 12 }).warnings.length, 1);
});

test('titles survive session round trips and share-link decoding', () => {
    ['Q&A: 50% rule', "Café d'Été"].forEach((title) => {
        const s = { v: 1, title, date: '2026-10-28', motions: [{ title, yes: 1, no: 2, present: 3, rule: 'majority' }] };
        const r = Tally.decodeSession(Tally.encodeSession(s));
        assert.equal(r.error, null);
        assert.deepEqual(r.session, s);
    });
    assert.equal(Tally.readTitle('Final%20Grade'), 'Final Grade');
    assert.equal(Tally.readTitle('Final Grade'), 'Final Grade');
    assert.equal(Tally.readTitle(null), '');
    assert.equal(Tally.readTitle('100% sure'), '100% sure');
});

test('alt text has no NaN, undefined or null when optional fields are blank', () => {
    const o = Tally.motionOutcome({ yes: 5, no: 1, present: 0, rule: 'majority' });
    const t = Tally.motionAltText('X', o);
    assert.match(t, /PASSED/);
    assert.doesNotMatch(t, /NaN|undefined|null/);
});

test('motion alt text states quorum when given', () => {
    const q = Tally.quorumCall({ members: 108, signedIn: 48 });
    const o = Tally.motionOutcome({ yes: 5, no: 1, present: 0, rule: 'majority', quorumMet: q.met });
    const t = Tally.motionAltText('X', o, q);
    assert.match(t, /NO QUORUM/);
    assert.match(t, /NOT MET/);
});

test('quorum alt text names the status word', () => {
    assert.match(Tally.quorumAltText('Roll', Tally.quorumCall({ members: 108, signedIn: 96 })), /MET/);
    assert.match(Tally.quorumAltText('Roll', Tally.quorumCall({ members: 108, signedIn: 40 })), /NOT MET/);
});

test('malformed session links yield an error and an empty session', () => {
    ['garbage', '', '%%%', Tally.encodeSession({ title: 'x' }).slice(0, 5)].forEach((s) => {
        const r = Tally.decodeSession(s);
        assert.ok(r.error && r.error.length > 0, s);
        assert.deepEqual(r.session.motions, []);
    });
});

test('session summary text is a tab-separated table', () => {
    const session = {
        v: 1, title: 'Oct', date: '2026-10-28', members: 108, signedIn: 96,
        motions: [
            { title: 'A', yes: 60, no: 20, present: 5, rule: 'majority' },
            { title: 'B', yes: 30, no: 20, present: 0, rule: 'two-thirds' }
        ]
    };
    const lines = Tally.sessionSummaryText(session).split('\n');
    assert.equal(lines.length, 4);
    const cols = lines[0].split('\t').length;
    lines.forEach((l) => assert.equal(l.split('\t').length, cols));
    assert.match(lines[2], /PASSED/);
    assert.match(lines[3], /FAILED/);
});

test('session summary shows NO QUORUM for every motion when quorum is not met', () => {
    const session = {
        v: 1, title: 'Oct', date: '', members: 108, signedIn: 40,
        motions: [{ title: 'A', yes: 9, no: 1, present: 0, rule: 'majority' }]
    };
    const lines = Tally.sessionSummaryText(session).split('\n');
    assert.match(lines[1], /NOT MET/);
    assert.match(lines[2], /NO QUORUM/);
});

test('classic alt text is unchanged for existing inputs', () => {
    assert.equal(
        Tally.classicAltText({ title: 'T', attendance: 96, quorum: 55, votes: 85 }),
        'Faculty Senate Vote Tracker visualization for "T". Total attendance: 96 members. Quorum requirement: 55 votes. Votes received: 85 (88.5% participation rate). Quorum status: Met - voting threshold achieved. The dashboard displays three metric cards: Attendance (blue), Quorum (yellow), and Votes (green). A progress bar shows 88.5% completion with a yellow quorum marker at 55 votes. A donut chart visualizes 85 voted versus 11 not voted.'
    );
    assert.equal(
        Tally.classicAltText({ title: 'Low', attendance: 96, quorum: 55, votes: 30 }),
        'Faculty Senate Vote Tracker visualization for "Low". Total attendance: 96 members. Quorum requirement: 55 votes. Votes received: 30 (31.3% participation rate). Quorum status: Not met - 25 more votes needed. The dashboard displays three metric cards: Attendance (blue), Quorum (yellow), and Votes (red). A progress bar shows 31.3% completion with a yellow quorum marker at 55 votes. A donut chart visualizes 30 voted versus 66 not voted.'
    );
});

test('session summary omits the quorum row when no quorum call is given', () => {
    const session = { v: 1, title: 'Oct', date: '', motions: [{ title: 'A', yes: 3, no: 1, present: 0, rule: 'majority' }] };
    assert.equal(Tally.sessionSummaryText(session).split('\n').length, 2);
});

test('session alt text names every status word and has no NaN or undefined', () => {
    const session = {
        v: 1, title: 'Oct', date: '2026-10-28', members: 108, signedIn: 96,
        motions: [
            { title: 'A', yes: 60, no: 20, present: 5, rule: 'majority' },
            { title: 'B', yes: 0, no: 0, present: 4, rule: 'two-thirds' }
        ]
    };
    const t = Tally.sessionAltText(session);
    assert.match(t, /October 28, 2026/);
    assert.match(t, /MET/);
    assert.match(t, /PASSED/);
    assert.match(t, /FAILED/);
    assert.doesNotMatch(t, /NaN|undefined|null/);
});

test('fmtDate is time-zone independent and tolerates bad input', () => {
    assert.equal(Tally.fmtDate('2026-10-28'), 'October 28, 2026');
    assert.equal(Tally.fmtDate(''), '');
    assert.equal(Tally.fmtDate('soon'), 'soon');
});

test('session links with wrong field types are rejected', () => {
    const bad = { v: 1, title: 'x', members: 'many', motions: [] };
    assert.ok(Tally.decodeSession(Tally.encodeSession(bad)).error);
    const bad2 = { v: 1, title: 'x', motions: [{ title: 'm', yes: 1, no: 1, present: 0, rule: 'majority', eligible: -3 }] };
    assert.ok(Tally.decodeSession(Tally.encodeSession(bad2)).error);
});

test('summary text cells cannot break columns or evaluate as formulas', () => {
    const session = {
        v: 1, title: 'Oct', date: '', motions: [
            { title: '=HYPERLINK("x")', yes: 1, no: 0, present: 0, rule: 'majority' },
            { title: 'A\tB\nC', yes: 1, no: 0, present: 0, rule: 'majority' },
            { title: '@SUM(1)', yes: 1, no: 0, present: 0, rule: 'majority' }
        ]
    };
    const lines = Tally.sessionSummaryText(session).split('\n');
    assert.equal(lines.length, 4);
    assert.ok(lines[1].split('\t')[0].startsWith("'="));
    assert.equal(lines[2].split('\t')[0], 'A B C');
    assert.ok(lines[3].split('\t')[0].startsWith("'@"));
    const cols = lines[0].split('\t').length;
    lines.forEach((l) => assert.equal(l.split('\t').length, cols));
});

test('an auto-filled threshold is not saved and keeps tracking the roster after a round trip', () => {
    assert.equal(Tally.thresholdOverride(108, 55), undefined);
    assert.equal(Tally.thresholdOverride(108, null), undefined);
    const session = { v: 1, title: 'Oct', date: '', members: 108, signedIn: 55,
        motions: [{ title: 'A', yes: 40, no: 5, present: 2, rule: 'majority' }] };
    const override = Tally.thresholdOverride(session.members, 55);
    if (override !== undefined) session.threshold = override;
    const reopened = Tally.decodeSession(Tally.encodeSession(session)).session;
    assert.equal(reopened.threshold, undefined);
    reopened.members = 110;
    const q = Tally.sessionQuorum(reopened);
    assert.equal(q.threshold, 56);
    assert.equal(q.met, false);
    assert.equal(Tally.sessionOutcomes(reopened)[0].status, 'NO QUORUM');
    assert.equal(Tally.effectiveThreshold(110, undefined), 56);
});

test('an explicit threshold override survives a round trip', () => {
    assert.equal(Tally.thresholdOverride(108, 60), 60);
    const session = { v: 1, title: 'Oct', date: '', members: 108, signedIn: 58, threshold: Tally.thresholdOverride(108, 60),
        motions: [] };
    const reopened = Tally.decodeSession(Tally.encodeSession(session)).session;
    assert.equal(reopened.threshold, 60);
    reopened.members = 110;
    assert.equal(Tally.sessionQuorum(reopened).threshold, 60);
    assert.equal(Tally.effectiveThreshold(110, 60), 60);
});

test('quorum wording names an overridden threshold instead of claiming a majority', () => {
    const plain = Tally.quorumCall({ members: 108, signedIn: 60 });
    assert.equal(Tally.quorumBasis(plain), 'Quorum is a majority of voting members');
    const set = Tally.quorumCall({ members: 108, signedIn: 60, threshold: 70 });
    const basis = Tally.quorumBasis(set);
    assert.doesNotMatch(basis, /Quorum is a majority/);
    assert.match(basis, /70/);
    assert.match(basis, /55/);
    const alt = Tally.quorumAltText('Roll', set);
    assert.doesNotMatch(alt, /Quorum is a majority/);
    assert.match(alt, /70/);
    assert.match(alt, /55/);
});

test('summary text cells neutralize leading quotes, whitespace and line separators', () => {
    const session = {
        v: 1, title: 'Oct', date: '', motions: [
            { title: '"=1+1"', yes: 1, no: 0, present: 0, rule: 'majority' },
            { title: '"Sense of the Senate', yes: 1, no: 0, present: 0, rule: 'majority' },
            { title: '  =SUM(1)', yes: 1, no: 0, present: 0, rule: 'majority' },
            { title: 'One\u2028Two\u2029Three\u0085Four\u000bFive\u007f', yes: 1, no: 0, present: 0, rule: 'majority' }
        ]
    };
    const text = Tally.sessionSummaryText(session);
    const lines = text.split('\n');
    assert.equal(lines.length, 5);
    const cols = lines[0].split('\t').length;
    lines.forEach((l) => assert.equal(l.split('\t').length, cols));
    assert.ok(lines[1].split('\t')[0].startsWith("'"));
    assert.ok(lines[2].split('\t')[0].startsWith("'"));
    assert.ok(lines[3].split('\t')[0].startsWith("'"));
    assert.equal(lines[4].split('\t')[0], 'One Two Three Four Five ');
    assert.doesNotMatch(text, /[\u0000-\u0008\u000b-\u001f\u007f\u0085\u2028\u2029]/);
});
