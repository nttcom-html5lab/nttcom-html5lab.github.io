var util = (function() {
    var getNow = function() {
        if ('now' in Date) {
            return Date.now();
        } else {
            return new Date();
        }
    };

    // Facebookをベースにしたscriptの非同期読み込み用の関数
    var jsload = function (d, s, id, src) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = src;
        fjs.parentNode.insertBefore(js, fjs);
    };

    // Twitter
    jsload(document, 'script', 'twitter-wjs', '//platform.twitter.com/widgets.js');
    // Facebook
    jsload(document, 'script', 'facebook-jssdk', '//connect.facebook.net/ja_JP/all.js#xfbml=1&appId=582225031817530');
    // Hatena
    jsload(document, 'script', 'hatena-js', '//b.st-hatena.com/js/bookmark_button.js');

    try {
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
        getNow: getNow,
        console: console
    };
})();
