import * as fieldManager from './fieldManager.js';
import * as dataGenerator from './dataGenerator.js';

// DOM Elements
const templateUpload = document.getElementById('templateUpload');
const idCanvas = document.getElementById('idCanvas');
const ctx = idCanvas.getContext('2d');

const addNameFieldButton = document.getElementById('addNameField');
const addDOBFieldButton = document.getElementById('addDOBField');
const addIssueDateFieldButton = document.getElementById('addIssueDateField');
const addExpiryDateFieldButton = document.getElementById('addExpiryDateField');
const addCivilNoFieldButton = document.getElementById('addCivilNoField');
const addPhotoFieldButton = document.getElementById('addPhotoField');

const numIDsToGenerateInput = document.getElementById('numIDsToGenerate');
const generateButton = document.getElementById('generateButton');
const downloadPreviewButton = document.getElementById('downloadPreviewButton');
const downloadAllButton = document.getElementById('downloadAllButton');

// App State
let templateImage = null;
let fields = {}; // Stores configuration of added fields: { id: {type, x, y, width, height, text} }
let generatedIdObjects = []; // Stores { name: string, dataUrl: string } for generated IDs

// Initialize field manager with the canvas
fieldManager.initializeFieldManager(idCanvas);

// Event Listeners

templateUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            templateImage = new Image();
            templateImage.onload = () => {
                idCanvas.width = templateImage.width;
                idCanvas.height = templateImage.height;
                redrawCanvasWithTemplate();
                fieldManager.updateFieldLayerPosition();
                fieldManager.clearFields();
                fields = {};
                generatedIdObjects = [];
                downloadAllButton.style.display = 'none';
            };
            templateImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function addNewField(type, placeholderText) {
    if (!templateImage) {
        alert('Please upload an ID template image first.');
        return;
    }
    const fieldData = fieldManager.addField(type, placeholderText);
    if (fieldData) {
        fields[fieldData.id] = fieldData;
    }
}

addNameFieldButton.addEventListener('click', () => addNewField('name', 'Full Name'));
addDOBFieldButton.addEventListener('click', () => addNewField('dob', 'YYYY-MM-DD'));
addIssueDateFieldButton.addEventListener('click', () => addNewField('issueDate', 'YYYY-MM-DD'));
addExpiryDateFieldButton.addEventListener('click', () => addNewField('expiryDate', 'YYYY-MM-DD'));
addCivilNoFieldButton.addEventListener('click', () => addNewField('civilNo', 'Civil Number/ID'));
addPhotoFieldButton.addEventListener('click', () => addNewField('photo', 'Photo'));

fieldManager.fieldLayer.addEventListener('field:moved', (event) => {
    const { id, x, y, width, height } = event.detail;
    if (fields[id]) {
        fields[id].x = x;
        fields[id].y = y;
        fields[id].width = width;
        fields[id].height = height;
    }
});

function redrawCanvasWithTemplate() {
    if (!idCanvas || !ctx) return;
    ctx.clearRect(0, 0, idCanvas.width, idCanvas.height);
    if (templateImage) {
        ctx.drawImage(templateImage, 0, 0, idCanvas.width, idCanvas.height);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, idCanvas.width, idCanvas.height);
        ctx.fillStyle = '#777';
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillText('Upload a template image', idCanvas.width / 2, idCanvas.height / 2);
    }
}

