// Mock face image data for offline testing
// Small 64x64 PNG image encoded as base64
export const MOCK_FACE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Binary data for mock face (1x1 transparent PNG)
export const MOCK_FACE_BINARY = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0xDA, 0x63, 0x64, 0x60, 0x60, 0xF8,
  0x0F, 0x00, 0x01, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x1C, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

// Function to generate different mock faces for variety in tests
export function generateMockFace(seed = 1) {
  // Create a simple pattern based on seed for different "faces"
  const pattern = (seed % 4) + 1;
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg${pattern}=`;
}

// Setup function to mock /api/face endpoint
export async function setupFaceMocking(page) {
  let requestCount = 0;
  
  await page.route('**/api/face', async (route) => {
    requestCount++;
    
    // Simulate slight delay like real API
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: MOCK_FACE_BINARY
    });
  });
  
  return () => requestCount;
}

// Mock for error scenarios
export async function setupFaceErrorMocking(page, errorType = 'network') {
  await page.route('**/api/face', async (route) => {
    if (errorType === 'network') {
      await route.abort('internetdisconnected');
    } else if (errorType === 'timeout') {
      // Simulate timeout
      await new Promise(resolve => setTimeout(resolve, 10000));
      await route.fulfill({ status: 408 });
    } else if (errorType === 'server') {
      await route.fulfill({ 
        status: 500, 
        body: 'Internal Server Error',
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  });
}