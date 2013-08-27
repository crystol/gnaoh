// module to start the server
'use strict';
//dependencies
var http = require('http');
var spdy = require('spdy');
var express = require('express');
var router = require('./router.js');
var fs = require('fs');
//init express
var gnaoh = express();
// gnaoh settings
gnaoh.configure(function () {
    gnaoh.use(express.compress());
    gnaoh.set('view engine', 'jade');
    gnaoh.set('views', __dirname + '/views');
    gnaoh.use(express.methodOverride());
    gnaoh.use(express.bodyParser());
    gnaoh.use(express.favicon(__dirname + '/views/misc/favicon.ico'));
    gnaoh.disable('x-powered-by');
    //route stack   
    // cannonicalizer
    gnaoh.use(function (request, response, next) {
        //remove wwww 
        if (request.host.substr(0, 4) === 'www.') {
            var url = '//' + request.host.slice(4) + request.path;
            response.redirect(301, url);
        }
        //strip forward slashes at the end
        if (request.url.substr(-1) === '/' && request.url.length > 1) {
            response.redirect(301, request.url.slice(0, -1));
        }
        //headers
        response.set({
            Server: 'NodeGnaoh',
            'Cache-Control': 'public, max-age=13333337',
            'Transfer-Encoding': 'chunked'
        });
        next();
    });
    // static url for domain wide routing
    gnaoh.use('/css/', express.static(__dirname + '/css/'));
    gnaoh.use('/js/', express.static(__dirname + '/js/'));
    // static url for developement with /node address
    gnaoh.use('/static/', express.static('/kadmin/server/www/static'));
    gnaoh.use('/misc/', express.static('/kadmin/server/www/static/misc'));
    gnaoh.use('/assets/', express.static('/kadmin/server/www/static/misc'));
    // enable logging for requested routes
    gnaoh.use(express.logger('dev'));
    // views router
    gnaoh.use(gnaoh.router);
    // 404 page
    gnaoh.use(function (request, response) {
        response.status(404).render('404', {
            title: '404'
        });
    });
});
//production settings
gnaoh.configure('production', function () {
    //SPDY options 
    var spdyOptions = {
        windowSize: 3000,
        maxChunk: 32 * 1024,
        key: fs.readFileSync('/kadmin/server/shared/ssl/keys/gnaoh.key'),
        cert: fs.readFileSync('/kadmin/server/shared/ssl/certs/gnaoh.crt'),
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
//developmental settings
gnaoh.configure('development', function () {
    http.createServer(gnaoh).listen(1337);
});
//developemental settings
// routes through express to render from jade templates
var getters = ['/', 'index', 'about', 'gallery', 'videos', 'devdev'];
getters.forEach(function (value) {
    if (value === '/') {
        //404 the root for now
        gnaoh.get('/', router['404']);
    } else {
        gnaoh.get('/' + value, router[value]);
    }
});