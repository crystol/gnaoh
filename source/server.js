// module to start the server
'use strict';
// dependencies
var http = require('http');
var spdy = require('spdy');
var express = require('express');
var gnaoh = express();
var router = require('./router.js');
var fs = require('fs');
// SPDY options 
var spdyOptions = {
    windowSize: 3000,
    maxChunk: 64000,
    key: fs.readFileSync('/kadmin/server/nginx/ssl/keys/gnaoh.key'),
    cert: fs.readFileSync('/kadmin/server/nginx/ssl/certs/gnaoh.crt'),
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-RC4-SHA:RC4:HIGH:!EDH:!MD5:!aNULL',
    honorCipherOrder: true,
};
// gnaoh settings
gnaoh.configure(function () {
    gnaoh.set('view engine', 'jade');
    gnaoh.set('views', __dirname + '/views');
    gnaoh.use(express.compress());
    gnaoh.use(express.methodOverride());
    gnaoh.use(express.express.bodyParser());
    gnaoh.use(express.favicon(__dirname + '/views/misc/favicon.ico'));
    gnaoh.use(express.errorHandler());
    //route stack   
    // strip slashes
    gnaoh.use(function (req, res, next) {
        if (req.url.substr(-1) === '/' && req.url.length > 1) {
            res.redirect(301, req.url.slice(0, -1));
        } else {
            next();
        }
    });
    gnaoh.use(gnaoh.router);
    // static url for domain wide routing
    gnaoh.use(express.static(__dirname));
    // static url for developement with /node address
    gnaoh.use('/library/', express.static('/kadmin/server/www/library'));
    // 404 page
    gnaoh.use(function (req, res) {
        res.status(404).render('404', {
            title: '404'
        });
    });
    //headers
    gnaoh.set('Server', 'Node');
    gnaoh.disable('x-powered-by');
    gnaoh.disable('etag');
});
//production settings
gnaoh.configure('production', function () {
    http.createServer(function (request, response) {
        response.writeHead(301, {
            Location: 'https://' + request.headers.host + request.url
        });
        response.end();
    }).listen(80);
    spdy.createServer(spdyOptions, gnaoh).listen(443);
});
//developmental settings
gnaoh.configure('developmental', function () {
    http.createServer(gnaoh).listen(1337);
    spdy.createServer(spdyOptions, gnaoh).listen(1338);
});
//developemental settings
// routes through express to render from jade templates
var getters = ['/', 'index', 'about', 'gallery', 'videos'];
getters.forEach(function (value) {
    if (value === '/') {
        //404 the root for now
        gnaoh.get('/', router['404']);
    } else {
        gnaoh.get('/' + value, router[value]);
    }
});