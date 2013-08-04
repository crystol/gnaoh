//lists of all the routes used by the app
module.exports.index = function (req, res) {
    res.render('index', {
        title: 'Kenny Hoang',
    });
};
module.exports.gallery = function (req, res) {
    res.render('index', {
        title: 'Gallery',
    });
};