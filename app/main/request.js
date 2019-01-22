const { ipcMain, net } = require('electron');
const topics = require('./config').get('topics');
const topicsId = topics.map(x => { return x.id; });


/* Receiver */
ipcMain.on('GetSourceFromRenderer', (event) => {
    getSource(event.sender);
});


let bufferArray = [];

function getSource(window) {
    window.webContents.send('StartLoadingFromMain');

    bufferArray = [];

    let topicIndex = Math.floor(Math.random()*topicsId.length);
    let request = net.request({
        method: 'POST',
        url: "https://app.jike.ruguoapp.com/1.0/squarePosts/list"
    });
    request.setHeader('Content-Type', 'application/json');
    request.write(`{"topicId": "${topicsId[topicIndex]}", "limit": 20}`);

    request.on('response', (response) => {
        response.on('data', (trunk) => {
            bufferArray.push(trunk);
        });
        response.on('end', () => {
            const data = Buffer.concat(bufferArray);
            // Answer
            window.send('GetSourceFromMain', data);
        })
    });
    request.end();
}

module.exports = { getSource };
