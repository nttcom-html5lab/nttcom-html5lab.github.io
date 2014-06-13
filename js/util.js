var util = (function() {
    var getNow = function() {
        if ('now' in Date) {
            return Date.now();
        } else {
            return new Date();
        }
    };

    try {
    if (os.iOS) {
        var iOS7more = /^[^2-6]/.test(os.version);
        if (iOS7more) {
            var iOSHeight = window.innerHeight;
            var iOSResizeTimer = setInterval(function() {
                var height = window.innerHeight;
                if (iOSHeight !== height) {
                    iOSHeight = height;
                    $(window).trigger('iosstatusbarvisibilitychange');
                }
            }, 1000);

            $(window).on('unload', function() {
                clearInterval(iOSResizeTimer);
            });
        }
    }
        console.log(
                '\n' +
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
    } catch(e) {
    }

    return {
        getNow: getNow
    };
})();
