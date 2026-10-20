let dashboardChart = null;

function updateVisualization() {
    const voteTitle = document.getElementById('voteTitle').value.trim();
    const totalAttendance = parseInt(document.getElementById('totalAttendance').value);
    const quorumRequired = parseInt(document.getElementById('quorumRequired').value);
    const votesReceived = parseInt(document.getElementById('votesReceived').value);
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.textContent = '';
    
    if (!voteTitle) {
        errorDiv.textContent = 'Please enter a vote title.';
        return;
    }
    
    if (isNaN(totalAttendance) || totalAttendance <= 0) {
        errorDiv.textContent = 'Please enter a valid total attendance number.';
        return;
    }
    
    if (isNaN(quorumRequired) || quorumRequired <= 0) {
        errorDiv.textContent = 'Please enter a valid quorum number.';
        return;
    }
    
    if (isNaN(votesReceived) || votesReceived < 0) {
        errorDiv.textContent = 'Please enter a valid number of votes received.';
        return;
    }
    
    if (votesReceived > totalAttendance) {
        errorDiv.textContent = 'Votes received cannot exceed total attendance.';
        return;
    }
    
    if (quorumRequired > totalAttendance) {
        errorDiv.textContent = 'Quorum cannot exceed total attendance.';
        return;
    }
    
    const participationRate = (votesReceived / totalAttendance * 100).toFixed(1);
    const quorumPercentage = (quorumRequired / totalAttendance * 100);
    const votesPercentage = (votesReceived / totalAttendance * 100);
    
    document.getElementById('displayTitle').textContent = voteTitle;
    document.getElementById('attendanceCount').textContent = totalAttendance;
    document.getElementById('quorumCount').textContent = quorumRequired;
    document.getElementById('votesCount').textContent = votesReceived;
    document.getElementById('participationRate').textContent = participationRate + '%';
    
    document.getElementById('vizArea').style.display = 'block';
    document.getElementById('exportSection').style.display = 'block';
    
    updateDashboard(votesReceived, totalAttendance, quorumRequired, votesPercentage, quorumPercentage);
}

function updateDashboard(votesReceived, totalAttendance, quorumRequired, votesPercentage, quorumPercentage) {
    document.getElementById('dashboardAttendance').textContent = totalAttendance;
    document.getElementById('dashboardQuorum').textContent = quorumRequired;
    document.getElementById('dashboardVotes').textContent = votesReceived;
    
    const attendanceCard = document.getElementById('attendanceCard');
    const quorumCard = document.getElementById('quorumCard');
    const votesCard = document.getElementById('votesCard');
    
    attendanceCard.className = 'metric-card';
    quorumCard.className = 'metric-card warning'; // Always yellow to match quorum indicators
    votesCard.className = votesReceived >= quorumRequired ? 'metric-card success' : 'metric-card danger';
    
    const progressBar = document.getElementById('dashboardProgress');
    const quorumMarker = document.getElementById('dashboardQuorumMarker');
    
    progressBar.style.width = votesPercentage + '%';
    progressBar.className = votesPercentage >= quorumPercentage ? 'progress-bar' : 'progress-bar low';
    quorumMarker.style.left = quorumPercentage + '%';
    
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    
    if (dashboardChart) {
        dashboardChart.destroy();
    }
    
    // Create datasets with quorum visualization
    const datasets = [];
    
    // Main voting data
    datasets.push({
        data: [votesReceived, totalAttendance - votesReceived],
        backgroundColor: [
            votesReceived >= quorumRequired ? '#28a745' : '#dc3545',
            '#e9ecef'
        ],
        borderWidth: 0,
        weight: 2
    });
    
    // Quorum indicator ring
    const quorumData = [quorumRequired, totalAttendance - quorumRequired];
    datasets.push({
        data: quorumData,
        backgroundColor: ['#ffc107', 'transparent'],
        borderWidth: 0,
        weight: 0.5,
        borderRadius: 0
    });
    
    dashboardChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Voted', 'Not Voted'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        filter: function(legendItem, chartData) {
                            // Only show legend for the main dataset
                            return legendItem.datasetIndex === 0;
                        }
                    }
                },
                tooltip: {
                    filter: function(tooltipItem) {
                        // Only show tooltips for the main dataset
                        return tooltipItem.datasetIndex === 0;
                    }
                }
            },
            animation: { duration: 1000 }
        }
    });
}

