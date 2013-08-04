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
            express: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['routes/**', 'views/**'],
                    dest: 'build/'
                }]
            },
            root: {
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['*'],
                    dest: 'build/',
                    filter: 'isFile'
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
                files: ['source/routes/**', 'source/views/**', 'source/*.js'],
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
            },
            // livereload: {
            // files: ['build/**/**'],
            // options: {
            // livereload: 35729
            // }
            // }
        }
    });
    //load tasks
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    // grunt.loadTasks('tasks');
    //assign tasks
    grunt.registerTask('build', ['uglify', 'concat', 'less:production', 'copy']);
    grunt.registerTask('default', ['jshint', 'clean', 'build']);
    grunt.registerTask('live', function () {
        grunt.loadTasks('build/app.js');
    });
};