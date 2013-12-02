// Grunt task to convert all jade templates to .html files
'use strict';
module.exports = function (grunt) {
    grunt.registerTask('renderHTML', function () {
        var fs = require('fs');
        var jade = require('jade');
        var mkdirp = require('mkdirp');
        var buildDir = process.cwd() + '/build/';
        var routesList = require(buildDir + '/router.js');
        // Writes the generated html to file
        function write(error, html) {
            if (error) {
                throw error;
            }
            // Make the directory if it doesn't exist
            var routeFrags = route.split('/');
            var htmlDir = buildDir + 'public/' + routeFrags.slice(0, routeFrags.length - 1).join('/');
            if (routeFrags.length > 1 && !fs.existsSync(htmlDir)) {
                mkdirp.sync(htmlDir);
            }
            var htmlFile = buildDir + 'public/' + route + '.html';
            fs.writeFileSync(htmlFile, html);
            console.log('Generated ' + htmlFile);
        }
        // Loop through the routes list and call write function for each.
        for (var route in routesList) {
            var jadeFile = buildDir + 'views/' + route + '.jade';
            jade.renderFile(jadeFile, routesList[route].options, write);
        }
    });
};