function showToast(message, type = 'success') {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger show animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function generateAltText() {
    return Tally.classicAltText({
        title: document.getElementById('voteTitle').value.trim(),
        attendance: parseInt(document.getElementById('totalAttendance').value),
        quorum: parseInt(document.getElementById('quorumRequired').value),
        votes: parseInt(document.getElementById('votesReceived').value)
    });
}

function copyAltText(event) {
    const altText = generateAltText();
    const button = event ? event.target : document.querySelector('button[onclick*="copyAltText"]');

    // Copy alt text to clipboard
    navigator.clipboard.writeText(altText).then(function() {
        // Show success feedback
        const originalText = button.textContent;
        button.textContent = 'Alt Text Copied!';
        button.style.backgroundColor = '#28a745';

        setTimeout(function() {
            button.textContent = originalText;
            button.style.backgroundColor = '#6c757d';
        }, 2000);
    }).catch(function(error) {
        // If clipboard fails, show in prompt for manual copying
        prompt('Copy this alt text for PowerPoint accessibility:', altText);
    });
}

function exportAsImage() {
    const voteTitle = document.getElementById('voteTitle').value.trim() || 'Vote-Tracker';
    exportElement(document.getElementById('vizArea'), fileSafe(voteTitle) + '.png', generateAltText());
}

function generateShareLink(event) {
    const voteTitle = document.getElementById('voteTitle').value.trim();
    const totalAttendance = document.getElementById('totalAttendance').value;
    const quorumRequired = document.getElementById('quorumRequired').value;
    const votesReceived = document.getElementById('votesReceived').value;
    
    const params = new URLSearchParams();
    if (voteTitle) params.set('title', voteTitle);
    if (totalAttendance) params.set('attendance', totalAttendance);
    if (quorumRequired) params.set('quorum', quorumRequired);
    if (votesReceived) params.set('votes', votesReceived);
    
    const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
    
    // Get the button element
    const button = event ? event.target : document.querySelector('button[onclick*="generateShareLink"]');
    
    // Copy directly to clipboard
    navigator.clipboard.writeText(shareUrl).then(function() {
        // Show temporary success message
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.backgroundColor = '#28a745';
        
        setTimeout(function() {
            button.textContent = originalText;
            button.style.backgroundColor = '#17a2b8';
        }, 1500);
    }).catch(function(error) {
        // Fallback: show the URL in a prompt for manual copying
        console.error('Clipboard copy failed:', error);
        prompt('Copy this link to share your results:', shareUrl);
    });
}

function loadFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'motion') {
        loadMotionParams(urlParams);
        return;
    }
    if (mode === 'quorum') {
        loadQuorumParams(urlParams);
        return;
    }
    if (urlParams.has('s')) {
        loadSessionParam(urlParams.get('s'));
        return;
    }

    const title = urlParams.get('title');
    const attendance = urlParams.get('attendance');
    const quorum = urlParams.get('quorum');
    const votes = urlParams.get('votes');
    
    if (title) {
        document.getElementById('voteTitle').value = Tally.readTitle(title);
    }
    if (attendance) {
        document.getElementById('totalAttendance').value = attendance;
    }
    if (quorum) {
        document.getElementById('quorumRequired').value = quorum;
    }
    if (votes) {
        document.getElementById('votesReceived').value = votes;
    }
    
    // If we have any URL parameters, automatically update the visualization
    if (title || attendance || quorum || votes) {
        updateVisualization();
    }
}

