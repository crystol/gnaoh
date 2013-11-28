// Google analytics
(function (window) {
    'use strict';
    window.onload = function () {
        window['ga'] = window['ga'] || function () {
            (window['ga'].q = window['ga'].q || []).push(arguments);
        };
        window['ga'].l = 1 * new Date();
        window.ga('create', 'UA-45841326-1', 'gnaoh.com');
        window.ga('send', 'pageview');
        window.require(['analytics']);
    };
})(window);