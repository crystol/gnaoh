//loading configuration & analytics
(function (root, document) {
	'use strict';
	//CDN hosted scripts and their local fallbacks
	var library = '/library/js';
	root.require.config({
		baseUrl: 'js/',
		paths: {
			lib: library,
			jQuery: [
				document.location.protocol + '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min',
				library + '/jQuery'
			],
			analytics: [
				('https:' === document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga'
			]
		}
	});
	//load the main scriptd
	root.require(['gnaoh']);
	//Google analytics
	root.onload = function () {
		var cookieTray = document.cookie.split(';').sort();
		var remote;
		while (cookieTray.length) {
			remote = cookieTray.pop();
			if (/^Remote/.test(remote)) {
				remote = remote.split('=')[1];
				break;
			}
		}
		var _gaq = root._gaq || [];
		_gaq.push(['_setAccount', 'UA-38948913-1'], ['_setDomainName', 'none'], ['_trackPageview'], ['_setCustomVar', 1, 'Remote', remote, 1]);
		root._gaq = _gaq;
		root.require(['analytics']);
	};
})(window, document);