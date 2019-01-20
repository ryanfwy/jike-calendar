const { ipcRenderer: ipcRequest } = require('electron');


const containerView = document.querySelector('.container-content');
const contentView = document.querySelector('.content');
const topicView = document.querySelector('.topic');
const userView = document.querySelector('.user');

global.loadingOn = false;


/* Events */
containerView.addEventListener('click', () => {
    if (global.loadingOn === false) {
        ipcRequest.send('GetSourceFromRenderer');
    }
});


/* Receiver */
ipcRequest.on('GetSourceFromMain', (event, arg) => {
    // Loading animation => off
    global.loadingOn = false;
    let data = JSON.parse(arg);
    renderRequest(data.data);
});
ipcRequest.on('StartLoadingFromMain', (event, arg) => {
    // Loading animation => on
    global.loadingOn = true;
    startLoading();
});


function renderRequest(result) {
    let contentIndex = Math.floor(Math.random()*result.length)
    let topic = result[contentIndex].topic.content
    let user = result[contentIndex].user.screenName
    let content = result[contentIndex].content
    let picture = result[contentIndex].pictures.length > 0 ? result[contentIndex].pictures[0].smallPicUrl : ""
    
    if (content === '') {
        ipcRequest.send('GetSourceFromRenderer');
        return;
    }
    
    contentView.innerText = content;
    topicView.innerText = '『' + topic + '』';
    userView.innerText = 'via ' + user;

    ipcRequest.send('CaptureFrameFromRenderer');
}

function startLoading(idx=0, up=true) {
    let views = document.querySelectorAll('.loading');
    
    if (global.loadingOn === false) {
        for (let i=0; i<3; i++) {
            let view = views[i];
            simpleAnimate(view, false);
        }
    } else if (global.loadingOn === true) {
        simpleAnimate(views[idx], up, () => {
            if (global.loadingOn === false) startLoading();
            else startLoading(up ? idx : (idx+1)%3, !up);
        });
    }
}

function simpleAnimate(view, up, completion=null) {
    let timer = setInterval(() => {
        let offset = Number(view.style.top.replace('px', ''));
        let value = up ? offset - 0.5 : offset + 0.5;
        view.style.top = value + 'px';
        if (value < -10 || value > 0.5) {
            view.style.top = (up ? -10 : 0) + 'px';
            clearInterval(timer);
            if (completion) completion();
        }
    }, 10);
}