// ---- Shared helpers for the outcome, quorum and session graphics ----

function fileSafe(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '-');
}

function h(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

function readNum(id) {
    const v = document.getElementById(id).value.trim();
    return v === '' ? null : Number(v);
}

function setValue(id, value) {
    if (value !== null && value !== undefined && value !== '') document.getElementById(id).value = value;
}

function paramNum(params, key) {
    const v = params.get(key);
    return v === null || v === '' ? null : Number(v);
}

function pushNum(params, key, value) {
    if (value !== null && value !== undefined && !Number.isNaN(value)) params.set(key, value);
}

function pageUrl(params) {
    return window.location.origin + window.location.pathname + '?' + params.toString();
}

function exportElement(el, fileName, altText) {
    // Alt text goes to the clipboard first so it can be pasted next to the PNG in PowerPoint.
    navigator.clipboard.writeText(altText).catch(function(err) {
        console.log('Could not auto-copy alt text:', err);
    });

    return html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
    }).then(function(canvas) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL();
        link.click();
        showToast('Image downloaded! Alt text copied to clipboard for PowerPoint accessibility.', 'success');
    }).catch(function(error) {
        console.error('Error generating image:', error);
        showToast('Error generating image. Please try again.', 'error');
    });
}

function copyText(button, text, doneLabel, promptLabel) {
    const originalText = button.textContent;
    navigator.clipboard.writeText(text).then(function() {
        button.textContent = doneLabel;
        setTimeout(function() { button.textContent = originalText; }, 1500);
    }).catch(function() {
        prompt(promptLabel, text);
    });
}

// Builds the Export PNG / Copy Alt Text / Copy Link row for one graphic.
function makeActions(opts) {
    const row = h('div', 'actions');
    const exportBtn = h('button', '', 'Export PNG');
    exportBtn.type = 'button';
    exportBtn.addEventListener('click', function() {
        exportElement(opts.target, opts.fileName, opts.altText);
    });
    const altBtn = h('button', '', 'Copy Alt Text');
    altBtn.type = 'button';
    altBtn.addEventListener('click', function() {
        copyText(altBtn, opts.altText, 'Alt Text Copied!', 'Copy this alt text for PowerPoint accessibility:');
    });
    row.append(exportBtn, altBtn);
    if (opts.link) {
        const linkBtn = h('button', 'link-btn', 'Copy Link');
        linkBtn.type = 'button';
        linkBtn.addEventListener('click', function() {
            copyText(linkBtn, opts.link, 'Copied!', 'Copy this link to share your results:');
        });
        row.append(linkBtn);
    }
    if (opts.extra) opts.extra.forEach(function(b) { row.append(b); });
    return row;
}

function statusClass(status) {
    return { 'PASSED': 'passed', 'FAILED': 'failed', 'NO QUORUM': 'noquorum', 'MET': 'met', 'NOT MET': 'notmet' }[status];
}

function swatchItem(color, label) {
    const item = h('div', 'item');
    const sw = h('span', 'swatch');
    sw.style.background = color;
    item.append(sw, document.createTextNode(label));
    return item;
}

