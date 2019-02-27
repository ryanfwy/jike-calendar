const { ipcRenderer: ipcRequest } = require('electron');


const containerView = document.querySelector('.container-content');
const containerContentView = containerView.querySelector('.content');
const containerTitleView = containerView.querySelector('.title');
const containerTopicView = containerView.querySelector('.title .topic span');
const containerUserView = containerView.querySelector('.title .user');

const popupView = document.querySelector('.popup');
const popupContentPictureView = popupView.querySelector('.content .picture');
const popupContentTextView = popupView.querySelector('.content .text');
const popupTopicView = popupView.querySelector('.title .topic span');
const popupUserView = popupView.querySelector('.title .user');
const popupAvatarView = popupView.querySelector('.title .avatar');

const leftMaskView = document.querySelector('.container-content .hover .left');

// 0 => waiting, 1 => loading, 2 => done
global.loadingState = 0;
global.mouseTimeout = null;


/* Events */
leftMaskView.addEventListener('mouseenter', () => {
    global.mouseTimeout = setTimeout(() => {
        if (global.mouseTimeout === -1) return;
        opacityAnimationLeft(1, 500);
    }, 800);
});
leftMaskView.addEventListener('mouseleave', () => {
    if (global.mouseTimeout === null) return;
    clearTimeout(global.mouseTimeout);
    global.mouseTimeout = null;
    opacityAnimationLeft(0, 500);
});
leftMaskView.addEventListener('click', () => {
    global.mouseTimeout = -1;
    opacityAnimationLeft(0, 300);
    if (global.loadingState === 0) {
        ipcRequest.send('GetSourceFromRenderer');
    }
});


/* Receiver */
ipcRequest.on('GetSourceFromMain', (event, arg) => {
    global.loadingState = 2; // Loading stage => done
    let data = JSON.parse(arg);
    renderRequest(data.data);
});
ipcRequest.on('StartLoadingFromMain', (event, arg) => {
    // Loading state => loading
    global.loadingState = 1;
    let animation = anime({
        targets: '.container-loading .loading',
        translateY: [
            { value: -10, easing: 'easeOutSine', duration: 500 },
            { value: 0, easing: 'easeOutSine', duration: 500 }
        ],
        delay(el, i) { return i * 200; },
        endDelay(el, i, l) { return (l - i) * 100; },
        complete() {
            if (global.loadingState === 1) animation.restart();
            else if (global.loadingState === 2) global.loadingState = 0;
        }
    })
});


function renderRequest(result) {
    let contentIndex = Math.floor(Math.random()*result.length);
    let topic = result[contentIndex].topic.content;
    let user = result[contentIndex].user.screenName;
    let content = result[contentIndex].content;
    let pictures = result[contentIndex].pictures;
    let avatar = result[contentIndex].user.avatarImage.smallPicUrl;
    
    if (content === '') {
        ipcRequest.send('GetSourceFromRenderer');
        return;
    }

    // Popup view contents
    popupContentPictureView.innerHTML = '';
    for (let pic of pictures) {
        let img = document.createElement('img');
        img.src = pic.smallPicUrl;
        img.onclick = (sender) => { console.log(sender.target.src); };
        popupContentPictureView.appendChild(img);
    }
    popupContentTextView.innerText = content;
    popupTopicView.innerText = topic;
    popupUserView.innerText = 'via ' + user;
    popupAvatarView.src = avatar;


    containerContentView.id = 'fade-out';
    containerTitleView.id = 'fade-out';
    setTimeout(() => {
        if (pictures.length > 0) content = `(❐^${pictures.length}) ${content}`;
        containerContentView.innerText = content;
        containerContentView.id = 'fade-in';
        
        setTimeout(() => {
            containerTopicView.innerText = topic;
            containerUserView.innerText = 'via ' + user;
            containerTitleView.id = 'fade-in';
        }, 200);
    }, 200);

    ipcRequest.send('CaptureFrameFromRenderer');
}

function opacityAnimationLeft(opacity, duration) {
    anime({
        targets: leftMaskView,
        opacity: opacity,
        duration: duration,
        easing: 'linear'
    });
}
