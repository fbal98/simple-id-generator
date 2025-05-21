class PositionPersistence {
    constructor(key = 'fieldData') {
        this.key = key;
    }

    load() {
        const raw = localStorage.getItem(this.key);
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }

    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch {
            // ignore storage errors
        }
    }
}

export default PositionPersistence;
