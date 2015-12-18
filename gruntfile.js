module.exports = function (grunt) {

    function Config() {

        var cfg, config = {};
        var dest, modules, module, scripts, script, allScripts;

        cfg = grunt.file.readYAML('gruntfile.yaml');

        /**
         * Fix paths to JS modules and scripts
         */
        for (dest in cfg.dest) {
            if (!cfg.dest.hasOwnProperty(dest)) continue;

            /**
             * Fix modules paths
             */
            modules = cfg.dest[dest].js.modules || [];
            for (module in modules) {
                if (!modules.hasOwnProperty(module)) continue;
                modules[module] = 'src/modules/js/' + modules[module] + '.js';
            }
            cfg.dest[dest].js.modules = modules;

            /**
             * Fix scriptts paths
             */
            scripts = cfg.dest[dest].js.scripts || [];
            for (script in scripts) {
                if (!scripts.hasOwnProperty(script)) continue;
                scripts[script] = 'src/' + dest + '/js/' + scripts[script] + '.js';
            }
            cfg.dest[dest].js.scripts = scripts;
        }


        /**
         * JS Hint
         */
        config.jshint = {
            options: {
                bitwise: true,
                camelcase: true,
                eqeqeq: true,
                forin: true,
                latedef: 'nofunc',
                newcap: true,
                noarg: true,
                noempty: true,
                nonbsp: true,
                quotmark: 'single',
                undef: true,
                unused: false,
                strict: true,
                trailing: true,
                browser: true,
            }
        };
        for (dest in cfg.dest) {
            if (!cfg.dest.hasOwnProperty(dest)) continue;

            if (cfg.dest[dest].js.modules.length) {
                config.jshint['modules_' + dest] = cfg.dest[dest].js.modules;
            }
            if (cfg.dest[dest].js.scripts.length) {
                config.jshint[dest] = cfg.dest[dest].js.scripts;
            }
        }



        /**
         * Concat
         */
        config.concat = {
            options: {
                separator: ';'
            }
        };
        for (dest in cfg.dest) {
            if (!cfg.dest.hasOwnProperty(dest)) continue;

            allScripts = [];

            modules = cfg.dest[dest].js.modules;
            for (module in modules) {
                if (!modules.hasOwnProperty(module)) continue;
                allScripts.push(modules[module]);
            }

            scripts = cfg.dest[dest].js.scripts;
            for (script in scripts) {
                if (!scripts.hasOwnProperty(script)) continue;
                allScripts.push(scripts[script]);
            }

            if (!allScripts.length) continue;

            config.concat[dest] = {
                src: allScripts,
                dest: 'public/assets/' + dest + '/js/scripts.js',
            };
        }



        /**
         * Uglify
         */
        config.uglify = {};

        if (cfg.options.minify_js) {
            for (dest in cfg.dest) {
                if (!cfg.dest.hasOwnProperty(dest)) continue;

                config.uglify[dest] = {
                    src: 'public/assets/' + dest + '/js/scripts.js',
                    dest: 'public/assets/' + dest + '/js/scripts.js',
                };
            }
        }



        /**
         * LESS
         */
        config.less = {};
        for (dest in cfg.dest) {
            if (!cfg.dest.hasOwnProperty(dest)) continue;

            config.less[dest] = {files: {}};
            config.less[dest].files['public/assets/' + dest + '/css/style.css'] = 'src/' + dest + '/less/style.less';
        }



        /**
         * PostCSS
         */
        config.postcss = {
            options: {
                map: cfg.options.less_map || false,
                processors: [
                    require('autoprefixer')({browsers: ['last 2 versions']})
                ]
            }
        };

        /**
         * PostCSS minify
         */
        if (cfg.options.minify_css) {
            config.postcss.options.processors.push(require('cssnano')());
        }

        /**
         * PostCSS dest
         */
        for (dest in cfg.dest) {
            if (!cfg.dest.hasOwnProperty(dest)) continue;

            config.postcss[dest] = {
                src: 'public/assets/' + dest + '/css/style.css',
                dest: 'public/assets/' + dest + '/css/style.css'
            };
        }



        /**
         * SVG Store
         */
        config.svgstore = {
            options: {
                prefix: 'svg-',
                cleanup: true,
                svg: {
                    style: 'display:none'
                }
            }
        };
        for (dest in cfg.dest) {
            if (!cfg.dest.hasOwnProperty(dest)) continue;

            config.svgstore[dest] = {files: {}};
            config.svgstore[dest].files['public/assets/' + dest + '/svg/shapes.svg'] = ['src/' + dest + '/svg/*.svg'];
        }



        /**
         * Watch
         */
        config.watch = {
            options: {
                spawn: false,
                livereload: cfg.livereloadPort || 35730
            }
        };

        for (dest in cfg.dest) {
            if (!cfg.dest.hasOwnProperty(dest)) continue;

            config.watch[dest + '_css'] = {
                files: ['src/' + dest + '/less/*.less'],
                tasks: ['less:' + dest, 'postcss:' + dest]
            };

            config.watch[dest + '_js'] = {
                files: ['src/' + dest + '/js/**/*.js'],
                tasks: ['jshint:' + dest, 'concat:' + dest, 'uglify:' + dest]
            };

            config.watch[dest + '_svg'] = {
                files: ['src/' + dest + '/svg/*.svg'],
                tasks: ['svgstore:' + dest]
            };

            config.watch[dest + '_html'] = {files: []};
            for (var tpl in cfg.dest[dest].html) {
                if (!cfg.dest[dest].html.hasOwnProperty(tpl)) continue;
                config.watch[dest + '_html'].files.push(cfg.dest[dest].html[tpl]);
            }
        }

        config.watch.css = {
            files: ['src/modules/less/*.less'],
            tasks: ['less', 'postcss']
        };

        config.watch.js = {
            files: ['src/modules/js/*.js'],
            tasks: ['jshint', 'concat', 'uglify']
        };

        config.watch.config = {
            files: ['gruntfile.yaml'],
            tasks: ['reload', 'less', 'postcss', 'jshint', 'concat', 'uglify']
        };

        return config;
    }

    require('load-grunt-tasks')(grunt, {pattern: ['grunt-*', '@*/grunt-*']});

    grunt.config.init(Config());

    grunt.registerTask('reload', 'Reload config', function () {
        grunt.config.data = Config();
        console.log('Reloading config');
    });

    grunt.registerTask('config', 'Print config', function () {
        console.log(JSON.stringify(Config(), null, 4));
    });

    grunt.registerTask('default', ['watch']);

};