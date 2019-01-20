const { app } = require('electron');
const { language } = require('./config');
const path = require('path');
const fs = require('fs');


class Localization {
    constructor() {
        this.__localeJSON = this.constructor.loadLocale();
    }

    static loadLocale() {
        const locale = (language === 'system' ? app.getLocale() : language).replace(/-.+$/, '');
        const localePath = path.join(__dirname, '../locales/');
        if(fs.existsSync(localePath + locale + '.json')) {
            return JSON.parse(fs.readFileSync(localePath + locale + '.json', 'utf8'));
        } else {
            return JSON.parse(fs.readFileSync(localePath + 'en.json', 'utf8'));
        }
    }

    get(key) {
        return this.__localeJSON[key] ? this.__localeJSON[key] : key;
    }
}

const L = new Localization();

module.exports = {
    l10n(key) {
        return L.get(key);
    }
};
