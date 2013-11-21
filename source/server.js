// Module to start the server
'use strict';
// Dependencies
var http = require('http');
var express = require('express');
var router = require('./router.js');
var fs = require('fs');
// Init express
var gnaoh = express();
// Configuring gnaoh under different environments (set by shell init.conf script with NODE_ENV)
// Developmental environment (http://localhost:1337)
gnaoh.configure('development', function () {
    http.createServer(gnaoh).listen(1337);
    gnaoh.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});
// Production mode proxied through nginx
gnaoh.configure('production', function () {
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
    gnaoh.set('view engine', 'jade');
    gnaoh.set('views', __dirname + '/views');
    gnaoh.disable('x-powered-by');
    // Enable logging for requested routes--should only generate single line success/error codes for rendered requests
    gnaoh.use(express.logger('dev'));
    // Gzipper
    gnaoh.use(express.compress());
    // Simulate PUT and DELETE requests
    // gnaoh.use(express.methodOverride());
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
    // Serving static files -- this is a redundancy in case Nginx isn't working or node is running in standalone mode
    // Public root directories for files such as robots.txt, favicon.ico, humans.txt, etc
    // gnaoh.use('/', express.static(__dirname + '/public/'));
    gnaoh.use('/css/', express.static(__dirname + '/public/css/'));
    gnaoh.use('/js/', express.static(__dirname + '/public/js/'));
    gnaoh.use('/static/', express.static('/kadmin/server/www/static/'));
    // Primary views router 
    gnaoh.use(gnaoh.router);
    // Handling 404 errors
    gnaoh.use(function (request, response, next) {
        response.status(404).render('404');
    });
    // Handling all other errors and logging to stdout
    gnaoh.use(function (error, request, response, next) {
        console.log(error);
        response.status(500).render('404');
    });
});
// Register paths to the router
for (var route in router) {
    // Attempts to go through the route and fetch the requested pages
    var path = '/' + route;
    gnaoh.get(path, router[route].render);
}
// 404 the root for now
gnaoh.get('/', function (request, response, next) {
    // router['projects'].render(request, response, next);
    response.status(404).render('404');
});