module.exports = function(grunt) {
    'use strict';
    grunt.initConfig({
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
            source: {
                files: {
                    'build/js/<%= package.name %>.js': 'source/js/<%= package.name %>.js',
                    'source/temp/<%= package.name %>.loader.js': 'source/js/<%= package.name %>.loader.js',
                }
            }
        },
        //stringing scripts and stylesheets
        concat: {
            options: {
                separator: '\n',
            },
            source: {
                src: ['<%= library %>/js/require.js', 'source/temp/<%= package.name %>.loader.js'],
                dest: 'build/js/loader.js',
            },
        },
        //javascript linting
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                eqnull: true,
                esnext: true,
                indent: 4,
                immed: true,
                latedef: true,
                newcap: true,
                quotmark: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                node: true,
                jquery:true,
                globals: {
                    'define': true
                }
            },
            source: ['Gruntfile.js', 'source/js/*.js']
        },
        //less css preprocessor
        less: {
            development: {
                options: {
                    paths: ['source/less']
                },
                files: {
                    'build/css/<%= package.name %>.css': 'source/css/<%= package.name %>.less'
                }
            },
            production: {
                options: {
                    paths: ['source/less'],
                    report: 'gzip',
                    yuicompress: true,
                },
                files: {
                    'build/css/<%= package.name %>.css': 'source/css/<%= package.name %>.less'
                }
            }
        },
        //watches for changes within files & perform tasks if found
        watch: {
            js: {
                files: ['source/js/*.js'],
                tasks: ['uglify', 'concat']
            },
            less: {
                files: ['source/less/*.less'],
                tasks: ['less:development']
            },
            // livereload: {
            //     files: ['*.html', 'stylesheets/*.less', 'scripts/*.js'],
            //     options: {
            //         livereload: 1337
            //     }
            // }
        }
    });

    //load tasks
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    //assign tasks
    grunt.registerTask('build', ['jshint', 'uglify', 'concat', 'less']);
    grunt.registerTask('default', ['build']);
};