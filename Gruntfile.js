module.exports = function () {
    'use strict';
    var grunt = require('grunt');
    grunt.initConfig({
        package: grunt.file.readJSON('package.json'),
        static: '../static',
        // clean directories
        clean: {
            start: ['build/'],
            finish: ['build/.temp/', 'build/less/']
        },
        //clone source tree to build
        copy: {
            everything: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['**/**'],
                    dest: 'build/',
                }]
            },
            js: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'source/',
                    src: ['js/*.js'],
                    dest: 'build/js/'
                }]
            },
            views: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['views/**'],
                    dest: 'build/'
                }]
            },
            less: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'source/',
                    src: ['less/*.less'],
                    dest: 'build/css/'
                }]
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
                    'define': true,
                    "d3": true,
                    "topojson": true,
                    "gnaoh": true
                },
                force: true
            },
            source: ['Gruntfile.js', 'source/**/*.js']
        },
        //javascript minimizer/obfuscater 
        uglify: {
            main: {
                options: {
                    banner: '/*\nThis is the file that makes me tick! \nYou\'re probably not a robot (or are you?) and would most likely prefer looking at this version: https://github.com/crystol/gnaoh/blob/master/source/js/gnaoh.js\n*/ \n',
                    report: 'gzip'
                },
                src: 'source/js/<%= package.name %>.js',
                dest: 'build/js/<%= package.name %>.js'
            },
            assets: {
                options: {
                    report: 'gzip'
                },
                files: [{
                    expand: true,
                    cwd: 'source/js',
                    src: ['*', '!gnaoh.js'],
                    dest: 'build/js/',
                    ext: '.js'
                }]
            }
        },
        //stringing scripts and stylesheets
        concat: {
            all: {
                files: [{
                    src: ['<%= static %>/js/require.js', 'build/js/loader.js'],
                    dest: 'build/js/loader.js'
                }]
            }
        },
        //less css preprocessor
        less: {
            development: {
                options: {
                    paths: ['source/less']
                },
                files: [{
                    expand: true,
                    cwd: 'source/less',
                    src: ['*.less'],
                    dest: 'build/css/',
                    ext: '.css'
                }]
            },
            production: {
                options: {
                    paths: ['source/less'],
                    yuicompress: true,
                },
                files: [{
                    expand: true,
                    cwd: 'source/less',
                    src: ['*.less'],
                    dest: 'build/css/',
                    ext: '.css'
                }]
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
                tasks: ['copy']
            },
            js: {
                files: ['source/js/*.js'],
                tasks: ['jshint', 'copy:js', 'concat']
            },
            views: {
                files: ['source/views/**'],
                tasks: ['copy:views']
            },
            less: {
                files: ['source/less/*.less'],
                tasks: ['less:development']
            }
        },
        //auto restart the server if conditions meet
        nodemon: {
            prod: {
                options: {
                    env: {
                        'NODE_ENV': 'development'
                    },
                    delayTime: 4,
                    watchedFolders: ['source/'],
                    ignoredFiles: ['source/**/**'],
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
    //assign tasks
    grunt.registerTask('default', ['production']);
    grunt.registerTask('live', ['development', 'concurrent']);
    grunt.registerTask('development', ['jshint', 'clean:start', 'copy:everything', 'copy:less', 'concat', 'less:development']);
    grunt.registerTask('production', ['clean:start', 'copy:everything', 'copy:less', 'uglify', 'concat', 'less:production', 'clean:finish']);
};