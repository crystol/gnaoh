module.exports.index = function(req, res) {
	res.render('index', {
		title: 'Kenny Hoang',
		pretty: true
	});
};