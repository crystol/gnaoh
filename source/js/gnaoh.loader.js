//loading configuration & analytics
(function (root, document) {
    'use strict';
    //CDN hosted scripts and their local fallbacks
    var staticLocation = '/static/js';
    root.require.config({
        baseUrl: 'js/',
        paths: {
            static: staticLocation,
            jQuery: [
                '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
                staticLocation + '/jQuery'
            ],
            analytics: [
                ('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga'
            ]
        }
    });
    //load the main script
    root.require(['gnaoh']);
    root.require(['gnaoh2']);
    //Google analytics
    root.onload = function () {
        var _gaq = root._gaq || [];
    //     _gaq.push(['_setAccount', 'UA-38948913-1'], ['_setDomainName', 'none'], ['_trackPageview']);
        root._gaq = _gaq;
    //     root.require(['analytics']);
    };
})(window, document);