class BaseModel {
    constructor(data = {}) {
        this._id = data.id || null;
    }

    get id() {
        return this._id;
    }
    set id(value) {
        throw new Error('ID is read-only');
    }

    toJSON() {
        const json = {...this};
        delete json._id;
        return json;
    }
}
