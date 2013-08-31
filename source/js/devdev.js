require(['jquery', 'static/d3', 'static/topojson', 'gnaoh'], function () {
    gnaoh.requireCss('devdev.css');
    (function (doc, $, d3) {
        'use strict';
        var window = this;
        // Constructor function for the maps.

        function Map() {
            // Define with of the map as the size of the container
            this.width = $('.map').width();
            this.height = this.width * 0.75;
            this.centered = undefined;
        }
        Map.prototype = {
            // Define the d3 projection for the map.
            init: function (json) {
                // Referencing the instance in order to be able to pass it to other callbacks
                var This = this;
                This.data = json;
                var projection = d3.geo.albersUsa()
                    .scale(This.width * 1.25)
                    .translate([This.width / 2, This.height / 2]);
                This.path = d3.geo.path()
                    .projection(projection);
                This.svg = d3.select('.map').append('svg')
                    .attr('width', This.width)
                    .attr('height', This.height);
                This.states = This.svg.append('g');
                // Grab the JSON files with vectors of the US
                d3.json('/assets/Murica.json', function (data) {
                    This.states.append('g')
                        .attr('class', 'states')
                        .selectAll('path')
                        .data(topojson.feature(data, data.objects.state).features)
                        .enter().append('path')
                    // Marks the ID of each path as the state abbreviation
                    .attr('id', function (obj) {
                        return obj.properties.STUSPS10;
                    })
                        .on('click', function (data) {
                            This.click.call(this, data, This);
                        })
                        .attr('d', This.path);
                    // Calls colorize when the map has been initialized.
                    This.colorize();
                });
                return This;
            },
            // Event listener for clicks
            click: function (data, This) {
                var x;
                var y;
                var k;
                if (data && This.centered !== data) {
                    var centroid = This.path.centroid(data);
                    x = centroid[0];
                    y = centroid[1];
                    k = 4;
                    This.centered = data;
                } else {
                    x = This.width / 2;
                    y = This.height / 2;
                    k = 1;
                    This.centered = null;
                }
                // Centering on the map.
                This.states.selectAll('path')
                    .classed('active', This.centered && function (data) {
                        return data === This.centered;
                    });
                // Transitions for zooming in
                This.states.transition()
                    .duration(400)
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
                    .style('stroke-width', 1 / k + 'px');
            },
            // Color code states depending on which language is most popular.
            colorize: function () {
                // Loops through the JSON object and uses the key value for state and language.
                for (var state in this.data) {
                    var language = this.data[state]['dominant language'];
                    $('#' + state).attr('class', language);
                }
            }
        };
        // Mock example of how it would work
        var statesData = {
            "MN": {
                "dominant language": "ruby"
            },
            "CA": {
                "dominant language": "javascript"
            }
        };
        if ($('.map')[0]) {
            // Call the constructor.
            new Map().init(statesData);
        }
    }).call(this, document, jQuery, d3, topojson);
});