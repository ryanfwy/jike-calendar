const fs = require('fs');
const path = require('path');


const configPath = path.join(__dirname, '..', 'config/setting.json');

class Configation {
    constructor(path) {
        if (!Configation.instance) {
            this._configPath = path;
            this._configJSON = this._loadConfig();
            Configation.instance = this;
        }
        return Configation.instance;
    }

    _loadConfig() {
        return JSON.parse(fs.readFileSync(this._configPath));
    }

    _saveConfig() {
        const config = JSON.stringify(this._configJSON, null, 4);
        fs.writeFileSync(this._configPath, config);
    }

    setConfig(key, value) {
        const conf = this._configJSON;
        conf[key] = value;
        this._saveConfig();
    }

    getConfig(key) {
        return this._configJSON[key];
    }
}

const C = new Configation(configPath);

module.exports = {
    set(key, value) { C.setConfig(key, value); },
    get(key) { return C.getConfig(key); }
}
