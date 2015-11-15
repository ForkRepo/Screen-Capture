document.body.style.backgroundImage = 'url(' + localStorage.capture + ')';

var imageBoard, clipLayout = document.getElementById('gray_layout'),
    shutter = document.getElementById('shutter');

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y, x+w, y+h, r);
    this.arcTo(x+w, y+h, x, y+h, r);
    this.arcTo(x, y+h, x, y, r);
    this.arcTo(x, y, x+w, y, r);
    this.closePath();
    return this;
}

document.body.addEventListener('contextmenu', function(e) {
    //e.preventDefault();
    //close();
}, false);

function close() {
    chrome.windows.getCurrent(function (window) {
        chrome.windows.remove(window.id);
    });
}

function clip() {
    var pos = null,
        ctx = clipLayout.getContext('2d');

    clipLayout.height = window.screen.height * window.devicePixelRatio;
    clipLayout.width = window.screen.width * window.devicePixelRatio;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, clipLayout.width, clipLayout.height);

    clipLayout.onmousedown = function(e) {
        pos = {
            x: e.clientX,
            y: e.clientY
        };
    };

    clipLayout.onmousemove = function(e) {
        if (null === pos) {
            return;
        }
        var left = Math.min(pos.x, e.clientX),
            top = Math.min(pos.y, e.clientY),
            width = Math.abs(pos.x - e.clientX),
            height = Math.abs(pos.y - e.clientY);

        drawClip(left, top, width, height);
    };

    clipLayout.onmouseup = function(e) {
        var left = Math.min(pos.x, e.clientX),
            top = Math.min(pos.y, e.clientY),
            width = Math.abs(pos.x - e.clientX),
            height = Math.abs(pos.y - e.clientY);

        clipLayout.onmousedown = null;
        clipLayout.onmousemove = null;
        clipLayout.onmouseup = null;
        pos = null;

        completeClip(left, top, width, height);
        drawToolbox(left, top, width, height);
    };
}

