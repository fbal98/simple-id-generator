export async function generateBatch(count, fieldPositions, templateImage) {
  const canvases = [];
  for (let index = 0; index < count; index++) {
    // Start generating record and fetching face simultaneously
    const [record, face] = await Promise.all([
      generateRecord(),
      fetchFace(),
    ]);

    // composeID might be async so await its result
    const canvas = await composeID(record, face, fieldPositions, templateImage);
    canvases.push(canvas);

    // Dispatch progress event after each ID is generated
    document.dispatchEvent(
      new CustomEvent('batch:progress', {
        detail: { current: canvases.length, total: count },
      })
    );
  }

  // Dispatch done event with all canvases
  document.dispatchEvent(
    new CustomEvent('batch:done', { detail: canvases })
  );
  return canvases;
}
