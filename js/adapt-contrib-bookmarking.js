define([
    'coreJS/adapt'
], function(Adapt) {

    var Bookmarking = _.extend({

        bookmarkLevel: null,
        currentOnScreens: [],
        inviewEventListeners: [],
        locationID: null,
        debounceOnScroll: null,

        initialize: function () {
            this.listenToOnce(Adapt, "router:location", this.onAdaptInitialize);
        },

        onAdaptInitialize: function() {
            if (!this.checkIsEnabled()) return;
            this.setupPrimaryEventListeners();
            this.checkRestoreLocation();
        },

        checkIsEnabled: function() {
            var courseBookmarkModel = Adapt.course.get('_bookmarking');
            if (!courseBookmarkModel || !courseBookmarkModel._isEnabled) return false;
            if (!Adapt.offlineStorage) return false;
            return true;
        },

        setupPrimaryEventListeners: function() {

            this.debounceOnScroll =_.debounce(_.bind(this.onScroll, Bookmarking), 1000);

            this.listenTo(Adapt, 'menuView:ready', this.onMenuReady);
            this.listenTo(Adapt, 'pageView:preRender', this.onPagePreRender);
        },

        checkRestoreLocation: function() {
            this.locationID = Adapt.offlineStorage.get("location");

            if (!this.locationID) return;

            this.listenToOnce(Adapt, "pageView:ready menuView:ready", this.restoreLocation);
        },

        restoreLocation: function() {
            _.defer(_.bind(function() {

                this.stopListening(Adapt, "pageView:ready menuView:ready", this.restoreLocation);

                var courseBookmarkModel = Adapt.course.get('_bookmarking');
                courseBookmarkModel._locationID = this.locationID;

                if (this.locationID == Adapt.location._currentId) return;

                try {
                    var model = Adapt.findById(this.locationID);
                } catch (error) {
                    return;
                }

                this.showPrompt();

            }, this));
        },

        showPrompt: function() {
            var courseBookmarkModel = Adapt.course.get('_bookmarking');
            if (!courseBookmarkModel._buttons) {
                courseBookmarkModel._buttons = {
                    yes: "Yes",
                    no: "No"
                };
            }
            if (!courseBookmarkModel._buttons.yes) {
                courseBookmarkModel._buttons.yes = "Yes";
            }
            if (!courseBookmarkModel._buttons.no) {
                courseBookmarkModel._buttons.no = "No";
            }


            this.listenToOnce(Adapt, "bookmarking:continue", this.onNavigateToPrevious);
            this.listenToOnce(Adapt, "bookmarking:cancel", this.onNavigateCancel);

            var promptObject = {
                title: courseBookmarkModel.title,
                body: courseBookmarkModel.body,
                _prompts:[
                    {
                        promptText: courseBookmarkModel._buttons.yes,
                        _callbackEvent: "bookmarking:continue",
                    },
                    {
                        promptText: courseBookmarkModel._buttons.no,
                        _callbackEvent: "bookmarking:cancel",
                    }
                ],
                _showIcon: true
            }

            Adapt.trigger('notify:prompt', promptObject);
        },

        onNavigateToPrevious: function() {
            var courseBookmarkModel = Adapt.course.get('_bookmarking');
            
            _.defer(function() {
                Backbone.history.navigate('#/id/' + courseBookmarkModel._locationID, {trigger: true});    
            });
            
            this.stopListening(Adapt, "bookmarking:cancel");
        },

        onNavigateCancel: function() {
            this.stopListening(Adapt, "bookmarking:continue");
        },

        resetLocation: function () {
            this.saveLocation('');
        },

        onMenuReady: function(menuView) {
            var menuModel = menuView.model;
            if (menuModel.get("_parentId")) return this.saveLocation(menuModel.get("_id"));
            else this.resetLocation();
        },
        
        onPagePreRender: function (pageView) {
            var hasPageBookmarkObject = pageView.model.has('_bookmarking');
            var bookmarkModel = (hasPageBookmarkObject) ? pageView.model.get('_bookmarking') : Adapt.course.get('_bookmarking');
            this.bookmarkLevel = bookmarkModel._level;

            if (!bookmarkModel._isEnabled) {
                this.resetLocation();
                return;
            } else if (this.bookmarkLevel === 'page') {
                this.saveLocation(pageView.model.get('_id'));
            } else {
                $(window).on("scroll", this._debounceOnScroll);
                this.listenTo(Adapt, this.bookmarkLevel + "View:postRender", this.addInViewListeners);
                this.listenToOnce(Adapt, "remove", this.removeInViewListeners);
            }
        },

        addInViewListeners: function (view) {
            var element = view.$el;
            var id = view.model.get('_id');
            element.data('locationID', id);
            element.on('onscreen', _.bind(this.delayOnScreen, this));
            this.inviewEventListeners.push(element);
        },

        delayOnScreen: function(event) {
            var $target = $(event.target);

            _.delay(_.bind(function(){
            
                this.onScreen($target)

            },this), 1000);
        },

        onScreen: function ($target) {
            var id = $target.data('locationID');

            this.recheckOnScreens();

            var isInList = _.findWhere(this.currentOnScreens, { id : id } );

            if (!isInList) {
                var measurements =  $target.onscreen();

                if (measurements.onscreen) {                
                    this.currentOnScreens.push({
                        id: id,
                        $target: $target,
                        measurements: measurements
                    });
                } else {
                    return;
                }

            } else {

                if (!isInList.measurements.onscreen) {
                    this.currentOnScreens = _.reject(this.currentOnScreens, function(item) {
                        return item.id == id;
                    });
                }
            }

            this.sortOnScreenItems();
            this.setLocation();
        },

        recheckOnScreens: function() {
            for (var i = 0, l = this.currentOnScreens.length; i < l; i++) {
                var currentOnScreen = this.currentOnScreens[i];
                currentOnScreen.measurements = currentOnScreen.$target.onscreen();
            }
        },

        sortOnScreenItems: function() {
            if (this.currentOnScreens.length === 0) return;
            
            this.currentIndexViews = this.currentOnScreens.sort(function(item1, item2) {
                return item2.measurements.percentInview-item1.measurements.percentInview;
            });
        },

        onScroll: function() {
            this.recheckOnScreens();
            this.sortOnScreenItems();
            this.setLocationToFirstVisible();
        },

        setLocation: function() {
            if (this.currentOnScreens.length === 0) this.resetLocation();
            else if (typeof this.currentOnScreens[0].id == 'undefined') return;
            else this.saveLocation(this.currentOnScreens[0].id);
        },

        saveLocation: function (id) {
            if (!Adapt.offlineStorage) return;
            if (this.locationID == id) return;
            Adapt.offlineStorage.set("location", id);
            this.locationID = id;
        },

        removeInViewListeners: function () {
            $(this.inviewEventListeners).off('onscreen');
            this.currentOnScreens.length = 0;
            this.inviewEventListeners.length = 0;
            this.stopListening(Adapt, this.bookmarkLevel + 'View:postRender', this.addInViewListeners);
        }

    }, Backbone.Events)

    Bookmarking.initialize();

});
