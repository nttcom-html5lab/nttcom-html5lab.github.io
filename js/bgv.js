var bgv = (function() {

    var isWindowLoaded = false;
    var isBgvLoaded = false;
    var resizeTimer = null;

    var $document = $(document);
    var $html = $('html');
    var $body = $('body');
    var $htmlAndBody = $('html, body');
    var windowHeight = 0;
    var currentScroll = 0;
    var documentHeight = 0;
    var isPlaying = false;
    var isFirstPlay = true;
    var isSuspended = false;
    var wasSuspended = false;
    var isInitialized = false;
    var duration = 0;

    if (util.os.iOS) {
        var iOS7more = /^[^2-6]/.test(util.os.version);
    }

    function readyHandler() {
        if (util.isDebug) console.log('document.onready');

        flexvideo
            .on('loadedmetadata', loadedMetadataHandler)
            .on('loadeddata', loadedDataHandler)
            .on('timeupdate', timeUpdateHandler)
            .on('ended', endedHandler)
            .on('playing', playingHandler)
            .on('paused', pausedHandler)
            .initialize('.toppage-background', '#video', '#pictures');

        $html.addClass('isPausing');

        if (util.isDebug) {
            $('main').append(
                '<section class="current-time-container">'
                + '<span id="currentTime"></span> / <span id="duration"></span>'
                + '</section>'
            );
        }

        if (util.support.inlineVideo) {
            $('#pictures').hide();
        } else {
            $('#video').hide();
        }
    }

    function loadedMetadataHandler() {
        if (util.isDebug) console.log('flexvideo.onloadedmetadata');

        flexvideo.pause();

        duration = flexvideo.getDuration();
        if (util.isDebug) {
            var stringedDuration = (Math.floor(duration * 10) / 10).toFixed(1);
            $('#duration').text(stringedDuration + 's');
        }
    }

    function windowLoadHandler() {
        if (util.isDebug) console.log('window.onload');
        isWindowLoaded = true;
        if (isWindowLoaded && isBgvLoaded) {
            initialize();
        }
    }

    function loadedDataHandler() {
        if (util.isDebug) console.log('flexvideo.onloadeddata');
        isBgvLoaded = true;
        if (isWindowLoaded && isBgvLoaded) {
            initialize();
        }
    }

    function initialize() {
        if (util.isDebug) console.log('bgv.initialize()');
        setTimeout(function() {
            isInitialized = true;
            measureSizes();
            startPlaying();
        }, 0);
    }

    function endedHandler() {
        if (util.isDebug) console.log('flexvideo.onended');
        stopPlaying();
    }

    function playingHandler() {
        if (util.isDebug) console.log('flexvideo.onplaying');
        isPlaying = true;
        if (util.isDebug) console.log('isPlaying = true');
        $('html').removeClass('isPausing').addClass('isPlaying');
    }

    function pausedHandler() {
        if (util.isDebug) console.log('flexvideo.onpaused');
        if (isSuspended) {
            return;
        }
        $('html').removeClass('isPlaying').addClass('isPausing');
        isPlaying = false;
        if (util.isDebug) console.log('isPlaying = false');
    }

    function resizeHandler() {
        if (!isWindowLoaded || !isBgvLoaded) {
            return;
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(measureSizes, 100);
    }

    function measureSizes() {
        if (iOS7more) {
            windowHeight = window.innerHeight;
        } else {
            windowHeight = $(window).height();
        }

        currentScroll = $body.scrollTop() || $html.scrollTop();
        documentHeight = $document.height();
        if (util.isDebug) console.log('bgv.measureSizes(); documentHeight = ' + documentHeight + ', windowHeight = ' + windowHeight + ', currentScroll = ' + currentScroll);
        scrollHandler();
    }

    function wheelHandler(event) {
        if (util.isDebug && event && event.type) console.log('document.on' + event.type);
        if (isPlaying) {
            stopPlaying();
        }
    }

    function scrollHandler() {
        if (isPlaying) {
            //if (util.isDebug) console.log('ignored scroll event because isPlaying is true.');
            return;
        }
        if (flexvideo.getReadyState() === flexvideo.HAVE_NOTHING) {
            if (util.isDebug) console.warn('ignored scroll event because of readyState is ' + flexvideo.getReadyState());
            return;
        }
        if (isSuspended) {
            if (util.isDebug) console.warn('scroll event was fired though isSuspended is true.');
            return;
        }
        if (!isInitialized) {
            if (util.isDebug) console.warn('ignored scroll event because isInitialized is false.');
            return;
        }
        if (util.isDebug) console.log('window.onscroll');
        seekByScroll();
    }

    function seekByScroll() {
        currentScroll = $body.scrollTop() || $html.scrollTop();
        var currentTime = duration * currentScroll / (documentHeight - windowHeight);
        currentTime = Math.max(Math.min(currentTime, duration), 0);
        if (util.isDebug) console.log('flexvideo.setCurrentTime(' + currentTime + ')');
        flexvideo.setCurrentTime(currentTime);

        drawSeekBar(currentTime);
    }

    function timeUpdateHandler() {
        if (isSuspended) {
            if (util.isDebug) console.warn('timeupdate event was fired though isSuspended is true.');
            return;
        }
        if (!isPlaying) {
            if (util.isDebug) console.log('ignored timeupdate event because isPlaying is false.');
            return;
        }
        if (util.support.touch && isFirstPlay) {
            if (util.isDebug) console.log('ignored timeupdate event because of first play.');
            isFirstPlay = false;
            return;
        }
        if (util.isDebug) console.log('video.ontimeupdate');
        scrollByTimeUpdate();
    }

    function scrollByTimeUpdate() {
        //if (util.isDebug) console.log('scrollByTimeUpdate');
        var currentTime = flexvideo.getCurrentTime();
        var newScroll = (documentHeight - windowHeight) * currentTime / duration;

        if (util.isDebug) console.log('html / body.scrollTop(' + newScroll + ')');
        $htmlAndBody.stop(true, false).animate({
            scrollTop: newScroll
        }, {
            duration: 400,
            easing: 'linear'
        });

        drawSeekBar(currentTime);
        // if (util.isDebug) console.log('(' + documentHeight + ' - ' + windowHeight + ') * ' + currentTime + ' / ' + duration +' = ' + newScroll);
    }

    function drawSeekBar(currentTime) {
        var stringedTime = (Math.floor(currentTime * 10) / 10).toFixed(1);
        var buffered = flexvideo.getBuffered();
        var bufferedLength = buffered.length;
        var $buffered = $('.buffered');
        var $bufferedLength = $buffered.length;

        if (util.isDebug) {
            $('#currentTime').text(stringedTime);
        }

        $('#played').css({
            width: (currentTime / duration * 100) + '%'
        });
        for (var i = 0; i < Math.max(bufferedLength, $bufferedLength); i++) {
            if (i < bufferedLength) {
                if (i >= $bufferedLength) {
                    $('<div class="buffered"></div>').appendTo('.seek-bar');
                }
                var start = buffered.start(i);
                var end = buffered.end(i);
                $buffered.eq(i).css({
                    left: (start / duration * 100) + '%',
                    width: ((end - start) / duration * 100) + '%'
                });
            } else {
                $buffered.eq(i).css({
                    width: 0
                });
            }
        }
    }

    function visibilityChangeHandler(event) {
        if (util.isDebug && event.type) {
            if (event.target && event.target.nodeName) {
                console.log(event.target.nodeName + '.on' + event.type);
            } else if (event.target === window) {
                console.log('window' + '.on' + event.type);
            }
        }

        switch (event.type) {
            case 'pageshow':
                isSuspended = false;
                break;
            case 'pagehide':
                isSuspended = true;
                break;
            case 'visibilitychange':
                switch (document.visibilityState) {
                    case 'visible':
                        isSuspended = false;
                        break;
                    case 'hidden':
                    case 'pretender':
                        isSuspended = true;
                        break;
                }
                break;
        }

        if (isSuspended === wasSuspended) {
            return;
        }
        wasSuspended = isSuspended;

        if (util.isDebug) console.log('isSuspended = ' + isSuspended + ', isPlaying = ' + isPlaying);

        if (isPlaying && isSuspended) {
            $htmlAndBody.stop(true, true);
            flexvideo.pause();
        }

        if (isPlaying && !isSuspended && !getEnded()) {
            setTimeout($.proxy(flexvideo.play, flexvideo), 0);
        }
    }

    function clickedPlayButtonHandler(event) {
        if (util.isDebug) console.log('#playButton.onclick');
        event.preventDefault();
        if (!isPlaying) {
            startPlaying();
        }
    }

    function clickedPauseButtonHandler(event) {
        if (util.isDebug) console.log('#pauseButton.onclick');
        event.preventDefault();
        if (isPlaying) {
            stopPlaying();
        }
    }

    function startPlaying() {
        if (util.isDebug) console.log('bgv.startPlaying()');
        if (getEnded()) {
            return;
        }
        flexvideo.play();
    }

    function stopPlaying() {
        if (util.isDebug) console.log('bgv.stopPlaying()');
        flexvideo.pause();
        $htmlAndBody.stop(true, true);
    }

    function getEnded() {
        var currentTime = flexvideo.getCurrentTime();
        var isCurrentTimeBug = util.support.inlineVideo && util.browser.ie;
        return flexvideo.getEnded()
            || ((duration === -1) && (currentTime >= duration))
            || ((duration === -1) && isCurrentTimeBug && (duration - currentTime < 0.5));  // IE11 Work Around
    }


    var startX = -1;
    var startY = -1;

    function touchStartHandler(event) {
        startX = event.originalEvent.touches[0].pageX;
        startY = event.originalEvent.touches[0].pageY;
        //if (util.isDebug) console.log('document.ontouchstart (' + startX + ', ' + startY + ')');
    }

    function touchMoveHandler(event) {
        if (startX === -1) {
            return;
        }
        var x = event.originalEvent.touches[0].pageX;
        var y = event.originalEvent.touches[0].pageY;
        var distance = Math.sqrt(Math.pow(startX - x, 2) + Math.pow(startY - y, 2));
        //if (util.isDebug) console.log('document.outouchmove (' + x + ', ' + y + ') ' + distance);
        if (distance > 10) {
            //if (util.isDebug) console.log('distance > 10');
            startX = -1;
            startY = -1;
            $document.trigger('vwheel');
        }
    }

    function touchEndHandler() {
        if (util.isDebug) console.log('document.ontouchend');
        startX = -1;
        startY = -1;
    }

    return {
        readyHandler: readyHandler,
        windowLoadHandler: windowLoadHandler,
        scrollHandler: scrollHandler,
        resizeHandler: resizeHandler,
        wheelHandler: wheelHandler,
        visibilityChangeHandler: visibilityChangeHandler,
        clickedPlayButtonHandler: clickedPlayButtonHandler,
        clickedPauseButtonHandler: clickedPauseButtonHandler,
        touchStartHandler: touchStartHandler,
        touchMoveHandler: touchMoveHandler,
        touchEndHandler: touchEndHandler
    };
})();
