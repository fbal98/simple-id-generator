# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simple ID Generator is a web application that allows users to:
1. Upload custom ID template images
2. Add customizable text and photo fields to the template
3. Generate multiple ID cards with randomized data
4. Adjust text boldness with real-time preview (font weight 100-900)
5. Download individual IDs or all generated IDs as a ZIP archive

## Commands

### Running the Application
```bash
# Install dependencies
bun install

# Start the development server
bun start
```

The application will be available at http://localhost:3000


## Architecture

The application consists of a Bun-based server for static file serving and API proxy functionality, with a vanilla JavaScript frontend.

### Core Components

1. **Server (`server.js`)**
   - Serves static files (HTML, JS, CSS)
   - Provides a proxy endpoint `/api/face` to fetch AI-generated face images from thispersondoesnotexist.com
   - Handles CORS and basic security measures

2. **Frontend Modules**
   - **app.js**: Main application logic, manages app state and connects UI components
   - **fieldManager.js**: Handles draggable/resizable field overlay management
   - **dataGenerator.js**: Contains functions for generating random data for IDs

3. **UI Structure**
   - Left panel: Controls for template upload and field addition
   - Center: Canvas for ID template with draggable field overlays
   - Right panel: Controls for ID generation and download

### Data Flow

1. User uploads a template image and adds fields to it
2. When generating IDs, the app:
   - Creates random data for each field
   - Fetches AI faces for photo fields via the server proxy
   - Renders each ID to an offscreen canvas
   - Converts to PNG data URLs
   - Provides download options for individual or bulk ZIP downloads

### Key Features

1. **Field Management**
   - Add, position, and resize various field types (name, dates, civil number, photo)
   - Custom styling for each field type
   - Real-time positioning and updates

2. **ID Generation**
   - Generates random, culturally appropriate names
   - Creates plausible dates and civil numbers
   - Fetches AI-generated face photos
   - Supports batch generation with progress indication

3. **Export Options**
   - Download individual preview
   - Download all as ZIP (using JSZip from CDN)
   - Edit layout after generation

4. **Text Boldness Control**
   - Font weight slider (100-900) appears after ID generation
   - Real-time preview updates when adjusting boldness
   - Applies to all text fields (not photo fields)
   - Persists in downloaded files (both single and ZIP)
   - Works in edit mode with field overlays
   - Font weight stored in app state and applied during rendering

## File Structure

```
.
├── index.html                    # Main HTML file
├── server.js                     # Bun server for static files and proxying AI face fetch
├── package.json                  # Project metadata and scripts
├── styles/
│   └── main.css                  # Stylesheet
└── js/
    ├── app.js                    # Front-end application logic
    ├── fieldManager.js           # Draggable/resizable field manager
    └── dataGenerator.js          # Random data generator functions
```


## Field Overlay Implementation Details

The field overlay system uses a draggable/resizable design pattern with WYSIWYG (What You See Is What You Get) functionality:

1. **Field Creation**: Fields auto-size to fit their content using `whiteSpace: nowrap` measurement
2. **Text Fields**: Use minimal padding (2px each side) for tight visual fit that matches canvas rendering
3. **Label Edge System**: Text fields support 4 label edge positions (left, right, top, bottom):
   - **Left Edge**: Text grows rightward from the left edge (default)
   - **Right Edge**: Text grows leftward from the right edge
   - **Top Edge**: Text is centered horizontally with top padding
   - **Bottom Edge**: Text is centered horizontally with bottom padding
4. **Edge Selection**: Click on edge indicators (visible when field is focused) to change label position
5. **Generated Mode**: Fields get `.generated-mode` class for subtle styling during ID generation
6. **Resize Behavior**: Text fields auto-adjust height when width changes, position adjusts based on label edge
7. **Canvas Rendering**: Single-line text rendering with alignment matching overlay field positioning
8. **WYSIWYG Design**: Overlay fields precisely match the final rendered output positioning and alignment

## Text Boldness Implementation Details

The text boldness control provides real-time font weight adjustment:

