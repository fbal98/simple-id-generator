# Simple ID Generator

A simple web application to generate randomized ID cards based on a user-provided template.

## Features
- Upload a custom ID template image (PNG, JPEG, etc.).
- Add draggable and resizable text fields (Name, Date of Birth, Issue Date, Expiry Date, Civil Number).
- Add a photo field that fetches AI-generated faces via a local proxy.
- Generate multiple ID cards with randomized data.
- Adjust text boldness with real-time preview (font weight 100-900).
- Preview the first generated ID and download individual IDs or all as a ZIP archive.

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
1. In the **Controls** panel (left), upload your ID template image.
2. Click the buttons to add fields: Name, Date of Birth, Issue Date, Expiry Date, Civil Number, or Photo.
3. **Position and configure fields:**
   - **Drag** fields to reposition them on the template
   - **Resize** fields using the resize handle (bottom-right corner when focused)
   - **Set label edge** by clicking on edge indicators (left, right, top, bottom) when field is focused:
     - **Left edge**: Text grows rightward (default)
     - **Right edge**: Text grows leftward  
     - **Top edge**: Text is centered with top padding
     - **Bottom edge**: Text is centered with bottom padding
4. In the **Generation** panel (right), set the number of IDs to generate.
5. Click **Generate IDs**.
6. **Adjust text boldness** (after generation):
   - Use the **Font Weight** slider that appears after generating IDs
   - Adjust from 100 (thin) to 900 (black) in increments of 100
   - Changes apply instantly to the preview
   - All downloaded IDs will use the selected font weight
7. Preview the first ID on the canvas. Click **Download Preview** to save it.
8. If multiple IDs are generated, click **Download All (ZIP)** to download a ZIP archive of all IDs.
   If the JSZip library fails to load, this button will be disabled.

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

## Contributing
Contributions are welcome! Please fork the repository, create a branch for your feature or fix, and submit a pull request.

## License
Distributed under the ISC License. See `package.json` for license details.