function renderMotion(container, title, outcome, quorum) {
    container.textContent = '';
    const g = h('div', 'graphic');
    g.setAttribute('role', 'img');
    g.setAttribute('aria-label', Tally.motionAltText(title, outcome, quorum));

    g.append(h('div', 'g-title', title));
    g.append(h('div', 'g-status ' + statusClass(outcome.status), outcome.status));
    const ruleText = outcome.rule === 'two-thirds'
        ? 'Passes with two-thirds of Yes and No votes'
        : 'Passes with a majority of Yes and No votes';
    g.append(h('div', 'g-sub', outcome.status === 'NO QUORUM' ? 'Quorum was not met. ' + ruleText + '.' : ruleText));

    const wrap = h('div', 'bar-wrap');
    const bar = h('div', 'split-bar');
    const yes = h('div', 'yes');
    yes.style.width = outcome.yesPct + '%';
    const no = h('div', 'no');
    no.style.width = outcome.noPct + '%';
    bar.append(yes, no);
    const marker = h('div', 'marker');
    marker.style.left = (outcome.rule === 'two-thirds' ? 100 * 2 / 3 : 50) + '%';
    wrap.append(bar, marker);
    g.append(wrap);

    const counts = h('div', 'counts');
    counts.append(
        swatchItem('#28a745', 'Yes ' + outcome.yes + ' (' + Tally.fmtPct(outcome.yesPct) + '%)'),
        swatchItem('#dc3545', 'No ' + outcome.no + ' (' + Tally.fmtPct(outcome.noPct) + '%)')
    );
    g.append(counts);
    g.append(h('div', 'tag-row', 'Percentages are of Yes and No votes. Black line: ' +
        (outcome.rule === 'two-thirds' ? 'two-thirds' : 'majority') + ' threshold.'));

    g.append(h('div', 'present-box', 'Present: ' + outcome.present + ' (not counted in the decision)'));

    if (outcome.participationPct !== null) {
        g.append(h('div', 'g-line', 'Ballots cast: ' + outcome.ballotsCast + ' of ' + outcome.eligible +
            ' eligible voters (' + Tally.fmtPct(outcome.participationPct) + '%)'));
    }
    if (quorum) {
        g.append(h('div', 'g-line quorum-line', 'Quorum: ' + quorum.signedIn + ' signed in, ' + quorum.threshold +
            ' needed: ' + (quorum.met ? 'MET' : 'NOT MET')));
    }
    container.append(g);
    return g;
}

function renderQuorum(container, title, call) {
    container.textContent = '';
    const g = h('div', 'graphic');
    g.setAttribute('role', 'img');
    g.setAttribute('aria-label', Tally.quorumAltText(title, call));

    g.append(h('div', 'g-title', title));
    const word = call.met ? 'MET' : 'NOT MET';
    g.append(h('div', 'g-status ' + statusClass(word), word));
    g.append(h('div', 'g-sub', Tally.quorumBasis(call)));

    const wrap = h('div', 'bar-wrap');
    const bar = h('div', 'split-bar');
    const fill = h('div', 'fill');
    fill.style.width = Math.min(100, call.members > 0 ? call.signedIn / call.members * 100 : 0) + '%';
    bar.append(fill);
    const marker = h('div', 'marker');
    marker.style.left = Math.min(100, call.members > 0 ? call.threshold / call.members * 100 : 0) + '%';
    wrap.append(bar, marker);
    g.append(wrap);

    const counts = h('div', 'counts');
    counts.append(
        swatchItem('#007bff', 'Signed In ' + call.signedIn + ' of ' + call.members + ' voting members'),
        h('div', 'item', 'Quorum threshold ' + call.threshold)
    );
    g.append(counts);
    g.append(h('div', 'tag-row', 'Black line: quorum threshold.'));
    container.append(g);
    return g;
}

function showMessages(prefix, errors, warnings) {
    document.getElementById(prefix + 'Error').textContent = errors.join(' ');
    const w = document.getElementById(prefix + 'Warnings');
    w.textContent = '';
    warnings.forEach(function(text) { w.append(h('p', '', text)); });
    w.hidden = warnings.length === 0;
}

function clearResult(prefix) {
    document.getElementById(prefix + 'Graphic').textContent = '';
    document.getElementById(prefix + 'Actions').textContent = '';
}

// ---- Motion outcome mode ----

function readMotionInputs() {
    return {
        title: document.getElementById('motionTitle').value.trim(),
        yes: readNum('motionYes'),
        no: readNum('motionNo'),
        present: readNum('motionPresent'),
        rule: document.getElementById('motionRule').value,
        eligible: readNum('motionEligible'),
        members: readNum('motionMembers'),
        signedIn: readNum('motionSignedIn')
    };
}

