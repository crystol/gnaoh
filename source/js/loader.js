//loading configuration & analytics
(function (win, document) {
    'use strict';
    //CDN hosted scripts and their local fallbacks
    var staticLocation = '/static/js';
    win.require.config({
        baseUrl: '/js/',
        paths: {
            static: staticLocation,
            jquery: [
                // '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
                '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min',
                staticLocation + '/jQuery'
            ],
            analytics: [
                ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga'
            ]
        }
    });
    //load the main script
    win.require(['gnaoh']);
    //Google analytics
    win.onload = function () {
        var _gaq = win._gaq || [];
        _gaq.push(['_setAccount', 'UA-38948913-1'], ['_setDomainName', 'none'], ['_trackPageview']);
        win._gaq = _gaq;
        win.require(['analytics']);
    };
})(window, document);