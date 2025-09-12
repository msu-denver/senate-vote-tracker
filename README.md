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

## Usage

### Basic Operation
1. Enter the vote title and attendance information
2. Specify the quorum requirement for the vote
3. Input the number of votes received
4. Click "Update Vote Tracker" to generate the visualization

### Sharing Results
- **Copy Link to Results** - Generates a shareable URL with all vote data
- **Export as Image** - Downloads a PNG file perfect for meeting minutes
- **URL Format**: `?title=Vote&attendance=50&quorum=26&votes=35`

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
- **Chart.js** - Interactive donut chart visualization
- **html2canvas** - Image export functionality
- **CSS Grid/Flexbox** - Responsive layout system

### Browser Support
- Chrome/Edge (recommended)
- Firefox
- Safari (iOS/macOS)
- Mobile browsers

### Performance
- **Lightweight** - Single HTML file, no build process required
- **Fast loading** - CDN-delivered dependencies
- **Offline capable** - All code embedded, works without internet after loading

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
2. Upload `index.html` and `serve.sh`
3. Enable GitHub Pages in repository settings
4. Access at `https://yourusername.github.io/repository-name`

### Self-Hosting
Simply serve the `index.html` file from any web server. No server-side processing required.

## File Structure
```
senate-vote-tracker/
├── index.html          # Main application file
├── serve.sh           # Local development server script
├── README.md          # This file
└── LICENSE            # MIT license
```

## Use Cases

### Faculty Senate Meetings
- Track voting participation during live meetings
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
- **Zero dependencies** - Self-contained application for reliability
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