function motionLink(m) {
    const params = new URLSearchParams();
    params.set('mode', 'motion');
    params.set('title', m.title);
    pushNum(params, 'yes', m.yes);
    pushNum(params, 'no', m.no);
    pushNum(params, 'present', m.present);
    params.set('rule', m.rule);
    pushNum(params, 'eligible', m.eligible);
    pushNum(params, 'members', m.members);
    pushNum(params, 'signedin', m.signedIn);
    return pageUrl(params);
}

function updateMotion() {
    const m = readMotionInputs();
    clearResult('motion');
    if (!m.title) return showMessages('motion', ['Please enter a motion title.'], []);
    if (m.yes === null || m.no === null || m.present === null) {
        return showMessages('motion', ['Please enter Yes, No and Present counts (0 if none).'], []);
    }
    if ((m.members === null) !== (m.signedIn === null)) {
        return showMessages('motion', ['Enter both Voting Members and Signed In for the quorum line, or leave both blank.'], []);
    }
    const check = Tally.checkCounts(m);
    if (check.errors.length) return showMessages('motion', check.errors, []);

    const quorum = m.members === null ? null : Tally.quorumCall({ members: m.members, signedIn: m.signedIn });
    const outcome = Tally.motionOutcome({
        yes: m.yes, no: m.no, present: m.present, rule: m.rule, eligible: m.eligible,
        quorumMet: quorum ? quorum.met : null
    });
    showMessages('motion', [], check.warnings);

    const graphic = renderMotion(document.getElementById('motionGraphic'), m.title, outcome, quorum);
    document.getElementById('motionActions').append(makeActions({
        target: graphic,
        fileName: fileSafe(m.title) + '-outcome.png',
        altText: Tally.motionAltText(m.title, outcome, quorum),
        link: motionLink(m)
    }));
}

function loadMotionParams(params) {
    setMode('motion');
    setValue('motionTitle', Tally.readTitle(params.get('title')));
    setValue('motionYes', params.get('yes'));
    setValue('motionNo', params.get('no'));
    setValue('motionPresent', params.get('present'));
    if (params.get('rule') === 'two-thirds') document.getElementById('motionRule').value = 'two-thirds';
    setValue('motionEligible', params.get('eligible'));
    setValue('motionMembers', params.get('members'));
    setValue('motionSignedIn', params.get('signedin'));
    updateMotion();
}

// ---- Quorum call mode ----

function quorumLink(title, members, signedIn, threshold) {
    const params = new URLSearchParams();
    params.set('mode', 'quorum');
    params.set('title', title);
    pushNum(params, 'members', members);
    pushNum(params, 'signedin', signedIn);
    pushNum(params, 'threshold', Tally.thresholdOverride(members, threshold));
    return pageUrl(params);
}

function updateQuorum() {
    const title = document.getElementById('quorumTitle').value.trim();
    const members = readNum('quorumMembers');
    const signedIn = readNum('quorumSignedIn');
    const threshold = readNum('quorumThreshold');
    clearResult('quorum');
    if (!title) return showMessages('quorum', ['Please enter a title.'], []);
    if (members === null || signedIn === null) {
        return showMessages('quorum', ['Please enter Voting Members and Signed In.'], []);
    }
    const check = Tally.checkCounts({ yes: 0, no: 0, present: 0, members, signedIn });
    if (check.errors.length) return showMessages('quorum', check.errors, []);
    if (threshold !== null && (!Number.isInteger(threshold) || threshold < 1)) {
        return showMessages('quorum', ['Quorum Threshold must be a whole number, one or more.'], []);
    }
    const call = Tally.quorumCall({ members, signedIn, threshold });
    showMessages('quorum', [], check.warnings);

    const graphic = renderQuorum(document.getElementById('quorumGraphic'), title, call);
    document.getElementById('quorumActions').append(makeActions({
        target: graphic,
        fileName: fileSafe(title) + '-quorum.png',
        altText: Tally.quorumAltText(title, call),
        link: quorumLink(title, members, signedIn, threshold)
    }));
}

