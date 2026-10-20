# Faculty Senate Vote Tracker

A modern, responsive web application designed to track and visualize voting participation in faculty senate meetings. Built to help administrators monitor quorum requirements and voting engagement with real-time visual feedback.

## Features

### 🎯 Core Functionality
- **Real-time vote tracking** - Input attendance, quorum requirements, and vote counts
- **Quorum monitoring** - Visual indicators show whether voting thresholds are met
- **Participation calculation** - Automatic percentage calculations and rate displays

### 📊 Visualizations
- **Dashboard-style metrics** - Color-coded cards for attendance, quorum, and votes
- **Progress bar** - Shows voting progress with quorum threshold marker
- **Enhanced donut chart** - Dual-ring design displaying both vote results and quorum levels
- **Consistent color scheme** - Blue (attendance), yellow (quorum), green/red (vote status)

### 📱 Mobile-First Design
- **Responsive layout** - Optimized for desktop, tablet, and mobile devices
- **Touch-friendly interface** - Large buttons and inputs for mobile use
- **No horizontal scrolling** - All content fits perfectly on mobile screens
- **iOS optimized** - Prevents unwanted zoom on form inputs

### 🔗 Sharing & Export
- **URL sharing** - Generate shareable links with vote data embedded
- **Image export** - Download high-quality PNG images of results
- **Permalink support** - Auto-populate forms from shared URLs
- **One-click copying** - Share results via clipboard with visual feedback

## Modes

A selector at the top of the page chooses the graphic. Every graphic in every mode has its own **Export PNG** button and **Copy Alt Text** button. Export also copies the alt text to the clipboard so it can be pasted next to the image in PowerPoint.

| Mode | What it makes |
|---|---|
| Participation (classic) | Ballots received against attendance, with a quorum marker. Old links open here. |
| Motion outcome | One motion: Yes and No as percentages of Yes and No, Present set apart, and PASSED, FAILED or NO QUORUM. Optional eligible voters add a participation line. An optional quorum line (voting members, signed in) turns the status to NO QUORUM when quorum is not met. |
| Quorum call | Signed in against the quorum threshold, and MET or NOT MET. The threshold is a majority of voting members and can be overridden. |
| Meeting session | A meeting title and date, one quorum call, and any number of motions. Each motion and the quorum call export on their own. A summary table exports as one image and copies as tab-separated text for the minutes. |

### Counting rule

The ballot offers Yes, No or Present. Under Bylaws Art. II 1.2.11 the totality of the votes is the Yes and No votes only.

- Majority: passes when Yes is greater than No. A tie fails.
- Two-thirds: passes when Yes is at least two-thirds of Yes plus No.
- Either rule fails when there are no Yes or No votes.
- Present counts toward participation and never toward the decision.
- Quorum is separate. It is a majority of voting members, `floor(members / 2) + 1`, measured by the sign-in count. When a session's quorum call is NOT MET, every motion shows NO QUORUM. When quorum is met, a motion with few ballots still shows PASSED or FAILED on Yes against No.
- Participation is ballots cast (Yes + No + Present) divided by eligible voters. In a session, eligible voters default to the signed-in count and each motion can override it.

Status words always appear as text in the graphic and the alt text, never as color alone. "Present" means only the ballot choice. Attendance is labeled "Signed In" or "In Attendance".

Inconsistent counts, such as more ballots than eligible voters, show a warning and still render. A missing title, or a negative or non-integer count, blocks.

## Usage

### Basic Operation (classic mode)
1. Enter the vote title and attendance information
2. Specify the quorum requirement for the vote
3. Input the number of votes received
4. Click "Update Vote Tracker" to generate the visualization

### Sharing Results
- **Copy Link to Results** - Generates a shareable URL with all vote data
- **Export as Image** - Downloads a PNG file perfect for meeting minutes
- **Link formats**, all with the title URL-encoded once:
  - Classic: `?title=Vote&attendance=50&quorum=26&votes=35` (no `mode` parameter means classic; older links with a double-encoded title still read correctly)
  - Motion: `?mode=motion&title=Vote&yes=69&no=7&present=9&rule=majority&eligible=93&members=108&signedin=96` (`rule` is `majority` or `two-thirds`; `eligible`, `members` and `signedin` are optional)
  - Quorum: `?mode=quorum&title=Roll+Call&members=108&signedin=96&threshold=55`
  - Session: `?s=<base64url of the session JSON>`. One link carries the whole meeting. A damaged link shows an error and an empty session.

