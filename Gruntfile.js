module.exports = function () {
    'use strict';
    var grunt = require('grunt');
    grunt.initConfig({
        package: grunt.file.readJSON('package.json'),
        staticDir: '../static',
        // Clean build and temp directories
        clean: {
            start: ['build/'],
            finish: ['build/.temp/', 'build/less/', 'build/private/', 'build/js/']
        },
        // Clone source tree to build directory
        copy: {
            everything: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: '**/**',
                    dest: 'build/',
                }]
            },
            server: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: 'source/*.js',
                    dest: 'build/'
                }, ]
            },
            js: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: 'source/js/*.js',
                    dest: 'build/public/js/'
                }]
            },
            less: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: 'source/less/*.less',
                    dest: 'build/public/less/'
                }]
            },
            views: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: 'views/**',
                    dest: 'build/'
                }]
            },
            privates: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: 'source/private/*.js',
                    dest: 'build/routes/'
                }, {
                    expand: true,
                    cwd: 'source/private/views',
                    src: '**/*.jade',
                    dest: 'build/views/'
                }],
            }
        },
        // Lint js files
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
                    'define': true,
                    "d3": true,
                    "topojson": true,
                    "gnaoh": true,
                    "DevDev": true
                },
                force: true
            },
            source: ['*.js', 'source/*.js', 'source/**/*.js', 'source/**/**/*.js', ]
        },
        // Javascript minimizer/obfuscater 
        uglify: {
            options: {
                report: 'gzip'
            },
            main: {
                options: {
                    banner: '/*\n<%= package.name %>.js is the file that makes me tick! \nYou\'re probably not a robot (or are you?) and would most likely prefer looking at this version: https://github.com/crystol/gnaoh/blob/master/source/js/gnaoh.js\n*/ \n',
                },
                src: 'source/js/gnaoh.js',
                dest: 'build/public/js/gnaoh.js'
            },
            loader: {
                options: {
                    banner: '\n//Loader script for the site. Source: https://github.com/crystol/gnaoh/blob/master/source/js/loader.js\n',
                },
                src: 'source/js/loader.js',
                dest: 'build/public/js/loader.js'
            },
            assets: {
                files: [{
                    expand: true,
                    cwd: 'source/js',
                    src: ['*', '!gnaoh.js', '!loader.js'],
                    dest: 'build/public/js/',
                    ext: '.js'
                }]
            }
        },
        // Render Less to  CSS
        less: {
            development: {
                options: {
                    paths: ['source/less']
                },
                files: [{
                    expand: true,
                    cwd: 'source/less',
                    src: ['*.less'],
                    dest: 'build/public/css/',
                    ext: '.css'
                }]
            },
            production: {
                options: {
                    paths: ['source/less'],
                    cleancss: true
                },
                files: [{
                    expand: true,
                    cwd: 'source/less',
                    src: ['*.less'],
                    dest: 'build/public/css/',
                    ext: '.css'
                }]
            }
        },
        // Concatinate scripts and stylesheets
        concat: {
            require: {
                src: ['<%= staticDir %>/js/require.js', 'build/public/js/loader.js'],
                dest: 'build/public/js/loader.js'
            },
            analytics: {
                src: ['build/public/js/loader.js', 'build/public/js/analytics.js'],
                dest: 'build/public/js/loader.js'
            }
        },
        //watches for changes within files & perform tasks if found
        watch: {
            options: {
                spawn: false,
                interrupt: true,
                livereload: 35729
            },
            server: {
                files: ['source/*.js'],
                tasks: ['copy:server', 'jshint']
            },
            js: {
                files: ['source/js/*.js'],
                tasks: ['copy:js', 'concat:require', 'jshint']
            },
            views: {
                files: ['source/views/**', 'source/views/**/**'],
                tasks: ['copy:views', 'html']
            },
            privates: {
                files: ['source/private/*.js', 'source/private/views/**', 'source/private/views/**/**'],
                tasks: ['copy:privates', 'html']
            },
            less: {
                files: ['source/less/*.less'],
                tasks: ['less:development']
            }
        },
        // Auto restart the server if conditions meet
        nodemon: {
            prod: {
                options: {
                    cwd: __dirname,
                    file: 'build/server.js',
                    // Sets the environment for node to development(configuration purposes)
                    env: {
                        'NODE_ENV': 'development'
                    },
                    delayTime: 2,
                    watchedExtensions: ['js'],
                    watchedFolders: ['source/', 'source/private/'],
                    ignoredFiles: ['source/js/**']
                }
            }
        },
        // Run watch and nodemon at the same time to serve the site live
        concurrent: {
            target: {
                tasks: ['nodemon', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });
    // Load tasks
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-nodemon');
    // Assign tasks names
    grunt.registerTask('default', ['production']);
    grunt.registerTask('live', ['development', 'concurrent']);
    grunt.registerTask('development', ['clean:start', 'copy', 'concat:require', 'less:development', 'html', 'clean:finish', 'jshint']);
    grunt.registerTask('production', ['clean:start', 'copy', 'uglify', 'concat', 'less:production', 'html', 'clean:finish']);
};