function loadQuorumParams(params) {
    setMode('quorum');
    setValue('quorumTitle', Tally.readTitle(params.get('title')));
    setValue('quorumMembers', params.get('members'));
    setValue('quorumSignedIn', params.get('signedin'));
    loadThreshold('quorumMembers', 'quorumThreshold', params.get('threshold'));
    updateQuorum();
}

// Prefill the threshold from the roster size until the user edits it.
function syncThreshold(membersId, thresholdId) {
    const input = document.getElementById(thresholdId);
    const members = readNum(membersId);
    if (input.dataset.touched === '1' || members === null || !(members > 0)) return;
    input.value = Tally.quorumThreshold(members);
}

// A threshold in a link is an explicit override and stays fixed; without one the field
// is prefilled and keeps following the roster size.
function loadThreshold(membersId, thresholdId, saved) {
    const input = document.getElementById(thresholdId);
    const given = saved !== null && saved !== undefined && saved !== '';
    input.dataset.touched = given ? '1' : '0';
    if (given) setValue(thresholdId, saved);
    else syncThreshold(membersId, thresholdId);
}

// ---- Session mode ----

let motionRowSeq = 0;

function motionField(labelText, input) {
    const id = 'sm' + (++motionRowSeq);
    input.id = id;
    const group = h('div', 'input-group');
    const label = h('label', '', labelText);
    label.htmlFor = id;
    group.append(label, input);
    return group;
}

function numberInput(placeholder) {
    const input = h('input');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.placeholder = placeholder;
    return input;
}

function addMotionRow(m) {
    m = m || {};
    const row = h('fieldset', 'optional-group motion-row');
    row.append(h('legend'));

    const title = h('input');
    title.type = 'text';
    title.placeholder = 'Enter motion name';
    title.value = m.title || '';
    const yes = numberInput('Yes votes');
    const no = numberInput('No votes');
    const present = numberInput('Present ballots');
    const rule = h('select');
    [['majority', 'Majority (Yes more than No)'], ['two-thirds', 'Two-thirds of Yes and No']].forEach(function(o) {
        const opt = h('option', '', o[1]);
        opt.value = o[0];
        rule.append(opt);
    });
    rule.value = m.rule || 'majority';
    const eligible = numberInput('Defaults to signed in');
    [[yes, m.yes], [no, m.no], [present, m.present], [eligible, m.eligible]].forEach(function(p) {
        if (p[1] !== undefined && p[1] !== null) p[0].value = p[1];
    });

    const remove = h('button', 'remove-btn', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', function() {
        row.remove();
        renumberRows();
        clearSessionResults();
    });

    row.append(
        motionField('Motion Title:', title), motionField('Yes:', yes), motionField('No:', no),
        motionField('Present:', present), motionField('Passes with:', rule),
        motionField('Eligible Voters (optional):', eligible), remove
    );
    row.fields = { title: title, yes: yes, no: no, present: present, rule: rule, eligible: eligible };
    document.getElementById('sessionMotions').append(row);
    renumberRows();
}

function renumberRows() {
    document.querySelectorAll('#sessionMotions .motion-row').forEach(function(row, i) {
        row.querySelector('legend').textContent = 'Motion ' + (i + 1);
        row.querySelector('.remove-btn').setAttribute('aria-label', 'Remove motion ' + (i + 1));
    });
}

function clearSessionResults() {
    document.getElementById('sessionResults').textContent = '';
}

function numOrNull(input) {
    const v = input.value.trim();
    return v === '' ? null : Number(v);
}

