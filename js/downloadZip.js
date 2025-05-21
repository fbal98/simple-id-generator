import JSZip from 'jszip';

/**
 * Generate a ZIP from the provided blobs and trigger a client-side download.
 * @param {Blob[]} blobs array of Blob objects to include in the zip
 */
export async function downloadBlobsAsZip(blobs) {
  if (!blobs || blobs.length === 0) {
    return;
  }
  const zip = new JSZip();
  blobs.forEach((blob, i) => {
    const name = `FakeID_${i}.png`;
    zip.file(name, blob);
  });
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FakeIDs.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
