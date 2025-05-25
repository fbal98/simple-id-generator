# Simple ID Generator

A modern, enterprise-grade web application for generating randomized ID cards based on custom templates. Features a sophisticated UI inspired by Vodafone's design language with glassmorphism effects, modern gradients, and professional aesthetics.

## Features

### Core Functionality
- **Template Upload**: Support for custom ID template images (PNG, JPEG, etc.)
- **Field Management**: Add draggable and resizable fields
  - Text fields: Name, Date of Birth, Issue Date, Expiry Date, Civil Number
  - Photo field: Automatically fetches AI-generated faces
- **Smart Field Positioning**: Label edge system for precise text alignment (left, right, top, bottom)
- **Batch Generation**: Generate multiple ID cards with randomized, culturally appropriate data
- **Real-time Customization**: Adjust text boldness with live preview (font weight 100-900)
- **Export Options**: Download individual IDs or batch export as ZIP archive

### Design & User Experience
- **Modern UI**: Vodafone-inspired design with contemporary aesthetics
- **Glassmorphism Effects**: Translucent panels with backdrop blur
- **Smooth Animations**: Professional transitions and hover states
- **Responsive Layout**: Adaptive design for various screen sizes
- **Accessibility**: Keyboard navigation and focus indicators

## Tech Stack
- [Bun](https://bun.sh/) for server and static file serving.
- HTML, CSS, and vanilla JavaScript (ES Modules) for the front-end.
- [JSZip](https://stuk.github.io/jszip/) (via CDN) for ZIP archive creation.

## Prerequisites
- Bun (v0.5 or later) installed and available in your PATH.
- A modern web browser (Chrome, Firefox, Edge, Safari).

## Installation
```bash
git clone https://github.com/your-username/simple-id-generator.git
cd simple-id-generator
bun install
```

## Running the Application
```bash
bun start
```
The server will start on http://localhost:3000. Open this URL in your browser.

## Testing

This project includes comprehensive end-to-end tests using Playwright. Tests cover all major user journeys including template upload, field management, ID generation, and downloads.

### Running Tests

```bash
# Install Playwright browsers (first time only)
bun playwright install

# Run all tests
bun run test

# Run tests with UI mode (interactive)
bun run test:ui

# Run tests in headed mode (see browser)
bun run test:headed

# Debug tests
bun run test:debug

# Run specific test suite
bunx playwright test tests/e2e/template-upload.spec.js
```

### Test Coverage

The test suite includes 60 tests across 6 test files:

- **Template Upload** (5 tests): Upload validation, error handling, template replacement
- **Field Management** (12 tests): Adding all field types, positioning, resizing, edge switching
- **ID Generation** (10 tests): Single/batch generation, progress tracking, API mocking
- **Output Validation** (10 tests): Visual regression testing, screenshot comparison
- **Download Functionality** (9 tests): Preview downloads, ZIP generation, file integrity
- **Text Boldness Control** (14 tests): Slider functionality, real-time updates, persistence

### Visual Regression Testing

Tests automatically capture screenshots and compare against baselines. To update baselines:

```bash
bunx playwright test --update-snapshots
```

See `/tests/README.md` for detailed testing documentation.


## Usage

### 1. Template Setup
- Click **Choose File** in the Controls panel to upload your ID template image
- The template will appear in the central canvas area

### 2. Adding Fields
- Use the field buttons to add different types of data fields:
  - **Name Field**: For full names
  - **Date of Birth**: For birth dates
  - **Issue Date**: For ID issue dates
  - **Expiry Date**: For ID expiration dates
  - **Civil Number**: For ID/civil registration numbers
  - **Photo Area**: For portrait photos (AI-generated)

### 3. Field Configuration
- **Position**: Drag fields to place them on the template
- **Resize**: Use the resize handle (visible when field is selected)
- **Label Edge**: Click field edges to change text alignment:
  - Left edge: Text flows rightward (default)
  - Right edge: Text flows leftward
  - Top edge: Centered text with top padding
  - Bottom edge: Centered text with bottom padding

### 4. ID Generation
- Set the **Number of IDs** to generate (default: 1)
- Click **Generate IDs** to create randomized ID cards
- Watch the progress bar for batch generation

### 5. Customization (Post-Generation)
- **Text Boldness**: Use the Font Weight slider (100-900)
  - Real-time preview updates
  - Applies to all generated IDs
- **Edit Layout**: Return to field editing mode

### 6. Export Options
- **Download Preview**: Save the currently displayed ID
- **Download All (ZIP)**: Export all generated IDs as a ZIP archive
  - Files are named sequentially (id_1.png, id_2.png, etc.)

## Project Structure
```
.
├── index.html                    # Main HTML file
├── server.js                     # Bun server for static files and proxying AI face fetch
├── package.json                  # Project metadata and scripts
├── playwright.config.js          # Playwright test configuration
├── CLAUDE.md                     # AI assistant guidance file
├── TESTING_PLAN.md              # Test implementation plan and checklist
├── styles/
│   └── main.css                  # Stylesheet
├── js/
│   ├── app.js                    # Front-end application logic
│   ├── fieldManager.js           # Draggable/resizable field manager
│   ├── dataGenerator.js          # Random data generator functions
│   ├── config.js                 # Application configuration
│   ├── idGenerator.js            # ID generation logic
│   ├── renderer.js               # Canvas rendering
│   ├── state.js                  # Application state management
│   ├── uiController.js           # UI interaction handling
│   └── exporter.js               # Export functionality
└── tests/
    ├── README.md                 # Testing documentation
    ├── e2e/                      # End-to-end test specs
    │   ├── template-upload.spec.js
    │   ├── field-management.spec.js
    │   ├── id-generation.spec.js
    │   ├── output-validation.spec.js
    │   ├── download.spec.js
    │   └── text-boldness.spec.js
    ├── fixtures/                 # Test assets
    │   └── template_id.JPEG
    └── helpers/                  # Test utilities
        └── test-utils.js
```

## Configuration
- **PORT**: Default is 3000. Can be overridden with `PORT` environment variable.
- **API Proxy**: The `/api/face` endpoint in `server.js` proxies to https://thispersondoesnotexist.com/. Customize as needed.
- **Test Port**: Tests run on port 3001 to avoid conflicts with development server.

## Design System

The application features a modern, professional design inspired by Vodafone's visual language:

- **Color Scheme**: Vodafone red (#E60000) as primary accent with modern secondary colors
- **Typography**: Clean, hierarchical text system with variable font weights
- **Visual Effects**: Glassmorphism, subtle animations, and modern shadows
- **Layout**: Three-panel responsive design with intuitive information architecture
- **Accessibility**: Keyboard navigation, focus indicators, and ARIA labels

For detailed design documentation, see the Design System section in `CLAUDE.md`.

## Contributing
Contributions are welcome! Please fork the repository, create a branch for your feature or fix, and submit a pull request.

## License
Distributed under the ISC License. See `package.json` for license details.