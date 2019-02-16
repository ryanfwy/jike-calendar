const { remote, ipcRenderer: ipcIndex } = require('electron');
const { Menu } = remote;


const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WHITE = [255, 255, 255];
const YELLOW = [255, 228, 17];

let CALENDAR_DATE = [0xA4B, 0x5164B, 0x6A5, 0x6D4, 0x415B5, 0x2B6, 0x957, 0x2092F, 0x497, 0x60C96, 0xD4A, 0xEA5, 0x50DA9, 0x5AD, 0x2B6, 0x3126E,  0x92E, 0x7192D, 0xC95, 0xD4A, 0x61B4A, 0xB55, 0x56A, 0x4155B,  0x25D, 0x92D, 0x2192B, 0xA95, 0x71695, 0x6CA, 0xB55, 0x50AB5, 0x4DA, 0xA5B, 0x30A57, 0x52B, 0x8152A, 0xE95, 0x6AA, 0x615AA, 0xAB5, 0x4B6, 0x414AE, 0xA57, 0x526, 0x31D26, 0xD95, 0x70B55, 0x56A, 0x96D, 0x5095D, 0x4AD, 0xA4D, 0x41A4D, 0xD25, 0x81AA5, 0xB54, 0xB6A, 0x612DA, 0x95B, 0x49B, 0x41497, 0xA4B, 0xA164B,  0x6A5, 0x6D4, 0x615B4, 0xAB6, 0x957, 0x5092F, 0x497, 0x64B,  0x30D4A, 0xEA5, 0x80D65, 0x5AC, 0xAB6, 0x5126D, 0x92E, 0xC96, 0x41A95, 0xD4A, 0xDA5, 0x20B55, 0x56A, 0x7155B, 0x25D, 0x92D, 0x5192B, 0xA95, 0xB4A, 0x416AA, 0xAD5, 0x90AB5, 0x4BA, 0xA5B,  0x60A57, 0x52B, 0xA93, 0x40E95];
let MONTH_ADD = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
let NUM_STRING = '一二三四五六七八九十';
let MON_STRING = '正二三四五六七八九十冬腊';


/* Receiver */
ipcIndex.on('RenderContentsFromMain', (event, arg) => {
    const { nickname } = arg;
    document.querySelector('#nickname').innerText = nickname;
});
ipcIndex.on('RenderAllFromMain', (event, arg) => {
    render();
});


/* Events */
document.addEventListener('contextmenu', evnet => {
    evnet.preventDefault();

    const menu = Menu.getApplicationMenu();
    menu.popup();
});
window.addEventListener('load', () => {
    document.querySelector('body').className = 'transition-bgcolor';
    document.querySelector('.question').className += ' transition-bgcolor';
    document.querySelector('.triangle').className += ' transition-bordercolor';
});


render();

function render() {
    // Render day and date
    const now = new Date();
    const dayString = WEEK[now.getDay()];
    const [month, date] = [now.getMonth()+1, now.getDate()];
    const dateString = `${month} 月 ${date} 日&nbsp;&nbsp;&nbsp;&nbsp;${showLunarCal(now)}`;

    document.querySelector('.day').innerText = dayString;
    document.querySelector('.date').innerHTML = dateString;

    document.querySelector('body').style.backgroundColor = 
        dayString === 'Friday' ? rgbaString(YELLOW, 0.7) : rgbaString(WHITE, 0.7);
    document.querySelector('.question').style.backgroundColor = 
        dayString === 'Friday' ? rgbaString(WHITE, 0.7) : rgbaString(YELLOW, 0.7);
    document.querySelector('.triangle').style.borderTopColor = 
        dayString === 'Friday' ? rgbaString(WHITE, 0.7) : rgbaString(YELLOW, 0.7);
    document.querySelector('.answer').innerText =
        dayString === 'Friday' ? '是' : '不是';
}

function rgbaString([r, g, b], a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}


/* Show lunar calendar */
function showLunarCal(date) {
    let yy = date.getFullYear();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    if (yy < 100) yy = '19' + yy;
    return getLunarDay(yy, mm, dd);
}

function getLunarDay(solarYear, solarMonth, solarDay) {  
    if (solarYear < 1921 || solarYear > 2020) {
        return '';
    } else {
        solarMonth = parseInt(solarMonth) > 0 ? solarMonth - 1 : 11;
        
        let {cMonth, cDay} = e2c(solarYear, solarMonth, solarDay);
        return getcDateString(cMonth, cDay);
    }
}

function getcDateString(cMonth, cDay) {
    let tmp = '';
    if (cMonth < 1) {
        tmp += '(闰)';
        tmp += MON_STRING.charAt(-cMonth-1);
    } else {
        tmp += MON_STRING.charAt(cMonth-1);
    }
    tmp += '月';
    tmp += (cDay < 11) ? '初' : ((cDay < 20) ? '十' : ((cDay < 30) ? '廿' : '三十'));
    if (cDay % 10 != 0 || cDay == 10) {
        tmp += NUM_STRING.charAt((cDay-1) % 10);
    }

    return tmp;  
}

function getBit(m, n) {
    return (m >> n) &1;
}

function e2c() {
    let cYear, cMonth, cDay;
    let theDate = (arguments.length != 3) ? new Date() : new Date(arguments[0],arguments[1],arguments[2]);
    let total, m, n, k;

    let tmp = theDate.getYear();
    if (tmp < 1900) tmp += 1900; 
    total = (tmp - 1921) * 365 + Math.floor((tmp-1921)/4) + MONTH_ADD[theDate.getMonth()] + theDate.getDate() - 38;
    if (theDate.getYear() % 4 == 0 && theDate.getMonth() > 1) total++;

    let isEnd = false;
    for (m=0; ; m++) {
        k = (CALENDAR_DATE[m] < 0xfff) ? 11 : 12;
        for (n=k; n>=0; n--) {
            if (total <= 29 + getBit(CALENDAR_DATE[m], n)) {
                isEnd = true;
                break;
            }
            total = total - 29 - getBit(CALENDAR_DATE[m], n);
        }
        if (isEnd) break;
    }

    cYear = 1921 + m;
    cMonth = k - n + 1;
    cDay = total;
    if (k == 12) {
        if (cMonth == Math.floor(CALENDAR_DATE[m]/0x10000)+1) cMonth = 1 - cMonth;
        if (cMonth > Math.floor(CALENDAR_DATE[m]/0x10000)+1) cMonth--;
    }

    return {cYear, cMonth, cDay};
}
