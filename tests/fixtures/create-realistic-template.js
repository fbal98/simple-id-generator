// Create a more realistic ID template based on actual ID structure
import fs from 'fs';
import path from 'path';

const fixturesDir = path.dirname(import.meta.url.replace('file://', ''));

function createRealisticIDTemplate() {
  const svg = `
    <svg width="600" height="380" xmlns="http://www.w3.org/2000/svg">
      <!-- Background with subtle pattern -->
      <rect width="600" height="380" fill="#f8f9fa"/>
      
      <!-- Main border -->
      <rect x="5" y="5" width="590" height="370" fill="none" stroke="#2c3e50" stroke-width="2" rx="15"/>
      
      <!-- Header section -->
      <rect x="15" y="15" width="570" height="60" fill="#34495e" rx="5"/>
      <text x="300" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="white" font-weight="bold">SULTANATE OF OMAN</text>
      <text x="300" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="white" font-weight="bold">IDENTITY CARD</text>
      
      <!-- Photo area -->
      <rect x="30" y="100" width="120" height="150" fill="#e9ecef" stroke="#6c757d" stroke-width="1" rx="3"/>
      <text x="90" y="150" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">PHOTO</text>
      <text x="90" y="165" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">AREA</text>
      
      <!-- Field labels and areas -->
      <!-- Name field -->
      <text x="170" y="120" font-family="Arial" font-size="12" fill="#495057" font-weight="bold">NAME</text>
      <rect x="170" y="125" width="400" height="25" fill="white" stroke="#ced4da" stroke-width="1" rx="2"/>
      
      <!-- Civil Number field -->
      <text x="170" y="170" font-family="Arial" font-size="12" fill="#495057" font-weight="bold">CIVIL NUMBER</text>
      <rect x="170" y="175" width="200" height="25" fill="white" stroke="#ced4da" stroke-width="1" rx="2"/>
      
      <!-- Date of Birth field -->
      <text x="170" y="220" font-family="Arial" font-size="12" fill="#495057" font-weight="bold">DATE OF BIRTH</text>
      <rect x="170" y="225" width="150" height="25" fill="white" stroke="#ced4da" stroke-width="1" rx="2"/>
      
      <!-- Issue Date field -->
      <text x="340" y="220" font-family="Arial" font-size="12" fill="#495057" font-weight="bold">ISSUE DATE</text>
      <rect x="340" y="225" width="120" height="25" fill="white" stroke="#ced4da" stroke-width="1" rx="2"/>
      
      <!-- Expiry Date field -->
      <text x="480" y="220" font-family="Arial" font-size="12" fill="#495057" font-weight="bold">EXPIRY DATE</text>
      <rect x="480" y="225" width="120" height="25" fill="white" stroke="#ced4da" stroke-width="1" rx="2"/>
      
      <!-- Security features placeholder -->
      <circle cx="500" cy="150" r="30" fill="none" stroke="#28a745" stroke-width="2" opacity="0.3"/>
      <text x="500" y="155" text-anchor="middle" font-family="Arial" font-size="8" fill="#28a745" opacity="0.5">SECURITY</text>
      
      <!-- Footer -->
      <text x="300" y="340" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">TEST ID TEMPLATE - NOT FOR OFFICIAL USE</text>
    </svg>
  `;
  
  return svg;
}

