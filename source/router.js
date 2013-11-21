// Lists of the most common routes used by the server
var routes = [{
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
// Object to store all of the routes and their rendering options/functions
var routesList = {};
// Exports a module per route
routes.forEach(function (route) {
    // Jade rendering options''
    var options = {
        path: '/',
        title: 1337,
        pretty: true,
        basedir: __dirname
    };
    // Copy all properoptionsties over to options object
    for (var prop in route) {
        if (!route[prop]) {
            route[prop] = 1337;
        }
        options[prop] = route[prop];
    }
    // Add each route to the list
    routesList[route.path] = {
        path: route.path,
        options: options,
        render: function (request, response) {
            response.render(route.path, options);
        }
    };
});
// Export the routes 
module.exports = routesList;