function readSession() {
    const errors = [];
    const warnings = [];
    const session = { v: 1, title: document.getElementById('sessionTitle').value.trim(), date: document.getElementById('sessionDate').value, motions: [] };
    const members = readNum('sessionMembers');
    const signedIn = readNum('sessionSignedIn');
    const threshold = readNum('sessionThreshold');
    if (!session.title) errors.push('Please enter a meeting title.');
    if ((members === null) !== (signedIn === null)) {
        errors.push('Enter both Voting Members and Signed In for the quorum call, or leave both blank.');
    }
    if (members !== null && signedIn !== null) {
        session.members = members;
        session.signedIn = signedIn;
        if (threshold !== null) {
            if (!Number.isInteger(threshold) || threshold < 1) errors.push('Quorum Threshold must be a whole number, one or more.');
            else if (Tally.thresholdOverride(members, threshold) !== undefined) session.threshold = threshold;
        }
        const qCheck = Tally.checkCounts({ yes: 0, no: 0, present: 0, members, signedIn });
        errors.push.apply(errors, qCheck.errors);
        warnings.push.apply(warnings, qCheck.warnings);
    }
    document.querySelectorAll('#sessionMotions .motion-row').forEach(function(row, i) {
        const f = row.fields;
        const label = 'Motion ' + (i + 1) + ': ';
        const motion = {
            title: f.title.value.trim(), yes: numOrNull(f.yes), no: numOrNull(f.no), present: numOrNull(f.present),
            rule: f.rule.value, eligible: numOrNull(f.eligible)
        };
        if (!motion.title) return errors.push(label + 'please enter a motion title.');
        if (motion.yes === null || motion.no === null || motion.present === null) {
            return errors.push(label + 'please enter Yes, No and Present counts (0 if none).');
        }
        const effectiveEligible = motion.eligible !== null ? motion.eligible : signedIn;
        const check = Tally.checkCounts({ yes: motion.yes, no: motion.no, present: motion.present, eligible: effectiveEligible === undefined ? null : effectiveEligible });
        check.errors.forEach(function(e) { errors.push(label + e); });
        check.warnings.forEach(function(w) { warnings.push(label + w); });
        if (motion.eligible === null) delete motion.eligible;
        session.motions.push(motion);
    });
    if (document.querySelectorAll('#sessionMotions .motion-row').length === 0) errors.push('Add at least one motion.');
    return { session: session, errors: errors, warnings: warnings };
}

function renderSummary(session, quorum, outcomes) {
    const g = h('div', 'graphic');
    g.append(h('div', 'g-title', session.title));
    if (session.date) g.append(h('div', 'g-date', Tally.fmtDate(session.date)));
    const table = h('table', 'summary-table');
    const head = h('tr');
    ['Motion', 'Yes', 'No', 'Present', 'Result'].forEach(function(t) {
        const th = h('th', '', t);
        th.scope = 'col';
        head.append(th);
    });
    table.append(head);
    function resultCell(status) {
        return h('td', 'res ' + statusClass(status), status);
    }
    if (quorum) {
        const tr = h('tr');
        const first = h('td', '', 'Quorum call');
        const detail = h('td', '', quorum.signedIn + ' signed in of ' + quorum.members + ' (threshold ' + quorum.threshold + ')');
        detail.colSpan = 3;
        tr.append(first, detail, resultCell(quorum.met ? 'MET' : 'NOT MET'));
        table.append(tr);
    }
    session.motions.forEach(function(m, i) {
        const o = outcomes[i];
        const tr = h('tr');
        tr.append(
            h('td', '', m.title),
            h('td', '', o.yes + ' (' + Tally.fmtPct(o.yesPct) + '%)'),
            h('td', '', o.no + ' (' + Tally.fmtPct(o.noPct) + '%)'),
            h('td', '', String(o.present)),
            resultCell(o.status)
        );
        table.append(tr);
    });
    g.append(table);
    g.append(h('div', 'tag-row', 'Percentages are of Yes and No votes. Present is not counted in the decision.'));
    return g;
}

function sessionSection(heading) {
    const sec = h('section', 'session-item');
    sec.append(h('h2', '', heading));
    document.getElementById('sessionResults').append(sec);
    return sec;
}

