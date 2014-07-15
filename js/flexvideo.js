var flexvideo = (function() {
    var $container, $video, video, $pictures;

    var $window = $(window);

    var VIDEO_EXTENSIONS = ['webm', 'mp4'];
    var PICTURE_EXTENSION = 'jpg';

    var HEADER_HEIGHT = 50;
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
        var pictureCurrentTime = -1;
        var secondsOfPictures = [];   // 使わないコードも書ける to be refactored
        var pictureUpdateTimer = 0;
        var currenPictureIndex = 0;
        var preloadPictureIndex = 0;
        var lastTimePictureUpdate = util.getNow();
        var PICTURE_UPDATE_DURATION = 200;
        var PRELOAD_IMAGES = 5;
    }

    function initialize(container, video_source, picture_source, picture_duration, picture_interval) {
        if (util.isDebug) console.log('flexvideo.initialize()');

        var $frag = $(document.createDocumentFragment());

        if (util.support.inlineVideo) {

            $video = $('<video>').attr({
                id: 'video',
                autoplay: 'autoplay',
                poster: picture_source.replace('%{sec}', '0') + '.' + PICTURE_EXTENSION
            });
            video = $video.get(0);
            $.each(VIDEO_EXTENSIONS, function() {
                $('<source>').attr({
                    src: video_source + '.' + this,
                    type: 'video/' + this
                }).appendTo($video);
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
                if (sec < picture_interval * PRELOAD_IMAGES) {
                    $img.attr('src', src);
                }
                secondsOfPictures.push(sec);
            }
            var $img = $('<img>').attr({
                src: picture_source.replace('%{sec}', 0) + '.' + PICTURE_EXTENSION
            }).addClass('poster').appendTo($pictures);

            $frag.append($pictures);

            $pictures.show();

            duration = picture_duration;

            setTimeout($.proxy(function() {
                this.emit('loadedmetadata');
                setTimeout($.proxy(function() {
                    this.emit('loadeddata');
                }, this), 0);
            }, this), 0);
        }

        $container = $(container).append($frag);

        if (!util.support.inlineVideo && !util.support.transform) {
            $container.find('img').css({
                width: '100%',
                height: '100%'
            });
        }

        $window.on('resize iosstatusbarvisibilitychange', resizeHandler);
        resizeHandler();
    }

    function resizeHandler(event) {
        if (util.isDebug && event && event.type) {
            console.log('window.on' + event.type);
        }

        if (iOS7more) {
            var windowWidth = window.innerWidth;
            var windowHeight = window.innerHeight;
        } else {
            var windowWidth = $window.width();
            var windowHeight = $window.height();
        }

        windowHeight -= HEADER_HEIGHT;

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
            getCss(css, 'translate', 0, distance + HEADER_HEIGHT);

            scale = windowWidth / src_width;
            getCss(css, 'scale', scale);
        } else {
            distance = (windowWidth - windowHeight * src_width / src_height) / 2;
            getCss(css, 'translate', distance, HEADER_HEIGHT);

            scale = windowHeight / src_height;
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
        if (util.isDebug) console.log('flexvideo.play()');
        if (!util.support.inlineVideo) {
            lastTimePictureUpdate = util.getNow();
            pictureUpdateTimer = setInterval($.proxy(pictureUpdate, this), PICTURE_UPDATE_DURATION);
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
        if (util.support.inlineVideo) {
            video.pause();
            return;
        }
        if (pictureUpdateTimer) {
            clearInterval(pictureUpdateTimer);
            pictureUpdateTimer = 0;
        }
        this.emit('paused');
    }

    function getDuration() {
        return duration;
    }

    function setCurrentTime(newTime) {
        if (util.support.inlineVideo) {
            video.currentTime = newTime;
            return;
        }

        var keyFrameLength = secondsOfPictures.length;

        function getNewFrame() {
            var _newFrame = -1;
            var _keyFrameLength = secondsOfPictures.length;
            for (var i = 0; i < _keyFrameLength; i++) {
                if (secondsOfPictures[i] > newTime) {
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

        if (pictureCurrentTime === 0 || currenPictureIndex !== newFrame) {
            function loadImage(_frame, _toLoad, _toShow, _toHide) {
                var $img = $pictures.find('img[data-sec=' + secondsOfPictures[_frame]
                    + ']');
                if (_toLoad) {
                    if (!$img.attr('src')) {
                        $img.attr('src', $img.attr('data-src'));
                    }
                }
                if (_toShow) {
                    $img.css('z-index', '0').fadeIn('1000');
                }
                if (_toHide) {
                    $img.css('z-index', '-100');
                    setTimeout(function() {
                        $img.hide();
                    }, 1000);
                }
            }

            loadImage(currenPictureIndex, false, false, true);
            loadImage(newFrame, true, true, false);

            // 先読み
            preloadPictureIndex = Math.min(newFrame + PRELOAD_IMAGES, keyFrameLength);
            for (var i = newFrame + 1; i < preloadPictureIndex; i++) {
                loadImage(i, true, false, false);
            }

            if (util.isDebug) console.log('change picture ' + newFrame);
            currenPictureIndex = newFrame;
        }

        pictureCurrentTime = newTime;

        this.emit('timeupdate');

        if (newTime >= duration) {
            clearInterval(pictureUpdateTimer);
            pictureUpdateTimer = 0;
            this.emit('ended');
        }
    }

    function getCurrentTime() {
        if (util.support.inlineVideo) {
            return video.currentTime;
        }
        return pictureCurrentTime;
    }

    function getReadyState() {
        if (util.support.inlineVideo) {
            return video.readyState;
        }
        if (duration === -1) {
            return HAVE_NOTHING;
        }
        return HAVE_ENOUGH_DATA;
    }

    function getEnded() {
        if (util.support.inlineVideo) {
            return video.ended;
        }
        return (pictureCurrentTime >= duration);
    }

    function pictureUpdate() {
        var now = util.getNow();
        var newTime = Math.min(pictureCurrentTime + (now - lastTimePictureUpdate) / 1000, duration);
        lastTimePictureUpdate = now;
        ($.proxy(setCurrentTime, this))(newTime);
    }
    
    function getBuffered() {
        if (util.support.inlineVideo) {
            return video.buffered;
        }
        return {
            length: 1,
            start: function() {
                return secondsOfPictures[currenPictureIndex];
            },
            end: function() {
                return secondsOfPictures[preloadPictureIndex];
            }
        }
    }

    if (!util.support.inlineVideo) {
        $(window).on('beforeunload', function() {
            if (pictureUpdateTimer) {
                clearInterval(pictureUpdateTimer);
                pictureUpdateTimer = 0;
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
