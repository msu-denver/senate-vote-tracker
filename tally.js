// Vote arithmetic, alt text and link encoding. Loads as window.Tally in the
// page and via require() in Node tests, so it must stay free of DOM access.
const Tally = (function () {
    const STATUS = { PASSED: 'PASSED', FAILED: 'FAILED', NO_QUORUM: 'NO QUORUM' };

    function isCount(n) {
        return typeof n === 'number' && Number.isInteger(n) && n >= 0;
    }

    function isGiven(n) {
        return n !== undefined && n !== null && !(typeof n === 'number' && Number.isNaN(n));
    }

    function fmtPct(n) {
        return Number.isFinite(n) && n !== 0 ? n.toFixed(1) : '0.0';
    }

    function quorumThreshold(members) {
        return Math.floor(members / 2) + 1;
    }

    function quorumCall({ members, signedIn, threshold }) {
        const t = isGiven(threshold) ? threshold : quorumThreshold(members);
        return { members, signedIn, threshold: t, met: signedIn >= t };
    }

    // Bylaws Art. II 1.2.11: only Yes and No count toward the decision.
    function motionOutcome({ yes, no, present, rule, eligible, quorumMet }) {
        const decided = yes + no;
        const ballotsCast = yes + no + present;
        const yesPct = decided > 0 ? (yes / decided) * 100 : 0;
        const noPct = decided > 0 ? (no / decided) * 100 : 0;
        const presentPct = ballotsCast > 0 ? (present / ballotsCast) * 100 : 0;
        const participationPct = isGiven(eligible) && eligible > 0 ? (ballotsCast / eligible) * 100 : null;
        let passes;
        if (decided === 0) passes = false;
        else if (rule === 'two-thirds') passes = 3 * yes >= 2 * decided;
        else passes = yes > no;
        let status = passes ? STATUS.PASSED : STATUS.FAILED;
        if (quorumMet === false) status = STATUS.NO_QUORUM;
        return {
            yes, no, present, rule, decided, ballotsCast, yesPct, noPct, presentPct, participationPct, status,
            eligible: isGiven(eligible) ? eligible : null
        };
    }

    function checkCounts({ yes, no, present, eligible, members, signedIn }) {
        const errors = [];
        const warnings = [];
        [['Yes', yes], ['No', no], ['Present', present]].forEach(function (p) {
            if (!isCount(p[1])) errors.push(p[0] + ' must be a whole number, zero or more.');
        });
        [['Eligible voters', eligible], ['Voting members', members], ['Signed in', signedIn]].forEach(function (p) {
            if (isGiven(p[1]) && !isCount(p[1])) errors.push(p[0] + ' must be a whole number, zero or more.');
        });
        if (errors.length === 0) {
            const cast = yes + no + present;
            if (isGiven(eligible) && cast > eligible) {
                warnings.push('Ballots cast (' + cast + ') exceed eligible voters (' + eligible + ').');
            }
            if (isGiven(members) && isGiven(signedIn) && signedIn > members) {
                warnings.push('Signed in (' + signedIn + ') exceeds voting members (' + members + ').');
            }
        }
        return { errors, warnings };
    }

    function ruleLabel(rule) {
        return rule === 'two-thirds' ? 'two-thirds' : 'majority';
    }

    function quorumSentence(q) {
        return 'Quorum call: ' + q.signedIn + ' signed in against a quorum of ' + q.threshold +
            ', ' + (q.met ? 'MET' : 'NOT MET') + '.';
    }

    function motionAltText(title, o, quorum) {
        let text = 'Motion outcome graphic for "' + title + '". Status: ' + o.status + '. ' +
            'Yes ' + o.yes + ' (' + fmtPct(o.yesPct) + '% of Yes and No votes). ' +
            'No ' + o.no + ' (' + fmtPct(o.noPct) + '% of Yes and No votes). ' +
            'Present ' + o.present + ', not counted in the decision. ' +
            'Passage requires a ' + ruleLabel(o.rule) + ' of Yes and No votes. ';
        if (o.participationPct !== null) {
            text += 'Ballots cast: ' + o.ballotsCast + ' of ' + o.eligible + ' eligible voters (' + fmtPct(o.participationPct) + '%). ';
        }
        if (quorum) text += quorumSentence(quorum) + ' ';
        return text.trim();
    }

    function quorumAltText(title, call) {
        return 'Quorum call graphic for "' + title + '". Status: ' + (call.met ? 'MET' : 'NOT MET') + '. ' +
            call.signedIn + ' of ' + call.members + ' voting members signed in. ' +
            'Quorum threshold: ' + call.threshold + '.';
    }

    function classicAltText({ title, attendance, quorum, votes }) {
        const voteTitle = title || 'Untitled Vote';
        const totalAttendance = attendance || 0;
        const quorumRequired = quorum || 0;
        const votesReceived = votes || 0;
        const participationRate = totalAttendance > 0 ? ((votesReceived / totalAttendance) * 100).toFixed(1) : '0';
        const quorumMet = votesReceived >= quorumRequired;
        return `Faculty Senate Vote Tracker visualization for "${voteTitle}". ` +
            `Total attendance: ${totalAttendance} members. ` +
            `Quorum requirement: ${quorumRequired} votes. ` +
            `Votes received: ${votesReceived} (${participationRate}% participation rate). ` +
            `Quorum status: ${quorumMet ? 'Met' : 'Not met'} - ${quorumMet ? 'voting threshold achieved' : `${quorumRequired - votesReceived} more votes needed`}. ` +
            `The dashboard displays three metric cards: Attendance (blue), Quorum (yellow), and Votes (${quorumMet ? 'green' : 'red'}). ` +
            `A progress bar shows ${participationRate}% completion with a yellow quorum marker at ${quorumRequired} votes. ` +
            `A donut chart visualizes ${votesReceived} voted versus ${totalAttendance - votesReceived} not voted.`;
    }

    // The session's quorum call, or null when members and signed in are not both given.
    function sessionQuorum(session) {
        if (!isGiven(session.members) || !isGiven(session.signedIn)) return null;
        return quorumCall({ members: session.members, signedIn: session.signedIn, threshold: session.threshold });
    }

    function sessionOutcomes(session) {
        const q = sessionQuorum(session);
        return session.motions.map(function (m) {
            return motionOutcome({
                yes: m.yes, no: m.no, present: m.present, rule: m.rule,
                eligible: isGiven(m.eligible) ? m.eligible : session.signedIn,
                quorumMet: q ? q.met : null
            });
        });
    }

    function sessionSummaryText(session) {
        const q = sessionQuorum(session);
        const head = ['Motion', 'Yes', 'No', 'Present', 'Yes %', 'No %', 'Rule', 'Participation %', 'Result'];
        const lines = [head.join('\t')];
        if (q) {
            lines.push(['Quorum call', String(q.signedIn), 'of ' + q.members, '', '', '',
                'threshold ' + q.threshold, '', q.met ? 'MET' : 'NOT MET'].join('\t'));
        }
        const outcomes = sessionOutcomes(session);
        session.motions.forEach(function (m, i) {
            const o = outcomes[i];
            lines.push([m.title, o.yes, o.no, o.present, fmtPct(o.yesPct), fmtPct(o.noPct), ruleLabel(o.rule),
                o.participationPct === null ? '' : fmtPct(o.participationPct), o.status].join('\t'));
        });
        return lines.join('\n');
    }

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December'];

    // Formats YYYY-MM-DD without a Date object so the result never shifts with the time zone.
    function fmtDate(iso) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
        if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return iso || '';
        return MONTHS[Number(m[2]) - 1] + ' ' + Number(m[3]) + ', ' + m[1];
    }

    function sessionAltText(session) {
        const q = sessionQuorum(session);
        const outcomes = sessionOutcomes(session);
        let text = 'Meeting summary graphic for "' + session.title + '"' +
            (session.date ? ', ' + fmtDate(session.date) : '') + '. ';
        if (q) {
            text += 'Quorum call: ' + q.signedIn + ' of ' + q.members + ' voting members signed in, quorum threshold ' +
                q.threshold + ', ' + (q.met ? 'MET' : 'NOT MET') + '. ';
        }
        session.motions.forEach(function (m, i) {
            const o = outcomes[i];
            text += 'Motion ' + (i + 1) + ', "' + m.title + '": ' + o.status + '. Yes ' + o.yes + ' (' + fmtPct(o.yesPct) +
                '%), No ' + o.no + ' (' + fmtPct(o.noPct) + '%), Present ' + o.present + ', ' + ruleLabel(o.rule) + ' rule. ';
        });
        return text.trim();
    }

    function toBase64Url(str) {
        const bytes = new TextEncoder().encode(str);
        let bin = '';
        bytes.forEach(function (b) { bin += String.fromCharCode(b); });
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function fromBase64Url(s) {
        const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
        const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
        const bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }

    function encodeSession(session) {
        return toBase64Url(JSON.stringify(Object.assign({ v: 1 }, session)));
    }

    function emptySession() {
        return { v: 1, title: '', date: '', motions: [] };
    }

    function optionalCount(n) {
        return n === undefined || isCount(n);
    }

    function validMotion(m) {
        return m && typeof m === 'object' && typeof m.title === 'string' && optionalCount(m.eligible) &&
            isCount(m.yes) && isCount(m.no) && isCount(m.present) &&
            (m.rule === 'majority' || m.rule === 'two-thirds');
    }

    function decodeSession(s) {
        const fail = 'This session link is damaged or incomplete, so it could not be opened.';
        try {
            const data = JSON.parse(fromBase64Url(String(s)));
            if (!data || data.v !== 1 || typeof data.title !== 'string' || !Array.isArray(data.motions) ||
                !data.motions.every(validMotion) || !optionalCount(data.members) || !optionalCount(data.signedIn) ||
                !optionalCount(data.threshold) || (data.date !== undefined && typeof data.date !== 'string')) {
                return { session: emptySession(), error: fail };
            }
            return { session: data, error: null };
        } catch (e) {
            return { session: emptySession(), error: fail };
        }
    }

    function readTitle(raw) {
        if (raw === null || raw === undefined) return '';
        if (/%[0-9A-Fa-f]{2}/.test(raw)) {
            try { return decodeURIComponent(raw); } catch (e) { return raw; }
        }
        return raw;
    }

    return {
        quorumThreshold, quorumCall, motionOutcome, checkCounts, fmtPct, motionAltText, quorumAltText,
        classicAltText, fmtDate, sessionAltText, sessionQuorum, sessionOutcomes, sessionSummaryText, encodeSession, decodeSession,
        readTitle, isGiven
    };
})();

if (typeof module !== 'undefined') module.exports = Tally; else window.Tally = Tally;
