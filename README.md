# Simple ID Generator

A simple web application to generate randomized ID cards based on a user-provided template.

## Features
- Upload a custom ID template image (PNG, JPEG, etc.).
- Add draggable and resizable text fields (Name, Date of Birth, Issue Date, Expiry Date, Civil Number).
- Add a photo field that fetches AI-generated faces via a local proxy.
- Generate multiple ID cards with randomized data.
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

## Usage
1. In the **Controls** panel (left), upload your ID template image.
2. Click the buttons to add fields: Name, Date of Birth, Issue Date, Expiry Date, Civil Number, or Photo.
3. Drag and resize fields on the template to position them as desired.
4. In the **Generation** panel (right), set the number of IDs to generate.
5. Click **Generate IDs**.
6. Preview the first ID on the canvas. Click **Download Preview** to save it.
7. If multiple IDs are generated, click **Download All (ZIP)** to download a ZIP archive of all IDs.
   If the JSZip library fails to load, this button will be disabled.

## Project Structure
```
.
├── index.html           # Main HTML file
├── server.js            # Bun server for static files and proxying AI face fetch
├── package.json         # Project metadata and scripts
├── bun.lockb            # Bun lockfile
├── styles/
│   └── main.css         # Stylesheet
└── js/
    ├── app.js           # Front-end application logic
    ├── fieldManager.js  # Draggable/resizable field manager
    └── dataGenerator.js # Random data generator functions
```

## Configuration
- **PORT**: Default is 3000. Modify the `PORT` constant in `server.js` to change.
- **API Proxy**: The `/api/face` endpoint in `server.js` proxies to https://thispersondoesnotexist.com/. Customize as needed.

## Contributing
Contributions are welcome! Please fork the repository, create a branch for your feature or fix, and submit a pull request.

## License
Distributed under the ISC License. See `package.json` for license details.