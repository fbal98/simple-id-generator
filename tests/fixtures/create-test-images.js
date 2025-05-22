// Helper script to create test fixture images
// Run with: bun tests/fixtures/create-test-images.js

import fs from 'fs';
import path from 'path';

const fixturesDir = path.dirname(import.meta.url.replace('file://', ''));

// Create test images as SVG (no external dependencies needed)
function createSimpleTestImage() {
  // Create a simple SVG that can be used as a test image
  const svg = `
    <svg width="600" height="380" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="380" fill="#f0f0f0"/>
      <rect x="10" y="10" width="580" height="360" fill="none" stroke="#333" stroke-width="2"/>
      <text x="300" y="50" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">TEST ID TEMPLATE</text>
      
      <!-- Photo area -->
      <rect x="50" y="100" width="120" height="150" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <text x="110" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Photo Area</text>
      
      <!-- Text field areas -->
      <rect x="200" y="100" width="350" height="30" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <text x="375" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Name Field Area</text>
      
      <rect x="200" y="150" width="150" height="30" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <text x="275" y="170" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">DOB Area</text>
      
      <rect x="200" y="200" width="150" height="30" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <text x="275" y="220" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Civil No Area</text>
      
      <rect x="200" y="250" width="150" height="30" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <text x="275" y="270" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Issue Date Area</text>
      
      <rect x="200" y="300" width="150" height="30" fill="none" stroke="#ccc" stroke-width="1" stroke-dasharray="5,5"/>
      <text x="275" y="320" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Expiry Date Area</text>
    </svg>
  `;
  
  return svg;
}

// Create SVG test images
const svgTemplate = createSimpleTestImage();
fs.writeFileSync(path.join(fixturesDir, 'test-id-template.svg'), svgTemplate);

// Create a smaller SVG
const smallSvg = `
  <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="#e8f4fd"/>
    <rect x="5" y="5" width="290" height="190" fill="none" stroke="#2196F3" stroke-width="3"/>
    <text x="150" y="100" text-anchor="middle" font-family="Arial" font-size="18" fill="#1976D2">SMALL TEST TEMPLATE</text>
  </svg>
`;
fs.writeFileSync(path.join(fixturesDir, 'small-test-template.svg'), smallSvg);

console.log('SVG test images created successfully');

// Also create a test data file
const testData = {
  sampleNames: [
    'Ahmed Al-Busaidi',
    'Fatma Al-Harthy', 
    'Mohammed Al-Lawati',
    'Aisha Al-Maashani',
    'Salim Al-Habsi'
  ],
  sampleDates: {
    dob: ['1990-05-15', '1985-12-03', '1992-08-20', '1988-03-10', '1995-11-25'],
    issueDate: ['2020-01-15', '2021-06-10', '2022-03-05', '2023-09-20', '2021-12-01'],
    expiryDate: ['2025-01-15', '2026-06-10', '2027-03-05', '2028-09-20', '2026-12-01']
  },
  sampleCivilNumbers: [
    '1234567890',
    '0987654321', 
    '5555666677',
    '1111222233',
    '9999888877'
  ]
};

fs.writeFileSync(
  path.join(fixturesDir, 'test-data.json'), 
  JSON.stringify(testData, null, 2)
);

console.log('Test data file created successfully');