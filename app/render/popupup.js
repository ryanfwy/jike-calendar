const rightMaskView = document.querySelector('.container-content .hover .right');
const popupDismissView = document.querySelector('.popup');

global.mouseTimeout = null;


/* Events */
rightMaskView.addEventListener('mouseenter', () => {
    global.mouseTimeout = setTimeout(() => {
        opacityAnimationRight(1, 500);
    }, 800);
});
rightMaskView.addEventListener('mouseleave', () => {
    if (global.mouseTimeout === null) return;
    clearTimeout(global.mouseTimeout);
    global.mouseTimeout = null;
    opacityAnimationRight(0, 500);
});
rightMaskView.addEventListener('click', () => {
    opacityAnimationRight(0, 300);
    popupShow();
});
popupDismissView.addEventListener('click', event => {
    const parentName = event.target.parentNode.className;
    if (parentName === 'content' || parentName === 'picture') return;
    popupDismiss();
});


function popupShow() {
    let popupView = document.querySelector('.popup');
    anime({
        targets: popupView,
        opacity: 1.0,
        duration: 300,
        easing: 'linear',
        begin() { popupView.style = 'display: block;'; }
    });
}

function popupDismiss() {
    let popupView = document.querySelector('.popup');
    anime({
        targets: popupView,
        opacity: 0,
        duration: 300,
        easing: 'linear',
        complete() { popupView.style = 'display: none;'; }
    });
}

function opacityAnimationRight(opacity, duration) {
    anime({
        targets: rightMaskView,
        opacity: opacity,
        duration: duration,
        easing: 'linear'
    });
}
