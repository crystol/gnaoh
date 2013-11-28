// Google analytics
(function (window) {
    'use strict';
    window.onload = function () {
        var _gaq = window._gaq || [];
        _gaq.push(['_setAccount', 'UA-38948913-1'], ['_setDomainName', 'none'], ['_trackPageview']);
        window._gaq = _gaq;
        window.require(['analytics']);
    };
})(window);