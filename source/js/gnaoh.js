(function (win, doc) {
    define(['jQuery'], function () {
        'use strict';
        var $ = win.jQuery;
        var developement = true;
        //lazy logging--if devleopement is false, it won't console log anything.
        var log = developement ? function (args) {
                win.console.log(args);
            } : function () {};
        //common jquery selectors cache
        var $window = $(win);
        var $body = $('body');
        var $content = $('#content');
        var $post = $('#post');
        var $navList = $('#navlist');
        var $loader = $('#navigator .pyrimidine');
        var $gallery;
        var $video;
        var $cv;
        //Extending jQuery functions
        //stall function that can be used more versitile from $().delay()
        $.prototype.wait = $.wait = function (time, callback) {
            //need to cache this and pass it to window as context
            var $this = this;
            var procrastinate = $.Deferred();
            if (typeof time !== 'number') {
                time = 500;
            }
            //if callback exists, perform it after the delay and return jquery object for chaining
            if (typeof callback === 'function') {
                win.setTimeout(function () {
                    callback.call($this);
                }, time);
                return $this;
            } else {
                //return promise--use withh .done()--if no callbacks are provided
                win.setTimeout(function () {
                    procrastinate.resolveWith($this);
                }, time);
                return procrastinate;
            }
        };
        //adds the animate class to selected element, wait for animation, and removes the class
        $.prototype.deanimate = function (removee, styleClear, time) {
            time = time || gnaoh.cssDelay;
            var removees = 'animated ' + removee;
            this.addClass('animated').wait(time).done(function () {
                this.removeClass(removees);
                if (styleClear) {
                    this.removeAttr('style');
                }
            });
            return this;
        };
        //an object to wield the burden of responsibilities--it will be the one...

        function Gnaoh() {
            //global scope variables
            this.mini = 0;
            this.medium = 0;
            this.massive = 0;
            this.loading = 0;
            this.popState = 0;
            this.scrolling = false;
            this.currentPage = 0;
            this.resizeDelay = 0;
            this.initPromise = 0;
            this.initCallbacks = 0;
            this.resizeCallbacks = 0;
            this.cssDelay = 1000;
            this.static = '/static';
        }
        /*****************************************************************************************
         * Functionality
         * ***************************************************************************************/
        Gnaoh.prototype = {
            //function to initialize the page on first load or ajax loaded sections. this usually deals with the big files.
            init: function () {
                var that = this;
                //clear sticky settings and unbind listeners
                $window.off();
                this.activate();
                this.size();
                $loader.addClass('loading').next().addClass('gnidaol');
                //promises and callbacks
                this.initPromise = $.Deferred();
                this.initCallbacks = $.Callbacks();
                this.resizeCallbacks = $.Callbacks();
                //add functions post-init callbacks list
                this.initCallbacks.add(function () {
                    that.loading = false;
                    //pagescroll observer
                    that.scrollspy();
                    //removeloading animation
                    $loader.on('animationiteration webkitAnimationIteration', function (event) {
                        $loader.off().on(event.type, function () {
                            $loader.removeClass('loading').next().removeClass('gnidaol');
                            $loader.off();
                        });
                    });
                });
                //exectue the callbacks after init is finished
                this.initPromise.done(function () {
                    that.initCallbacks.fire();
                });
                //add handlers for window's resize events
                this.resizeCallbacks.add([that.scrollspy, that.size]);
                //bind said handlers to window and add a delay to prevent rapid firing
                $window.on('resize', function () {
                    win.clearTimeout(that.resizeDelay);
                    that.resizeDelay = win.setTimeout(function () {
                        that.resizeCallbacks.fire.call(that);
                    }, 200);
                });
                //loading additional sections on the page
                $gallery = $('#post .gallery');
                $video = $('#post .video');
                $cv = $('#post .cv');
                //update currentpage for navigation
                this.currentPage = {
                    path: doc.location.pathname,
                    href: doc.location.href
                };
                //load cv if it exists
                if ($cv.length) {
                    this.loadCV();
                }
                //loads videos if they exist
                if ($video.length) {
                    this.loadVideo();
                }
                //loads galleries if they exist
                if ($gallery.length) {
                    this.loadGallery();
                }
                if (!$video.length && !$gallery.length) {
                    this.initPromise.resolve();
                }
                return this;
            },
            //media query: will set mini || medium || massive to true appropiately
            size: function () {
                var width = doc.body.clientWidth;
                this.mini = this.medium = this.massive = false;
                if (width <= 768) {
                    this.mini = true;
                } else if (width >= 769 && width <= 1024) {
                    this.medium = true;
                } else {
                    this.massive = true;
                }
            },
            //checks to see if the layout is currently in mini (mobile) responsive mode
            //it will throw a silent error and stop execution of the caller function
            isMini: function () {
                if (this.mini) {
                    //event listener that stops the error from being an error
                    $window.on('error', function (event) {
                        //remove the listener to prevent silencing of other errors
                        $window.off(event);
                        return false;
                    });
                    throw 'Mini detected';
                }
            },
            //ajax loading of pages
            getPage: function (link) {
                //need to save context of this to pass to jquery callbacks
                var that = this;
                this.loading = true;
                $loader.addClass('loading').next().addClass('gnidaol');
                //sends ajax request for the specific page
                $.ajax({
                    type: 'GET',
                    url: link
                }).done(function (data) {
                    //wraps the old page and replaces it with the data fetched from ajax request
                    var $data = $(data);
                    var name = $data.find('#post').data('name');
                    var $postPrep = $('<div id="new-post">').append($data.find('#post').contents());
                    //changes page name and title
                    $post.data('name', name);
                    doc.title = name.charAt(0).toUpperCase() + name.substring(1);
                    $post.wrapInner('<div id="old-post">').append($postPrep);
                    var $old = $('#old-post');
                    var $new = $('#new-post');
                    var animethod = (Math.round(Math.random()) === 0) ? 'flipped' : 'deppilf';
                    //restores the order

                    function cleanUp() {
                        $old.remove();
                        $new.contents().unwrap();
                        $post.removeClass(animethod);
                        //push new page to analytics and browser history
                        that.init();
                        win._gaq.push(['_trackPageview', doc.location.pathname]);
                    }
                    //animating the pages
                    //skip on mobile devices
                    if (that.mini) {
                        return cleanUp();
                    }
                    $post.deanimate(null, null, 1100).addClass(animethod).find($old).fadeOut(500).wait(1100, cleanUp);
                });
            },
            //load a css sheet 
            requireCss: function (name) {
                var stylesheet = doc.createElement("link");
                var href = (name === 'gnaoh.less') ? 'css/gnaoh.less' : this.static + '/css/' + name;
                stylesheet.rel = /less/.test(name) ? 'stylesheet/less' : 'stylesheet';
                stylesheet.href = href;
                doc.getElementsByTagName("head")[0].appendChild(stylesheet);
            },
            //load a  gallery from a specified directory. sample html code <div class='gallery' id='dirName' start='1' amount='10'></div>
            loadGallery: function () {
                var that = this;
                $gallery.each(function (element) {
                    var $this = $(this);
                    var options = {};
                    var imageArray = [];
                    var galleryPromise = $.Deferred();
                    //apply data from HTML tag to the options object
                    $.extend(options, this.dataset);
                    //apply additional options and serialize the numbers
                    $.extend(options, {
                        id: this.id,
                        //starts at provided point or 1
                        start: Number(options.start || 1),
                        //stops at the provided start point plus the amount needed to load
                        amount: Number(options.start || 1) + Number(options.amount),
                        wall: $this.hasClass('wall'),
                        lastOne: (element === $gallery.length - 1)
                    });
                    // if a wall gallery exists, it will be added to the init callback queue
                    if (options.wall) {
                        $this.addClass('mortar');
                        that.initCallbacks.add(function () {
                            //have to call laybricks because $.Callbacks forces this context to itself
                            that.layBricks.call(that);
                        });
                    }
                    //if it's the last gallery to load, it will resolve the init promise
                    if (options.lastOne) {
                        galleryPromise.done(function () {
                            that.initPromise.resolve();
                        });
                    }
                    // grab the JSON captions file if provided
                    if (options.captions) {
                        var captions;
                        $.ajax({
                            url: that.static + '/img/gallery/' + options.id + '/captions.JSON',
                            success: function (data) {
                                captions = data;
                                //the text will match with corresonponding image wrapper and insert a captions div
                                galleryPromise.done(function () {
                                    for (var key in data) {
                                        var caption = $('<div class="caption">' + data[key] + '</div>');
                                        $this.find('#' + options.id + '-' + key).append(caption);
                                    }
                                });
                            }
                        });
                    }
                    //creates a div, append the appropiate image to itself, and then pushes to the array of images
                    for (var i = options.start; i < options.amount; i++) {
                        var image = doc.createElement('img');
                        var imageWrapper = doc.createElement('div');
                        //load smaller images for mobile devices
                        // if (that.mini) {
                        //     image.src = that.static + '/img/gallery/' + options.id + '/' + i + 's.jpg';
                        // } 
                        image.src = that.static + '/img/gallery/' + options.id + '/' + i + '.jpg';
                        imageWrapper.className = 'image';
                        imageWrapper.id = options.id + '-' + i;
                        imageWrapper.appendChild(image);
                        imageArray.push(imageWrapper);
                    }
                    $this.append(imageArray);
                    //resolves any promises that were waiting for the gallery to load
                    galleryPromise.resolve();
                });
                //if not mobile nor wall gallery, it will do a fancy scroll upon click
                $gallery.filter(':not(.wall)').on('click', '.image', function (event) {
                    that.isMini();
                    that.smoothScroll.call(this, event);
                });
            },
            //lay the brick elements from class wall
            layBricks: function () {
                var that = this;
                var $foundation = $('.wall');
                win.require(['static/isotope'], function () {
                    $foundation.imagesLoaded(function () {
                        $foundation.isotope({
                            itemSelector: '.image',
                            layoutMode: 'masonry',
                            masonry: {
                                //width of the distributed collumns
                                columnWidth: that.mini ? $post.width() / 2 : $post.width() / 4
                            },
                            containerClass: 'wall',
                            itemClass: 'brick',
                            sortBy: 'random',
                            resizable: false
                        });

                        function anotherBrickOnTheWall() {
                            $foundation.isotope('reloadItems');
                            $foundation.isotope('reLayout');
                        }
                        //self-invoking function that fixes the width on window resizes
                        var rebrick = (function rebrick() {
                            var delay = that.mini ? 0 : 500;
                            $foundation.css({
                                width: $content.width(),
                                'max-width': $content.width()
                            }).isotope('option', {
                                masonry: {
                                    columnWidth: that.mini ? $post.width() / 2 : $post.width() / 4
                                }
                            });
                            //clicking on each image will toggle its enlargement.
                            //needs a animation delay in order to have accurate positions
                            $foundation.off().on('click', '.image', function () {
                                $.wait(delay).done(anotherBrickOnTheWall);
                                $(this).addClass('top').toggleClass('biggie').wait(delay * 2, function () {
                                    this.removeClass('top');
                                });
                                return false;
                            });
                            $.wait(that.cssDelay * 0.5, anotherBrickOnTheWall);
                            return rebrick;
                        })();
                        //add rebrick as a handler for resizing events
                        that.resizeCallbacks.add(rebrick);
                        //removes the opacity after the gallery is finished loading
                        $.wait(100).done(function () {
                            $foundation.removeClass('mortar');
                        });
                    });
                });
            },
            //loads html5 video content from div tags with .video class.
            loadVideo: function () {
                var that = this;
                $video.each(function () {
                    var $wrapper = $(this); //the parent container for the videos
                    var id = this.id;
                    var options = this.dataset;
                    var vidSrc = that.static + '/vid/' + id;
                    //placeholder while the video loads (the poster tag kinda sucks) and adjust the height for 16:9 ratio of 720p movies
                    var poster = $('<img src="' + that.static + '/vid/posters/' + id + '.jpg" class="poster">');
                    $wrapper.css({
                        height: $wrapper.width() * (9 / 16)
                    });
                    //create the video tag and apply attributes
                    var video = doc.createElement('video');
                    //create the mp4 source tag
                    var mp4 = doc.createElement('source');
                    mp4.type = 'video/mp4';
                    mp4.src = vidSrc + '.mp4';
                    //create the webm source tag
                    var webm = doc.createElement('source');
                    webm.type = 'video/webm';
                    webm.src = vidSrc + '.webm';
                    //append the sources to the video tag and stick it into the div
                    video.appendChild(mp4);
                    video.appendChild(webm);
                    $wrapper.append(poster);
                    $wrapper.append(video);
                    //loop through and apply options
                    for (var key in options) {
                        //break loop on these options
                        if (key === 'controls') {
                            break;
                        }
                        //if the key is a function, the video will execute it. if it's a prop, it will be applied to the video.
                        if (typeof video[key] === 'function') {
                            video[key]();
                        } else {
                            video[key] = options[key];
                        }
                    }
                    //event bindings
                    $(video).on({
                        //single click to play/pause
                        click: function (event) {
                            event.stopPropagation();
                            if (this.paused) {
                                this.play();
                            } else {
                                this.pause();
                            }
                        },
                        //fullscreen on double click
                        dblclick: function () {
                            if (this.webkitRequestFullscreen) {
                                this.webkitRequestFullscreen();
                            }
                        },
                        //if data-hover=true, will play on hover
                        mouseenter: function (event) {
                            event.stopPropagation();
                            if (this.hover) {
                                this.loop = true;
                                this.play();
                            }
                            this.preload = 'auto';
                        },
                        mouseleave: function () {
                            if (this.hover) {
                                this.pause();
                            }
                        },
                        //removes background once the video starts playing
                        play: function (event) {
                            if (options.controls) {
                                this.controls = true;
                            }
                            $(poster).deanimate().css('opacity', 0).wait(500, function () {
                                this.remove();
                            });
                            $(this).off(event);
                        }
                        //things to do while the video is playing
                        // timeupdate : function () {}
                    });
                    //the parent wrapper will delegate all of these events to its video child
                    $wrapper.on('click mouseenter', function (event) {
                        $wrapper.find('video').trigger(event.type);
                    });
                });
                //resolve init promise if it's hanging
                if (that.initPromise.state() === 'pending' || !$gallery.length) {
                    $.wait(1000, that.initPromise.resolve);
                }
                //on window resize, the video heights will adjust
                that.resizeCallbacks.add(function () {
                    $video.each(function () {
                        var $this = $(this);
                        $this.css('height', $this.width() * (9 / 16));
                    });
                });
            },
            //curriculum vitae section
            loadCV: function () {
                var that = this;
                $cv.find('.position:not(.active)').on({
                    click: function () {
                        that.isMini();
                        $cv.find('.active ').removeClass(' active ');
                        $(this).addClass(' active ');
                    },
                    mouseenter: function () {
                        that.isMini();
                        var $this = $(this);
                        var countdown = win.setTimeout(function () {
                            $cv.find('.active').removeClass('active');
                            $this.addClass(' active ');
                        }, 1000);
                        $this.on(' mouseleave ', function (event) {
                            win.clearTimeout(countdown);
                            $this.off(event);
                        });
                    }
                });
                $("#coolio").on('click', function () {
                    that.requireCss('fancybox/fancybox.css');
                    win.require(['static/fancybox'], function () {
                        $.fancybox({
                            padding: 3,
                            closeClick: true,
                            href: that.static + '/img/misc/coolio.jpg',
                            title: 'Hanging out in g-paradise with Coolio.'
                        });
                    });
                    return false;
                });
            },
            //animated smoothScroll to next sibbling element or specified target
            smoothScroll: function (event, direction, customTarget) {
                var that = this;
                var $this = $(this);
                //prevent stacking scroll animations
                if (this.scrolling) {
                    return;
                }
                if (event) {
                    event.preventDefault();
                }
                //recursively try to get the target

                function getNext(current) {
                    var next = direction.call(current);
                    //base case: breaks the loop if it bubbles to #post
                    if (current.attr('id') === 'post') {
                        return;
                    } else if (!next.length) {
                        //if next sibbling doesn't exist, it will try to use its parent
                        return getNext(current.parent());
                    } else {
                        return next;
                    }
                }
                //call either next or previous of current element (depended on scroll direction)
                direction = direction || $.fn.next;
                var target = customTarget ? customTarget : getNext($this);
                //if custom target is not specified, default offsets for next/prev elements are used
                var selector = {
                    scrollTop: $(target).offset() ? $(target).offset().top - 5 : 0
                };
                var scrollOptions = {
                    //portrait oriented photos will scroll at 1s and landscape will be .5s
                    duration: ($this.find('img').height() < 1000) ? 200 : 800,
                    complete: function () {
                        that.scrolling = false;
                    }
                };
                //executes the scroll
                try {
                    this.scrolling = true;
                    $body.animate(selector, scrollOptions);
                    $('html').animate(selector, scrollOptions);
                } catch (e) {}
            },
            //highlights the current page
            activate: function () {
                var pageName = $post.data('name');
                var activists = $navList.find('a[href="' + pageName + '"]');
                activists = activists.add(activists.parent());
                $navList.find('.active').removeClass('active');
                activists.addClass('active');
            },
            //actions to perform when the page is at a certain Y position
            scrollspy: function () {
                //delay function to prevent scroll event from firing too often
                var that = this;
                var stopDropRoll;

                function delayer() {
                    win.clearTimeout(stopDropRoll);
                    stopDropRoll = win.setTimeout(function () {
                        navlistDock();
                    }, 10);
                }

                function navlistDock() {
                    that.isMini();
                    var currentY = window.pageYOffset;
                    if (currentY <= 144) {
                        $navList.removeClass('fixed');
                    } else if (currentY > 144) {
                        $navList.addClass('fixed');
                    } else {
                        return;
                    }
                }
                $window.off('scroll').on('scroll', delayer).trigger('scroll');
            },
            //changing the colors!
            rainbow: function () {
                var colors = ['#52a87f', '#EE8080', '#9371b3', '#7C7C7C', '#0EAED6'];
                var randomColor = Math.floor(Math.random() * colors.length);

                function modify() {
                    $('link[rel=stylesheet]').remove();
                    $('body *').deanimate();
                    win.less.modifyVars({
                        '@color': colors[randomColor]
                    });
                }
                if (!win.less) {
                    this.requireCss('gnaoh.less');
                    win.require(['static/less'], modify);
                } else {
                    modify();
                }
            }
        };
        //initializing everything and exporting it to the global scope
        var gnaoh = new Gnaoh().init();
        win.gnaoh = gnaoh;
        win.Gnaoh = function () {
            return new Gnaoh();
        };
        // /*****************************************************************************************
        //  * Misc. DOM event bindings and manipulations
        //  * ****************************************************************************************
        // //history navigation (back/forward buttons) for ajax loaded pages
        try {
            win.onpopstate = function () {
                if (gnaoh.popState && gnaoh.currentPage.path !== doc.location.pathname) {
                    gnaoh.getPage(doc.location);
                }
                gnaoh.popState = true;
            };
        } catch (e) {}
        //nav list functions for each link
        $navList.on('click', 'a', function (event) {
            var $this = $(this);
            //dont break middle mouse/ctrl+click functionality
            if (event.which === 2 || event.ctrlKey) {
                return;
            }
            //return if link is already active or page is currently loading
            if ($this.hasClass('active')) {
                return false;
            }
            var href = this.href;
            //must pass relative link to ajax function to avoid time wasting SSL renegotiations
            var link = $this.attr('href');
            var formattedHref = href.replace(/\#\w/, '');
            var hash = href.match(/\#.*/);
            var samePage = formattedHref === gnaoh.currentPage.href.replace(/\#\w*/, '');
            if (hash && samePage) {
                //if there's a hash match, it will be extracted;
                gnaoh.smoothScroll(undefined, undefined, hash[0]);
            } else if (samePage) {
                gnaoh.smoothScroll(undefined, undefined, 'top');
            } else {
                gnaoh.getPage(link);
            }
            //mark link active & push page/hash to history
            win.history.pushState({}, "", href);
            return false;
        });
        //navlist toggle for smaller devices
        $('.middle').on('click', function () {
            var $this = $('.flipper');
            var rotation = $this.css('transform') === 'none' ? 'rotate(90deg)' : 'none';
            $this.css({
                transform: rotation
            });
            $navList.toggleClass('show');
        });
    });
})(window, document);