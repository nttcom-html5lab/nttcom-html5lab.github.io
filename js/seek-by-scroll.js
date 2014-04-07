$(document).on('ready', function() {
    var $window = $(window);
    var $html = $('html');
    var $body = $('body');
    var $htmlbody = $('html, body');
    var $video = $('#video');
    var video = $video.get(0);
    var duration = 0;
    var $document = $(document);
    var windowHeight = 0;
    var currentScroll = 0;
    var bodyHeight = 0;
    var isPlaying = false;

    var resizeHandler = function() {
        windowHeight = $window.height();
        $('.auto-height').height(windowHeight + 'px');
        currentScroll = $body.scrollTop() || $html.scrollTop();
        bodyHeight = $body.height();
    };

    var scrollHandler = function() {
        //console.log('scrollHandler');
        currentScroll = $body.scrollTop() || $html.scrollTop();
        var currentTime = Math.max(Math.min(duration * currentScroll / (bodyHeight - windowHeight), duration - 0.1), 0);
        video.currentTime = currentTime;
        var stringedTime = (Math.floor(currentTime * 10) / 10).toFixed(1);
        $('#currentTime').text(stringedTime);
    };

    var timeupdateHandler = function() {
        if (!isPlaying) {
            return;
        }
        //console.log('timeupdateHandler');
        var currentTime = video.currentTime;
        var newScroll = (bodyHeight - windowHeight) * currentTime / duration;

        var stringedTime = (Math.floor(currentTime * 10) / 10).toFixed(1);
        $('#currentTime').text(stringedTime);

        $htmlbody.stop(true, false).animate({
            scrollTop: newScroll
        }, {
            duration: 500,
            easing: 'linear'
        });
    };

    var loadeddataHandler = function() {
        //console.log('loadeddataHandler');
        duration = video.duration;
        video.pause();
        scrollHandler();
        scrollDelayTimer = setTimeout(scrollDelayHandler, 5000);
        var stringedDuration = (Math.floor(duration * 10) / 10).toFixed(1);
        $('#duration').text(stringedDuration + 's');
    };

    var scrollDelayHandler = function() {
        //console.log('scrollDelayHandler');
        isPlaying = true;
        video.play();
    };

    var wheelHandler = function() {
        //console.log('wheelHandler');
        $htmlbody.stop(true, true);
        isPlaying = false;
        video.pause();
    };

    var visibilityChangeHandler = function() {
        var isVisible = !document.hidden;
        //console.log('visibilityChangeHandler. isVisible = ' + isVisible);
        if (isPlaying && !isVisible) {
            $htmlbody.stop(true, true);
            isPlaying = false;
            video.pause();
        }
        if (!isPlaying && isVisible) {
            isPlaying = true;
            video.play();
        }
    };

    var hash = location.hash.replace(/^#/, '');
    var filename = '';
    switch (hash) {
        case 'mono':
            filename = 'web25_mono';
            break;
        case 'sepia':
            filename = 'web25_sepia';
            break;
        default:
            filename = 'web25';
            break;
    };
    var extension = '';
    if (navigator.userAgent.toLowerCase().match(/chrome/)) {
        extension = 'webm';
    } else if (navigator.userAgent.toLowerCase().match(/safari/)) {
        extension = 'm4v';
    } else if (navigator.userAgent.toLowerCase().match(/firefox/)) {
        extension = 'webm';
    } else {
        extension = 'm4v';
    }
    var src = filename + '.' + extension;
    video.src = 'video/' + src;
    video.play();
    resizeHandler();

    $window.on('scroll', function() {
        var isVisible = !document.hidden;
        if (!isVisible) {
            clearTimeout(scrollDelayTimer);
            return;
        }
        if (isPlaying) {
            return;
        }
        if (video.readyState !== video.HAVE_ENOUGH_DATA
            && video.readyState !== video.HAVE_FUTURE_DATA
            && video.readyState !== video.HAVE_CURRENT_DATA) {
            return;
        }
        scrollHandler();
        clearTimeout(scrollDelayTimer);
        scrollDelayTimer = setTimeout(scrollDelayHandler, 20000);
    });

    $video.on('loadeddata', loadeddataHandler);

    var resizeTimer = null;
    $window.on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeHandler, 100);
    });

    var scrollDelayTimer = null;
    $video.on('timeupdate', timeupdateHandler);
    $document.on('mousewheel', wheelHandler);

    $document.on('visibilitychange', visibilityChangeHandler);
});
