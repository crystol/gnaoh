define(['jquery','static/d3', 'static/topojson', 'gnaoh'], function () {
    gnaoh.requireCss('devdev.css');
    (function (doc, $, d3, topojson) {
        'use strict';
        var win = this;

        function Map(json) {
            // Define with of the map as the size of the container
            this.width = $('.map').width();
            this.height = this.width * 0.5;
            this.centered = undefined;
            this.data = json;
        }
        Map.prototype = {
            // Define the d3 projection for the map.
            init: function () {
                // Referencing the instance in order to be able to pass it to other callbacks
                var This = this;
                var projection = d3.geo.albersUsa()
                    .scale(This.width)
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
                        .attr('class', function (obj) {
                            var data = This.data[obj.properties.STUSPS10];
                            var language = data ? data['dominant language'] : '';
                            return language;
                        })
                        .on('click', function (data) {
                            This.click.call(this, data, This);
                        })
                        .attr('d', This.path);
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
            colorize: function (data) {
                this.data = data;
                for (var language in this.data) {
                    var states = this.data[language];
                    for (var i = 0; i < states.length; i++) {
                        var state = states[i];
                        $('#' + state).attr('class', language);
                    }
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
            win.x = new Map(statesData).init();
        }
    }).call(this, document, jQuery, d3, topojson);
});