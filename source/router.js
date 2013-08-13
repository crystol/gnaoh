//lists of all of the possible routes used by the server
var routes = ['404', 'index', 'about', 'gallery', 'videos'];
routes.forEach(function (value) {
    //exports a module per route
    module.exports[value] = function (request, response) {
        response.set({
            'Cache-Control': 'must-revalidate, private, max-age=0',
            'Strict-Transport-Security': 'max-age=13333337'
        });
        response.render(value, {
            title: value,
            // pretty: true
        });
    };
});