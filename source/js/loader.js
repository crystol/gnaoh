// Loading configuration for require.js
(function (window) {
    'use strict';
    //CDN hosted scripts and their local fallbacks
    var staticLocation = '/static/js';
    window.require.config({
        baseUrl: '/js/',
        paths: {
            static: staticLocation,
            jquery: [
                '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min',
                staticLocation + '/jQuery'
            ],
            analytics: [
                '//www.google-analytics.com/analytics',
                staticLocation + '/analytics'
            ]
        }
    });
    //load the main script
    window.require(['gnaoh']);
})(window);