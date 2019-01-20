const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config/setting.json');
const config = JSON.parse(fs.readFileSync(configPath));


// Topics
module.exports.topics = config.topics.map((obj) => { return obj.id; });
// Nickname
module.exports.nickname = config.nickname;
// Language
module.exports.language = config.language;