function completeClip(left, top, width, height) {
    var newLeft, newTop, newWidth, newHeight, dtLeft, dtTop, pos = null, handle = true, moved = false;

    clipLayout.onmousedown = function(e) {
        dtLeft = window.screen.height - top - height < 60 ? left : left + width - 120;
        dtTop = window.screen.height - top - height < 60 ? top - 50 : top + height + 10;

        if (handle && e.clientX > dtLeft && e.clientX < dtLeft + 40 &&
            e.clientY > dtTop && e.clientY < dtTop + 40) {
            var ctx = clipLayout.getContext('2d');

            handle = false;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.clearRect(0, 0, clipLayout.width, clipLayout.height);
            ctx.fillRect(0, 0, clipLayout.width, clipLayout.height);
            ctx.clearRect((left - 2) * window.devicePixelRatio,
                (top - 2) * window.devicePixelRatio,
                (width + 4) * window.devicePixelRatio,
                (height + 4) * window.devicePixelRatio);

            ctx.beginPath();
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#5bcbf5';
            ctx.rect((left - 2) * window.devicePixelRatio,
                (top - 2) * window.devicePixelRatio,
                (width + 4) * window.devicePixelRatio,
                (height + 4) * window.devicePixelRatio);
            ctx.stroke();

            drawToolbox(left, top, width, height);
            startEdit(left, top, width, height);
        } else if (e.clientX > dtLeft + 40 && e.clientX < dtLeft + 80 &&
            e.clientY > dtTop && e.clientY < dtTop + 40) {
            close();
        } else if (e.clientX > dtLeft + 80 && e.clientX < dtLeft + 120 &&
            e.clientY > dtTop && e.clientY < dtTop + 40) {
            finishEdit(left, top, width, height);
        } else if (e.clientX > left + 6 && e.clientX < left + width - 6 &&
            e.clientY > top + 6 && e.clientY < top + height - 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'move'
            }
        } else if (e.clientX > left - 6 && e.clientX < left + 6 &&
            e.clientY > top - 6 && e.clientY < top + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'topLeft'
            }
        } else if (e.clientX > left + width / 2 - 6 && e.clientX < left + width / 2 + 6 &&
            e.clientY > top - 6 && e.clientY < top + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'top'
            }
        } else if (e.clientX > left + width - 6 && e.clientX < left + width + 6 &&
            e.clientY > top - 6 && e.clientY < top + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'topRight'
            }
        } else if (e.clientX > left - 6 && e.clientX < left + 6 &&
            e.clientY > top + height / 2 - 6 && e.clientY < top + height / 2 + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'left'
            }
        } else if (e.clientX > left + width - 6 && e.clientX < left + width + 6 &&
            e.clientY > top + height / 2 - 6 && e.clientY < top + height / 2 + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'right'
            }
        } else if (e.clientX > left - 6 && e.clientX < left + 6 &&
            e.clientY > top + height - 6 && e.clientY < top + height + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'bottomLeft'
            }
        } else if (e.clientX > left + width / 2 - 6 && e.clientX < left + width / 2 + 6 &&
            e.clientY > top + height - 6 && e.clientY < top + height + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'bottom'
            }
        } else if (e.clientX > left + width - 6 && e.clientX < left + width + 6 &&
            e.clientY > top + height - 6 && e.clientY < top + height + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'bottomRight'
            }
        } else if (width < 12 && height < 12 &&
            e.clientX > left - 6 && e.clientX < left + width + 6 &&
            e.clientY > top - 6 && e.clientY < top + height + 6) {
            pos = {
                x: e.clientX,
                y: e.clientY,
                action: 'topLeft'
            }
        }
    };

    clipLayout.onmousemove = function(e) {
        if (null === pos || false === handle) {
            return;
        }

        moved = true;

        if ('move' === pos.action) {
            newLeft = left + e.clientX - pos.x;
            newTop = top + e.clientY - pos.y;

            newLeft = Math.max(newLeft, 0);
            newLeft = Math.min(newLeft, window.screen.width - width);
            newTop = Math.max(newTop, 0);
            newTop = Math.min(newTop, window.screen.height - height);

            newWidth = width;
            newHeight = height;
        } else if ('topLeft' === pos.action) {
            newLeft = left + e.clientX - pos.x;
            newTop = top + e.clientY - pos.y;
            newWidth = width + left - newLeft;
            newHeight = height + top - newTop;
        } else if ('top' === pos.action) {
            newLeft = left;
            newTop = top + e.clientY - pos.y;
            newWidth = width;
            newHeight = height + top - newTop;
        } else if ('topRight' === pos.action) {
            newLeft = left;
            newTop = top + e.clientY - pos.y;
            newWidth = width + e.clientX - pos.x;
            newHeight = height + top - newTop;
        } else if ('left' === pos.action) {
            newLeft = left + e.clientX - pos.x;
            newTop = top;
            newWidth = width + left - newLeft;
            newHeight = height;
        } else if ('right' === pos.action) {
            newLeft = left;
            newTop = top;
            newWidth = width + e.clientX - pos.x;
            newHeight = height;
        } else if ('bottomLeft' === pos.action) {
            newLeft = left + e.clientX - pos.x;
            newTop = top;
            newWidth = width + left - newLeft;
            newHeight = height + e.clientY - pos.y;
        } else if ('bottom' === pos.action) {
            newLeft = left;
            newTop = top;
            newWidth = width;
            newHeight = height + e.clientY - pos.y;
        } else if ('bottomRight' === pos.action) {
            newLeft = left;
            newTop = top;
            newWidth = width + e.clientX - pos.x;
            newHeight = height + e.clientY - pos.y;
        }

        drawClip(newLeft, newTop, newWidth, newHeight);
    };

    clipLayout.onmouseup = function(e) {
        newLeft = newWidth < 0 ? newLeft + newWidth : newLeft;
        newTop = newHeight < 0 ? newTop + newHeight : newTop;

        if (!isNaN(newLeft) && !isNaN(newTop) && !isNaN(newWidth) && !isNaN(newHeight)) {
            left = newLeft;
            top = newTop;
            width = Math.abs(newWidth);
            height = Math.abs(newHeight);
            if (moved !== false) {
                drawToolbox(left, top, width, height);
            }
        }

        pos = null;
        moved = false;
    };

    clipLayout.ondblclick = function(e) {
        if (e.clientX > left + 6 && e.clientX < left + width - 6 &&
            e.clientY > top + 6 && e.clientY < top + height - 6) {
            finishEdit(left, top, width, height);
        }
    };
}

