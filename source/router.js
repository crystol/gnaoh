//lists of all of the possible routes used by the server
var routes = ['404', 'index', 'about', 'gallery', 'videos'];
routes.forEach(function (value) {
    //exports a module per route
    module.exports[value] = function (req, res) {
        if(process.env.ENV === 'PROD' && !req.secure){
            return res.redirect(301, 'https://'+req.host+req.path);
        }
        res.render(value, {
            title: value,
            pretty: true
        });
    };
});