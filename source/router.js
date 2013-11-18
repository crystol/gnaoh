// Lists of all of the possible routes used by the server
var routes = [{
    path: '/',
    title: 'Kenny Hoang'
}, {
    path: '404',
    title: '404!'
}, {
    path: 'about',
    title: 'About'
}, {
    path: 'projects',
    title: 'Projects'
}];
// Append extra routes from source/routes/ directory if they exist
try {
    var extraRoutes = [];
    // Loops through directory and recursively require all of the files
    require('fs').readdirSync(__dirname + '/routes')
        .forEach(function (file) {
            extraRoutes.push(require(__dirname + '/routes/' + file));
        });
    // Push the values to the existing stack
    extraRoutes.forEach(function (value) {
        if (value.length > 1) {
            for (var i = 0; i < value.length; i++) {
                routes.push(value[i]);
            }
        } else {
            routes.push(value);
        }
    });
} catch (error) {
    console.log('No extra routes were found. ' + error);
}
// Append private routes (pages not included in repo) if they exist
try {
    var privateRoutes = require('./privateRoutes.js');
    privateRoutes.forEach(function (value) {
        routes.push(value);
    });
} catch (error) {
    console.log('No private routes were found. ' + error);
}
// Export the routes array as a module
module.exports['_list'] = routes;
// Exports a module per route
routes.forEach(function (route) {
    // Read-able HTML
    route.pretty = true;
    // When a route is requested from the array, a response will init jade's rendering.
    module.exports[route.path] = function (request, response) {
        response.render(route.path, route);
    };
});