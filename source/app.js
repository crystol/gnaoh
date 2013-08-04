//module to start the server
'use strict';
var express = require('express');
var app = express();
var routes = require('./routes');
var path = require('path');
app.enable('strict routing');
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname)));

//routers
// app.get('/node', function(request, response) {
// 	var body = 'Hello World';
// 	response.setHeader('Content-Type', 'text/plain');
// 	response.setHeader('Content-Length', body.length);
// 	response.send(body);
// });
app.get('/', routes.index);
app.get('/node', routes.index);
var port = 1337;
app.listen(port);
console.log('Starting a server on port: ' + port);