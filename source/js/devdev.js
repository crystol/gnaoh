require(['jquery', 'static/d3', 'static/topojson', 'gnaoh'], function () {
    gnaoh.requireCss('devdev.css');
    var log = window.log = function () {
        window.console.log(arguments);
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
                This.init(This.parseData(data.cities[This.options.city]));
            });
        };
        Pi.prototype = {
            init: function (data) {
                var This = this;
                // Main group for the pie graph
                This.d3.graph = This.d3.svg.append('g')
                    .attr('class', 'graph')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')');
                // Adds a path element for each language.
                This.d3.path = This.d3.graph
                    .selectAll('path')
                    .data(This.d3.pie(data))
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
                This.label(data);
            },
            // Parsing function into an array format that's D3-friendly. This normalizes the pi slices.
            parseData: function (data) {
                // Array of languages in the API's library. Add to this array when adding new languages.
                var languagesLibrary = ['cpp', 'dotnet', 'java', 'javascript', 'ruby'];
                // Maps and returns an array of objects for D3
                var parsedJSON = this.parsedJSON = languagesLibrary.map(function (language) {
                    return {
                        language: language,
                        // Append share data if it exists. Defaults to 0 if not
                        share: data.languages[language] ? data.languages[language].share : 0
                    };
                });
                return parsedJSON;
            },
            changeCity: function (city) {
                var This = this;
                This.options.city = city;
                // Function to redraw and animate the graph to reflect new data
                var redraw = function (newArc, This) {
                    var interpolate = d3.interpolate(this.currentArc, newArc);
                    // Update current path data for the next interpolations
                    this.currentArc = interpolate(0);
                    return function (time) {
                        return This.d3.arc(interpolate(time));
                    };
                };
                // XHR for new data.
                d3.json('/assets/sampledata.json', function (error, data) {
                    if (error) {
                        throw error;
                    }
                    // Parse new data and update the graph with redraw function
                    This.d3.path.data(This.d3.pie(This.parseData(data.cities[This.options.city])))
                        .transition()
                        .duration(This.options.tweenTime)
                    // Tween between old and new data. Has to return as a function to animate with transition time.
                        .attrTween('d', function (data) {
                            return redraw.call(this, data, This);
                        });
                });
            },
            // Add text labels (language, value, etc) to the chart
            label: function () {
                var This = this;
                // Filter language objects from the array that are null
                var filteredData = This.d3.pie(This.parsedJSON).filter(function (data) {
                    return data.value > 0 ? data : null;
                });
                // Adding a midpoint value in degrees of the arc to aid calculations
                filteredData.forEach(function (element) {
                    element.midpoint = (element.startAngle + element.endAngle) / 2 * 180 / Math.PI;
                });
                // Add a label super-group
                This.d3.label = This.d3.svg.append('g')
                    .attr('class', 'labels')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')');
                // /dev/deviation brand
                This.d3.label.name = This.d3.label
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
                // City name
                This.d3.label.city = This.d3.label
                    .append('text')
                    .text(This.options.city)
                    .attr('class', 'city')
                // Offset its x position by half its length
                    .attr('dx', function () {
                        return -this.scrollWidth / 2;
                    });
                // Add language text labels
                This.d3.label.languages = This.d3.label.selectAll('text.language')
                    .data(filteredData)
                    .enter()
                    .append('text')
                    .attr('class', function (arc) {
                        return 'language ' + arc.data.language;
                    })
                // Calculates where the text label will anchor [beginning, middle, end]
                    .attr('text-anchor', function (arc) {
                        var position;
                        // From 20 to 160 degrees (3/2pi to 1/2pi on unit circle)
                        if (arc.midpoint > 20 && arc.midpoint < 160) {
                            position = 'begining';
                            // From 200 to 340 degrees (1/2pi to 3/2pi on unit circle)
                        } else if (arc.midpoint > 200 && arc.midpoint < 340) {
                            position = 'end';
                            // Near areas where tangent is 0 or undefined)
                        } else {
                            position = 'middle';
                        }
                        return position;
                    })
                // X and Y positions of the label. They're pinned near the center of the arc.
                // Computer circles goes clockwise from 12 oclock position unlike the unit circle.
                // Switch the normal sin(0) and cos(0) for calculations. 
                    .attr('dx', function (arc) {
                        // They extend slightly beyond the radius (1.1x seems to be good.)
                        return This.radius * 1.1 * Math.sin(arc.midpoint * Math.PI / 180);
                    })
                    .attr('dy', function (arc) {
                        return This.radius * -1.1 * Math.cos(arc.midpoint * Math.PI / 180);
                    })
                    .text(function (arc) {
                        return arc.data.language;
                    });
                // Add language distribution value labels
                This.d3.label.languages = This.d3.label.selectAll('text.distribution')
                    .data(filteredData)
                    .enter()
                    .append('text')
                    .attr('class', 'distribution')
                    .attr('text-anchor', function (arc) {
                        var position;
                        if (arc.midpoint > 20 && arc.midpoint < 160) {
                            position = 'begining';
                        } else if (arc.midpoint > 200 && arc.midpoint < 340) {
                            position = 'end';
                        } else {
                            position = 'middle';
                        }
                        return position;
                    })
                    .attr('dx', function (arc) {
                        return This.radius * 1.1 * Math.sin(arc.midpoint * Math.PI / 180);
                    })
                    .attr('dy', function (arc) {
                        // Include a 15px offset so the value will fall  below the label.
                        var slightBudge;
                        if (arc.midpoint > 20 && arc.midpoint < 160) {
                            slightBudge = 20;
                        } else if (arc.midpoint > 200 && arc.midpoint < 340) {
                            slightBudge = 20;
                        } else {
                            slightBudge = 15;
                        }
                        return slightBudge + This.radius * -1.1 * Math.cos(arc.midpoint * Math.PI / 180);
                    })
                    .text(function (arc) {
                        return arc.value * 100 + '%';
                    });
            }
        };
        // Exporting the DevDev object to window scope
        window.DevDev = DevDev;
    }).call(this, document, jQuery, d3, topojson);
    // Sample Map
    var sampleMap = new DevDev.Map();
    // Sample Pi graph. Call the constructor with 'new DevDev.Pi({arguments})'
    var samplePiGraph = new DevDev.Pi({
        city: $('.pi input:checked')[0].value,
        thickness: 45,
    });
    // Example of binding the graph to a change event.
    $('.pi input').on('change', function () {
        samplePiGraph.changeCity(this.value);
    });
});