// module to start the server
'use strict';
// dependencies
var http = require('http');
var spdy = require('spdy');
var express = require('express');
var gnaoh = express();
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
    http: http.createServer(gnaoh),
    spdy: spdy.createServer(spdyOptions, gnaoh)
};
//serving for production on normal ports
if (process.env.ENV === 'PROD') {
    httpPort = 80;
    httpsPort = 443;
}
http.createServer(gnaoh).listen(httpPort);
spdy.createServer(spdyOptions, gnaoh).listen(httpsPort);
// gnaoh settings
gnaoh.configure(function () {
    gnaoh.set('view engine', 'jade')
        .set('views', __dirname + '/views')
        .use(express.logger('dev'))
        .use(express.bodyParser())
        .use(express.methodOverride())
        .use(express.favicon(__dirname + '/views/misc/favicon.ico'));
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
    gnaoh.disable('x-powered-by');
});
// controllers that will route through express
var getters = ['/', 'index', 'about', 'gallery', 'videos'];
getters.forEach(function (value) {
    if (value === '/') {
        //404 the root for now
        gnaoh.get('/', router['404']);
    } else {
        gnaoh.get('/' + value, router[value]);
    }
});