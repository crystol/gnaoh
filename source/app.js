// module to start the server
'use strict';
// dependencies
var http = require('http');
var spdy = require('spdy');
var express = require('express');
var app = express();
var routes = require('./routes.js');
var fs = require('fs');
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
	app.use(express.favicon(__dirname + '/views/favicon.ico'));
	app.use(app.router);
	app.disable('x-powered-by');
	// static url for domain wide routing
	app.use(express.static(__dirname));
	// static url for developement with /node address
	app.use('/library/', express.static('../library'));
	// 404 page
	app.use(function (req, res) {
		res.status(404).sendfile('views/404.html');
	});
});
// http serve
http.createServer(app).listen(app.get('http port'), function () {
	console.log('Starting a server on port: ' + app.get('http port'));
});
// SPDY server 
var options = {
	key: fs.readFileSync('/kadmin/server/nginx/ssl/server.key'),
	cert: fs.readFileSync('/kadmin/server/nginx/ssl/server.cert')
};
spdy.createServer(options, app).listen(app.get('https port'), function () {
	console.log('Starting a SPDY server listening on port: ' + app.get('https port'));
});
// routers
app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/gallery', routes.gallery);
app.get('/videos', routes.videos);