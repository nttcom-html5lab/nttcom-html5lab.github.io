var bgv = (function() {

    var isWindowLoaded = false;
    var isBgvLoaded = false;
    var resizeTimer = null;

    var $html = $('html');
    var $body = $('body');
    var $htmlAndBody = $('html, body');
    var windowHeight = 0;
    var currentScroll = 0;
    var documentHeight = 0;
    var isPlaying = false;
    var isSuspended = false;
    var isInitialized = false;
    var duration = 0;
    var isDebug = true;
    isDebug = isDebug && ('console' in window);

    function readyHandler() {
        flexvideo
            .on('loadedmetadata', loadedMetadataHandler)
            .on('loadeddata', loadedDataHandler)
            .on('timeupdate', timeUpdateHandler)
            .on('ended', endedHandler)
            .initialize('.toppage-background', '#video', '#pictures');

        $html.addClass('isPausing');

        if (isDebug) {
            $('main').append(
                '<section class="current-time-container">'
                + '<span id="currentTime"></span> / <span id="duration"></span>'
                + '</section>'
            );
            console.log('document.onready');
        }
    }

    function loadedMetadataHandler() {
        if (isDebug) console.log('flexvideo.onloadedmetadata');
        flexvideo.pause();

        duration = flexvideo.getDuration();
        if (isDebug) {
            var stringedDuration = (Math.floor(duration * 10) / 10).toFixed(1);
            $('#duration').text(stringedDuration + 's');
        }
    }

    function windowLoadHandler() {
        if (isDebug) console.log('window.onload');
        isWindowLoaded = true;
        if (isWindowLoaded && isBgvLoaded) {
            initialize();
        }
    }

    function loadedDataHandler() {
        if (isDebug) console.log('flexvideo.onloadeddata');
        isBgvLoaded = true;
        if (isWindowLoaded && isBgvLoaded) {
            initialize();
        }
    }

    function initialize() {
        setTimeout(function() {
            isInitialized = true;
            measureSizes();
            startPlaying();
        }, 0);
    }

    function timeUpdateHandler() {
        if (isSuspended) {
            if (isDebug) console.warn('timeupdate event was fired though isSuspended is true.');
            return;
        }
        if (!isPlaying) {
            // if (isDebug) console.log('ignored timeupdate event because isPlaying is false.');
            return;
        }
        scrollByTimeUpdate();
    }

    function endedHandler() {
        if (isDebug) console.log('flexvideo ended.');
        stopPlaying();
    }

    function resizeHandler() {
        if (!isWindowLoaded || !isBgvLoaded) {
            return;
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(measureSizes, 100);
    }

    function measureSizes() {
        if (isDebug) console.log('measureSizes was called.');
        windowHeight = $(window).height();
        currentScroll = $body.scrollTop() || $html.scrollTop();
        documentHeight = $(document).height();
        if (isDebug) console.log('documentHeight = ' + documentHeight + ', windowHeight = ' + windowHeight + ', currentScroll = ' + currentScroll);
        scrollHandler();
    }

    function wheelHandler() {
        if (isPlaying) {
            stopPlaying();
        }
    }

    function scrollHandler() {
        if (isPlaying) {
            //if (isDebug) console.log('ignored scroll event because isPlaying is true.');
            return;
        }
        if (flexvideo.getReadyState() === flexvideo.HAVE_NOTHING) {
            if (isDebug) console.warn('ignored scroll event because of readyState is ' + flexvideo.getReadyState());
            return;
        }
        if (isSuspended) {
            if (isDebug) console.warn('scroll event was fired though isSuspended is true.');
            return;
        }
        if (!isInitialized) {
            if (isDebug) console.warn('ignored scroll event because isInitialized is false.');
            return;
        }
        seekByScroll();
    }

    function seekByScroll() {
        currentScroll = $body.scrollTop() || $html.scrollTop();
        var currentTime = Math.max(Math.min(duration * currentScroll / (documentHeight - windowHeight), duration), 0);
        flexvideo.setCurrentTime(currentTime);
        // if (isDebug) console.log('seekByScroll was called. current time is ' + currentTime + '.');

        drawSeekBar(currentTime);
    }

    function scrollByTimeUpdate() {
        //if (isDebug) console.log('scrollByTimeUpdate');
        var currentTime = flexvideo.getCurrentTime();
        var newScroll = (documentHeight - windowHeight) * currentTime / duration;

        $htmlAndBody.stop(true, false).animate({
            scrollTop: newScroll
        }, {
            duration: 400,
            easing: 'linear'
        });

        drawSeekBar(currentTime);
        // if (isDebug) console.log('(' + documentHeight + ' - ' + windowHeight + ') * ' + currentTime + ' / ' + duration +' = ' + newScroll);
    }

    function drawSeekBar(currentTime) {
        var stringedTime = (Math.floor(currentTime * 10) / 10).toFixed(1);
        var buffered = flexvideo.getBuffered();
        var bufferedLength = buffered.length;
        var $buffered = $('.buffered');
        var $bufferedLength = $buffered.length;

        if (isDebug) {
            $('#currentTime').text(stringedTime);
            $('#played').css({
                width: (currentTime / duration * 100) + '%'
            });
        }

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

    function visibilityChangeHandler() {
        switch (document.visibilityState) {
            case 'visible':
                isSuspended = false;
                break;
            case 'hidden':
            case 'pretender':
                isSuspended = true;
                break;
        }
        if (isDebug) console.log('isSuspended = ' + isSuspended + ', isPlaying = ' + isPlaying);

        if (isPlaying && isSuspended) {
            $htmlAndBody.stop(true, true);
            flexvideo.pause();
        }

        if (isPlaying && !isSuspended && !flexvideo.getEnded()) {
            flexvideo.play();
        }
    }

    function clickedPlayButtonHandler(event) {
        if (isDebug) console.log('#playButton.onclick');
        event.preventDefault();
        if (!isPlaying) {
            startPlaying();
        }
    }

    function clickedPauseButtonHandler(event) {
        if (isDebug) console.log('#pauseButton.onclick');
        event.preventDefault();
        if (isPlaying) {
            stopPlaying();
        }
    }

    function startPlaying() {
        var currentTime = flexvideo.getCurrentTime();
        var isIE = /(trident|msie)/.test(navigator.userAgent.toLowerCase());
        var isCurrentTimeBug = flexvideo.support.video && isIE;
        if (flexvideo.getEnded()
            || ((duration === -1) && (currentTime >= duration))
            || (isCurrentTimeBug && (duration - currentTime < 0.5))   // IE11 Work Around
            ) {
            return;
        }
        if (isDebug) console.log('startPlaying');
        isPlaying = true;
        $('html').removeClass('isPausing').addClass('isPlaying');
        flexvideo.play();
    }

    function stopPlaying() {
        if (isDebug) console.log('stopPlaying');
        flexvideo.pause();
        $htmlAndBody.stop(true, false);
        $('html').removeClass('isPlaying').addClass('isPausing');
        isPlaying = false;
    }

    return {
        readyHandler: readyHandler,
        windowLoadHandler: windowLoadHandler,
        scrollHandler: scrollHandler,
        resizeHandler: resizeHandler,
        wheelHandler: wheelHandler,
        visibilityChangeHandler: visibilityChangeHandler,
        clickedPlayButtonHandler: clickedPlayButtonHandler,
        clickedPauseButtonHandler: clickedPauseButtonHandler
    };
})();