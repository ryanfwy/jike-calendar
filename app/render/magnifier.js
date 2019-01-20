const { ipcRenderer: ipcMagnifier } = require('electron');


const magnifier = document.querySelector('.magnifier');
const magnifierWidth = 70;
const magnifierHeight = 100;

global.imageObject = null;
global.mouseEvent = null;


/* Events */
document.addEventListener('mousemove', event => {
    // if (magnifier.style.display === 'none') return;
    throttle(renderMagnifier, null, event, 10, 100);
});
document.addEventListener('DOMContentLoaded', () => {
    defaultContext('.magnifier-background', true);
    defaultContext('.magnifier-view', false);
});


/* Receiver */
ipcMagnifier.on('IsMagnifierOnFromMain', (event, arg) => {
    const mode = magnifier.style.display === 'none' ? false : true;
    ipcMagnifier.send('IsMagnifierOnFromRenderer', mode);
});
ipcMagnifier.on('ToggleMagnifierFromMain', (event, arg) => {
    const mode = magnifier.style.display === 'none' ? '+' : '-';

    if (mode === '+') {
        magnifier.style.display = 'block';
        document.querySelector('body').style.pointerEvents = 'none';
        setOpacity({
            mode: '+',
            range: [0.0, 1.0],
            handler: null
        });
    } else {
        document.querySelector('body').style.pointerEvents = 'all';
        setOpacity({
            mode: '-',
            range: [0.0, 1.0],
            handler: () => {
                magnifier.style.display = 'none';
            }
        });
    }
});
ipcMagnifier.on('CaptureFrameFromMain', (event, arg) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + arg;
    img.onload = () => {
        global.imageObject = img;
        if (global.mouseEvent) renderMagnifier(global.mouseEvent);
    };
});


function renderMagnifier(event) {
    global.mouseEvent = event;

    event.stopPropagation();

    const {clientX, clientY} = event;
    // Display magnifier
    magnifier.style.left = `${clientX-magnifierWidth*0.5}px`;
    magnifier.style.top = `${clientY-magnifierHeight-5}px`;

    const canvas = document.querySelector('.magnifier-view');
    const ctx = canvas.getContext('2d');
    
    const img = global.imageObject;
    const {width: imgWidth} = img;
    const {clientWidth: bodyWidth} = document.querySelector('body');
    const ratio = imgWidth / bodyWidth;

    const {width, height} = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, (clientX-magnifierWidth*0.5)*ratio+20, (clientY-magnifierHeight*0.5)*ratio-60, 80, 80, 0, 0, width, height);
}

function throttle(fn, context, args, delay, mustApplyTime) {
    if (fn.timer) {
        clearTimeout(fn.timer);
    }
    fn._cur = Date.now();

    if (!fn._start) {
        fn._start = fn._cur;
    }
    if (fn._cur - fn._start > mustApplyTime) {
        fn.call(context, args);
        clearTimeout(fn.timer);
        fn._start = fn._cur;
    } else {
        fn.timer = setTimeout(() => {
            fn.call(context, args);
        }, delay);
    }
}

function setOpacity(obj) {
    const {mode, range, handler} = obj;
    const [min, max] = range;

    let opacity = Number(magnifier.style.opacity);
    let newOpacity = mode === '+' ? opacity+0.05 : opacity-0.05;
    magnifier.style.opacity = newOpacity.toString();
    if (newOpacity < max && newOpacity > min) {
        setTimeout(() => {
            setOpacity({mode, range, handler});
        }, 10);
    } else {
        magnifier.style.opacity = (mode === '+' ? max : min).toString();
        if (obj.handler) obj.handler();
    }
}

function defaultContext(id, drawRect=false) {
    const canvas = document.querySelector(id);
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 1000;
    
    const ratio = canvas.width / 100;
    const rad = -15 * (Math.PI / 180);

    const [width, height] = [55*ratio, 75*ratio];
    const [x0, y0] = [15*10, 22.5*10];
    const [x1, y1] = [x0+width*Math.cos(rad), y0+width*Math.sin(rad)];
    const [x2, y2] = [x1-height*Math.sin(rad), y1+height*Math.cos(rad)];
    const [x3, y3] = [x0-height*Math.sin(rad), y0+height*Math.cos(rad)];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    if (drawRect) ctx.fill();
    else ctx.clip();
}