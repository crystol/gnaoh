# Cloning 
    (sans the images and videos unless you route /static to https://gnaoh.com/static)
```
    git clone https://github.com/crystol/gnaoh.git
    cd gnaoh
    npm install
```
# Serving
```
    curl https://raw.github.com/jrburke/requirejs/master/require.js >> source/js/require.js
    grunt clone
    export NODE_ENV='clone' && node build/server.js
```
    Point browser to http://localhost:1337

# Things used to tran[scribe && slate] gnaoh.com:
    front: {
        jquery: "~2.0.3",
        require: "~2.1.9",
        d3: "~3.2.8",
        isotope: "~1.5.25",
        googleAnalytics: "~???"
    }
    back {
        express: "~3.3.8",
        jade: "~0.34.1",
        spdy: "~1.10.12",
        nodeunit: "~0.8.2"
    }
    dev {
        grunt: "~0.4.1",
        grunt - contrib - clean: "~0.5.0",
        grunt - contrib - concat: "~0.3.0",
        grunt - contrib - less: "~0.8.1",
        grunt - contrib - uglify: "~0.2.7",
        grunt - contrib - jshint: "~0.7.1",
        grunt - contrib - watch: "~0.5.3",
        grunt - contrib - copy: "~0.4.1",
        grunt - nodemon: "~0.1.1",
        grunt - concurrent: "~0.4.1"
    }