### Reading the Dashboard
- **Blue card (Present)** - Total members in attendance
- **Yellow card (Quorum)** - Required votes for valid decision
- **Green/Red card (Voted)** - Actual votes received (color indicates quorum status)
- **Progress bar** - Yellow line shows quorum threshold
- **Donut chart** - Inner yellow ring shows quorum, outer ring shows actual votes

## Technical Details

### Built With
- **HTML5/CSS3** - Modern web standards
- **JavaScript (ES6+)** - Client-side functionality
- **Chart.js 4.5.1** - Donut chart in the classic view (vendored in `vendor/`)
- **html2canvas 1.4.1** - Image export functionality (vendored in `vendor/`)
- **Node test runner** - Unit tests for the vote arithmetic (`node --test`), no npm packages
- **CSS Grid/Flexbox** - Responsive layout system

### Browser Support
- Chrome/Edge (recommended)
- Firefox
- Safari (iOS/macOS)
- Mobile browsers

### Performance
- **Lightweight** - Static files, no build process required
- **Fast loading** - Libraries are served from the same site
- **Offline capable** - Chart.js and html2canvas are bundled in `vendor/` and loaded locally, so the page works without internet

## Installation & Deployment

### Local Development
```bash
# Clone or download the repository
git clone [repository-url]
cd senate-vote-tracker

# Start local server (optional)
./serve.sh
# Or use any static file server
python3 -m http.server 8000
```

### GitHub Pages Deployment
1. Create a new GitHub repository
2. Upload `index.html`, `app.js`, `tally.js` and the `vendor/` folder
3. Enable GitHub Pages in repository settings
4. Access at `https://yourusername.github.io/repository-name`

### Self-Hosting
Serve the repository files from any web server. No server-side processing required.

## File Structure
```
senate-vote-tracker/
├── index.html          # Page markup and styles
├── app.js              # Interface code for every mode
├── tally.js            # Vote arithmetic, alt text and link encoding (browser and Node)
├── tests/              # Unit tests for tally.js
├── vendor/             # Chart.js and html2canvas, with source and checksum notes
├── docs/               # Design, plan and how-to-test notes
├── serve.sh           # Local development server script
├── README.md          # This file
└── LICENSE            # MIT license
```

## Use Cases

### Faculty Senate Meetings
- Report each motion's outcome and quorum after the meeting
- Monitor quorum compliance for official votes
- Generate visual reports for meeting minutes
- Share results with absent members via URL

### Committee Meetings
- Adapted for any group voting scenario
- Scalable for different attendance sizes
- Professional presentation of voting data

### Meeting Documentation
- Export images for official records
- Share permalinks in follow-up communications
- Maintain voting transparency and accountability

## Design Philosophy

### User Experience
- **Simplicity first** - Clean interface with minimal cognitive load
- **Mobile accessibility** - Usable in any meeting environment
- **Visual clarity** - Color coding and icons for instant comprehension
- **Professional appearance** - Suitable for formal academic settings

### Technical Approach
- **Progressive enhancement** - Works with basic browsers, enhanced with modern features
- **Mobile-first responsive** - Designed primarily for mobile, scaled up for desktop
- **Few dependencies** - Two pinned libraries, bundled in the repository, and no build step
- **Accessibility conscious** - Readable fonts, sufficient contrast, keyboard navigation

## Contributing

This project welcomes contributions! Areas for enhancement:
- Additional visualization types
- Accessibility improvements
- Multi-language support
- Advanced export formats
- Integration capabilities

## License

Released under the MIT License. See LICENSE file for details.

## Support

For issues, feature requests, or questions about deployment in your organization, please use the GitHub Issues system.

---

**Faculty Senate Vote Tracker** - Making democratic participation visible and accessible.