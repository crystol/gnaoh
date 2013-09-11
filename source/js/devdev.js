require(['jquery', 'static/d3', 'static/topojson', 'gnaoh'], function () {
    gnaoh.requireCss('devdev.css');
    var log = window.log = function (args) {
        window.console.log(args);
    };
    (function (doc, $, d3) {
        'use strict';
        var window = this;
        var DevDev = window.DevDev || {};
        // Constructor function for the maps.
        var Map = DevDev.Map = function () {
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
        };
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
                        .data(topojson.feature(data, data.objects.state).features)
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
        // Pi chart constructor
        var Pi = DevDev.Pi = function (object) {
            // Cache 'this' to pass into callbacks.
            var This = this;
            // Object that hold basic arguments and their defaults
            This.options = {
                city: object.city.toLowerCase() || 'minneapolis',
                // Transition duration
                tweenTime: object.tweenTime || 1000,
                // Appends to a specific dom element--defaults to class 'pi'
                element: object.element || '.pi',
                // Thickness of the pi
                thickness: object.thickness || '30',
            };
            This.width = $(This.options.element).width();
            This.height = This.width * 0.5;
            This.radius = Math.min(This.width, This.height) * 0.4;
            // Collection of D3 specific methods
            This.d3 = {
                // Helper functions from the D3 library
                // Pie graph layout engine
                pie: d3.layout.pie()
                    .value(function (data) {
                        return data.share;
                    })
                    .sort(null),
                // Arc construction function.
                arc: d3.svg.arc()
                    .startAngle(function (data) {
                        return data.startAngle;
                    })
                    .endAngle(function (data) {
                        return data.endAngle;
                    })
                // Radii of the chart. OuterRadius determines oversize of the graph (default is determined by This.radius)
                // Inner radius determines whitespace of the chart. Set inner to 0 for no whitespace.
                    .innerRadius(This.radius - This.options.thickness)
                    .outerRadius(This.radius),
                // Groups within the SVG
                svg: d3.select(This.options.element)
                    .append('svg')
                    .attr('width', This.width)
                    .attr('height', This.height)
            };
            // Request data from the server and draw the pi chart
            d3.json('/assets/sampledata.json', function (error, data) {
                if (error) {
                    throw error;
                }
                // Parse incoming JSON data and call init function
                var parsedJSON = This.partitioner(data.cities[This.options.city]);
                This.init();
            });
        };
        Pi.prototype = {
            // Parses data into an array format that's D3-friendly and adds helpers for calculations.
            partitioner: function (data) {
                var This = this;
                // Array of languages in the API's library. Add to this array when adding new languages.
                var languagesLibrary = ['cpp', 'dotnet', 'java', 'javascript', 'ruby'];
                // Maps and returns a data array suitable for D3.
                var parsedData = languagesLibrary.map(function (language) {
                    return {
                        language: language,
                        // Append share data as a pi-partitiion if it exists. Normalizes to 0 if not.
                        share: data.languages[language] ? data.languages[language].share : 0
                    };
                });
                // Divide the pi into their respective portions and prototypically bind to the Pi constructor
                var partitions = This.partitions = This.d3.pie(parsedData);
                // Filter objects from the array that are null. This is useful for handling text labels and values.
                This.filteredData = partitions.filter(function (data) {
                    return data.value > 0 ? data : null;
                });
                // Adding a midpoint value in degrees of the arc to aid calculations
                This.filteredData.forEach(function (element) {
                    element.midpoint = (element.startAngle + element.endAngle) / 2 * 180 / Math.PI;
                });
                return partitions;
            },
            init: function () {
                var This = this;
                // Main group for the pie graph
                This.d3.graph = This.d3.svg.append('g')
                    .attr('class', 'graph')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')');
                // Adds a path element for each language.
                This.d3.path = This.d3.graph
                    .selectAll('path')
                // Append data that was previously created with Pi.partitioner()
                    .data(This.partitions)
                    .enter()
                    .append('path')
                // Draw path for each pi section using the d3's arc function
                    .attr('d', This.d3.arc)
                // Adds the language as a class respectively. This enables css color coding.
                    .attr('class', function (arc) {
                        return arc.data.language;
                    })
                // Stores current path value in 'current'. Used to interpolate with new data.
                    .each(function (arc) {
                        this.currentArc = arc;
                    });
                // Make the labels
                This.labels = This.createLabels()
                    .city()
                    .languages()
                    .distribution();
                return This;
            },
            // Add text labels (language, value, etc) to the chart
            createLabels: function () {
                var This = this;
                // Add a label super-group and append the brand if uninitialized
                This.d3.labels = This.d3.svg.append('g')
                    .attr('class', 'labels')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')');
                // /dev/deviation brand
                This.d3.labels.name = This.d3.labels
                    .append('text')
                    .text('/dev/deviation')
                    .attr('class', 'title')
                // Offset its x position by half its length
                    .attr('dx', function () {
                        return -this.scrollWidth * 0.5;
                    })
                    .attr('dy', function () {
                        return -this.scrollHeight * 0.75;
                    });
                // Returns an object packed with functions that control the labeling of the graph;
                return {
                    // City name
                    city: function (city) {
                        city = city || This.options.city;
                        if (This.d3.labels.city) {
                            This.d3.labels.city.remove();
                        }
                        This.d3.labels.city = This.d3.labels
                            .append('text')
                            .text(city)
                            .attr('class', 'city')
                        // Offset its x position by half its length
                            .attr('dx', function () {
                                return -this.scrollWidth / 2;
                            });
                        return this;
                    },
                    languages: function () {
                        // Add language text labels
                        if (This.d3.labels.languages) {
                            This.d3.labels.languages.remove();
                        }
                        This.d3.labels.languages = This.d3.labels.selectAll('text.language')
                            .data(This.filteredData)
                            .enter()
                            .append('text')
                            .each(function (arc) {
                                var d3select = d3.select(this);
                                // X and Y positions of the label. They're pinned near the center of the arc.
                                // Computer circles goes clockwise from 12 oclock position unlike the unit circle.
                                // Switch the normal sin(0) and cos(0) for calculations. 
                                // They extend slightly beyond the radius (1.1x seems to be good.)
                                var dx = This.radius * 1.1 * Math.sin(arc.midpoint * Math.PI / 180);
                                var dy = This.radius * -1.1 * Math.cos(arc.midpoint * Math.PI / 180);
                                // Align the labels with regards to their position on the circle. 
                                if (arc.midpoint > 20 && arc.midpoint < 160) {
                                    // From 20 to 160 degrees (3/2pi to 1/2pi on unit circle)
                                    // Determines where the text label will anchor [beginning, middle, end]
                                    d3select.attr('text-anchor', 'begining')
                                    // Apply dx and dy
                                        .attr('dx', dx)
                                        .attr('dy', dy);
                                    // From 200 to 340 degrees (1/2pi to 3/2pi on unit circle)
                                } else if (arc.midpoint > 200 && arc.midpoint < 340) {
                                    d3select.attr('text-anchor', 'end')
                                        .attr('dx', dx)
                                        .attr('dy', dy);
                                    // Near areas where tangent is 0 or undefined)
                                } else {
                                    d3select.attr('text-anchor', 'middle')
                                        .attr('dx', dx)
                                        .attr('dy', dy);
                                }
                                d3select.attr('class', 'language ' + arc.data.language)
                                    .text(arc.data.language);
                            });
                        return this;
                    },
                    // Add language distribution value labels
                    distribution: function () {
                        if (This.d3.labels.distribution) {
                            This.d3.labels.distribution.remove();
                        }
                        This.d3.labels.distribution = This.d3.labels.selectAll('text.distribution')
                            .data(This.filteredData)
                            .enter()
                            .append('text')
                            .attr('class', 'distribution')
                            .each(function (arc) {
                                var d3Element = d3.select(this);
                                // Basically the same as the language label with minor shifts. 
                                var dx = This.radius * 1.1 * Math.sin(arc.midpoint * Math.PI / 180);
                                var dy = This.radius * -1.1 * Math.cos(arc.midpoint * Math.PI / 180);
                                if (arc.midpoint > 20 && arc.midpoint < 160) {
                                    d3Element.attr('text-anchor', 'begining')
                                        .attr('dx', dx + 10)
                                        .attr('dy', dy + 20);
                                } else if (arc.midpoint > 200 && arc.midpoint < 340) {
                                    d3Element.attr('text-anchor', 'end')
                                        .attr('dx', dx - 10)
                                        .attr('dy', dy + 20);
                                } else {
                                    d3Element.attr('text-anchor', 'middle')
                                        .attr('dx', dx)
                                        .attr('dy', dy + 15);
                                }
                                // Value for each language convert to human percentage.
                                d3Element.text(arc.value * 100 + '%');
                            });
                        return this;
                    }
                };
            },
            changeCity: function (city) {
                var This = this;
                This.options.city = city;
                // XHR for new data.
                d3.json('/assets/sampledata.json', function (error, data) {
                    if (error) {
                        throw error;
                    }
                    // Parse new data and update the graph with redraw function
                    var newData = This.partitioner(data.cities[This.options.city]);
                    // Generate and tween between old and new arcs. Has to return as a function to animate with transition time.
                    This.d3.path
                        .data(newData)
                        .transition()
                        .duration(This.options.tweenTime)
                        .attrTween('d', function (newArc) {
                            // Function to redraw and animate the graph to reflect new data
                            var interpolate = d3.interpolate(this.currentArc, newArc);
                            // Update current path data for the next interpolations
                            this.currentArc = interpolate(0);
                            return function (time) {
                                return This.d3.arc(interpolate(time));
                            };
                        });
                    // Update the labels accordingly 
                    This.labels.city()
                        .languages()
                        .distribution();
                });
            },
        };
        // Exporting the DevDev object to window scope
        window.DevDev = DevDev;
    }).call(this, document, jQuery, d3, topojson);
    // Sample Map
    // var sampleMap = new DevDev.Map();
    // Sample Pi graph. Call the constructor with 'new DevDev.Pi({arguments})'
    var samplePiGraph = window.samplePiGraph = new DevDev.Pi({
        city: $('.pi input:checked').val(),
        thickness: 45,
    });
    // Example of binding the graph to a change event.
    $('.pi input').on('change', function () {
        samplePiGraph.changeCity(this.value);
    });
});