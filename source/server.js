// module to start the server
'use strict';
// dependencies
var http = require('http');
var spdy = require('spdy');
var express = require('express');
var app = express();
var router = require('./router.js');
var fs = require('fs');
var httpPort = 1337;
var httpsPort = 1338;
// SPDY server 
var spdyOptions = {
	key: fs.readFileSync('/kadmin/server/nginx/ssl/keys/gnaoh.key'),
	cert: fs.readFileSync('/kadmin/server/nginx/ssl/certs/gnaoh.crt'),
	ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-RC4-SHA:HIGH:!EDH:!MD5:!aNULL',
	honorCipherOrder: true,
};
// export to listen and serves
module.exports = {
	http: http.createServer(app),
	spdy: spdy.createServer(spdyOptions, app)
};
//serving for production on normal ports
if (process.env.ENV === 'PROD') {
	httpPort = 80;
	httpsPort = 443;
}
http.createServer(app).listen(httpPort);
spdy.createServer(spdyOptions, app).listen(httpsPort);
// app settings
app.configure(function () {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
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