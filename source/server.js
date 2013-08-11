// module to start the server
'use strict';
// dependencies
var http = require('http');
var spdy = require('spdy');
var express = require('express');
var app = express();
var router = require('./router.js');
var fs = require('fs');
// SPDY server 
var spdyOptions = {
	key: fs.readFileSync('/kadmin/server/nginx/ssl/keys/gnaoh.key'),
	cert: fs.readFileSync('/kadmin/server/nginx/ssl/certs/gnaoh.crt')
};
// export to listen and serve
module.exports = {
	http: http.createServer(app),
	spdy: spdy.createServer(spdyOptions, app)
};
// app settings
app.configure(function () {
	app.set('views', __dirname + '/views');
	app.engine('jade', require('jade').__express);
	app.set('view engine', 'jade');
	app.set('http port', 1337);
	app.set('https port', 1338);
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	// strip slashes
	app.use(function (req, res, next) {
		if (req.url.substr(-1) === '/' && req.url.length > 1) {
			res.redirect(301, req.url.slice(0, -1));
		} else {
			next();
		}
	});
	app.use(express.favicon(__dirname + '/views/favicon.ico'));
	app.use(app.router);
	app.disable('x-powered-by');
	// static url for domain wide routing
	app.use(express.static(__dirname));
	// static url for developement with /node address
	app.use('/library/', express.static('/kadmin/server/www/library'));
	// 404 page
	app.use(function (req, res) {
		res.status(404).sendfile(__dirname + '/views/404.html');
	});
});
// getters
var getters = ['/', 'index', 'about', 'gallery', 'videos'];
getters.forEach(function (value) {
	if (value === '/') {
		//404 the homepage for now
		app.get('/', router['404']);
	} else {
		app.get('/' + value, router[value]);
	}
});
// http serve
// http.createServer(app).listen(app.get('http port'), function () {
// console.log('Starting a server on port: ' + app.get('http port'));
// });
// spdy.createServer(spdyOptions, app).listen(app.get('https port'), function () {
// console.log('Starting a SPDY server listening on port: ' + app.get('https port'));
// });