function createDrivingLicenseTemplate() {
  const svg = `
    <svg width="600" height="380" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="600" height="380" fill="#f1f3f4"/>
      
      <!-- Main border -->
      <rect x="5" y="5" width="590" height="370" fill="none" stroke="#1a365d" stroke-width="2" rx="12"/>
      
      <!-- Header section -->
      <rect x="15" y="15" width="570" height="50" fill="#2d3748" rx="5"/>
      <text x="300" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="white" font-weight="bold">DRIVING LICENCE</text>
      <text x="300" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white">SULTANATE OF OMAN</text>
      
      <!-- Photo area -->
      <rect x="30" y="85" width="100" height="130" fill="#e2e8f0" stroke="#4a5568" stroke-width="1" rx="3"/>
      <text x="80" y="125" text-anchor="middle" font-family="Arial" font-size="9" fill="#4a5568">PHOTO</text>
      <text x="80" y="140" text-anchor="middle" font-family="Arial" font-size="9" fill="#4a5568">AREA</text>
      
      <!-- Field areas -->
      <!-- Name -->
      <text x="150" y="105" font-family="Arial" font-size="11" fill="#2d3748" font-weight="bold">NAME</text>
      <rect x="150" y="110" width="420" height="22" fill="white" stroke="#cbd5e0" stroke-width="1" rx="2"/>
      
      <!-- License Number -->
      <text x="150" y="150" font-family="Arial" font-size="11" fill="#2d3748" font-weight="bold">LICENSE NUMBER</text>
      <rect x="150" y="155" width="200" height="22" fill="white" stroke="#cbd5e0" stroke-width="1" rx="2"/>
      
      <!-- Class -->
      <text x="370" y="150" font-family="Arial" font-size="11" fill="#2d3748" font-weight="bold">CLASS</text>
      <rect x="370" y="155" width="100" height="22" fill="white" stroke="#cbd5e0" stroke-width="1" rx="2"/>
      
      <!-- Date of Birth -->
      <text x="150" y="195" font-family="Arial" font-size="11" fill="#2d3748" font-weight="bold">DATE OF BIRTH</text>
      <rect x="150" y="200" width="130" height="22" fill="white" stroke="#cbd5e0" stroke-width="1" rx="2"/>
      
      <!-- Issue Date -->
      <text x="300" y="195" font-family="Arial" font-size="11" fill="#2d3748" font-weight="bold">ISSUE DATE</text>
      <rect x="300" y="200" width="120" height="22" fill="white" stroke="#cbd5e0" stroke-width="1" rx="2"/>
      
      <!-- Expiry Date -->
      <text x="440" y="195" font-family="Arial" font-size="11" fill="#2d3748" font-weight="bold">EXPIRY DATE</text>
      <rect x="440" y="200" width="120" height="22" fill="white" stroke="#cbd5e0" stroke-width="1" rx="2"/>
      
      <!-- Footer -->
      <text x="300" y="350" text-anchor="middle" font-family="Arial" font-size="10" fill="#718096">TEST DRIVING LICENSE TEMPLATE - NOT FOR OFFICIAL USE</text>
    </svg>
  `;
  
  return svg;
}

// Create the templates
const idTemplate = createRealisticIDTemplate();
const licenseTemplate = createDrivingLicenseTemplate();

fs.writeFileSync(path.join(fixturesDir, 'realistic-id-template.svg'), idTemplate);
fs.writeFileSync(path.join(fixturesDir, 'driving-license-template.svg'), licenseTemplate);

console.log('Realistic ID templates created successfully');

// Update test data with more realistic values
const enhancedTestData = {
  sampleNames: [
    'Ahmed Al-Busaidi',
    'Fatma Al-Harthy', 
    'Mohammed Al-Lawati',
    'Aisha Al-Maashani',
    'Salim Al-Habsi',
    'Maryam Al-Kindi',
    'Omar Al-Ghafri',
    'Layla Al-Siyabi'
  ],
  sampleDates: {
    dob: ['1990-05-15', '1985-12-03', '1992-08-20', '1988-03-10', '1995-11-25', '1993-07-08', '1987-02-14', '1991-09-30'],
    issueDate: ['2020-01-15', '2021-06-10', '2022-03-05', '2023-09-20', '2021-12-01', '2022-08-18', '2023-04-12', '2020-11-25'],
    expiryDate: ['2025-01-15', '2026-06-10', '2027-03-05', '2028-09-20', '2026-12-01', '2027-08-18', '2028-04-12', '2025-11-25']
  },
  sampleCivilNumbers: [
    '11870261',
    '09876543', 
    '55556666',
    '11112222',
    '99998888',
    '12345678',
    '87654321',
    '13579246'
  ],
  licenseNumbers: [
    'IDOMN1187026',
    'IDOMN0987654',
    'IDOMN5555666',
    'IDOMN1111222',
    'IDOMN9999888',
    'IDOMN1234567',
    'IDOMN8765432',
    'IDOMN1357924'
  ],
  vehicleClasses: [
    'Light Vehicle',
    'Heavy Vehicle', 
    'Motorcycle',
    'Commercial',
    'Private'
  ]
};

fs.writeFileSync(
  path.join(fixturesDir, 'enhanced-test-data.json'), 
  JSON.stringify(enhancedTestData, null, 2)
);

console.log('Enhanced test data created successfully');