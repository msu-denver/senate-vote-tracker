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
