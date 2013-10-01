require(['jquery', 'static/d3', 'static/topojson', 'gnaoh'], function () {
    gnaoh.requireCss('devdev.css');
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
                city: object.city || 'minneapolis',
                // Transition duration
                tweenTime: object.tweenTime || 1000,
                // Appends to a specific dom element--defaults to class 'pi'
                element: object.element || '.pi',
                // Thickness of the pi
                thickness: object.thickness || '30',
            };
            This.width = $(This.options.element)
                .width();
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
                This.partitioner(data.cities[This.options.city]);
                This.init();
            });
        };
        Pi.prototype = {
            init: function () {
                var This = this;
                // Main group for the pie graph
                This.d3.graph = This.d3.svg.append('g')
                    .attr('class', 'graph')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')');
                // Adds a path element for each language.
                This.d3.path = This.d3.graph.selectAll('path')
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
                This.labels = This.createLabels().city();
                This.labels.languages();
                This.labels.distribution();
                return This;
            },
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
            // Add text labels (language, value, etc) to the chart
            createLabels: function () {
                var This = this;
                // Add a label super-group and append the brand if uninitialized
                This.d3.labels = This.d3.svg.append('g')
                    .attr('class', 'labels')
                    .attr('transform', 'translate(' + This.width / 2 + ',' + This.height / 2 + ')');
                // /dev/deviation brand
                This.d3.labels.name = This.d3.labels.append('text')
                    .text('/dev/deviation')
                    .attr('class', 'title')
                // Offset its x position by half its length
                    .attr('dx', function () {
                        return -this.scrollWidth * 0.5;
                    })
                    .attr('dy', function () {
                        return -this.scrollHeight * 0.75;
                    });
                // Create an object to hold temporary interpolation data.
                This.d3.interp = {};
                // Functions to determine X and Y positions of the label. They're pinned near the center of the arc.
                // Computer circles goes clockwise from 12 oclock position unlike the unit circle.
                // Switch the normal sin(0) and cos(0) for calculations. 
                // They extend slightly beyond the radius (1.1x seems to be good.)
                function dx(midpoint) {
                    return This.radius * 1.1 * Math.sin(midpoint * Math.PI / 180);
                }
                function dy(midpoint) {
                    return This.radius * -1.1 * Math.cos(midpoint * Math.PI / 180);
                }
                // Returns an object packed with functions that control the labeling of the graph;
                return {
                    // City name
                    city: function () {
                        This.d3.labels.city = This.d3.labels.city || This.d3.labels.append('text')
                            .attr('class', 'city')
                        // Offset its x position by half its length
                            .attr('dx', function () {
                                return -this.scrollWidth / 2;
                            });
                        This.d3.labels.city.text(This.options.city)
                            .attr('dx', function () {
                                return -this.scrollWidth / 2;
                            });
                        return this;
                    },
                    // Add language text labels
                    languages: function () {
                        var oldData = This.d3.interp.languages || {};
                        var newData = {};
                        if (This.d3.labels.languages) {
                            This.d3.labels.languages.remove();
                        }
                        var languages = This.d3.labels.languages = This.d3.labels.selectAll('text.language')
                            .data(This.filteredData)
                            .enter()
                            .append('text')
                            .each(function (arc) {
                                var d3select = d3.select(this);
                                var languageName = arc.data.language;
                                // Align the labels with regards to their position on the circle. 
                                if (arc.midpoint > 20 && arc.midpoint < 160) {
                                    // From 20 to 160 degrees (3/2pi to 1/2pi on unit circle)
                                    // Determines where the text label will anchor [beginning, middle, end]
                                    d3select.attr('text-anchor', 'begining');
                                    // From 200 to 340 degrees (1/2pi to 3/2pi on unit circle)
                                } else if (arc.midpoint > 200 && arc.midpoint < 340) {
                                    d3select.attr('text-anchor', 'end');
                                    // Near areas where tangent is 0 or undefined)
                                } else {
                                    d3select.attr('text-anchor', 'middle');
                                }
                                // Add color coding class.
                                d3select.attr('class', 'language ' + languageName)
                                    .text(languageName)
                                    .transition()
                                    .duration(This.options.tweenTime)
                                    .tween('position', function () {
                                        // Function to redraw and animate the graph to reflect new data
                                        var oldMidpoint = oldData[languageName] ? oldData[languageName].midpoint : arc.midpoint;
                                        var interp = d3.interpolate(oldMidpoint, arc.midpoint);
                                        // Update current path data for the next interpolations
                                        newData[languageName] = {};
                                        newData[languageName].midpoint = arc.midpoint;
                                        return function (time) {
                                            // Apply dx and dy
                                            d3select.attr('dx', dx(interp(time)));
                                            d3select.attr('dy', dy(interp(time)));
                                        };
                                    });
                            });
                        This.d3.interp.languages = newData;
                        return languages;
                    },
                    // Add language distribution value labels
                    distribution: function () {
                        var oldData = This.d3.interp.distribution || {};
                        var newData = {};
                        if (This.d3.labels.distribution) {
                            This.d3.labels.distribution.remove();
                        }
                        This.d3.labels.distribution = This.d3.labels.selectAll('text.distribution')
                            .data(This.filteredData)
                            .enter()
                            .append('text')
                            .attr('class', 'distribution')
                            .each(function (arc) {
                                var d3select = d3.select(this);
                                var languageName = arc.data.language;
                                var xOffset, yOffset;
                                // Basically the same as the language label with minor shifts. 
                                if (arc.midpoint > 20 && arc.midpoint < 160) {
                                    d3select.attr('text-anchor', 'begining');
                                    xOffset = 10;
                                    yOffset = 20;
                                } else if (arc.midpoint > 200 && arc.midpoint < 340) {
                                    d3select.attr('text-anchor', 'end');
                                    xOffset = -10;
                                    yOffset = 20;
                                } else {
                                    d3select.attr('text-anchor', 'middle');
                                    xOffset = 0;
                                    yOffset = 15;
                                }
                                // Value for each language convert to human percentage.
                                d3select.text(arc.value * 100 + '%');
                                // Animating the change in position
                                d3select.transition()
                                    .duration(This.options.tweenTime)
                                    .tween('position', function () {
                                        // Function to redraw and animate the graph to reflect new data
                                        var oldMidpoint = oldData[languageName] ? oldData[languageName].midpoint : arc.midpoint;
                                        var interp = d3.interpolate(oldMidpoint, arc.midpoint);
                                        // Update current path data for the next interpolations
                                        newData[languageName] = {};
                                        newData[languageName].midpoint = arc.midpoint;
                                        return function (time) {
                                            // Apply dx and dy
                                            d3select.attr('dx', dx(interp(time)) + xOffset);
                                            d3select.attr('dy', dy(interp(time)) + yOffset);
                                        };
                                    });
                            });
                        This.d3.interp.distribution = newData;
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
                    var newData = This.partitioner(data.cities[city]);
                    // Generate and tween between old and new arcs. Has to return as a function to animate with transition time.
                    This.d3.path.data(newData)
                        .transition()
                        .duration(This.options.tweenTime)
                        .attrTween('d', function (newArc) {
                            // Function to redraw and animate the graph to reflect new data
                            var interp = d3.interpolate(this.currentArc, newArc);
                            // Update current path data for the next interpolations
                            this.currentArc = interp(0);
                            return function (time) {
                                return This.d3.arc(interp(time));
                            };
                        });
                    // Update the labels accordingly 
                    This.labels.city();
                    This.labels.languages();
                    This.labels.distribution();
                });
            },
        };
        // Area graph constructor
        var Area = DevDev.Area = function (object) {
            var This = this;
            // Object that hold basic arguments and their defaults
            This.options = {
                city: object.city || 'minneapolis',
                tweenTime: object.tweenTime || 1000,
                element: object.element || '.area',
            };
            This.width = $(This.options.element).width();
            This.height = This.width * 0.5;
            // Each graph has 1/4 of the height of the main svg container
            This.singleHeight = This.height * 0.2;
            // Collection of D3 specific helper methods
            This.d3 = {
                // SVG-maker
                svg: d3.select(This.options.element)
                    .append('svg')
                    .attr('width', This.width)
                    .attr('height', This.height),
                // Data scales
                scale: {
                    x: d3.scale.linear()
                        .range([0, This.width * 0.8]),
                    y: d3.scale.linear()
                        .range([0, This.singleHeight * 0.8])
                },
                // Axis creator
                axis: {
                    x: d3.svg.axis()
                        .orient('bottom'),
                    y: d3.svg.axis()
                        .orient('left'),
                },
                // Area path creator
                area: d3.svg.area()
                // Monotone nterpolation of the data will use a cubic function to smooth the graph between data points
                    .interpolate('monotone')
            };
            // Request data from the server and initialize the line graph
            d3.json('/assets/sampledata.json', function (error, data) {
                if (error) {
                    throw error;
                }
                // Parse incoming JSON data and call init function
                This.parser(data.cities[This.options.city].languages);
                This.init();
            });
        };
        Area.prototype = {
            // Parsed data for each city request into a d3-friendly array-object format
            parser: function (data) {
                // Object to be returned after data is parsed
                var parsedLanguages = {};
                // Tracks the count of languages
                var languagesCount = 0;
                // Array that holds all points of data (useful for calculating max and mins)
                var allDataPoints = [];
                // Loops through each available language for the specific city
                for (var language in data) {
                    // Temporary array to push data into
                    var basket = [];
                    // Normalizes the set with f(0) = 0
                    basket[0] = {
                        experience: 0,
                        salary: 0
                    };
                    for (var experience in data[language].salary) {
                        basket.push({
                            experience: experience,
                            salary: data[language].salary[experience]
                        });
                    }
                    // Add each basket to the parsed object.
                    allDataPoints = allDataPoints.concat(basket);
                    parsedLanguages[language] = basket;
                    languagesCount++;
                }
                var parsedData = this.parsedData = {
                    allDataPoints: allDataPoints,
                    languages: parsedLanguages,
                    languagesCount: languagesCount
                };
                return parsedData;
            },
            init: function () {
                var This = this;
                This.d3.graph = {};
                // Determine the axis' domain and ticks
                // X-axis starts at 0 years of experience and ends at the highest point of data available                
                This.d3.scale.x.domain(
                    [
                        0,
                        d3.max(This.parsedData.allDataPoints, function (data) {
                            return data.experience;
                        })
                    ]);
                // Create the x axis
                This.d3.axis
                    .x.scale(This.d3.scale.x)
                // Limit the ticks to the amount of year data points available
                    .ticks(d3.max(This.parsedData.allDataPoints, function (data) {
                        return data.experience;
                    }));
                // Y-scale is determined by the max and min of the range of salary data.           
                This.d3.scale.y.domain(
                    [
                        d3.max(This.parsedData.allDataPoints, function (data) {
                            return data.salary;
                        }),
                        0
                    ]);
                // Create the y axis
                This.d3.axis.y.scale(This.d3.scale.y)
                    .ticks(This.singleHeight / 20)
                // Round the ticks to the nearest thousandth and append 'k'
                    .tickFormat(function (tick) {
                        return Math.round(tick / 1000) + 'k';
                    });
                // Draw the X-axis
                This.d3.graph.x = This.d3.svg.append('g')
                    .attr('class', 'x-axis')
                    .attr('transform', 'translate(' + This.width * 0.12 + ',' + This.singleHeight * This.parsedData.languagesCount + ')')
                    .call(This.d3.axis.x);
                // Append the label for the X-axis
                This.d3.graph.x.append('text')
                    .text('Experience (Years)')
                    .attr('text-anchor', 'end')
                // Align it at the center
                    .attr('dx', function () {
                        return This.width * 0.5;
                    })
                // Shift the position by a factor of its height
                    .attr('dy', function () {
                        return this.scrollHeight * 2;
                    });
                //Draw the Y-axis label
                // Append the label for the Y-axis
                This.d3.graph.y = This.d3.svg.append('g')
                    .append('text')
                    .text('Salary (USD)')
                    .attr('class', 'label')
                // Rotate the label to a vertical position
                    .attr('transform', 'rotate(-90)')
                // Stick it to the middle of the axis
                    .attr('dx', -This.height * 0.5)
                    .attr('dy', function () {
                        return this.scrollHeight * 2;
                    });
                // Append a separate graph for each language available
                var chartCount = 0;
                for (var language in This.parsedData.languages) {
                    This.drawChart(language, This.parsedData.languages[language], chartCount);
                    chartCount++;
                }
                return This;
            },
            // Function that draws each individual graph
            drawChart: function (language, parsedData, chartCount) {
                var This = this;
                // Main group for the line graph
                This.d3.graph[language] = This.d3.svg.append('g')
                    .attr('class', 'graph')
                    .attr('transform', 'translate(' + 0 + ',' + chartCount * This.singleHeight + ')');
                // Append a Y-axis for each chart.
                This.d3.graph[language].y = This.d3.graph[language].append('g')
                    .attr('class', 'y-axis')
                    .attr('transform', 'translate(' + This.width * 0.1 + ',' + This.singleHeight * 0.1 + ')')
                    .call(This.d3.axis.y);
                // Label the language
                This.d3.graph[language].name = This.d3.graph[language].append('text')
                    .text(language)
                    .attr('class', 'name ' + language)
                    .attr('dx', This.width * 0.12)
                    .attr('dy', function () {
                        return this.scrollHeight;
                    });
                // Create the path using the data.
                This.d3.area
                    .x(function (data) {
                        return This.d3.scale.x(data.experience);
                    })
                    .y1(function (data) {
                        return This.d3.scale.y(data.salary);
                    })
                    .y0(This.singleHeight * 0.8);
                // Append the path to the graph
                This.d3.graph[language].line = This.d3.graph[language].append('path')
                    .attr('class', 'area ' + language)
                    .data([parsedData])
                    .attr('d', This.d3.area)
                    .attr('transform', 'translate(' + This.width * 0.12 + ',' + This.singleHeight * 0.1 + ')');
            },
            changeCity: function (city) {
                var This = this;
                This.options.city = city;
                // XHR for new data.
                // d3.json('/assets/sampledata.json', function (error, data) {
                //     if (error) {
                //         throw error;
                //     }
                //     // Parse incoming JSON data and call init function
                //     // This.parser(data.cities[This.options.city].languages);
                // });
                $('.area svg').remove();
                return new DevDev.Area({
                    city: city
                });
            },
        };
        // Line graph constructor
        var Line = DevDev.Line = function (object) {
            var This = this;
            This.options = {
                city: object.city || 'minneapolis',
                tweenTime: object.tweenTime || 1000,
                element: object.element || '.line',
            };
            This.width = $(This.options.element).width();
            This.height = This.width * 0.5;
            This.margin = {
                top: This.height * 0.125,
                bottom: This.height * 0.125,
                left: This.width * 0.125,
                right: This.width * 0.125
            };
            // Add check boxes for language selection
            This.selection = $('<form name="language">').appendTo(This.options.element);
            // Listener that adds or remove paths
            This.selection.on('change', 'input', function () {
                if (this.checked) {
                    This.addLanguage(this.value);
                } else {
                    This.removeLanguage(this.value);
                }
            });
            // D3 helpers
            This.d3 = {
                svg: d3.select(This.options.element)
                    .append('svg')
                    .attr('width', This.width)
                    .attr('height', This.height),
                scale: {
                    x: d3.scale.linear()
                        .range([0, This.width - (This.margin.left + This.margin.right)]),
                    y: d3.scale.linear()
                        .range([0, This.height - (This.margin.top + This.margin.bottom)])
                },
                axis: {
                    x: d3.svg.axis()
                        .orient('bottom'),
                    y: d3.svg.axis()
                        .orient('left'),
                },
                line: d3.svg.line()
                    .interpolate('monotone')
                    .x(function (data) {
                        return This.d3.scale.x(data.experience);
                    })
                    .y(function (data) {
                        return This.d3.scale.y(data.salary);
                    })
            };
            // Request data from the server and initialize the line graph
            d3.json('/assets/sampledata.json', function (error, data) {
                if (error) {
                    throw error;
                }
                // Parse incoming JSON data and call init function
                This.parser(data.cities[This.options.city].languages);
                This.init();
            });
        };
        Line.prototype = {
            // Parsed data for each city request into a d3-friendly array-object format
            parser: function (data) {
                var parsedLanguages = {};
                var allDataPoints = [];
                var list = [];
                var count = 0;
                for (var language in data) {
                    var basket = [];
                    // Normalizes the set with f(0) = 0
                    basket[0] = {
                        experience: 0,
                        salary: 0
                    };
                    for (var experience in data[language].salary) {
                        basket.push({
                            experience: experience,
                            salary: data[language].salary[experience]
                        });
                    }
                    allDataPoints = allDataPoints.concat(basket);
                    parsedLanguages[language] = basket;
                    list.push(language);
                    count++;
                }
                var parsedData = this.parsedData = {
                    allDataPoints: allDataPoints,
                    languages: parsedLanguages,
                    count: count,
                    list: list
                };
                return parsedData;
            },
            // Initializer
            init: function () {
                var This = this;
                // Add dropdown menu
                This.parsedData.list.forEach(function (data, element) {
                    var checked = element === 0 ? 'checked' : '';
                    var input = '<label class="' + data + '"><input type="checkbox" value="' + data + '"' + checked + '>' + data + '</label>';
                    This.selection.append(input);
                });
                // Determine x domain and create the axis
                This.d3.scale.x.domain(
                    [
                        0,
                        d3.max(This.parsedData.allDataPoints, function (data) {
                            return data.experience;
                        })
                    ]);
                This.d3.axis.x
                    .scale(This.d3.scale.x)
                    .ticks(d3.max(This.parsedData.allDataPoints, function (data) {
                        return data.experience;
                    }));
                // Determine Y domain and create the axis
                This.d3.scale.y.domain(
                    [
                        d3.max(This.parsedData.allDataPoints, function (data) {
                            return data.salary;
                        }),
                        0
                    ]);
                // Round the ticks to the nearest thousandth and append 'k'
                This.d3.axis.y
                    .scale(This.d3.scale.y)
                    .ticks(This.height / 50)
                    .tickFormat(function (tick) {
                        return Math.round(tick / 1000) + 'k';
                    });
                // Create super groups to hold SVG paths
                This.d3.graph = This.d3.svg.append('g')
                    .attr('class', 'graph');
                // Labels group
                This.d3.graph.labels = This.d3.svg.append('g')
                    .attr('class', 'labels');
                // Axes group
                This.d3.graph.axes = This.d3.svg.append('g')
                    .attr('class', 'axes');
                // Draw the first language on the list
                This.drawChart(This.parsedData.list[0]);
                return This;
            },
            // Function that draws each individual graph
            drawChart: function (language) {
                var This = this;
                // Draw the X-axis
                This.d3.graph.axes.x = This.d3.graph.axes.append('g')
                    .attr('class', 'x-axis')
                    .attr('transform', 'translate(' + This.margin.left + ',' + Number(This.height - This.margin.bottom) + ')')
                    .call(This.d3.axis.x);
                // Append the label for the X-axis
                This.d3.graph.labels.append('text')
                    .text('Experience (Years)')
                    .attr('text-anchor', 'middle')
                    .attr('dx', This.width * 0.5)
                    .attr('dy', function () {
                        return This.height - This.margin.bottom + this.scrollHeight * 2;
                    });
                // Append the label for the Y-axis
                This.d3.graph.labels.append('text')
                    .text('Salary (USD)')
                    .attr('transform', 'rotate(-90)')
                    .attr('dx', -This.height * 0.5)
                    .attr('dy', function () {
                        return this.scrollHeight * 2;
                    });
                This.d3.graph.axes.y = This.d3.graph.axes.append('g')
                    .attr('class', 'y-axis')
                    .attr('transform', 'translate(' + This.margin.left + ',' + This.margin.top + ')')
                    .call(This.d3.axis.y);
                // Brand it
                This.d3.graph.labels.append('text')
                    .text('/dev/deviation')
                    .attr('class', 'brand')
                    .attr('dx', This.margin.left*1.5)
                    .attr('dy', function () {
                        return this.scrollHeight * 2;
                    });
                // Append the path to the graph
                This.addLanguage(language);
            },
            addLanguage: function (language) {
                var This = this;
                This.d3.graph[language] = This.d3.graph.append('path');
                This.d3.graph[language]
                    .attr('class', 'line-path ' + language)
                    .data([This.parsedData.languages[language]])
                    .attr('d', This.d3.line)
                    .attr('transform', 'translate(' + This.margin.left + ',' + This.margin.top + ')')
                    .attr('stroke-dashoffset', function () {
                        return this.getTotalLength();
                    })
                    .attr('stroke-dasharray', function () {
                        return this.getTotalLength();
                    })
                    .transition()
                    .ease('linear')
                    .duration(This.options.tweenTime)
                    .attr('stroke-dashoffset', 0);
            },
            removeLanguage: function (language) {
                var This = this;
                This.d3.graph[language]
                    .transition()
                    .ease('linear')
                    .duration(This.options.tweenTime / 2)
                    .attr('stroke-dashoffset', function () {
                        return this.getTotalLength();
                    });
            },
            changeCity: function (city) {
                var This = this;
                This.options.city = city;
                // XHR for new data.
                // d3.json('/assets/sampledata.json', function (error, data) {
                //     if (error) {
                //         throw error;
                //     }
                //     // Parse incoming JSON data and call init function
                //     // This.parser(data.cities[This.options.city].languages);
                // });
                $(This.options.element + ' [name="language"]').remove();
                $(This.options.element + ' svg').remove();
                return new DevDev.Line({
                    city: city
                });
            },
        };
        // Exporting the DevDev object to window scope
        window.DevDev = DevDev;
    }).call(this, document, jQuery, d3, topojson);
    // Sample Line graph. Call the constructor with 'new DevDev.Line({arguments})'
    var sampleLineGraph = window.sampleLineGraph = new DevDev.Line({
        city: $('.line input:checked').val()
    });
    $('.line .city-select input').on('change', function () {
        sampleLineGraph.changeCity(this.value);
    });
    // Sample Pi graph. Call the constructor with 'new DevDev.Pi({arguments})'
    var samplePiGraph = window.samplePiGraph = new DevDev.Pi({
        city: $('.pi input:checked').val(),
        thickness: 45,
    });
    // Example of binding the graph to a change event.
    $('.pi input').on('change', function () {
        samplePiGraph.changeCity(this.value);
    });
    // Sample area graph. Call the constructor with 'new DevDev.Area({arguments})'
    var sampleAreaGraph = window.sampleAreaGraph = new DevDev.Area({
        city: $('.area input:checked').val(),
    });
    // Binding the graph to a change event.
    $('.area input').on('change', function () {
        sampleAreaGraph.changeCity(this.value);
    });
    // Sample Map
    var sampleMap = new DevDev.Map();
});