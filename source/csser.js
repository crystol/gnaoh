module.exports = (function () {
    var fs = require('fs');
    var css = fs.readFileSync(process.cwd() + '/build/css/gnaoh.css', {
        encoding: 'utf-8'
    });
    return css;
})();