function renderSessionResults(session) {
    clearSessionResults();
    const quorum = Tally.sessionQuorum(session);
    const outcomes = Tally.sessionOutcomes(session);
    const base = fileSafe(session.title);
    const params = new URLSearchParams();
    params.set('s', Tally.encodeSession(session));
    const link = pageUrl(params);

    const sumSec = sessionSection('Meeting summary');
    const summary = renderSummary(session, quorum, outcomes);
    const textBtn = h('button', '', 'Copy as Text');
    textBtn.type = 'button';
    textBtn.addEventListener('click', function() {
        copyText(textBtn, Tally.sessionSummaryText(session), 'Text Copied!', 'Copy this table for the minutes:');
    });
    sumSec.append(makeActions({
        target: summary, fileName: base + '-summary.png', altText: Tally.sessionAltText(session), link: link, extra: [textBtn]
    }), summary);

    if (quorum) {
        const qSec = sessionSection('Quorum call');
        const g = renderQuorum(h('div'), session.title, quorum);
        const holder = g.parentNode;
        qSec.append(makeActions({
            target: g, fileName: base + '-quorum.png', altText: Tally.quorumAltText(session.title, quorum)
        }), holder);
    }

    session.motions.forEach(function(m, i) {
        const sec = sessionSection('Motion ' + (i + 1));
        const holder = h('div');
        const g = renderMotion(holder, m.title, outcomes[i], quorum);
        sec.append(makeActions({
            target: g, fileName: base + '-motion-' + (i + 1) + '-' + fileSafe(m.title) + '.png',
            altText: Tally.motionAltText(m.title, outcomes[i], quorum)
        }), holder);
    });
}

function updateSession() {
    const r = readSession();
    clearSessionResults();
    showMessages('session', r.errors, r.errors.length ? [] : r.warnings);
    if (r.errors.length) return;
    renderSessionResults(r.session);
}

function fillSession(session) {
    setValue('sessionTitle', session.title);
    setValue('sessionDate', session.date);
    setValue('sessionMembers', session.members);
    setValue('sessionSignedIn', session.signedIn);
    loadThreshold('sessionMembers', 'sessionThreshold', session.threshold);
    document.getElementById('sessionMotions').textContent = '';
    if (session.motions.length === 0) addMotionRow();
    session.motions.forEach(addMotionRow);
}

function loadSessionParam(value) {
    setMode('session');
    const r = Tally.decodeSession(value);
    fillSession(r.session);
    if (r.error) {
        showMessages('session', [r.error], []);
        return;
    }
    updateSession();
}

// ---- Mode switching ----

const MODES = ['classic', 'motion', 'quorum', 'session'];

function setMode(mode) {
    MODES.forEach(function(m) {
        document.getElementById('panel-' + m).hidden = m !== mode;
    });
    document.getElementById('mode-' + mode).checked = true;
}

window.onload = function() {
    document.querySelectorAll('input[name="mode"]').forEach(function(r) {
        r.addEventListener('change', function() { setMode(r.value); });
    });
    document.getElementById('motionUpdate').addEventListener('click', updateMotion);
    document.getElementById('quorumUpdate').addEventListener('click', updateQuorum);
    [['quorumMembers', 'quorumThreshold'], ['sessionMembers', 'sessionThreshold']].forEach(function(ids) {
        document.getElementById(ids[0]).addEventListener('input', function() { syncThreshold(ids[0], ids[1]); });
        document.getElementById(ids[1]).addEventListener('input', function(e) {
            e.target.dataset.touched = e.target.value === '' ? '0' : '1';
        });
    });
    document.getElementById('sessionAdd').addEventListener('click', function() {
        addMotionRow();
        clearSessionResults();
    });
    document.getElementById('sessionUpdate').addEventListener('click', updateSession);
    addMotionRow();
    loadFromUrlParams();
};
