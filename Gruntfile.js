module.exports = function () {
    'use strict';
    var grunt = require('grunt');
    grunt.initConfig({
        port: 1337,
        package: grunt.file.readJSON('package.json'),
        library: '../library',
        // clean directories
        clean: {
            build: ['build/']
        },
        //javascript minimizer/obfuscater 
        uglify: {
            options: {
                report: 'gzip'
            },
            javascript: {
                files: {
                    'build/js/<%= package.name %>.js': 'source/js/<%= package.name %>.js',
                    'source/.temp/<%= package.name %>.loader.js': 'source/js/<%= package.name %>.loader.js',
                }
            }
        },
        //stringing scripts and stylesheets
        concat: {
            javascript: {
                files: {
                    'build/js/loader.js': ['<%= library %>/js/require.js', 'source/.temp/<%= package.name %>.loader.js'],
                }
            },
        },
        //javascript linting
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                eqnull: true,
                esnext: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                node: true,
                browser: true,
                jquery: true,
                unused: true,
                globals: {
                    'define': true
                },
                force: true
            },
            source: ['Gruntfile.js', 'source/**/*.js']
        },
        //less css preprocessor
        less: {
            development: {
                options: {
                    paths: ['source/less']
                },
                files: {
                    'build/css/<%= package.name %>.css': 'source/less/<%= package.name %>.less'
                }
            },
            production: {
                options: {
                    paths: ['source/less'],
                    report: 'gzip',
                    yuicompress: true,
                },
                files: {
                    'build/css/<%= package.name %>.css': 'source/less/<%= package.name %>.less'
                }
            }
        },
        //copy assets to build 
        copy: {
            root: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['*'],
                    dest: 'build/',
                    filter: 'isFile'
                }]
            },
            express: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['views/**'],
                    dest: 'build/'
                }]
            },
            css: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'source/',
                    src: ['less/*.less'],
                    dest: 'build/css/'
                }]
            }
        },
        //watches for changes within files & perform tasks if found
        watch: {
            options: {
                spawn: false,
                livereload: 35729
            },
            copy: {
                files: ['source/views/**', 'source/*.js'],
                tasks: ['copy']
            },
            js: {
                files: ['source/js/*.js'],
                tasks: ['uglify', 'concat']
            },
            less: {
                files: ['source/less/*.less'],
                tasks: ['less:development']
            },
            lint: {
                files: ['source/**/*.js'],
                tasks: ['jshint']
            }
        },
        //auto restart the server if conditions meet
        nodemon: {
            prod: {
                options: {
                    delayTime: 3,
                    watchedFolders: ['build'],
                    ignoredFiles: ['build/**/**'],
                    cwd: __dirname
                }
            }
        },
        //run watch and nodemon at the same time
        concurrent: {
            target: {
                tasks: ['nodemon', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });
    //load tasks
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    // grunt.loadTasks('tasks');
    //assign tasks
    grunt.registerTask('build', ['uglify', 'concat', 'less:production', 'copy']);
    grunt.registerTask('default', ['jshint', 'clean', 'build']);
    grunt.registerTask('live', ['concurrent']);
    grunt.registerTask('serve', function () {
        //keep task alive
        this.async();
        var server = require('./build/server.js');
        server.http.listen(80, function () {
            console.log('Http server on port: ' + 80);
        });
        server.spdy.listen(443, function () {
            console.log('Http server on port: ' + 443);
        });
    });
};