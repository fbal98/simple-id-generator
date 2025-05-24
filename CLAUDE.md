# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simple ID Generator is a web application that allows users to:
1. Upload custom ID template images
2. Add customizable text and photo fields to the template
3. Generate multiple ID cards with randomized data
4. Download individual IDs or all generated IDs as a ZIP archive

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