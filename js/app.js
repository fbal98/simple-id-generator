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
const fontFamilySelect = document.getElementById('fontFamilySelect');
const fontSizeInput = document.getElementById('fontSizeInput');
const progressWrapper = document.getElementById('progressWrapper');
const progressBar = document.getElementById('generationProgress');
const progressText = document.getElementById('progressText');

// Check if JSZip loaded from CDN
const jszipAvailable = typeof window.JSZip !== 'undefined';

// App State
let templateImage = null;
let fields = {}; // Stores configuration of added fields: { id: {type, x, y, width, height, text, fontFamily, fontSize} }
let generatedIdObjects = []; // Stores { name: string, dataUrl: string } for generated IDs
let selectedFieldId = null;

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
    fieldManager.showAllFields();
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
    const { id, x, y, width, height, fontFamily, fontSize } = event.detail;
    if (fields[id]) {
        fields[id].x = x;
        fields[id].y = y;
        fields[id].width = width;
        fields[id].height = height;
        if (fontFamily) fields[id].fontFamily = fontFamily;
        if (fontSize) fields[id].fontSize = fontSize;
    }
});

fieldManager.fieldLayer.addEventListener('field:focused', (event) => {
    if (event.detail) {
        selectedFieldId = event.detail.id;
        const field = fields[selectedFieldId];
        if (field && field.type !== 'photo') {
            fontFamilySelect.value = field.fontFamily || 'Arial';
            fontSizeInput.value = field.fontSize || 16;
            fontFamilySelect.disabled = false;
            fontSizeInput.disabled = false;
        } else {
            fontFamilySelect.disabled = true;
            fontSizeInput.disabled = true;
        }
    } else {
        selectedFieldId = null;
        fontFamilySelect.disabled = true;
        fontSizeInput.disabled = true;
    }
});

fontFamilySelect.addEventListener('change', () => {
    if (selectedFieldId && fields[selectedFieldId]) {
        const val = fontFamilySelect.value;
        fields[selectedFieldId].fontFamily = val;
        const el = document.getElementById(selectedFieldId);
        if (el) el.style.fontFamily = val;
    }
});

fontSizeInput.addEventListener('change', () => {
    if (selectedFieldId && fields[selectedFieldId]) {
        const size = parseInt(fontSizeInput.value, 10) || 16;
        fields[selectedFieldId].fontSize = size;
        const el = document.getElementById(selectedFieldId);
        if (el) el.style.fontSize = `${size}px`;
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
    try {
        let imageData;
        
        // Use our local Bun server as a proxy
        console.log('Using local Bun server as proxy for AI face');
        
        // Local server endpoint that handles CORS and proxies the request
        const localProxyUrl = 'http://localhost:3000/api/face';
        
        // The server at /api/face is configured to not cache,
        // so client-side cache busting (query params or cache option) is not strictly necessary here.
        console.log('Fetching from:', localProxyUrl);
        
        const response = await fetch(localProxyUrl);
        
        if (!response.ok) {
            let errorText = response.statusText;
            try {
                // Attempt to get more detailed error from proxy response body
                const bodyText = await response.text();
                if (bodyText) errorText += ` - ${bodyText}`;
            } catch (e) {
                // Ignore if can't read body
            }
            console.error(`Failed to fetch AI face via proxy: ${response.status} ${errorText}`);
            throw new Error(`Failed to fetch AI face via proxy: ${response.status} ${errorText}`);
        }
        
        const blob = await response.blob();
        imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => {
                console.error('FileReader error while reading AI face blob.');
                reject(new Error('FileReader error reading AI face blob.'));
            };
            reader.readAsDataURL(blob);
        });

        if (!imageData) { // Should not happen if previous steps succeeded, but as a safeguard.
            console.error('AI face imageData is null after successful fetch and read.');
            return null;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => {
                console.error("Error loading AI Face data URL into Image object:", err);
                reject(new Error('Failed to load AI face image data into Image object.'));
            };
            img.src = imageData;
        });

    } catch (error) {
        console.error('Error in fetchAIFace:', error.message);
        // Don't alert - handle gracefully by returning null
        return null; 
    }
}

