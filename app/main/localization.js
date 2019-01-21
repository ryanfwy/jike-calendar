const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const language = require('./config').get('language');


const localePath = path.join(__dirname, '../locales/');

class Localization {
    constructor(path) {
        if (!Localization.instance) {
            this._localePath = path;
            this._localeJSON = this._loadLocale();
            Localization.instance = this;
        }
        return Localization.instance;
    }

    _loadLocale() {
        const locale = (language === 'system' ? app.getLocale() : language).replace(/-.+$/, '');
        if(fs.existsSync(this._localePath + locale + '.json')) {
            return JSON.parse(fs.readFileSync(this._localePath + locale + '.json', 'utf8'));
        } else {
            return JSON.parse(fs.readFileSync(this._localePath + 'en.json', 'utf8'));
        }
    }

    get(key) {
        return this._localeJSON[key] ? this._localeJSON[key] : key;
    }
}

const L = new Localization(localePath);

module.exports = {
    l10n(key) { return L.get(key); }
};
