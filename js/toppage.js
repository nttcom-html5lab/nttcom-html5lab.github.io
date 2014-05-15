$(document)
    .on('mousewheel DOMMouseScroll mousedown touchstart', bgv.wheelHandler)
    .on('visibilitychange', bgv.visibilityChangeHandler)
    .on('ready', function() {
        $('#playButton').on('click touchstart', bgv.clickedPlayButtonHandler);
        $('#pauseButton').on('click touchstart', bgv.clickedPauseButtonHandler);
        bgv.readyHandler();
    });
$(window)
    .on('load', bgv.windowLoadHandler)
    .on('scroll', bgv.scrollHandler)
    .on('resize', bgv.resizeHandler);