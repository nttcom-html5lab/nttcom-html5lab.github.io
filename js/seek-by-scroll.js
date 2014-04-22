(function() {
    try {
        console.log(
                ' _   _  _____  __  __  _     ___    _       _    ___\n' +
                '| |_| ||_   _||  \\/  || |   | __|  | |     / \\  | D )\n' +
                '|  _  |  | |  | |\\/| || |__ |__ \\  | |__  / A \\ | D \\\n' +
                '|_| |_|  |_|  |_|  |_||____||___/  |____|/_/¯\\_\\|___/\n' +
                '\n' +
                '         N T T   C o m m u n i c a t i o n s\n' +
                '\n' +
                'Hi! Thank you for looking in the developer console!\n' +
                'If you have any cool ideas or see any bugs,\n' +
                'please submit a pull request.\n' +
                '\n' +
                'コンソールまで見てくれてありがとう！\n' +
                'おもしろいアイデアや不具合などあれば、プルリクエストを送ってくださいね。\n' +
                '\n' +
                'https://github.com/html5lab/html5lab.github.io/'
        );
    } catch (e) {}
})();

$(document).on('ready', function() {
    var $window = $(window);
    var $html = $('html');
    var $body = $('body');
    var $htmlAndBody = $('html, body');
    var $video = $('#video');
    var video = $video.get(0);
    var duration = 0;
    var $document = $(document);
    var windowHeight = 0;
    var currentScroll = 0;
    var documentHeight = 0;
    var isPlaying = false;
    var isSuspended = false;
    var IE_SEEK_INTERVAL = 1000;
    var lastSeekTime = 0;
    var isWindowLoaded = false;
    var isVideoLoaded = false;

    var readyHandler = function () {
        console.log('document.onready');
    };

    var loadHandler = function() {
        console.log('window.onload');
        isWindowLoaded = true;
        if (isWindowLoaded && isVideoLoaded) {
            initialize();
        }
    };

    var loadedMetadataHandler = function() {
        console.log('video.onloadedmetadata');
        video.pause();

        duration = video.duration;
        var stringedDuration = (Math.floor(duration * 10) / 10).toFixed(1);
        $('#duration').text(stringedDuration + 's');
    };

    var loadedDataHandler = function() {
        console.log('video.onloadeddata');
        isVideoLoaded = true;
        if (isWindowLoaded && isVideoLoaded) {
            initialize();
        }
    };

    var initialize = function() {
        resizeDelayHandeler();
        seekByScroll();
        setTimeout(startPlaying, 0);

        $(window)
            .on('scroll', function() {
                if (isPlaying) {
                    console.log('ignored scroll event because isPlaying is true.');
                    return;
                }
                if (video.readyState === video.HAVE_NOTHING) {
                    console.log('ignored scroll event because of readyState is ' + video.readyState);
                    return;
                }
                if (isSuspended) {
                    console.warn('scroll event was fired though isSuspended is true.');
                    return;
                }

                seekByScroll();
            })
            .on('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(resizeDelayHandeler, 100);
            })
    };

    var resizeDelayHandeler = function() {
        console.log('resizeDelayHandler was called.');
        windowHeight = $window.height();
        //$('.auto-height').css('min-height', windowHeight + 'px');
        currentScroll = $body.scrollTop() || $html.scrollTop();
        documentHeight = $document.height();
        //console.log('documentHeight = ' + documentHeight + ', windowHeight = ' + windowHeight + ', currentScroll = ' + currentScroll)
    };

    var seekByScroll = function() {

        // IEは頻繁にcurrentTimeを更新すると追随できないので、頻度を下げる
        var isIE9 = !!navigator.userAgent.toLowerCase().match('msie 9');
        var isVideoSupported = 'HTMLVideoElement' in window;
        if (isIE9 && isVideoSupported) {
            var now = Date.now();
            if (now - lastSeekTime < IE_SEEK_INTERVAL) {
                console.log('ignored seeking because of too short interval.');
                return;
            }
            lastSeekTime = now;
        }

        currentScroll = $body.scrollTop() || $html.scrollTop();
        var currentTime = Math.max(Math.min(duration * currentScroll / (documentHeight - windowHeight), duration - 0.1), 0);
        video.currentTime = currentTime;
        var stringedTime = (Math.floor(currentTime * 10) / 10).toFixed(1);
        $('#currentTime').text(stringedTime);
        // console.log('seekByScroll was called. current time is ' + currentTime + '.');
    };

    var scrollByTimeUpdate = function() {
        //console.log('scrollByTimeUpdate');
        var currentTime = video.currentTime;
        var newScroll = (documentHeight - windowHeight) * currentTime / duration;

        var stringedTime = (Math.floor(currentTime * 10) / 10).toFixed(1);
        $('#currentTime').text(stringedTime);

        $htmlAndBody.stop(true, false).animate({
            scrollTop: newScroll
        }, {
            duration: 400,
            easing: 'linear'
        });
        // console.log('(' + documentHeight + ' - ' + windowHeight + ') * ' + currentTime + ' / ' + duration +' = ' + newScroll);
    };

    var startPlaying = function() {
        if (video.seeking) {
            console.log('skiped startPlaying');
            setTimeout(startPlaying, 100);
        }
        console.log('startPlaying');
        isPlaying = true;
        $('html').addClass('isPlaying');
        video.play();
    };

    var stopPlaying = function() {
        console.log('stopPlaying');
        video.pause();
        $htmlAndBody.stop(true, false);
        $('html').removeClass('isPlaying');
        isPlaying = false;
    };

    var visibilityChangeHandler = function() {
        switch (document.visibilityState) {
            case 'visible':
                isSuspended = false;
                break;
            case 'hidden':
            case 'pretender':
                isSuspended = true;
                break;
        }
        console.log('isSuspended = ' + isSuspended + ', isPlaying = ' + isPlaying);

        if (isPlaying && isSuspended) {
            $htmlAndBody.stop(true, true);
            video.pause();
        }

        if (isPlaying && !isSuspended && !video.ended) {
            video.play();
        }
    };

    var resizeTimer = null;

    $window.on('load', loadHandler);

    $video
        .on('loadedmetadata', loadedMetadataHandler)
        .on('loadeddata', loadedDataHandler)
        .on('timeupdate', function() {
            if (isSuspended) {
                console.warn('timeupdate event was fired though isSuspended is true.');
                return;
            }
            if (!isPlaying) {
                console.log('ignored timeupdate event because isPlaying is false.');
                return;
            }
            scrollByTimeUpdate();
        }).on('ended', function() {
            console.log('video ended.');
            stopPlaying();
        });

    $document
        .on('mousewheel DOMMouseScroll mousedown', function() {
            if (!isPlaying) {
                return;
            }
            stopPlaying();
        })
        .on('visibilitychange', visibilityChangeHandler);

    $('#playButton').on('click touchstart', function(event) {
        event.preventDefault();
        if (!isPlaying) {
            startPlaying();
        }
    });

    $('#pauseButton').on('click touchstart', function(event) {
        event.preventDefault();
        if (isPlaying) {
            stopPlaying();
        }
    });

    readyHandler();
});
