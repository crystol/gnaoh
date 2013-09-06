require(['jquery', 'static/d3', 'static/topojson', 'gnaoh'], function () {
    gnaoh.requireCss('devdev.css');
    var log = window.log = function () {
        window.console.log(arguments);
    };
    (function (doc, $, d3) {
        'use strict';
        var window = this;
        // Constructor function for the maps.

        function Map() {
            var This = this;
            // Define with of the map as the size of the container
            this.width = $('.map')
                .width();
            this.height = this.width * 0.75;
            this.centered = undefined;
            // Query server for json data and initialize the map
            d3.json('/assets/sampledata.json', function (error, data) {
                if (error) {
                    throw error;
                }
                This.init(data.states);
            });
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
                This.svg = d3.select('.map')
                    .append('svg')
                    .attr('width', This.width)
                    .attr('height', This.height);
                This.states = This.svg.append('g');
                // Grab the JSON files with vectors of the US
                d3.json('/assets/Murica.json', function (data) {
                    This.states.append('g')
                        .attr('class', 'states')
                        .selectAll('path')
                        .data(topojson.feature(data, data.objects.state)
                            .features)
                        .enter()
                        .append('path')
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
                    $('#' + state)
                        .attr('class', language);
                }
            }
        };
        // Call the constructor.
        new Map();
        // Pie distribution

        function Pi(city, element) {
            var This = this;
            element = element || '.pi';
            this.width = $(element)
                .width();
            this.height = this.width * 0.5;
            this.radius = Math.min(this.width, this.height) / 2;
            // Request data from the server and draw the pi chart
            d3.json('/assets/sampledata.json', function (error, data) {
                if (error) {
                    throw error;
                }
                This._data = {
                    city: city,
                    distribution: data.cities[city].distribution
                };
                This.init(data.cities[city].distribution);
            });
        }
        Pi.prototype = {
            init: function (data) {
                var This = this;
                This.pi = d3.layout.pie()
                    .value(function (data) {
                        return data.value;
                    })
                    .sort(null);
                This.arc = d3.svg.arc()
                    .startAngle(function (data) {
                        return data.startAngle;
                    })
                    .endAngle(function (data) {
                        return data.endAngle;
                    })
                    .innerRadius(this.radius - 100)
                    .outerRadius(this.radius - 40);
                This.svg = d3.select('.pi')
                    .append('svg')
                    .attr('width', This.width)
                    .attr('height', This.height);
                // Main group for the pi graph
                This.graph = This.svg.append('g')
                    .attr('class', 'pi-svg')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')')
                    .datum(data);
                This.path = This.svg.select('g')
                    .selectAll('path')
                    .data(This.pi)
                    .enter()
                    .append("path")
                    .attr("class", function (arc) {
                        // Adds the language as a class respectively 
                        return arc.data.language;
                    })
                    .attr("d", This.arc)
                    .each(function (arc) {
                        // Stores current path value in 'current'. Used to interpolate with new data.
                        this._current = arc;
                    });
                // Line marks for labels.
                This.label = This.svg.append('g')
                    .attr('class', 'pi-labels')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')');
                This.lines = This.label.selectAll('line');
                This.lines.append('line')
                    .attr("x1", 0)
                    .attr("x2", 0)
                    .attr("y1", -This.radius - 3)
                    .attr("y2", -This.radius - 15)
                    .attr("stroke", "gray")
                    .attr("transform", function (d) {
                        return "rotate(" + (d.startAngle + d.endAngle) / 2 * (180 / Math.PI) + ")";
                    });
            },
            changeCity: function (city) {
                var This = this;
                // Function to redraw and animate the graph to reflect new data
                var redraw = function (newData, This) {
                    var interpolate = d3.interpolate(this._current, newData);
                    // Update current path data for the next interpolations
                    this._current = interpolate(0);
                    return function (time) {
                        return This.arc(interpolate(time));
                    };
                };
                // XHR for new data. 
                d3.json('/assets/sampledata.json', function (error, data) {
                    if (error) {
                        throw error;
                    }
                    // Update object metadata
                    This._data = {
                        city: city,
                        distribution: data.cities[city].distribution
                    };
                    // Update the graph with new data
                    This.graph.datum(data.cities[city].distribution);
                    This.pi.value(function (data) {
                        return data.value;
                    })
                        .sort(null);
                    // Redraw the graph with new data
                    This.path.data(This.pi)
                        .transition()
                        .duration(1000)
                    // Tween between old and new data. Has to return as a function to animate with transition time.
                    .attrTween('d', function (data) {
                        return redraw.call(this, data, This);
                    });
                });
            }
        };
        var samplePi = new Pi('minneapolis');
       
    })
        .call(this, document, jQuery, d3, topojson);
});