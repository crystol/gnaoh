(function (window, document) {
    define('gnaoh', ['jquery'], function ($) {
        'use strict';
        var development = true;
        // Common jquery selectors cache
        var $window = $(window);
        var $body = $('body');
        var $content = $('#content');
        var $post = $('#post');
        var $navList = $('#navlist');
        var $loader = $('#navigator .pyrimidine');
        // An object to wield the burden of responsibilities--it will be the one...
        function Gnaoh() {
            // Global scope variables
            this.scrolling = false;
            this.cssDelay = 1000;
            this.static = '/static';
            this.firstLoad = true;
        }
        Gnaoh.prototype = {
            // Function to initialize the page on first load or ajax loaded sections
            init: function () {
                var This = this;
                // Clear sticky settings and unbind listeners
                if ($('#new-post')[0] || $('#old-post')[0]) {
                    $('#old-post').remove();
                    $('#new-post').contents().unwrap();
                }
                // Activate markings and sizing functions
                This.activate();
                This.size();
                This.loadToggle('on');
                // Promises and callbacks
                This.initPromise = new $.Deferred();
                This.initCallbacks = new $.Callbacks();
                This.resizeCallbacks = new $.Callbacks();
                // Add functions post-init callbacks list
                This.initCallbacks.add(function () {
                    This.loadToggle();
                    This.historian();
                    This.scrollspy();
                    This.dominatrix();
                });
                // Execute the callbacks after the page is initialized
                This.initPromise.done(This.initCallbacks.fire);
                // Add handlers for window's resize events
                This.resizeCallbacks.add([This.scrollspy, This.size]);
                // Bind said handlers to window and add a delay to prevent rapid firing
                $window.on('resize', function () {
                    window.clearTimeout(This.resizeDelay);
                    This.resizeDelay = window.setTimeout(function () {
                        This.resizeCallbacks.fire.call(This);
                    }, 200);
                });
                // Series of sections that may exist on pages that need to be loaded
                var thingsToLoad = {
                    // Codeblocks
                    prettify: $('#post .prettyprint'),
                    // Curriculum Vitae
                    loadCV: $('#post .cv'),
                    // Photo galleries
                    loadGallery: $('#post .gallery'),
                    // Videos
                    loadVideo: $('#post .video')
                };
                // Loops through the sections and call their respective functions
                This.sectionsDone = 0;
                var sectionsPassed = 0;
                var sectionsTotal = 0;
                for (var loader in thingsToLoad) {
                    var loadee = thingsToLoad[loader];
                    if (loadee[0]) {
                        This[loader](loadee);
                    } else {
                        sectionsPassed++;
                    }
                    sectionsTotal++;
                }
                // Resolves the promise after the sections are loaded
                while (true) {
                    if (This.sectionsDone + sectionsPassed >= sectionsTotal) {
                        This.initPromise.resolve();
                        break;
                    }
                }
                return This;
            },
            // Toggle loading animation 
            loadToggle: function (toggle) {
                var This = this;
                if (toggle === 'on') {
                    This.loading = true;
                    $loader.off().addClass('loading');
                } else {
                    // Remove loading animation after next iteration
                    $loader.on('animationiteration webkitAnimationIteration', function (event) {
                        $loader.off().on(event.type, function () {
                            This.loading = false;
                            $loader.removeClass('loading').off();
                        });
                    });
                }
            },
            // Media query: will set mini || medium || massive to true appropiately
            size: function () {
                var width = document.body.clientWidth;
                this.mini = this.medium = this.massive = false;
                if (width <= 768) {
                    this.mini = true;
                } else if (width >= 769 && width <= 1024) {
                    this.medium = true;
                } else {
                    this.massive = true;
                }
            },
            // Checks to see if the layout is currently in mini (mobile) responsive mode
            // It will throw a silent error and stop execution of the caller function
            isMini: function () {
                if (this.mini) {
                    // Event listener that stops the error from being an error
                    $window.on('error', function (event) {
                        // Remove the listener to prevent silencing of other errors
                        $window.off(event);
                        return false;
                    });
                    throw 'Mini mode detected, cancelling function.';
                }
            },
            // Ajax loading of pages
            getPage: function (link, animate, noHistory) {
                // Need to save context of this to pass to jquery callbacks
                var This = this;
                This.loadToggle('on');
                // Sends ajax request for the specific page
                $.ajax({
                    type: 'GET',
                    url: link
                }).error(function () {
                    var names = $('.kenny').add('.hoang').add('.gnaoh');
                    // Flash the names to be red
                    names.addClass('error').wait(2000, function () {
                        names.removeClass('error');
                    });
                    This.loadToggle('off');
                }).success(function (data) {
                    // Scroll up top
                    gnaoh.smoothScroll(null, null, 'navigator');
                    // Mark link active & push page/hash to history
                    if (!noHistory) {
                        window.history.pushState({}, '', link);
                    }
                    // Wraps the old page and replaces it with the data fetched from ajax request
                    var $data = $(data).find('#post');
                    var $postPrep = $('<div id="new-post">').append($data.contents());
                    // Changes page title and path
                    $post.data('path', $data.data('path'));
                    document.title = $data.data('title');
                    $post.wrapInner('<div id="old-post">').append($postPrep);
                    var $old = $('#old-post');
                    var $new = $('#new-post').css('width', $post.width());
                    // Restores the order
                    function cleanUp() {
                        $old.remove();
                        $new.contents().unwrap();
                        // Push to analytics and initialize the new page
                        if (window.mixpanel) {
                            window.mixpanel.track('Navigation', {
                                url: document.location.pathname
                            });
                        }
                        This.init();
                    }
                    // Animating the pages
                    if (!This.mini && animate) {
                        $old.add($new).addClass('move');
                        $.wait(This.cssDelay, cleanUp);
                    } else {
                        cleanUp();
                    }
                });
            },
            historian: function () {
                var This = this;
                // Update currentpage for navigation
                This.currentPage = {
                    path: document.location.pathname,
                    href: document.location.href
                };
                // History navigation (back/forward buttons) for ajax loaded pages
                try {
                    window.onpopstate = function () {
                        if (This.currentPage.path !== document.location.pathname) {
                            This.getPage(document.location, false, true);
                        }
                    };
                } catch (e) {
                    log(e);
                }
            },
            // Load a css file from the static library or local /css directory
            requireCss: function (name, staticLib) {
                var stylesheet = document.createElement('link');
                var href = (staticLib) ? this.static + '/css/' + name : name;
                stylesheet.rel = /less/.test(name) ? 'stylesheet/less' : 'stylesheet';
                stylesheet.href = href;
                document.getElementsByTagName('head')[0].appendChild(stylesheet);
            },
            // Load a single photo in a light box
            lightbox: function (url, caption) {
                var This = this;
                function load() {
                    $.fancybox({
                        padding: 3,
                        closeClick: true,
                        href: This.static + '/img/' + url,
                        title: caption,
                        helpers: {
                            overlay: null
                        }
                    });
                }
                // Loads the CSS and JS files for fancybox.js if they're not loaded. 
                if (!This.lightboxed) {
                    This.lightboxed = true;
                    This.requireCss('fancybox/fancybox.css', true);
                    window.require(['static/fancybox'], load);
                } else {
                    return load();
                }
            },
            // Load an image gallery from a specified directory. 
            // Sample html code <div class='gallery' id='dirName' start='1' amount='10'></div>
            loadGallery: function ($gallery) {
                var This = this;
                $gallery = $gallery || $('#post .gallery');
                $gallery.each(function () {
                    var $this = $(this);
                    // // Apply options and serialize the numbers
                    var options = {
                        id: this.id,
                        // Starts at provided image index or 1
                        start: Number(this.dataset.start || 1),
                        // Stops at the provided start point plus the amount needed to load
                        amount: Number(this.dataset.start || 1) + Number(this.dataset.amount),
                        // Does a captions file exist?
                        captions: Boolean(this.dataset.captions === 'true'),
                        // Wall-type gallery
                        wall: $this.hasClass('wall')
                    };
                    // Creates a div, append the appropiate image to itself, and then pushes to the array of images
                    var imageArray = [];
                    for (var i = options.start; i < options.amount; i++) {
                        var image = document.createElement('img');
                        var imageWrapper = document.createElement('div');
                        image.src = This.static + '/img/gallery/' + options.id + '/' + i + '.jpg';
                        imageWrapper.className = 'image';
                        // Give the wrapper a unique ID to help with the captions
                        imageWrapper.id = options.id + '-' + i;
                        imageWrapper.appendChild(image);
                        imageArray.push(imageWrapper);
                    }
                    $this.append(imageArray);
                    // Grab the JSON captions file if it exists
                    if (options.captions) {
                        var captionsURL = This.static + '/img/gallery/' + options.id + '/captions.json';
                        // Loop through and match the text with corresonponding image
                        var captionator = function (data) {
                            for (var key in data) {
                                var caption = document.createElement('div');
                                caption.className = 'caption';
                                caption.textContent = data[key];
                                document.getElementById(options.id + '-' + key).appendChild(caption);
                            }
                        };
                        // Make the ajax call
                        $.ajax({
                            url: captionsURL,
                            success: captionator,
                            error: function () {
                                console.log('No captions file found at: ' + captionsURL);
                            }
                        });
                    }
                    // If a wall-type gallery exists, it will be added to the init callback queue
                    if (options.wall) {
                        $this.addClass('mortar');
                        This.initCallbacks.add(function () {
                            // Call laybricks with This since $.Callbacks forces the 'this' context to itself
                            This.layBricks.call(This, options);
                        });
                    }
                });
                // If not mobile nor wall gallery, it will do a fancy scroll upon click
                $gallery.filter(':not(.wall)').on('click', '.image', function (event) {
                    This.isMini();
                    This.smoothScroll.call(this, event);
                });
                // Help resolve init promise
                This.sectionsDone++;
            },
            // Lay the brick elements using isotope.js from galleries with .wall classes
            layBricks: function () {
                var This = this;
                var $foundation = $('.wall');
                // Append isotope.js asynchronously
                window.require(['static/isotope'], function () {
                    // Images.loaded() helps increases position accurary when the gallery is animated
                    $foundation.imagesLoaded(function () {
                        $foundation.isotope({
                            itemSelector: '.image',
                            layoutMode: 'masonry',
                            masonry: {
                                // 2 photos per column on bigger screens (>1024px); 4 per column on mobile
                                columnWidth: This.mini ? $post.width() / 2 : $post.width() / 4
                            },
                            containerClass: 'wall',
                            itemClass: 'brick',
                            resizable: false
                        });
                        function anotherBrickOnTheWall() {
                            $foundation.isotope('reloadItems');
                            $foundation.isotope('reLayout');
                        }
                        // Self-invoking function (on first init) that fixes the width on window resizes
                        var rebrick = (function rebrick() {
                            var delay = This.mini ? 0 : 500;
                            $foundation.css({
                                width: $content.width(),
                                'max-width': $content.width()
                            }).isotope('option', {
                                masonry: {
                                    columnWidth: This.mini ? $post.width() / 2 : $post.width() / 4
                                }
                            });
                            // Clicking on each image will toggle its enlargement.
                            $foundation.off().on('click', '.image', function () {
                                // Needs a animation delay in order for isotope to accurately calculate positions
                                $.wait(delay, anotherBrickOnTheWall);
                                $(this).addClass('top').toggleClass('biggie').wait(delay * 2, function () {
                                    this.removeClass('top');
                                });
                                return false;
                            });
                            $.wait(This.cssDelay * 0.5, anotherBrickOnTheWall);
                            return rebrick;
                        })();
                        // Add rebrick as a handler for resizing events
                        This.resizeCallbacks.add(rebrick);
                        // Removes the opacity after the gallery is finished loading
                        $foundation.removeClass('mortar');
                    });
                });
            },
            // Loads html5 video content from div tags with .video class.
            loadVideo: function ($video) {
                var This = this;
                $video = $video || $('#post .video');
                $video.each(function () {
                    var $wrapper = $(this);
                    var id = this.id;
                    var options = this.dataset;
                    var vidSrc = This.static + '/vid/' + id;
                    // Placeholder image while the video loads (the poster tag kinda sucks) and adjust the height for 16:9 ratio of 720p movies
                    var poster = $('<img src="' + This.static + '/vid/posters/' + id + '.jpg" class="poster">');
                    $wrapper.css({
                        height: $wrapper.width() * (9 / 16)
                    });
                    // Video - main container
                    var video = document.createElement('video');
                    // Mp4 source tag
                    var mp4 = document.createElement('source');
                    mp4.type = 'video/mp4';
                    mp4.src = vidSrc + '.mp4';
                    // Webm source tag
                    var webm = document.createElement('source');
                    webm.type = 'video/webm';
                    webm.src = vidSrc + '.webm';
                    // Append the sources to the video tag and stick it into the div
                    video.appendChild(mp4);
                    video.appendChild(webm);
                    $wrapper.append(poster);
                    $wrapper.append(video);
                    // Loop through and apply options
                    for (var key in options) {
                        // Break loop on these options
                        if (key === 'controls') {
                            break;
                        }
                        // If the key is a function, the video will execute it. If it's a property, it will be applied to the video tag.
                        if (typeof video[key] === 'function') {
                            video[key]();
                        } else {
                            video[key] = options[key];
                        }
                    }
                    // Event bindings
                    $(video).on({
                        // Single click to play/pause
                        click: function (event) {
                            event.stopPropagation();
                            if (this.paused) {
                                this.play();
                            } else {
                                this.pause();
                            }
                        },
                        // Fullscreen on double click
                        dblclick: function () {
                            if (this.webkitRequestFullscreen) {
                                this.webkitRequestFullscreen();
                            }
                        },
                        // Play on hover
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
                        // Removes background once the video starts playing
                        play: function (event) {
                            if (options.controls) {
                                this.controls = true;
                            }
                            $(poster).deanimate().css('opacity', 0).wait(500, function () {
                                this.remove();
                            });
                            $(this).off(event);
                        }
                        // Events during playback
                        // timeupdate : function () {}
                    });
                    // Parent wrapper will delegate all of these events to its video child
                    $wrapper.on('click mouseenter', function (event) {
                        $wrapper.find('video').trigger(event.type);
                    });
                });
                // On window resize, the video heights will adjust
                This.resizeCallbacks.add(function () {
                    $video.each(function () {
                        var $this = $(this);
                        $this.css('height', $this.width() * (9 / 16));
                    });
                });
                // Help resolve init promise
                This.sectionsDone++;
            },
            // Animated smoothScroll to next sibbling element or specified target
            smoothScroll: function (event, direction, customTarget) {
                var This = this;
                var $this = $(this);
                //  Prevent stacking scroll animations
                if (This.scrolling) {
                    return;
                }
                if (event) {
                    event.preventDefault();
                }
                // Recursively try to get the target
                function getNext(current) {
                    var next = direction.call(current);
                    // Base case: breaks the loop if it bubbles to #post
                    if (current.attr('id') === 'post') {
                        return;
                    } else if (!next.length) {
                        // If next sibbling doesn't exist, it will try to use its parent
                        return getNext(current.parent());
                    } else {
                        return next;
                    }
                }
                // Call either next or previous of current element (depended on scroll direction)
                direction = direction || $.fn.next;
                var target = customTarget ? customTarget : getNext($this);
                // If custom target is not specified, default offsets for next/prev elements are used
                var selector = {
                    scrollTop: $(target).offset() ? $(target).offset().top - $('#navigator').height() : 0
                };
                var scrollOptions = {
                    // Portrait oriented photos will scroll at 1s and landscape will be .5s
                    duration: ($this.find('img').height() < 1000) ? 200 : 400,
                    complete: function () {
                        This.scrolling = false;
                    }
                };
                // Executes the scroll
                try {
                    this.scrolling = true;
                    $body.animate(selector, scrollOptions);
                    $('html').animate(selector, scrollOptions);
                } catch (e) {
                    console.log(e);
                }
            },
            // Highlights the current page
            activate: function () {
                var path = $post.data('path');
                var activists = $navList.find('a[href="' + path + '"]');
                activists = activists.add(activists.parent());
                $navList.find('.active').removeClass('active');
                activists.addClass('active');
            },
            // Actions to perform when the page is at a certain Y position
            scrollspy: function () {
                return;
                // Delay function to prevent scroll event from firing too often
                // var This = this;
                // var stopDropRoll;
                // function delayer() {
                //     window.clearTimeout(stopDropRoll);
                //     stopDropRoll = window.setTimeout(function () {
                //         navlistDock();
                //     }, 10);
                // }
                // function navlistDock() {
                // This.isMini();
                // var currentY = window.pageYOffset;
                // if (currentY <= 144) {
                // } else if (currentY > 144) {
                // } else {
                // return;
                // }
                // }
                // $window.off('scroll').on('scroll', delayer).trigger('scroll');
            },
            // Changing the colors!
            rainbow: function () {
                var colors = ['#52a87f', '#EE8080', '#9371b3', '#7C7C7C', '#0EAED6'];
                var randomColor = Math.floor(Math.random() * colors.length);
                function modify() {
                    $('link[rel=stylesheet]').remove();
                    $('body *').deanimate();
                    window.less.modifyVars({
                        '@color': colors[randomColor],
                        '@highlight': colors[randomColor]
                    });
                }
                if (!window.less) {
                    this.requireCss('/less/gnaoh.less');
                    window.require(['static/less'], modify);
                } else {
                    modify();
                }
            },
            // Executes Google Prettify script and provide syntax highlighting
            prettify: function () {
                window.require(['static/prettify'], function () {
                    window.prettyPrint();
                });
                // Help resolve init promise
                this.sectionsDone++;
            },
            // Curriculum Vitae section
            loadCV: function ($cv) {
                $cv = $cv || $('#post .cv');
                // Skills section
                $cv.find('.skills .title').on({
                    click: function () {
                        $cv.find('.skills .active').removeClass('active');
                        // Mark the label and the tab active
                        $cv.find(this.dataset.tab).addClass('active');
                        $(this).addClass('active');
                        if (window.mixpanel) {
                            window.mixpanel.track('CV Click', {
                                url: this.textContent + ' Tab'
                            });
                        }
                    }
                });
                // Experience section
                $cv.find('.position:not(.active)').on({
                    click: function () {
                        $cv.find('.position.active').removeClass(' active');
                        $(this).addClass(' active');
                    },
                    // Adds active status on hover. Cancels if mouse leaves within 1000ms
                    mouseenter: function () {
                        var $this = $(this);
                        var countdown = window.setTimeout(function () {
                            $cv.find('.position.active').removeClass('active');
                            $this.addClass('active');
                        }, 1000);
                        $this.on('mouseleave', function (event) {
                            window.clearTimeout(countdown);
                            $this.off(event);
                        });
                    }
                });
                if (window.mixpanel) {
                    $cv.find('a').on('click', function (data) {
                        window.mixpanel.track('CV Click', {
                            url: data.target.href
                        });
                    });
                }
                // Help resolve init promise
                this.sectionsDone++;
            },
            // Miscellaneous DOM bindings
            dominatrix: function () {
                var This = this;
                // Return if page has already ben initialized
                if (!This.firstLoad) {
                    return;
                } else {
                    This.firstLoad = false;
                }
                // Ajax fetching of links with 'ajax' class 
                $body.on('click', '.ajax', function (event) {
                    var $this = $(this);
                    // Don't break middle mouse/ctrl+click functionality
                    if (event.which === 2 || event.ctrlKey) {
                        return;
                    }
                    // Return if link is already active or page is currently loading
                    if ($this.hasClass('active')) {
                        return false;
                    }
                    var href = this.href;
                    // Must pass relative link to ajax function to avoid time wasting SSL renegotiations
                    var link = $this.attr('href');
                    var formattedHref = href.replace(/\#\w/, '');
                    var hash = href.match(/\#.*/);
                    var samePage = formattedHref === This.currentPage.href.replace(/\#\w*/, '');
                    if (hash && samePage) {
                        // If there's a hash match, it will be extracted and focused
                        This.smoothScroll(undefined, undefined, hash[0]);
                    } else if ($this.hasClass('move')) {
                        This.getPage(link, true);
                    } else {
                        This.getPage(link);
                    }
                    return false;
                });
                // Navlist toggle for smaller devices
                $('.middle').on('click', function () {
                    var $this = $('.flipper');
                    var rotation = $this.css('transform') === 'none' ? 'rotate(90deg)' : 'none';
                    $this.css({
                        transform: rotation
                    });
                    $navList.toggleClass('show');
                });
                // Mixpanel analytics
                if (window.mixpanel) {
                    // Grab user from LS or generate random number for new comers
                    var user = window.localStorage.gnaohUser || Math.floor(Math.random() * 10000);
                    window.localStorage.gnaohUser = user;
                    // Identiy and set user metric
                    window.mixpanel.identify(user);
                    // Parse remote IP address from cookie
                    var remoteIP;
                    var cookieTray = document.cookie.split(';');
                    for (var i = 0; i < cookieTray.length; i++) {
                        if (/^Remote=/.test(cookieTray[i])) {
                            remoteIP = cookieTray[i].split('=')[1];
                        }
                    }
                    // Push data to mixpanel
                    window.mixpanel.people.set({
                        '$name': user,
                        '$last_login': new Date(),
                        'IP': remoteIP
                    });
                    // Logging landing page
                    window.mixpanel.track('Landing', {
                        url: document.location.pathname
                    });
                    // Exit page
                    window.onunload = function () {
                        window.mixpanel.track('Unloading', {
                            url: document.location.pathname
                        });
                    };
                }
            },
        };
        // Initializing everything and exporting it to the global scope
        var gnaoh = new Gnaoh().init();
        window.gnaoh = gnaoh;
        window.Gnaoh = Gnaoh;
        // Lazy logging in dev environment
        function log(args) {
            if (development && window.console.log) {
                window.console.log(args);
            } else {
                return;
            }
        }
        // Extensions to jQuery
        // Stall function that can be used more versitile from $().delay()
        $.prototype.wait = $.wait = function (time, callback) {
            var This = this;
            var procrastinate = $.Deferred();
            if (typeof time !== 'number') {
                time = 500;
            }
            // If callback exists, perform it after the delay and return jquery object for chaining
            if (typeof callback === 'function') {
                window.setTimeout(function () {
                    callback.call(This);
                }, time);
                return This;
            } else {
                // Return promise--use withh .done()--if no callbacks are provided
                window.setTimeout(function () {
                    procrastinate.resolveWith(This);
                }, time);
                return procrastinate;
            }
        };
        // Adds the animate class to selected element, wait for animation, and removes the class
        $.prototype.deanimate = function (removee, styleClear, time) {
            time = time || 1000;
            var removees = 'animated ' + removee;
            this.addClass('animated').wait(time).done(function () {
                this.removeClass(removees);
                if (styleClear) {
                    this.removeAttr('style');
                }
            });
            return this;
        };
    });
})(window, document);