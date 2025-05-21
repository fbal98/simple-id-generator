export default function initStyleControls(fieldManager) {
    const panel = document.getElementById('leftPanel');
    if (!panel) return;

    const container = document.createElement('div');
    container.id = 'styleControls';
    container.style.display = 'none';

    // Font family dropdown
    const familyLabel = document.createElement('label');
    familyLabel.textContent = 'Font Family:';
    const familySelect = document.createElement('select');
    ['Arial', 'Courier New', 'Times New Roman', 'Sans-serif'].forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = f;
        familySelect.appendChild(opt);
    });

    // Font size slider
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Font Size:';
    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '8';
    sizeSlider.max = '72';

    container.appendChild(familyLabel);
    container.appendChild(familySelect);
    container.appendChild(sizeLabel);
    container.appendChild(sizeSlider);

    panel.appendChild(container);

    const showControls = fieldData => {
        if (!fieldData) {
            container.style.display = 'none';
            return;
        }
        container.style.display = 'block';
        familySelect.value = fieldData.styles.fontFamily || 'Arial';
        const size = parseInt(fieldData.styles.fontSize, 10);
        sizeSlider.value = size || 16;
    };

    fieldManager.addEventListener('fieldSelected', e => showControls(e.detail));

    familySelect.addEventListener('change', () => {
        fieldManager.updateStyle({ fontFamily: familySelect.value });
    });

    sizeSlider.addEventListener('input', () => {
        fieldManager.updateStyle({ fontSize: `${sizeSlider.value}px` });
    });

    // Show current selected field if any at init
    showControls(fieldManager.getSelectedField());
}
