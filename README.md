# Ozan Yetkin - Personal Portfolio Website

[![Website](https://img.shields.io/website?down_color=red&down_message=offline&up_color=green&up_message=online&url=https%3A%2F%2Fozanyetkin.com)](https://ozanyetkin.com)
[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-blue)](https://pages.github.com/)

Personal portfolio website for Ozan Yetkin - Researcher, Developer, and Designer pursuing a Ph.D. in Building Science at METU. Features a responsive design with dark/light themes, ATS-friendly PDF CV generation, and interactive portfolio showcasing 3D visualizations, games, and data visualizations.

**Live Website**: [ozanyetkin.com](https://ozanyetkin.com)

## Features

- Dark/light theme toggle with persistent preferences
- Responsive design optimized for all devices
- One-click ATS-friendly PDF CV generation
- Interactive portfolio with 3D scenes, mini-games, and data visualizations
- Clean, accessible design with smooth animations

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Three.js for 3D graphics
- D3.js for data visualization
- jsPDF for client-side PDF generation
- GitHub Pages hosting

## Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/ozanyetkin/ozanyetkin.github.io.git
   cd ozanyetkin.github.io
   ```

2. Serve locally:

   ```bash
   python -m http.server 8000
   ```

3. Open `http://localhost:8000` in your browser

## Project Structure

```plaintext
├── index.html              # Main page
├── style.css               # Styles and theme system
├── script.js               # Core functionality
├── 3d/                     # 3D visualizations
├── games/                  # Interactive games
├── animations/             # 2D animations
├── data/                   # Data visualizations
└── img/                    # Project thumbnails
```

## Customization

The theme system uses CSS custom properties for easy customization. Modify the CSS variables in `style.css` to change colors and styling.

To add new projects:

1. Create HTML file in the appropriate directory
2. Add thumbnail image to `img/`
3. Update the portfolio section in `index.html`

## Contact

- Website: [ozanyetkin.com](https://ozanyetkin.com)
- Email: [oyetkin@metu.edu.tr](mailto:oyetkin@metu.edu.tr)
- LinkedIn: [linkedin.com/in/ozan-yetkin](https://linkedin.com/in/ozan-yetkin/)
- GitHub: [github.com/ozanyetkin](https://github.com/ozanyetkin/)
