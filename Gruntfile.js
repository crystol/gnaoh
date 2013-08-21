module.exports = function () {
    'use strict';
    var grunt = require('grunt');
    grunt.initConfig({
        package: grunt.file.readJSON('package.json'),
        static: '../static',
        // clean directories
        clean: {
            build: ['build/']
        },
        //javascript minimizer/obfuscater 
        uglify: {
            production: {
                // files: {
                //     'build/js/<%= package.name %>.js': 'source/js/<%= package.name %>.js',
                //     'build/.temp/loader.js': 'source/js/loader.js',
                // }
                files: [{
                    expand: true,
                    cwd: 'source/js/',
                    src: ['**/*.js'],
                    dest: 'build/',
                    ext: '.min.js'
                }]
            },
            development: {
                options: {
                    report: 'gzip',
                    mangle: false
                },
                files: {
                    'build/.temp/<%= package.name %>.js': 'source/js/<%= package.name %>.js',
                    'build/.temp/<%= package.name %>2.js': 'source/js/<%= package.name %>2.js',
                    'build/.temp/loader.js': 'source/js/loader.js',
                }
            }
        },
        //stringing scripts and stylesheets
        concat: {
            production: {
                files: {
                    'build/js/loader.js': ['<%= static %>/js/require.js', 'build/.temp/loader.js'],
                }
            },
            development: {
                files: {
                    'build/js/<%= package.name %>.js': ['build/.temp/<%= package.name %>*.js'],
                    'build/js/loader.js': ['<%= static %>/js/require.js', 'build/.temp/loader.js'],
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
                    'define': true,
                    "d3": true,
                    "topojson": true,
                    "gnaoh": true
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
                    'build/css/devdev.css': 'source/less/devdev.less'
                }
            },
            production: {
                options: {
                    paths: ['source/less'],
                    yuicompress: true,
                },
                files: {
                    'build/css/devdev.css': 'devdev.less',
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
            js: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'source/',
                    src: ['js/*.js'],
                    dest: 'build/js/'
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
            server: {
                files: ['source/*.js'],
                tasks: ['copy:root']
            },
            views: {
                files: ['source/views/**'],
                tasks: ['copy:express']
            },
            js: {
                files: ['source/js/*.js'],
                tasks: ['copy:js', 'uglify:development', 'concat']
            },
            less: {
                files: ['source/less/*.less'],
                tasks: ['less:production']
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
                    env: {
                        'NODE_ENV': 'developmental'
                    },
                    delayTime: 4,
                    watchedFolders: ['build/'],
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
    //assign tasks
    grunt.registerTask('default', ['build']);
    grunt.registerTask('dev', ['clean', 'copy', 'uglify:development', 'concat:development', 'less:development']);
    grunt.registerTask('build', ['clean', 'copy', 'uglify:production', 'concat:production', 'less:production']);
    grunt.registerTask('live', ['dev', 'concurrent']);
};