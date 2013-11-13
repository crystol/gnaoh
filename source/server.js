// Module to start the server
'use strict';
// Dependencies
var http = require('http');
var express = require('express');
var router = require('./router.js');
var fs = require('fs');
// Init express
var gnaoh = express();
// Serving gnaoh.com
// Proxied through nginx
gnaoh.configure('production', function () {
    http.createServer(gnaoh).listen(1337);
});
// Developmental environment (http://localhost:1337)
gnaoh.configure('development', function () {
    http.createServer(gnaoh).listen(1337);
});
// Standalone environment (without nginx proxy)
gnaoh.configure('standalone', function () {
    // SPDY options 
    var spdy = require('spdy');
    var spdyOptions = {
        windowSize: 3000,
        maxChunk: 32 * 1024,
        key: fs.readFileSync('/kadmin/server/shared/ssl/keys/gnaoh.key'),
        cert: fs.readFileSync('/kadmin/server/shared/ssl/certs/gnaoh.crt'),
        // Includes ECDHE ciphers for when node implements these.
        ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-RC4-SHA:RC4:HIGH:!EDH:!MD5:!aNULL',
        honorCipherOrder: true,
    };
    http.createServer(function (request, response) {
        response.writeHead(301, {
            Location: 'https://' + request.headers.host + request.url
        });
        response.end();
    }).listen(80);
    spdy.createServer(spdyOptions, gnaoh).listen(443);
});
// Universial application settings
gnaoh.configure(function () {
    gnaoh.enable('trust proxy');
    gnaoh.use(express.compress());
    gnaoh.locals.basedir = __dirname;
    gnaoh.set('view engine', 'jade');
    gnaoh.set('views', __dirname + '/views');
    gnaoh.disable('x-powered-by');
    // Enable logging for requested routes
    gnaoh.use(express.logger('dev'));
    // Route stack   
    gnaoh.use(express.methodOverride());
    gnaoh.use(express.bodyParser());
    // URL Cannonicalizer
    gnaoh.use(function (request, response, next) {
        // Remove www prefix
        if (request.host.substr(0, 4) === 'www.') {
            var url = '//' + request.host.slice(4) + request.path;
            return response.redirect(301, url);
        }
        // Strip forward slashes at the end
        if (request.url.substr(-1) === '/' && request.url.length > 1) {
            return response.redirect(301, request.url.slice(0, -1));
        }
        // Default headers
        response.set({
            'Server': 'NodeGnaoh',
            'Cache-Control': 'public, max-age=13333337',
            'Transfer-Encoding': 'chunked',
        });
        next();
    });
    // Route stack
    // Public root directories for files such as robots.txt, favicon.ico, humans.txt, etc
    gnaoh.use('/', express.static(__dirname + '/public/'));
    // Static files
    gnaoh.use('/css/', express.static(__dirname + '/public/css/'));
    gnaoh.use('/js/', express.static(__dirname + '/public/js/'));
    gnaoh.use('/static/', express.static(__dirname + '/../../static'));
    // Primary views router 
    gnaoh.use(gnaoh.router);
    // 404 page at the end of the stack
    gnaoh.use(function (request, response) {
        response.status(404).render('404');
    });
});
// Routes through express to render from jade templates
var routeList = router.routes;
routeList.forEach(function (value) {
    if (value === '/') {
        // 404 the root for now
        gnaoh.get('/', router['404']);
    } else {
        gnaoh.get('/' + value, router[value]);
    }
});