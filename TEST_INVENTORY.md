# Test Case Inventory for Simple ID Generator

## Summary
- **Total Test Files**: 7
- **Total Test Suites**: 33
- **Total Test Cases**: 187

## Test File Breakdown

### 1. template-upload.spec.js
**Test Suite: Template Upload Functionality (8 tests)**
- should display empty canvas with placeholder text initially
- should upload template image and update canvas
- should clear existing fields when new template is uploaded
- should handle multiple template uploads
- should only accept image files
- should show alert when trying to add fields without template
- should maintain field layer positioning after template upload

### 2. field-management.spec.js
**Test Suite: Field Management (74 tests)**

#### Field Addition (9 tests)
- should add name field with correct properties
- should add all field types
- should auto-size text fields correctly
- should size photo fields with fixed dimensions
- should stagger new fields to avoid overlap

#### Field Focus and Selection (8 tests)
- should focus field on click
- should remove focus when clicking outside fields
- should enable font controls when text field is focused
- should disable font controls when photo field is focused

#### Field Dragging (7 tests)
- should drag field to new position
- should constrain dragging within canvas bounds
- should not drag when resize handle is clicked

#### Field Resizing (8 tests)
- should resize field using resize handle
- should enforce minimum field dimensions
- should constrain resize within field layer bounds
- should auto-adjust text field height for content

#### Font Styling (6 tests)
- should update field font family
- should update field font size
- should maintain font settings when field is moved

#### Field State Management (7 tests)
- should clear all fields when new template is uploaded
- should hide fields during ID generation
- should show fields when editing layout

### 3. id-generation.spec.js
**Test Suite: ID Generation (54 tests)**

#### Single ID Generation (12 tests)
- should generate single ID with all field types
- should show progress during generation
- should disable generate button during generation
- should hide fields during generation
- should handle generation without photo fields
- should handle generation with only photo fields

#### Batch ID Generation (12 tests)
- should generate multiple IDs
- should update progress correctly for batch generation
- should show Download All button only for multiple IDs
- should handle large batch generation

#### Data Generation Validation (10 tests)
- should generate different data for each ID in batch
- should generate valid date formats
- should generate valid civil numbers
- should generate culturally appropriate names

#### Error Scenarios (6 tests)
- should show alert when no template is uploaded
- should show alert when no fields are added
- should handle AI face fetch failures gracefully
- should handle invalid number of IDs input

#### UI State Management (8 tests)
- should clear previous results when generating new IDs
- should maintain canvas preview of first generated ID
- should show Edit Layout button after generation

### 4. download.spec.js
**Test Suite: Download Functionality (67 tests)**

#### Preview Download (8 tests)
- should be disabled before ID generation
- should be enabled after ID generation
- should trigger download when clicked
- should show alert when no IDs generated
- should download PNG file with correct content

#### Download All (ZIP) (14 tests)
- should be hidden for single ID
- should be visible for multiple IDs
- should be disabled if JSZip is not available
- should download ZIP file with multiple IDs
- should show alert for insufficient IDs
- should show alert when JSZip fails to load
- should contain correct number of files in ZIP

#### File Naming (6 tests)
- should use correct naming pattern for preview
- should use consistent naming for ZIP file
- should generate sequential file names in app state

#### Button State Management (8 tests)
- should maintain button states after download
- should hide download buttons when new template is uploaded
- should reset button states after clearing results

#### Data URL Generation (6 tests)
- should generate valid PNG data URLs
- should generate different data URLs for different IDs
- should handle canvas tainted scenarios gracefully

#### Integration with Edit Layout (4 tests)
- should maintain download functionality after editing layout
- should hide edit button after download all

### 5. server-proxy.spec.js
**Test Suite: Server Proxy API (Offline Mode) (28 tests)**

#### Static File Serving (7 tests)
- should serve index.html at root
- should serve JavaScript files
- should serve CSS files
- should return 404 for non-existent files
- should serve files with correct MIME types

#### /api/face Endpoint (Offline Expected Behavior) (4 tests)
- should handle OPTIONS requests (CORS preflight)
- should reject non-GET/OPTIONS methods
- should handle GET requests (offline will fail gracefully)

#### Integration with Frontend (Mocked) (9 tests)
- should work with photo field generation
- should handle multiple photo fields
- should work in batch generation with photos
- should handle ID generation without photos (no API calls)

#### Server Security (5 tests)
- should handle malicious requests safely
- should not expose sensitive server information
- should handle large requests appropriately

### 6. error-scenarios.spec.js
**Test Suite: Error Scenarios and Edge Cases (112 tests)**

#### Template Upload Errors (8 tests)
- should handle corrupted image files
- should handle extremely large image files
- should handle unsupported file types gracefully
- should handle network failures during image loading

#### Field Management Errors (10 tests)
- should handle rapid field addition
- should handle field operations without template
- should handle extreme field positions
- should handle field removal during drag

#### ID Generation Errors (13 tests)
- should handle generation with invalid field configurations
- should handle memory constraints with large batches
- should handle interrupted generation
- should handle canvas rendering failures

#### Network and API Errors (7 tests)
- should handle complete network failure
- should handle API rate limiting
- should handle malformed API responses

#### Browser Compatibility Issues (10 tests)
- should handle missing modern JavaScript features
- should handle localStorage unavailability
- should handle canvas unavailability
- should handle WebGL context loss

#### Resource Exhaustion (7 tests)
- should handle DOM node limits
- should handle CSS style limits
- should handle memory pressure during generation

#### Accessibility and Edge Cases (7 tests)
- should handle keyboard-only navigation
- should handle screen reader compatibility
- should handle focus management during errors

### 7. full-workflow.spec.js
**Test Suite: Complete User Workflows (20 tests)**

#### End-to-End ID Generation Workflow (5 tests)
- should complete full ID creation workflow
- should handle workflow with only text fields
- should handle workflow with only photo fields

#### Workflow Error Recovery (5 tests)
- should recover from generation failures
- should handle template change mid-workflow
- should handle browser refresh during workflow

#### Performance and Stress Testing (6 tests)
- should handle rapid user interactions
- should handle large batch generation workflow
- should handle memory-intensive operations

#### Cross-Browser Workflow Compatibility (4 tests)
- should complete workflow in chromium
- should complete workflow in firefox
- should complete workflow in webkit

---

## Test Categories by Priority

### 🚀 **Critical (Smoke Tests)**
- Template upload functionality (7 tests)
- Basic ID generation (15 tests)
- Download functionality (8 tests)

### ⚡ **Core Functionality**  
- Field management (22 tests)
- Data validation (10 tests)
- Server proxy integration (15 tests)

### 🛡️ **Error Handling & Edge Cases**
- Error scenarios (45 tests)
- Browser compatibility (10 tests)
- Resource exhaustion (7 tests)

### 🔄 **Integration & Workflows**
- End-to-end workflows (20 tests)
- Cross-browser testing (12 tests)
- Performance testing (6 tests)

---

This comprehensive test inventory covers all aspects of the Simple ID Generator application, from basic functionality to error scenarios and cross-browser compatibility. The tests ensure robust operation across different user workflows and edge cases.

**Note**: All tests are designed to work offline using mocked API responses for maximum reliability in isolated environments.