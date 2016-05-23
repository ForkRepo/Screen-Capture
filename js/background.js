chrome.commands.onCommand.addListener(function(command) {
    if ('start-capture' === command) {
        doCapture();
    }
});

var STREAM = null,
    MEDIA_ID = null;

function doCapture() {
    if (null === STREAM && null === MEDIA_ID) {
        MEDIA_ID = chrome.desktopCapture.chooseDesktopMedia(['screen'], function(streamId) {
            getStream(streamId, function(stream) {
                STREAM = stream;
                STREAM.onended = function() {
                    STREAM = null;
                    MEDIA_ID = null;
                };
                getCapture(STREAM, showCapture);
            }, function(err) {
                MEDIA_ID = null;
            });
        });
    } else {
        getCapture(STREAM, showCapture);
    }
}


function getStream(streamId, success, fail) {
    navigator.webkitGetUserMedia({
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: streamId,
                maxHeight: window.screen.height * window.devicePixelRatio,
                minHeight: window.screen.height * window.devicePixelRatio,
                maxWidth: window.screen.width * window.devicePixelRatio,
                minWidth: window.screen.width * window.devicePixelRatio
            }
        }
    }, success, fail);
}

function getCapture(stream, callback) {
    var video = document.createElement('video');
    video.src = window.URL.createObjectURL(stream);
    video.oncanplay = function(){
        var canvas = document.createElement('canvas');
        canvas.width = window.screen.width * window.devicePixelRatio;
        canvas.height = window.screen.height * window.devicePixelRatio;
        canvas.getContext('2d').drawImage(video, 0, 0);
        callback(canvas.toDataURL());
        canvas = null;
        video = null;
    }
}

function showCapture(imageDataURL) {
    localStorage.capture = imageDataURL;
    chrome.windows.create({
        url: chrome.extension.getURL('layout/clip.html'),
        type: 'popup',
        state: 'fullscreen'
    }, function() {
        // created
    });
}

// copy image to clipboard
function copyImageToClipboard () {
    var img = document.createElement('img');
    img.src = localStorage.captured;
    document.body.appendChild(img);
    var r = document.createRange();
    r.setStartBefore(img);
    r.setEndAfter(img);
    r.selectNode(img);
    var sel = window.getSelection();
    sel.addRange(r);
    document.execCommand('Copy');
    document.body.removeChild(img);
}
