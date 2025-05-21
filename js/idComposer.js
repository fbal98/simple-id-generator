export function composeID({
  templateImage,
  fieldPositions = {},
  data = {},
  faceImage,
  fontFamily = 'sans-serif',
  fontSize = 12
}) {
  // Create off-screen canvas same size as the template
  const canvas = document.createElement('canvas');
  canvas.width = templateImage.width;
  canvas.height = templateImage.height;
  const ctx = canvas.getContext('2d');

  // Draw template image
  if (templateImage) {
    ctx.drawImage(templateImage, 0, 0);
  }

  // Draw face image if provided and position known
  const photoPos = fieldPositions.photo;
  if (faceImage && photoPos) {
    const { x = 0, y = 0, width = faceImage.width, height = faceImage.height } = photoPos;
    ctx.drawImage(faceImage, x, y, width, height);
  }

  // Configure font for text fields
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'black';

  // Draw each text field if coordinates are available
  const drawText = (key) => {
    const pos = fieldPositions[key];
    if (!pos) return;
    const value = data[key] || '';
    ctx.fillText(value, pos.x || 0, pos.y || 0);
  };

  ['name', 'dob', 'civil'].forEach(drawText);

  return canvas;
}
