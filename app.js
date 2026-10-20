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
    const voteTitle = document.getElementById('voteTitle').value.trim() || 'Untitled Vote';
    const totalAttendance = parseInt(document.getElementById('totalAttendance').value) || 0;
    const quorumRequired = parseInt(document.getElementById('quorumRequired').value) || 0;
    const votesReceived = parseInt(document.getElementById('votesReceived').value) || 0;
    const participationRate = totalAttendance > 0 ? ((votesReceived / totalAttendance) * 100).toFixed(1) : '0';
    const quorumMet = votesReceived >= quorumRequired;

    // Generate comprehensive alt text
    const altText = `Faculty Senate Vote Tracker visualization for "${voteTitle}". ` +
        `Total attendance: ${totalAttendance} members. ` +
        `Quorum requirement: ${quorumRequired} votes. ` +
        `Votes received: ${votesReceived} (${participationRate}% participation rate). ` +
        `Quorum status: ${quorumMet ? 'Met' : 'Not met'} - ${quorumMet ? 'voting threshold achieved' : `${quorumRequired - votesReceived} more votes needed`}. ` +
        `The dashboard displays three metric cards: Attendance (blue), Quorum (yellow), and Votes (${quorumMet ? 'green' : 'red'}). ` +
        `A progress bar shows ${participationRate}% completion with a yellow quorum marker at ${quorumRequired} votes. ` +
        `A donut chart visualizes ${votesReceived} voted versus ${totalAttendance - votesReceived} not voted.`;

    return altText;
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
    const vizArea = document.getElementById('vizArea');

    // Generate and copy alt text for accessibility
    const altText = generateAltText();

    // Copy alt text to clipboard silently
    navigator.clipboard.writeText(altText).then(function() {
        console.log('Alt text copied to clipboard for accessibility');
    }).catch(function(err) {
        console.log('Could not auto-copy alt text:', err);
    });

    // Export the image
    html2canvas(vizArea, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
    }).then(function(canvas) {
        const link = document.createElement('a');
        const voteTitle = document.getElementById('voteTitle').value.trim() || 'Vote-Tracker';
        const fileName = voteTitle.replace(/[^a-zA-Z0-9]/g, '-') + '.png';

        link.download = fileName;
        link.href = canvas.toDataURL();
        link.click();

        // Show toast notification about alt text
        showToast('Image downloaded! Alt text copied to clipboard for PowerPoint accessibility.', 'success');
    }).catch(function(error) {
        console.error('Error generating image:', error);
        showToast('Error generating image. Please try again.', 'error');
    });
}

function generateShareLink(event) {
    const voteTitle = document.getElementById('voteTitle').value.trim();
    const totalAttendance = document.getElementById('totalAttendance').value;
    const quorumRequired = document.getElementById('quorumRequired').value;
    const votesReceived = document.getElementById('votesReceived').value;
    
    const params = new URLSearchParams();
    if (voteTitle) params.set('title', encodeURIComponent(voteTitle));
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
    
    const title = urlParams.get('title');
    const attendance = urlParams.get('attendance');
    const quorum = urlParams.get('quorum');
    const votes = urlParams.get('votes');
    
    if (title) {
        document.getElementById('voteTitle').value = decodeURIComponent(title);
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

// Load URL parameters on page load
window.onload = function() {
    loadFromUrlParams();
};
