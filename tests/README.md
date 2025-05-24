# Simple ID Generator - E2E Tests

This directory contains end-to-end tests for the Simple ID Generator application using Playwright.

## Test Structure

```
tests/
├── e2e/                          # End-to-end test specs
│   ├── template-upload.spec.js   # Template upload functionality
│   ├── field-management.spec.js  # Field addition and positioning
│   ├── id-generation.spec.js     # ID generation flow
│   ├── output-validation.spec.js # Visual regression & validation
│   └── download.spec.js          # Download functionality
├── fixtures/                     # Test assets
│   ├── template_id.JPEG          # Sample template image
│   └── test-face.jpg             # Mock face image for API
├── helpers/                      # Test utilities
│   └── test-utils.js             # Common test functions
└── README.md                     # This file
```

## Running Tests

### Prerequisites
```bash
# Install dependencies
bun install

# Install Playwright browsers
bun playwright install
```

### Test Commands
```bash
# Run all tests
bun test

# Run with interactive UI
bun run test:ui

# Run in headed mode (see browser)
bun run test:headed

# Debug mode
bun run test:debug

# Run specific test file
bunx playwright test tests/e2e/template-upload.spec.js

# Run specific test
bunx playwright test -g "should upload and display template image"
```

## Test Coverage

### Template Upload (5 tests)
- Upload validation and display
- Error handling for invalid files
- Large image handling
- Template replacement

### Field Management (12 tests)
- Adding all field types (name, dob, expiry, civil number, photo)
- Drag and drop positioning
- Field resizing
- Label edge positioning
- Field deletion
- Multiple field handling

### ID Generation (10 tests)
- Single and batch generation
- Progress indication
- Data population validation
- API error handling
- Button state management

### Output Validation (10 tests)
- Generated ID visibility
- Field position validation
- Visual regression testing
- Text content validation
- Template integrity

### Download Functionality (9 tests)
- Preview downloads
- ZIP batch downloads
- File integrity verification
- Download progress
- Edit mode functionality

## Key Features

### Visual Regression Testing
Tests automatically capture screenshots and compare against baselines for pixel-perfect validation.

### API Mocking
External face API calls are mocked for consistent test results and offline testing.

### Deterministic Data
Random data generation uses fixed seeds for reproducible test results.

### Error Handling
Tests cover edge cases and error conditions to ensure robust functionality.

## Configuration

Tests run on port 3001 for isolation from development server (port 3000).

Key configuration options in `playwright.config.js`:
- Fixed viewport (1280x720) for consistent screenshots
- Configurable visual diff thresholds
- Automatic server startup/shutdown
- Trace collection on failures

## Troubleshooting

### Common Issues

1. **Server port conflicts**: Tests use port 3001, ensure it's available
2. **Screenshot differences**: Check `test-results/` for diff images
3. **Timeout issues**: Increase timeout in playwright.config.js if needed
4. **Browser installation**: Run `bun playwright install` if browsers missing

### Debugging Tests

Use the `--debug` flag to step through tests interactively:
```bash
bun run test:debug
```

Or run with headed mode to see browser actions:
```bash
bun run test:headed
```

## CI/CD Integration

Tests are configured for CI environments with:
- Retry on failure (2 retries in CI)
- Sequential execution in CI
- HTML report generation
- Screenshot artifact collection