1. **UI Control**: Range slider appears in right panel after ID generation
2. **Font Weight Range**: 100-900 in increments of 100 (CSS standard font weights)
3. **State Management**: Font weight stored in `appState._fontWeight` with getter/setter (default: 600)
4. **Real-time Updates**: 
   - Slider input events trigger immediate canvas re-rendering
   - All generated IDs are re-rendered with new font weight
   - Field overlays in edit mode also update their font weight
5. **Canvas Rendering**: Font weight applied via `ctx.font` property (e.g., "700 16px Arial")
6. **Scale Preservation**: Re-rendering maintains proper scale factors to prevent position shifts
7. **Download Consistency**: Updated data URLs ensure downloads reflect current font weight
8. **Session Persistence**: Font weight persists during session but resets to 600 when clearing generated IDs

## Design System

### Modern UI Design (Vodafone-Inspired)

The application features a sophisticated design system inspired by Vodafone's brand guidelines but modernized for contemporary web applications:

1. **Color Palette**
   - Primary: Vodafone Red (#E60000) with modern variations
   - Secondary: Deep navy (#1A1F36) for contrast
   - Accent colors: Purple (#9C2AA0), Cyan (#00D4FF), Success Green (#00D68F)
   - Neutral grays with subtle warmth for better readability

2. **Typography**
   - Clean sans-serif stack prioritizing system fonts
   - Hierarchical sizing: 18px for headings, 13-16px for body text
   - Font weights: 500-700 for optimal readability

3. **Visual Effects**
   - **Glassmorphism**: Translucent panels with backdrop blur
   - **Subtle animations**: Smooth transitions and micro-interactions
   - **Modern shadows**: Multi-layered for depth without heaviness
   - **Gradient accents**: Used sparingly for visual interest

4. **Component Design**
   - **Buttons**: Gradient backgrounds with hover elevation
   - **Inputs**: Semi-transparent with focus glow effects
   - **Field overlays**: Glassmorphic design with color-coded accents
   - **Progress indicators**: Animated gradient fills

5. **Layout Principles**
   - Three-panel layout with visual hierarchy
   - Generous spacing following 8px grid system
   - Subtle background patterns for depth
   - Professional, enterprise-appropriate aesthetics

## Testing

### Running Tests
```bash
# Run all E2E tests
bun run test

# Run specific test suite
bunx playwright test tests/e2e/template-upload.spec.js

# Run with UI mode
bun run test:ui

# Update visual regression baselines
bunx playwright test --update-snapshots
```

### Test Structure
- **Template Upload**: Tests file upload, validation, and display
- **Field Management**: Tests field addition, positioning, and properties
- **ID Generation**: Tests single/batch generation with mocked APIs
- **Output Validation**: Tests visual regression and content validation
- **Downloads**: Tests preview and ZIP download functionality
- **Text Boldness**: Tests slider control, real-time updates, and persistence

### Key Testing Notes
- Tests run on port 3001 (configured in playwright.config.js)
- Face API is mocked for consistent results
- Visual regression tests compare screenshots against baselines
- Field selectors use pattern `[id^="field-{type}"]` where type is: name, dob, issueDate, expiry, civilNo, photo
- Generated IDs are displayed on the main canvas (#idCanvas), not as separate elements
- Field positioning and dimensions are relative to the #fieldLayer container
- Download tests use `page.waitForEvent('download')` for proper download handling
- Resize functionality uses mouse events to drag the `.resize-handle` element

## Development Guidelines

### Code Style
- Use ES6+ features (modules, arrow functions, destructuring)
- Maintain single responsibility principle for modules
- Add JSDoc comments for public functions
- Keep functions pure where possible

### CSS Architecture
- Use CSS custom properties for theming
- Follow BEM-like naming for complex components
- Organize styles by component/section
- Maintain responsive design principles

### Testing Best Practices
- Write descriptive test names
- Use Page Object pattern for complex interactions
- Mock external dependencies (API calls)
- Maintain visual regression baselines

### Performance Considerations
- Lazy load heavy dependencies (JSZip)
- Use offscreen canvas for batch rendering
- Optimize image processing with appropriate formats
- Minimize reflows during drag operations