function renderSingleIdToContext(targetCtx, baseTemplate, fieldLayouts, textDataById, photoDataById, scaleX = 1, scaleY = 1) {
    targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    if (baseTemplate) {
        targetCtx.drawImage(baseTemplate, 0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    }

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
            const scaledFontSize = (field.fontSize || 16) * scaleY;
            targetCtx.font = `${scaledFontSize}px ${field.fontFamily || 'Arial'}`;
            // const lineHeight = scaledFontSize; // Not strictly needed for single line in this manner

            const paddingX = 2 * scaleX; // Small horizontal padding from left edge
            const paddingY = 2 * scaleY; // Small vertical padding from top edge
            
            // Draw text as a single line, no wrapping
            targetCtx.fillText(String(textToDraw).trim(), x + paddingX, y + paddingY);
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
    if (progressWrapper) {
        progressBar.max = numIDs;
        progressBar.value = 0;
        progressText.textContent = `0 / ${numIDs}`;
        progressWrapper.style.display = 'block';
    }

    const idPromises = [];

    for (let i = 0; i < numIDs; i++) {
        idPromises.push((async () => {
            const idInstanceData = { text: {}, photos: {} };
            const photoPromises = [];

            // Generate data for each field instance
            for (const fieldIdKey in fields) {
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
                        photoPromises.push(
                            fetchAIFace()
                                .then(img => {
                                    idInstanceData.photos[field.id] = img;
                                })
                                .catch(e => {
                                    console.error(`Failed to fetch AI face for field ${field.id} on ID ${i + 1}: ${e.message}`);
                                    idInstanceData.photos[field.id] = null;
                                })
                        );
                        break;
                }
            }

            await Promise.all(photoPromises);

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = templateImage.width;
            offscreenCanvas.height = templateImage.height;
            const offscreenCtx = offscreenCanvas.getContext('2d');

            // Calculate scale factors between displayed canvas and actual image size
            const scaleX = templateImage.width / idCanvas.clientWidth;
            const scaleY = templateImage.height / idCanvas.clientHeight;

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
                generatedIdObjects[i] = { name: `id_${i + 1}.png`, dataUrl: dataUrl };

                if (i === 0) {
                    const previewImage = new Image();
                    previewImage.onload = () => {
                        ctx.clearRect(0, 0, idCanvas.width, idCanvas.height);
                        ctx.drawImage(previewImage, 0, 0);
                        fieldManager.hideAllFields();
                    };
                    previewImage.src = dataUrl;
                }
            } catch (e) {
                console.error('Error generating data URL (possibly due to tainted canvas from CORS):', e);
                alert('Error generating image. This might be due to CORS policy on the AI face image source. Check console for details.');
                generatedIdObjects = [];
            }

            if (progressWrapper) {
                progressBar.value += 1;
                progressText.textContent = `${progressBar.value} / ${numIDs}`;
            }
        })());
    }

    await Promise.all(idPromises);

    generateButton.disabled = false;
    generateButton.textContent = 'Generate IDs';
    if (progressWrapper) {
        progressWrapper.style.display = 'none';
        progressBar.value = 0;
        progressText.textContent = '';
    }

    if (generatedIdObjects.length > 0) {
        downloadPreviewButton.disabled = false;
        if (generatedIdObjects.length > 1 && jszipAvailable) {
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
        if (typeof window.JSZip === 'undefined') {
            alert('JSZip library failed to load. Unable to generate ZIP file.');
            return;
        }
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
    fontFamilySelect.disabled = true;
    fontSizeInput.disabled = true;

    if (!jszipAvailable) {
        downloadAllButton.disabled = true;
        console.warn('JSZip failed to load. Download All feature disabled.');
    }
});

// For easier debugging
window.appState = {
    getFields: () => fields,
    getTemplate: () => templateImage,
    getGeneratedIds: () => generatedIdObjects,
    redraw: redrawCanvasWithTemplate,
};

console.log('App loaded.', jszipAvailable ? 'JSZip detected.' : 'JSZip NOT detected.');