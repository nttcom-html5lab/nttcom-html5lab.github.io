(function() {
    var $document = $(document);

    if (util.support.touch) {
        $document
            .on('touchstart', bgv.touchStartHandler)
            .on('touchmove', bgv.touchMoveHandler)
            .on('touchend touchcancel', bgv.touchEndHandler);
    }

    $document
        .on('mousewheel DOMMouseScroll vwheel mousedown', bgv.wheelHandler);

    $document
        .on('visibilitychange', bgv.visibilityChangeHandler)
        .on('ready', function() {
            $('#playButton').on('click touchstart', bgv.clickedPlayButtonHandler);
            $('#pauseButton').on('click touchstart', bgv.clickedPauseButtonHandler);
            bgv.readyHandler();
        });
    $(window)
        .on('load', bgv.windowLoadHandler)
        .on('scroll', bgv.scrollHandler)
        .on('resize iosstatusbarvisibilitychange', bgv.resizeHandler)
        .on('pageshow load', bgv.visibilityChangeHandler)
        .on('pagehide blur', bgv.visibilityChangeHandler);
})();