async function fetchAIFace() {
    // IMPORTANT: This direct fetch might fail due to CORS issues if thispersondoesnotexist.com
    // does not send appropriate Access-Control-Allow-Origin headers.
    // If it fails, the canvas will be "tainted" when drawing this image,
    // and toDataURL() will throw a security error.
    // A CORS proxy might be needed for robust fetching.
    try {
        // Adding a timestamp to the URL query string to try and prevent caching and get a new image.
        const response = await fetch(`https://thispersondoesnotexist.com/?_=${new Date().getTime()}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to fetch AI face: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src); // Clean up blob URL
                resolve(img);
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(img.src);
                console.error("Error loading AI Face into Image object:", err);
                reject(new Error('Failed to load AI face image data. Check CORS policy of the source.'));
            };
            // Using crossOrigin="Anonymous" is crucial for drawing cross-origin images to canvas
            // if the server sends `Access-Control-Allow-Origin: *`.
            img.crossOrigin = "Anonymous";
            img.src = URL.createObjectURL(blob);
        });
    } catch (error) {
        console.error('Error fetching AI face:', error);
        return null; // Return null if fetching fails
    }
}

function renderSingleIdToContext(targetCtx, baseTemplate, fieldLayouts, textDataById, photoDataById, scaleX = 1, scaleY = 1) {
    targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    if (baseTemplate) {
        targetCtx.drawImage(baseTemplate, 0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    }

    targetCtx.font = '16px Arial'; // Example font, consider making this configurable per field
    targetCtx.fillStyle = 'black';
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';

    console.log("Rendering ID with fieldLayouts:", JSON.parse(JSON.stringify(fieldLayouts)));
    console.log("Text data by ID:", JSON.parse(JSON.stringify(textDataById)));
    console.log("Photo data by ID keys:", Object.keys(photoDataById));


    for (const fieldKey in fieldLayouts) { // Use fieldKey to avoid conflict with global 'id' if any
        const field = fieldLayouts[fieldKey];
        console.log(`Rendering field: ID=${field.id}, Type=${field.type}, X=${field.x}, Y=${field.y}`);
        const x = field.x * scaleX;
        const y = field.y * scaleY;
        const width = field.width * scaleX;
        const height = field.height * scaleY;

        if (field.type === 'photo') {
            const photoImageObj = photoDataById[field.id];
            console.log(`For field ID ${field.id} (type ${field.type}), photo object present: ${!!photoImageObj}`);
            if (photoImageObj) {
                try {
                    targetCtx.drawImage(photoImageObj, x, y, width, height);
                } catch (e) {
                    console.error(`Error drawing photo for field ${field.id} (possibly CORS tainted):`, e);
                    targetCtx.fillStyle = 'rgba(255,0,0,0.5)';
                    targetCtx.fillRect(x, y, width, height);
                    targetCtx.fillStyle = 'white';
                    targetCtx.textAlign = 'center';
                    targetCtx.textBaseline = 'middle';
                    targetCtx.fillText('Photo Error', x + width / 2, y + height / 2);
                    targetCtx.fillStyle = 'black'; // Reset
                    targetCtx.textAlign = 'left'; // Reset
                    targetCtx.textBaseline = 'top'; // Reset
                }
            } else {
                targetCtx.strokeStyle = 'red';
                targetCtx.lineWidth = 1;
                targetCtx.strokeRect(x, y, width, height);
                targetCtx.fillStyle = 'red';
                targetCtx.textAlign = 'center';
                targetCtx.textBaseline = 'middle';
                targetCtx.fillText('No Photo Data', x + width / 2, y + height / 2);
                targetCtx.fillStyle = 'black'; // Reset
                targetCtx.textAlign = 'left'; // Reset
                targetCtx.textBaseline = 'top'; // Reset
            }
        } else {
            let textToDraw = textDataById[field.id] || `[${field.type}]`;
            console.log(`For field ID ${field.id} (type ${field.type}), drawing text: "${textToDraw}"`);
            // Basic text wrapping
            const lines = [];
            let currentLine = '';
            const words = String(textToDraw).split(' '); // Ensure textToDraw is a string
            for(const word of words) {
                const testLine = currentLine + word + ' ';
                const metrics = targetCtx.measureText(testLine);
                if (metrics.width > width && currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            lines.forEach((line, index) => {
                 targetCtx.fillText(line.trim(), x + 2, y + 2 + (index * 16)); // 16 for line height
            });
        }
    }
}

generateButton.addEventListener('click', async () => {
    if (!templateImage) {
        alert('Please upload a template image first.');
        return;
    }
    if (Object.keys(fields).length === 0) {
        alert('Please add some fields to the template.');
        return;
    }

    const numIDs = parseInt(numIDsToGenerateInput.value) || 1;
    generateButton.disabled = true;
    generateButton.textContent = 'Generating...';
    generatedIdObjects = []; // Clear previous results

    for (let i = 0; i < numIDs; i++) {
        const idInstanceData = { text: {}, photos: {} }; // Stores data per field.id for the current ID card

        // Generate data for each field instance
        for (const fieldIdKey in fields) { // Use fieldIdKey to avoid conflict
            const field = fields[fieldIdKey];
            switch (field.type) {
                case 'name':
                    idInstanceData.text[field.id] = dataGenerator.getRandomName();
                    break;
                case 'dob':
                    idInstanceData.text[field.id] = dataGenerator.getRandomDate(1970, 2004);
                    break;
                case 'issueDate':
                    idInstanceData.text[field.id] = dataGenerator.getRandomDate(2020, 2023);
                    break;
                case 'expiryDate':
                    idInstanceData.text[field.id] = dataGenerator.getRandomDate(2024, 2030);
                    break;
                case 'civilNo':
                    idInstanceData.text[field.id] = dataGenerator.getRandomCivilNumber();
                    break;
                case 'photo':
                    try {
                        // Fetch a unique face for each photo field instance
                        idInstanceData.photos[field.id] = await fetchAIFace();
                    } catch (e) {
                        console.error(`Failed to fetch AI face for field ${field.id} on ID ${i + 1}: ${e.message}`);
                        idInstanceData.photos[field.id] = null; // Store null if fetch fails
                    }
                    break;
            }
        }
        
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = templateImage.width;
        offscreenCanvas.height = templateImage.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        // Calculate scale factors between displayed canvas and actual image size
        const scaleX = templateImage.width / idCanvas.clientWidth;
        const scaleY = templateImage.height / idCanvas.clientHeight;

        // Pass data keyed by field.id to the rendering function with scaling
        renderSingleIdToContext(
            offscreenCtx,
            templateImage,
            fields,
            idInstanceData.text,
            idInstanceData.photos,
            scaleX,
            scaleY
        );
        
        try {
            const dataUrl = offscreenCanvas.toDataURL('image/png');
            generatedIdObjects.push({ name: `id_${i + 1}.png`, dataUrl: dataUrl });

            if (i === 0) { // Preview the first generated ID on the main canvas
                const previewImage = new Image();
                previewImage.onload = () => {
                    ctx.clearRect(0,0, idCanvas.width, idCanvas.height);
                    ctx.drawImage(previewImage, 0,0);
                }
                previewImage.src = dataUrl;
            }
        } catch (e) {
            console.error("Error generating data URL (possibly due to tainted canvas from CORS):", e);
            alert("Error generating image. This might be due to CORS policy on the AI face image source. Check console for details.");
            // If one fails, likely all will. Stop generation.
            generatedIdObjects = []; // Clear partial results
            break;
        }
    }

    generateButton.disabled = false;
    generateButton.textContent = 'Generate IDs';

    if (generatedIdObjects.length > 0) {
        downloadPreviewButton.disabled = false;
        if (generatedIdObjects.length > 1) {
            downloadAllButton.style.display = 'inline-block'; // Or 'block' depending on layout
        } else {
            downloadAllButton.style.display = 'none';
        }
    } else {
        downloadPreviewButton.disabled = true;
        downloadAllButton.style.display = 'none';
        redrawCanvasWithTemplate(); // Show blank template if generation failed
    }
});

downloadPreviewButton.addEventListener('click', () => {
    if (generatedIdObjects.length > 0) {
        const firstId = generatedIdObjects[0];
        const a = document.createElement('a');
        a.href = firstId.dataUrl;
        a.download = firstId.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert('No ID generated yet to download. Please generate IDs first.');
    }
});

downloadAllButton.addEventListener('click', () => {
    if (generatedIdObjects.length > 1) {
        const zip = new JSZip();
        generatedIdObjects.forEach(idObj => {
            // JSZip needs the base64 part of the data URL
            const base64Data = idObj.dataUrl.split(',')[1];
            zip.file(idObj.name, base64Data, { base64: true });
        });
        zip.generateAsync({ type: 'blob' })
            .then(function (content) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = 'generated_ids.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            });
    } else {
        alert('Generate at least two IDs to download a ZIP.');
    }
});

// Initial setup
window.addEventListener('DOMContentLoaded', () => {
    if (!templateImage) {
        idCanvas.width = 600;
        idCanvas.height = 380;
        redrawCanvasWithTemplate();
        fieldManager.updateFieldLayerPosition();
    }
    downloadPreviewButton.disabled = true;
    downloadAllButton.style.display = 'none';
});

// For easier debugging
window.appState = {
    getFields: () => fields,
    getTemplate: () => templateImage,
    getGeneratedIds: () => generatedIdObjects,
    redraw: redrawCanvasWithTemplate,
};

console.log('App loaded. JSZip should be available.');