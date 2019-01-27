const fs = require('fs');
const fs_ori = require('original-fs')
const path = require('path');
const config = require('./config');
const { net, dialog, BrowserWindow, app, shell } = require('electron');
const { l10n } = require('./localization');


class Update {
    constructor(path) {
        if (!Update.instance) {
            this._packagePath = path;
            this._packageJSON = this._loadPackage();
            this._version = '';
            this._url = "";
            this._querying = false;

            this._loadUpdateInfo();
            Update.instance = this;
        }
        return Update.instance;
    }

    // 0 => equal, -1 => no update, 1 => has update
    static compareVersion(local, online) {
        const localArr = local.split('.').map(x => { return Number(x); });
        const onlineArr = online.split('.').map(x => { return Number(x); });

        for (let i=0; i<3; i++) {
            if (onlineArr[i] > localArr[i]) return 1;
            else if (onlineArr[i] < localArr[i]) return -1;
        }
        return 0;
    }

    _loadPackage() {
        return JSON.parse(fs.readFileSync(this._packagePath));
    }

    _loadUpdateInfo() {
        this._version = this._packageJSON['version'];
        this._url = this._packageJSON['resource']['url'];
    }

    _getHttpsData(url, showProgress=false) {
        if (this._querying) return; // Avoid conflict

        this._querying = true;
        let bufferArray = [];
        return new Promise(resolve => {
            let request = net.request({
                method: 'GET',
                url: url
            });
            request.on('response', (response) => {
                if (response.statusCode !== 200) { resolve(null); };

                if (showProgress) {
                    this.__totalBytes = parseInt(response.headers['content-length'], 10);
                    this.__receiveBytes = 0;

                    this.__window = BrowserWindow.getAllWindows()[0];
                    this.__window.setProgressBar(0.0);
                }

                response.on('data', chunk => {
                    bufferArray.push(chunk);
                    if (showProgress) {
                        this.__receiveBytes += chunk.length;
                        this.__window.setProgressBar(this.__receiveBytes/this.__totalBytes);
                    }
                });
                response.on('end', () => {
                    this._querying = false; // Avoid conflict

                    const data = Buffer.concat(bufferArray);
                    resolve(data);
                });
            });
            request.end();
        });
    }

    async _fetchSourceAndUpdate(tag) {
        const asarUrl = `https://github.com/ryanfwy/jike-calendar/releases/download/v${tag}/app.asar`;
        const data = await this._getHttpsData(asarUrl, true);
        if (!data) return;

        const options = {
            type: 'info',
            buttons: [l10n('BUTTON_OK')],
            defaultId: 0,
            title: l10n('TITLE_UPDATE'),
            message: l10n('MESSAGE_NEW_VERSION_PREPARED'),
            detail: l10n('DETAIL_NEW_VERSION_PREPARED')
        };
        dialog.showMessageBox(null, options, response => {
            const infoPath = path.join(__dirname, '../../..', 'info.plist');
            const info = fs.readFileSync(infoPath, 'utf-8')
                .replace(/(<key>CFBundleShortVersionString<\/key>[\s\S]+?<string>)([0-9.]+)(<\/string>)/, '$1'+tag+'$3')
                .replace(/(<key>CFBundleVersion<\/key>[\s\S]+?<string>)([0-9.]+)(<\/string>)/, '$1'+tag+'$3');
            fs.writeFileSync(infoPath, info);

            const asarPath = path.join(__dirname, '../..', 'app.asar');
            fs_ori.writeFileSync(asarPath, data);

            app.relaunch();
            app.quit();
        });
    }

    async checkUpdate(showEvenNoUpdate=false) {
        const data = await this._getHttpsData(this._url);
        const dataJson = JSON.parse(data);

        const localVersion = this._version;
        const onlineVersion = dataJson['latest'];

        const needUpdate = this.constructor.compareVersion(localVersion, onlineVersion);
        if (needUpdate === 1) {
            const fullUpdateVersion = dataJson['full_update'];
            const needFullUpdate = this.constructor.compareVersion(localVersion, fullUpdateVersion);

            const lan = config.get('language') === 'zh' ? 'zh' : 'en';
            if (needFullUpdate === 1) {
                const options = {
                    type: 'info',
                    buttons: [l10n('BUTTON_LATER'), l10n('BUTTON_GOTO')],
                    defaultId: 1,
                    title: l10n('TITLE_NEW_VERSION'),
                    message: l10n('MESSAGE_FOUND_NEW_VERSION_') + ' v' + onlineVersion,
                    detail: dataJson['manifest'][0]['change_log'][lan] + '\n\n' + l10n('DETAIL_FULL_UPDATE_REQUIRED')
                };
                dialog.showMessageBox(null, options, response => {
                    if (response === 1) {
                        shell.openExternal('https://github.com/ryanfwy/jike-calendar/releases/latest')
                    }
                });
            }
            
            else {
                const options = {
                    type: 'info',
                    buttons: [l10n('BUTTON_LATER'), l10n('BUTTON_UPDATE')],
                    defaultId: 1,
                    title: l10n('TITLE_NEW_VERSION'),
                    message: l10n('MESSAGE_FOUND_NEW_VERSION_') + ' v' + onlineVersion,
                    detail: dataJson['manifest'][0]['change_log'][lan]
                };
                dialog.showMessageBox(null, options, response => {
                    if (response === 1) {
                        this._fetchSourceAndUpdate(onlineVersion);
                    }
                });
            }
        }

        else if (showEvenNoUpdate) {
            const options = {
                type: 'info',
                buttons: [l10n('BUTTON_OK')],
                defaultId: 0,
                title: l10n('TITLE_UP_TO_DATE'),
                message: l10n('MESSAGE_UP_TO_DATE'),
                detail: l10n('DETAIL_UP_TO_DATE')
            };
            dialog.showMessageBox(null, options);
        }
    }
}


const packagePath = path.join(__dirname, '..', 'package.json');
const U = new Update(packagePath);

module.exports = {
    check(showEvenNoUpdate) { U.checkUpdate(showEvenNoUpdate); }
}
