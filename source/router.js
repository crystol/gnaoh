//lists of all of the possible routes used by the server
var routes = ['404', 'index', 'about', 'gallery', 'videos'];
routes.forEach(function (value) {
    //exports a module per route
    module.exports[value] = function (request, response) {
        response.set({
            Server: 'Node'
        });
        response.render(value, {
            title: value,
            // pretty: true
        });
    };
});