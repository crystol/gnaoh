// //module to start the server
// module.exports = function() {
// 	'use strict';
// 	var express = require('express');
// 	var grunt = require('grunt');
// 	var app = express();

// 	grunt.registerTask('live', function() {
// 		// keep the server task alive
// 		this.async();
// 		app.enable('strict routing');
// 		app.get('/', function(request, response) {
// 			var body = 'Hello World';
// 			respon~se.setHeader('Content-Type', 'text/plain');
// 			response.setHeader('Content-Length', body.length);
// 			response.send(body);
// 		});

// 		var port = grunt.config.get('port');
// 		app.listen(port);
// 		console.log('Starting a server on port: ' + port);
// 	});
// };