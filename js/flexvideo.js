var flexvideo = (function() {
    var $container, $video, video, $pictures;

    var IE_SEEK_INTERVAL = 1000;
    var lastSeekTime = 0;
    var $window = $(window);

    var HAVE_NOTHING = 0;
    var HAVE_METADATA = 1;
    var HAVE_CURRENT_DATA = 2;
    var HAVE_FUTURE_DATA = 3;
    var HAVE_ENOUGH_DATA = 4;

    var BG_SRC_WIDTH = 1280;
    var BG_SRC_HEIGHT = 720;

    var duration = -1;

    var isSupportedVideo = 'HTMLVideoElement' in window;
    var isIPhone = /iphone/.test(navigator.userAgent.toLowerCase());
    var style = $('body').get(0).style;
    // var style = document.createElement('style').style;
    var support = {
        video: isSupportedVideo && !isIPhone,
        transform: ('-webkit-transform' in style && '-webkit-transform')
            || ('-moz-transform' in style && '-moz-transform')
            || ('-ms-transform' in style && '-ms-transform')
            || ('-o-transform' in style && '-o-transform')
            || ('transform' in style && 'transform')
    };
    var isDebug = true;
    isDebug = isDebug && ('console' in window);

    // fallback
    if (!support.video) {
        var currentTime = -1;
        var secondsOfFrames = [];
        var timeUpdateFallbackTimer = 0;
        var currentFrame = 0;
        var nextFrame = 0;
        var lastTimeUpdateFallback = util.getNow();
        var TIME_UPDATE_DURATION = 200;
    }

    function initialize(_container, _video, _pictures) {
        $container = $(_container);
        $video = $(_video);
        video = $video.get(0);

        if (support.transform) {
            $video.css({
                width: BG_SRC_WIDTH + 'px',
                height: BG_SRC_HEIGHT + 'px'
            });
        } else {
            $container.find('img').css({
                width: '100%',
                height: '100%'
            });
        }

        $window.on('resize', resizeHandler);
        resizeHandler();

        if (!support.video) {
            $pictures = $(_pictures);
            $pictures.show();
            duration = $pictures.attr('data-duration') - 0;

            $pictures.find('img').each(function() {
                secondsOfFrames.push($(this).attr('data-sec') - 0);
            });

            secondsOfFrames.sort(function(a, b) {
                return a - b;
            });
            if (isDebug) console.log(secondsOfFrames);

            setTimeout($.proxy(function() {
                this.emit('loadedmetadata');
                setTimeout($.proxy(function() {
                    this.emit('loadeddata');
                }, this), 0);
            }, this), 0);
            return;
        }

        $video.on('loadedmetadata', $.proxy(function(event) {
            duration = video.duration;
            this.emit(event.originalEvent.type);
        }, this)).on('loadeddata', $.proxy(function(event) {
            this.emit(event.originalEvent.type);
        }, this)).on('timeupdate', $.proxy(function(event) {
            this.emit(event.originalEvent.type);
        }, this)).on('ended', $.proxy(function(event) {
            this.emit(event.originalEvent.type);
        }, this));
    }

    function resizeHandler() {
        var windowWidth = $window.width();
        var windowHeight = $window.height();

        function getCss(_css, _property) {
            switch (_property) {
                case 'translate':
                    var _dx = arguments[2];
                    var _dy = arguments[3];
                    if (support.transform) {
                        _css.transform = (_css.transform ? _css.transform + ' ' : '')
                            + 'translate(' + _dx + 'px, ' + _dy + 'px)';
                    } else {
                        _css.left = _dx + 'px';
                        _css.top =  _dy + 'px';
                    }
                    break;
                case 'scale':
                    var _scale = arguments[2];
                    if (support.transform) {
                        _css.transform = (_css.transform ? _css.transform + ' ' : '')
                            + 'scale(' + _scale + ')';
                    } else {
                        _css.width = BG_SRC_WIDTH * _scale + 'px';
                        _css.height = BG_SRC_HEIGHT * _scale + 'px';
                    }
                    break;
            }
        }
        var css = {};
        var distance = 0;
        var scale = 0;

        if (windowWidth / windowHeight > BG_SRC_WIDTH / BG_SRC_HEIGHT) {
            distance = (windowHeight - windowWidth * BG_SRC_HEIGHT / BG_SRC_WIDTH) / 2;
            getCss(css, 'translate', 0, distance);

            scale = windowWidth / BG_SRC_WIDTH;
            getCss(css, 'scale', scale);
        } else {
            distance = (windowWidth - windowHeight * BG_SRC_WIDTH / BG_SRC_HEIGHT) / 2;
            getCss(css, 'translate', distance, 0);

            scale = windowHeight / BG_SRC_HEIGHT;
            getCss(css, 'scale', scale);
        }

        $container.css(css);
    }

    function on(eventType, handler) {
        $(this).on(eventType, handler);
        return this;
    }

    function off(eventType, handler) {
        $(this).off(eventType, handler);
        return this;
    }

    function emit(eventName, data) {
        $(this).trigger(eventName, data);
        return this;
    }

    function play() {
        if (!support.video) {
            lastTimeUpdateFallback = util.getNow();
            timeUpdateFallbackTimer = setInterval($.proxy(timeUpdateFallback, this), TIME_UPDATE_DURATION);
            return;
        }

        if (video.seeking) {
            if (isDebug) console.log('waiting for playing');
            setTimeout(play, 100);
        }

        video.play();
    }

    function pause() {
        if (!support.video) {
            if (timeUpdateFallbackTimer) {
                clearInterval(timeUpdateFallbackTimer);
                timeUpdateFallbackTimer = 0;
            }
            return;
        }
        video.pause();
    }

    function getDuration() {
        return duration;
    }

    function setCurrentTime(newTime) {
        if (!support.video) {
            var keyFrameLength = secondsOfFrames.length;

            function getNewFrame() {
                var _newFrame = -1;
                var _keyFrameLength = secondsOfFrames.length;
                for (var i = 0; i < _keyFrameLength; i++) {
                    if (secondsOfFrames[i] > newTime) {
                        _newFrame = i - 1;
                        break;
                    }
                }
                if (_newFrame === -1) {
                    _newFrame = _keyFrameLength - 1;
                }
                return _newFrame;
            }

            var newFrame = getNewFrame();

            if (currentTime === 0 || currentFrame !== newFrame) {
                function loadImage(_frame, _toLoad, _toShow, _toHide) {
                    var $img = $pictures.find('img[data-sec=' + secondsOfFrames[_frame]
                        + ']');
                    if (_toLoad) {
                        if (!$img.attr('src')) {
                            $img.attr('src', $img.attr('data-src'));
                        }
                    }
                    if (_toShow) {
                        $img.show();
                    }
                    if (_toHide) {
                        $img.hide();
                    }
                }

                loadImage(currentFrame, false, false, true);
                loadImage(newFrame, true, true, false);

                // 先読み
                if (newFrame < keyFrameLength - 1) {
                    nextFrame = newFrame + 1;
                    loadImage(nextFrame, true, false, false);
                } else {
                    nextFrame = newFrame;
                }

                if (isDebug) console.log('change picture ' + newFrame);
                currentFrame = newFrame;
            }

            currentTime = newTime;

            this.emit('timeupdate');

            if (newTime >= duration) {
                clearInterval(timeUpdateFallbackTimer);
                timeUpdateFallbackTimer = 0;
                this.emit('ended');
            }

            return;
        }

        // IEは頻繁にcurrentTimeを更新すると追随できないので、頻度を下げる
        var isIE9 = /msie 9/.test(navigator.userAgent.toLowerCase());
        if (isIE9) {
            var now = util.getNow();
            if (now - lastSeekTime < IE_SEEK_INTERVAL) {
                if (isDebug) console.log('ignored seeking because of too short interval. ' + (now - lastSeekTime) + 'ms');
                return;
            }
            console.log('seeked. ' + (now - lastSeekTime) + 'ms');
            lastSeekTime = now;
        }

        video.currentTime = newTime;
    }

    function getCurrentTime() {
        if (!support.video) {
            return currentTime;
        }
        return video.currentTime;
    }

    function getReadyState() {
        if (!support.video) {
            if (duration === -1) {
                return HAVE_NOTHING;
            }
            return HAVE_ENOUGH_DATA;
        }
        return video.readyState;
    }

    function getEnded() {
        if (!support.video) {
            return (currentTime >= duration);
        }
        return video.ended;
    }

    function timeUpdateFallback() {
        var now = util.getNow();
        var newTime = Math.min(currentTime + (now - lastTimeUpdateFallback) / 1000, duration);
        lastTimeUpdateFallback = now;
        ($.proxy(setCurrentTime, this))(newTime);
    }
    
    function getBuffered() {
        if (!support.video) {
            return {
                length: 1,
                start: function() {
                    return secondsOfFrames[currentFrame];
                },
                end: function() {
                    return secondsOfFrames[nextFrame];
                }
            }
        }
        return video.buffered;
    }

    if (!support.video) {
        $(window).on('beforeunload', function() {
            if (timeUpdateFallbackTimer) {
                clearInterval(timeUpdateFallbackTimer);
                timeUpdateFallbackTimer = 0;
            }
        });
    }

    // export
    return {
        support: support,
        HAVE_NOTHING: HAVE_NOTHING,
        HAVE_METADATA: HAVE_METADATA,
        HAVE_CURRENT_DATA: HAVE_CURRENT_DATA,
        HAVE_FUTURE_DATA: HAVE_FUTURE_DATA,
        HAVE_ENOUGH_DATA: HAVE_ENOUGH_DATA,
        initialize: initialize,
        on: on,
        off: off,
        emit: emit,
        play: play,
        pause: pause,
        getDuration: getDuration,
        setCurrentTime: setCurrentTime,
        getCurrentTime: getCurrentTime,
        getReadyState: getReadyState,
        getEnded: getEnded,
        getBuffered: getBuffered
    };
})();
