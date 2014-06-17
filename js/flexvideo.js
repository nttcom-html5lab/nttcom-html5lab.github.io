var flexvideo = (function() {
    var $wrapper, $video, video, $pictures;

    var $window = $(window);

    var VIDEO_EXTENSIONS = ['webm', 'm4v'];
    var PICTURE_EXTENSION = 'jpg';

    var HAVE_NOTHING = 0;
    var HAVE_METADATA = 1;
    var HAVE_CURRENT_DATA = 2;
    var HAVE_FUTURE_DATA = 3;
    var HAVE_ENOUGH_DATA = 4;

    var VIDEO_SRC_WIDTH = 1280;
    var VIDEO_SRC_HEIGHT = 720;

    var PICTURE_SRC_WIDTH = 960;
    var PICTURE_SRC_HEIGHT = 540;

    var WAIT_FOR_PLAYING_DURATION = 100;
    var WAIT_FOR_PLAYING_MAX = 50;
    var waitForPlayingTimes = 0;

    var duration = -1;

    if (util.os.iOS) {
        var iOS7more = /^[^2-6]/.test(util.os.version);
    }

    var src_width = util.support.inlineVideo ? VIDEO_SRC_WIDTH : PICTURE_SRC_WIDTH;
    var src_height = util.support.inlineVideo ? VIDEO_SRC_HEIGHT : PICTURE_SRC_HEIGHT;

    // fallback
    if (!util.support.inlineVideo) {
        var currentTime = -1;
        var secondsOfFrames = [];
        var timeUpdateFallbackTimer = 0;
        var currentFrame = 0;
        var nextFrame = 0;
        var lastTimeUpdateFallback = util.getNow();
        var TIME_UPDATE_DURATION = 200;
    }

    function initialize(container, video_source, picture_source, picture_duration, picture_interval) {
        if (util.isDebug) console.log('flexvideo.initialize()');

        var $frag = $(document.createDocumentFragment());

        if (util.support.inlineVideo) {

            $video = $('<video>').attr({
                id: 'video',
                autoplay: 'autoplay'
            });
            video = $video.get(0);
            $.each(VIDEO_EXTENSIONS, function() {
                $('<source>').attr('src', video_source + '.' + this).appendTo($video);
            });

            $frag.append($video);

            if (util.support.transform) {
                $video.css({
                    width: src_width + 'px',
                    height: src_height + 'px'
                });
            }

            $video
                .on('loadedmetadata', $.proxy(function() {
                    duration = video.duration;
                    this.emit('loadedmetadata');
                }, this))
                .on('loadeddata', $.proxy(function() {
                    this.emit('loadeddata');
                }, this))
                .on('timeupdate', $.proxy(function() {
                    this.emit('timeupdate');
                }, this))
                .on('ended', $.proxy(function() {
                    this.emit('ended');
                }, this))
                .on('playing', $.proxy(function() {
                    this.emit('playing');
                }, this))
                .on('pause', $.proxy(function() {
                    this.emit('paused');
                }, this));

        } else {

            $pictures = $('<div>').attr('id', 'pictures');
            for (var sec = 0; sec <= picture_duration; sec = sec + picture_interval) {
                var src = picture_source.replace('%{sec}', sec) + '.' + PICTURE_EXTENSION;
                var $img = $('<img>').attr({
                    'data-sec': sec,
                    'data-src': src
                }).appendTo($pictures);
                if (sec === 0) {
                    $img.attr('src', src);
                }
                secondsOfPictures.push(sec);
            }

            $frag.append($pictures);

            $pictures.show();

            if (!util.support.transform) {
                $container.find('img').css({
                    width: '100%',
                    height: '100%'
                });
            }

            duration = picture_duration;

            setTimeout($.proxy(function() {
                this.emit('loadedmetadata');
                setTimeout($.proxy(function() {
                    this.emit('loadeddata');
                }, this), 0);
            }, this), 0);
        }

        $container = $(container).append($frag);

        $window.on('resize iosstatusbarvisibilitychange', resizeHandler);
        resizeHandler();
    }

    function resizeHandler(event) {
        if (event && event.type) {
            console.log('window.on' + event.type);
        }

        if (iOS7more) {
            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;
        } else {
            var windowWidth = $window.width();
            var windowHeight = $window.height();
        }

        function getCss(_css, _property) {
            switch (_property) {
                case 'translate':
                    var _dx = arguments[2];
                    var _dy = arguments[3];
                    if (util.support.transform) {
                        _css.transform = (_css.transform ? _css.transform + ' ' : '')
                            + 'translate(' + _dx + 'px, ' + _dy + 'px)';
                    } else {
                        _css.left = _dx + 'px';
                        _css.top =  _dy + 'px';
                    }
                    break;
                case 'scale':
                    var _scale = arguments[2];
                    if (util.support.transform) {
                        _css.transform = (_css.transform ? _css.transform + ' ' : '')
                            + 'scale(' + _scale + ')';
                    } else {
                        _css.width = src_width * _scale + 'px';
                        _css.height = src_height * _scale + 'px';
                    }
                    break;
            }
        }
        var css = {};
        var distance = 0;
        var scale = 0;

        if (windowWidth / windowHeight > src_width / src_height) {
            distance = (windowHeight - windowWidth * src_height / src_width) / 2;
            getCss(css, 'translate', 0, distance);

            scale = windowWidth / src_width;
            getCss(css, 'scale', scale);
        } else {
            distance = (windowWidth - windowHeight * src_width / src_height) / 2;
            getCss(css, 'translate', distance, 0);

            scale = windowHeight / src_height;
            getCss(css, 'scale', scale);
        }

        $wrapper.css(css);
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
        if (util.isDebug) console.log('flexvideo.play()');
        if (!util.support.inlineVideo) {
            lastTimeUpdateFallback = util.getNow();
            timeUpdateFallbackTimer = setInterval($.proxy(timeUpdateFallback, this), TIME_UPDATE_DURATION);
            this.emit('playing');
            return;
        }

        if (video.seeking) {
            if (util.isDebug) console.log('waiting for playing');
            if (waitForPlayingTimes++ < WAIT_FOR_PLAYING_MAX) {
                setTimeout(play, WAIT_FOR_PLAYING_DURATION);
                return;
            }
            if (util.isDebug) console.log('waiting for playing time out');
            return;
        }

        waitForPlayingTimes = 0;
        video.play();
    }

    function pause() {
        if (util.isDebug) console.log('flexvideo.pause()');
        if (!util.support.inlineVideo) {
            if (timeUpdateFallbackTimer) {
                clearInterval(timeUpdateFallbackTimer);
                timeUpdateFallbackTimer = 0;
            }
            this.emit('paused');
            return;
        }
        video.pause();
    }

    function getDuration() {
        return duration;
    }

    function setCurrentTime(newTime) {
        if (!util.support.inlineVideo) {
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

                if (util.isDebug) console.log('change picture ' + newFrame);
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

        video.currentTime = newTime;
    }

    function getCurrentTime() {
        if (!util.support.inlineVideo) {
            return currentTime;
        }
        return video.currentTime;
    }

    function getReadyState() {
        if (!util.support.inlineVideo) {
            if (duration === -1) {
                return HAVE_NOTHING;
            }
            return HAVE_ENOUGH_DATA;
        }
        return video.readyState;
    }

    function getEnded() {
        if (!util.support.inlineVideo) {
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
        if (!util.support.inlineVideo) {
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

    if (!util.support.inlineVideo) {
        $(window).on('beforeunload', function() {
            if (timeUpdateFallbackTimer) {
                clearInterval(timeUpdateFallbackTimer);
                timeUpdateFallbackTimer = 0;
            }
        });
    }

    // export
    return {
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
