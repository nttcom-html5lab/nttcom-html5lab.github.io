/**
 * Created by rotsuya on 2014/03/03.
 */
(function() {
    // <head>読み込み時の処理

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

    $(document).on('ready', function() {
        // html読み込み時の処理
        var height = $(window).height();
        $('.hl-window-height').css('min-height', height);
        $('body').scrollspy({ target: '.hl-scroll-spy'});
        $('.hl-affix').affix({
            offset: {
                top: 0 ,
                bottom: $('.hl-footer').outerHeight() + 100
            }
        });
    });

    $(window).on('load', function() {
        // load完了時の処理
    }).on('resize', function() {
        // resize持の処理
        var height = $(window).height();
        $('.hl-window-height').css('min-height', height);
    });

})();
