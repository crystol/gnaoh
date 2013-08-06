//lists of all of the possible routes used by the app
var routes = ['index', 'about', 'gallery', 'videos'];
routes.forEach(function (value) {
    //exports a module per route
    module.exports[value] = function (req, res) {
        res.render(value, {
            title: value,
            pretty: true
        });
    };
});
