# Ozan Yetkin - Personal Portfolio Website

[![Website](https://img.shields.io/website?down_color=red&down_message=offline&up_color=green&up_message=online&url=https%3A%2F%2Fozanyetkin.com)](https://ozanyetkin.com)
[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-blue)](https://pages.github.com/)

Interactive portfolio website for Ozan Yetkin - Researcher, Developer, and Designer pursuing a Ph.D. in Building Science at METU. This comprehensive web application serves as both a digital CV and an interactive showcase of computational design, 3D graphics, data visualization, and game development projects.
*-Basically, it has everything needed to procrastinate from actual research.*

**See it in Action**: [ozanyetkin.com](https://ozanyetkin.com)

## Features

### Core Functionality

- **Responsive Design**: Optimized layout for all devices with mobile-first approach
- **Theme System**: Dark/light theme toggle with persistent user preferences via localStorage
- **Interactive Navigation**: Collapsible sidebar navigation with smooth animations
- **ATS-Friendly PDF Export**: One-click CV generation using jsPDF for professional applications. *-Because it seems like robots read resumes now... sigh*

### Portfolio Sections

- **3D Visualizations**: Interactive Three.js scenes including procedural knots, city generation, noise-based sphere deformation, clipping planes, wave animations, and instanced geometry
- **Mini Games**: Six playable browser games including Space Invaders, Tetromino, Hangman, 2048, Whack-a-Mole, and Minesweeper. *-Disclaimer: I'm not responsible for any lost productivity here*
- **2D Animations**: Canvas-based animations featuring procedural pipes, grid transformations, pulsing effects, rotations, randomized patterns, and fireworks
- **Data Visualizations**: D3.js-powered interactive charts including circle packing, zoomable sunburst, chord diagrams, heatmaps, treemaps, and Gantt charts

### Visual Enhancement

- **Tritone Image Processing**: Custom Python utility for generating consistent visual branding across project thumbnails
- **Smooth Animations**: CSS transitions and JavaScript-powered interactive elements
- **Accessibility**: Semantic HTML structure with ARIA labels and keyboard navigation support

## Tech Stack

### Frontend Technologies

- **HTML5 & CSS3**: Semantic markup with modern CSS features including custom properties, flexbox, and grid
- **Vanilla JavaScript**: Core functionality without framework dependencies for optimal performance. *-Because who needs a JS that is 500 MB*
- **CSS Custom Properties**: Dynamic theming system supporting dark/light modes

### Graphics & Visualization Libraries

- **Three.js**: WebGL-based 3D graphics rendering for interactive scenes and animations
- **D3.js**: Data-driven document manipulation for sophisticated data visualizations
- **Canvas API**: 2D graphics rendering for animations and game development

### Utilities & Tools

- **jsPDF**: Client-side PDF generation for downloadable CV functionality
- **Python (PIL/Pillow)**: Image processing utilities for consistent visual identity
- **GitHub Pages**: Static site hosting with custom domain support

### Development Environment

- **Git**: Version control with GitHub integration
- **Python 3.x**: Utility scripts and image processing tools
- **Modern Browser APIs**: LocalStorage, Canvas, WebGL, and responsive design APIs

## Quick Start

### Local Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/ozanyetkin/ozanyetkin.github.io.git
   cd ozanyetkin.github.io
   ```

2. **Serve locally**:

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Python 2 (if you're living in the past)
   python -m SimpleHTTPServer 8000

   # Using Node.js (if you have extra space to spare)
   npx serve .

   # Using PHP (if you enjoy suffering)
   php -S localhost:8000
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

### Image Processing Utility

To regenerate project thumbnails with consistent color palette, -*hope you are as picky as I am about colors*:

```bash
# Navigate to the project directory
cd ozanyetkin.github.io

# Run the tritone image processor
python utils/tritone_maker.py
```

This utility processes images in the `img/` directory and outputs tritone versions to `img/tritone/` for visual consistency across the portfolio.

## Project Structure

```plaintext
ozanyetkin.github.io/
├── index.html                          # Main portfolio page with CV content
├── style.css                           # Global styles and theme system
├── script.js                           # Core functionality and interactions
├── favicon.ico                         # Site favicon
├── CNAME                               # Custom domain configuration
├── README.md                           # Project documentation
├── 3d/                                 # Three.js 3D visualizations
│   ├── 3d_city.html                    # Procedural city generation
│   ├── 3d_knots.html                   # Mathematical knot visualizations
│   ├── 3d_wave.html                    # Wave animation system
│   ├── 3d_noisy_sphere.html            # Noise-based deformation
│   ├── 3d_clipping_intersection.html   # Clipping plane demonstration
│   ├── 3d_instance_rotation.html       # Instanced geometry example
│   └── [script/style files]            # Associated JS and CSS files
├── games/                              # Interactive browser games
│   ├── space_invaders_game.html        # Classic arcade game
│   ├── tetromino_game.html             # Tetris-style puzzle game
│   ├── hangman_game.html               # Word guessing game
│   ├── 2048_game.html                  # Number sliding puzzle
│   ├── whack_a_mole_game.html          # Reaction-based game
│   ├── minesweeper_game.html           # Logic puzzle game
│   └── [script/style files]            # Associated JS and CSS files
├── animations/                         # Canvas-based 2D animations
│   ├── animated_pipes.html             # Procedural pipe generation
│   ├── sequential_grid_animation.html  # Grid transformation effects
│   ├── pulsing_animation.html          # Rhythmic pulsing patterns
│   ├── rotating_grid_animation.html    # Rotating grid systems
│   ├── randomized_grid_animation.html  # Random pattern generation
│   ├── fireworks_animation.html        # Particle explosion effects
│   └── [script/style files]            # Associated JS and CSS files
├── data/                               # D3.js data visualizations
│   ├── circle_packing.html             # Hierarchical circle packing
│   ├── zoomable_sunburst_chart.html    # Interactive sunburst chart
│   ├── chord_diagram.html              # Relationship chord diagram
│   ├── heatmap_table.html              # Data heatmap visualization
│   ├── treemap_chart.html              # Hierarchical treemap
│   ├── gantt_chart.html                # Project timeline chart
│   ├── bump_chart.html                 # Ranking change visualization
│   └── [script/style files]            # Associated JS and CSS files
├── img/                                # Project images and thumbnails
│   └── tritone/                        # Processed tritone images
└── utils/                              # Development utilities
   └── tritone_maker.py                 # Image processing script
```

### Key Architecture Decisions

- **Modular Structure**: Each portfolio item is self-contained with its own HTML, CSS, and JavaScript files *-because you need to keep your sanity*
- **Zero Build Process**: Direct browser-compatible code without compilation or bundling
- **Progressive Enhancement**: Core content accessible without JavaScript, enhanced with interactivity
- **Semantic Organization**: Clear directory structure reflecting content categories

## Customization

### Theme Customization

The website uses CSS custom properties for comprehensive theming. Modify variables in `style.css`:

```css
:root {
  --primary-color: #3166d9;
  --secondary-color: #ff5069;
  --accent-color: #ffd943;
  --background-color: #ffffff;
  --text-color: #333333;
  /* Additional theme variables... */
}

[data-theme="dark"] {
  --background-color: #1a1a1a;
  --text-color: #ffffff;
  /* Dark theme overrides... */
}
```

### Adding New Portfolio Items

1. **Create project files**:

   ```bash
   # For 3D projects
   touch 3d/new_project.html 3d/new_project_script1.js 3d/new_project_style1.css

   # For games
   touch games/new_game.html games/new_game_script1.js games/new_game_style1.css
   ```

2. **Add project thumbnail**:

   - Place source image in `img/` directory
   - Run `python utils/tritone_maker.py` to generate processed version

3. **Update portfolio section** in `index.html`:

   ```html
   <div class="thumbnail">
     <p class="thumbnail-title">Project Name</p>
     <a href="category/new_project.html" target="_blank">
       <img src="./img/tritone/new_project.png" alt="Project Name" />
     </a>
   </div>
   ```

### Image Processing Customization

Modify `utils/tritone_maker.py` to customize the visual branding:

```python
# Custom color scheme (RGB values)
custom_colors = [
    (255, 80, 105),   # Primary color
    (49, 102, 217),   # Secondary color
    (255, 217, 67),   # Accent color
]

# Adjust contrast level
contrast_level = 1.5  # Higher values = more contrast
```

### Performance Optimization

- **Lazy Loading**: Images load on demand to improve initial page load
- **Minimal Dependencies**: Only essential libraries loaded per page
- **Efficient Animations**: CSS transitions preferred over JavaScript where possible
- **Caching Strategy**: Static assets cached via GitHub Pages headers

## Development

### Contributing

While this is a personal portfolio, contributions for bug fixes or feature improvements are welcome:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/improvement`
3. **Test locally**: Ensure all projects work correctly
4. **Submit a pull request**: Include clear description of changes

### Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ *-if you are still using Internet Explorer, we need to talk*
- **WebGL Support**: Required for 3D visualizations
- **ES6+ Features**: Uses modern JavaScript syntax
- **CSS Grid/Flexbox**: Modern layout techniques

### Performance Considerations

- **Lazy Loading**: Portfolio items load on-demand
- **Optimized Images**: Compressed thumbnails with consistent processing
- **Minimal JavaScript**: Core functionality without heavy frameworks
- **CDN Resources**: External libraries loaded from CDN for caching

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

*Assuming that you probably want to reach out to me since you survived all the drama and scrolled all the way down here, so choose wisely*:

- **Website**: [ozanyetkin.com](https://ozanyetkin.com)
- **Email**: [oyetkin@metu.edu.tr](mailto:oyetkin@metu.edu.tr)
- **LinkedIn**: [linkedin.com/in/ozan-yetkin](https://linkedin.com/in/ozan-yetkin/)
- **GitHub**: [github.com/ozanyetkin](https://github.com/ozanyetkin/)
- **ResearchGate**: [researchgate.net/profile/Ozan-Yetkin](https://researchgate.net/profile/Ozan-Yetkin)
- **Google Scholar**: [scholar.google.com/citations?user=ZmK_a4EAAAAJ](https://scholar.google.com/citations?user=ZmK_a4EAAAAJ)
