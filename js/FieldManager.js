class FieldManager extends EventTarget {
    constructor(persistence) {
        super();
        this.persistence = persistence;
        this.fields = new Map(); // id -> {element, styles}
        this.selectedFieldId = null;
    }

    init() {
        const persisted = this.persistence.load();
        document.querySelectorAll('.field').forEach((el, index) => {
            const id = el.dataset.id || `field-${index}`;
            el.dataset.id = id;
            const styles = persisted[id]?.styles || {};
            if (styles.fontFamily) el.style.fontFamily = styles.fontFamily;
            if (styles.fontSize) el.style.fontSize = styles.fontSize;
            this.fields.set(id, { element: el, styles });
            el.addEventListener('click', () => this.selectField(id));
        });
    }

    selectField(id) {
        if (this.selectedFieldId) {
            const prev = this.fields.get(this.selectedFieldId)?.element;
            if (prev) prev.classList.remove('selected');
        }
        this.selectedFieldId = id;
        const el = this.fields.get(id)?.element;
        if (el) el.classList.add('selected');
        this.dispatchEvent(new CustomEvent('fieldSelected', { detail: this.getSelectedField() }));
    }

    getSelectedField() {
        if (!this.selectedFieldId) return null;
        const data = this.fields.get(this.selectedFieldId);
        return { id: this.selectedFieldId, element: data.element, styles: data.styles };
    }

    updateStyle(styleUpdates) {
        const selected = this.getSelectedField();
        if (!selected) return;
        const { id, element, styles } = selected;
        Object.assign(styles, styleUpdates);
        if (styleUpdates.fontFamily) element.style.fontFamily = styleUpdates.fontFamily;
        if (styleUpdates.fontSize) element.style.fontSize = styleUpdates.fontSize;
        this.persistence.save(this.exportData());
        this.dispatchEvent(new CustomEvent('styleChanged', { detail: this.getSelectedField() }));
    }

    exportData() {
        const data = {};
        this.fields.forEach((value, id) => {
            data[id] = { styles: value.styles };
        });
        return data;
    }
}

export default FieldManager;