function drawClip(left, top, width, height) {
    var ctx = clipLayout.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.clearRect(0, 0, clipLayout.width, clipLayout.height);
    ctx.fillRect(0, 0, clipLayout.width, clipLayout.height);
    ctx.clearRect((left - 2) * window.devicePixelRatio,
        (top - 2) * window.devicePixelRatio,
        (width + 4) * window.devicePixelRatio,
        (height + 4) * window.devicePixelRatio);

    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#5bcbf5';
    ctx.rect((left - 2) * window.devicePixelRatio,
        (top - 2) * window.devicePixelRatio,
        (width + 4) * window.devicePixelRatio,
        (height + 4) * window.devicePixelRatio);
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc((left - 3) * window.devicePixelRatio,
        (top - 3) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((left + width / 2) * window.devicePixelRatio,
        (top - 3) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((left + width + 3) * window.devicePixelRatio,
        (top - 3) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((left - 3) * window.devicePixelRatio,
        (top + height / 2) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((left + width + 3) * window.devicePixelRatio,
        (top + height / 2) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();

    ctx.arc((left - 3) * window.devicePixelRatio,
        (top + height + 3) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((left + width / 2) * window.devicePixelRatio,
        (top + height + 3) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((left + width + 3) * window.devicePixelRatio,
        (top + height + 3) * window.devicePixelRatio,
        8, 0, 2*Math.PI);
    ctx.fill();
}

function drawToolbox(left, top, width, height) {
    var ctx = clipLayout.getContext('2d'),
        dtLeft = (window.screen.height - top - height < 60 ? left : left + width - 120) * window.devicePixelRatio,
        dtTop = (window.screen.height - top - height < 60 ? top - 50 : top + height + 10) * window.devicePixelRatio;

    var gradient = ctx.createLinearGradient(0, dtTop, 0, dtTop + 40 * window.devicePixelRatio);
    gradient.addColorStop(0, '#404040');
    gradient.addColorStop(1, '#282828');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(dtLeft, dtTop, 120 * window.devicePixelRatio, 40 * window.devicePixelRatio, 3 * window.devicePixelRatio);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fill();
    ctx.restore();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 20 * window.devicePixelRatio + 'px FontAwesome';
    ctx.fillText("\uf040", dtLeft + 14 * window.devicePixelRatio, dtTop + 28 * window.devicePixelRatio);
    ctx.fillStyle = '#ff3f3f';
    ctx.fillText("\uf00d", dtLeft + 52 * window.devicePixelRatio, dtTop + 28 * window.devicePixelRatio);
    ctx.fillStyle = '#1fe845';
    ctx.fillText("\uf00c", dtLeft + 90 * window.devicePixelRatio, dtTop + 28 * window.devicePixelRatio);
}

function startEdit(left, top, width, height) {
    var board = document.getElementById('board');

    board.style.left = left + 'px';
    board.style.top = top + 'px';
    board.style.width = width + 'px';
    board.style.height = height + 'px';

    imageBoard = new DrawingBoard.Board('board', {
        controls: false,
        color: '#f00',
        background: 'rgba(0, 0, 0, 0)',
        size: 2,
        webStorage: false
    });

    board.ondblclick = function(e) {
        if (e.clientX > left + 6 && e.clientX < left + width - 6 &&
            e.clientY > top + 6 && e.clientY < top + height - 6) {
            finishEdit(left, top, width, height);
        }
    };
}

function finishEdit(left, top, width, height) {
    var tmp = document.getElementById('tmp');
    tmp.width = width * devicePixelRatio;
    tmp.height = height * devicePixelRatio;

    var ctx = tmp.getContext('2d');
    var img = new Image();
    img.src = localStorage.capture;
    img.onload = function() {
        ctx.drawImage(img,
            left * window.devicePixelRatio,
            top * window.devicePixelRatio,
            width * window.devicePixelRatio,
            height * window.devicePixelRatio,
            0, 0, width * window.devicePixelRatio,
            height * window.devicePixelRatio);
        if (imageBoard) {
            ctx.drawImage(imageBoard.canvas, 0, 0,
                width * window.devicePixelRatio,
                height * window.devicePixelRatio);
        }

        copyImageToClipboard(tmp.toDataURL());
    }
}

function copyImageToClipboard(url){
    document.getElementById('lighting').className = 'start';
    setTimeout(function() {
        shutter.play();
        shutter.onended = function() {
            window.open(url, '_blank');
            close();
        }
    }, 500);
}

window.onload = clip;