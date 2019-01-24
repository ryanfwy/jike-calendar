const { remote, ipcRenderer: ipcIndex } = require('electron');
const { Menu } = remote;


const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WHITE = [255, 255, 255];
const YELLOW = [255, 228, 17];


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
    const dateString = `${month}月<br>${date}日`;

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
