/**
 * Fetches an AI-generated face image and returns it as an Image object.
 * Retries up to three times on network failure.
 */
export async function fetchFace() {
  const url = 'https://thispersondoesnotexist.com/image';
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(objectUrl);
          reject(e);
        };
      });

      return img;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }
}
