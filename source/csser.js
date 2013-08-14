module.exports = (function () {
    var fs = require('fs');
    var css = fs.readFileSync('./build/css/gnaoh.css', {
        encoding: 'utf-8'
    });
    return css;
})();