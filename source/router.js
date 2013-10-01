// Lists of all of the possible routes used by the server
var routes = ['/', '404', 'index', 'about', 'gallery', 'videos', 'projects/devdev'];
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
module.exports['routes'] = routes;
// Exports a module per route
routes.forEach(function (value) {
    module.exports[value] = function (request, response) {
        response.set({
            'Cache-Control': 'must-revalidate, private, max-age=0',
            'Strict-Transport-Security': 'max-age=13333337'
        }).render(value, {
            title: value,
            pretty: true
        });
    };
});