import Adapt from 'core/js/adapt';

class Bookmarking extends Backbone.Controller {

  initialize() {
    this.bookmarkLevel = null;
    this.watchViewIds = null;
    this.watchViews = [];
    this.restoredLocationID = null;
    this.currentLocationID = null;
    this.listenToOnce(Adapt, 'router:location', this.onAdaptInitialize);
  }

  onAdaptInitialize() {
    if (!this.checkIsEnabled()) return;
    this.setupEventListeners();
    this.checkRestoreLocation();
  }

  checkIsEnabled() {
    var courseBookmarkModel = Adapt.course.get('_bookmarking');
    if (!courseBookmarkModel || !courseBookmarkModel._isEnabled) return false;
    if (!Adapt.offlineStorage) return false;
    return true;
  }

  setupEventListeners() {
    this._onScroll = _.debounce(this.checkLocation.bind(this), 1000);
    this.listenTo(Adapt, {
      'menuView:ready': this.setupMenu,
      'pageView:preRender': this.setupPage
    });
  }

  checkRestoreLocation() {
    this.restoredLocationID = Adapt.offlineStorage.get('location');

    if (!this.restoredLocationID || this.restoredLocationID === 'undefined' || !Adapt.findById(this.restoredLocationID)) {
      return;
    }

    this.listenToOnce(Adapt, 'pageView:ready menuView:ready', this.restoreLocation);
  }

  restoreLocation() {
    _.defer(function() {
      this.stopListening(Adapt, 'pageView:ready menuView:ready', this.restoreLocation);

      if (this.isAlreadyOnScreen(this.restoredLocationID)) {
        return;
      }

      if (Adapt.course.get('_bookmarking')._showPrompt === false) {
        this.navigateToPrevious();
        return;
      }
      this.showPrompt();

    }.bind(this));
  }

  /**
   * If the learner is already at the bookmarked location, there's no need to show a prompt
   * This method determines whether that is the case or not
   * @param {string} id The `_id` of the item the learner needs to be returned to
   * @return {boolean}
   */
  isAlreadyOnScreen(id) {
    if (id === Adapt.location._currentId) return true;

    var type = Adapt.findById(id).getTypeGroup();
    if (type === 'menu' || type === 'page') {
      return false;
    }

    var locationOnscreen = $('.' + id).onscreen();
    var isLocationOnscreen = locationOnscreen && (locationOnscreen.percentInview > 0);
    var isLocationFullyInview = locationOnscreen && (locationOnscreen.percentInview === 100);
    if (isLocationOnscreen && isLocationFullyInview) {
      return true;
    }

    return false;
  }

  showPrompt() {
    var courseBookmarkModel = Adapt.course.get('_bookmarking');
    var buttons = courseBookmarkModel._buttons || { yes: 'Yes', no: 'No' };

    this.listenToOnce(Adapt, {
      'bookmarking:continue': this.navigateToPrevious,
      'bookmarking:cancel': this.navigateCancel
    });

    var promptObject = {
      title: courseBookmarkModel.title,
      body: courseBookmarkModel.body,
      _classes: 'is-bookmarking',
      _prompts: [
        {
          promptText: buttons.yes || 'Yes',
          _callbackEvent: 'bookmarking:continue'
        },
        {
          promptText: buttons.no || 'No',
          _callbackEvent: 'bookmarking:cancel'
        }
      ],
      _showIcon: true
    };

    Adapt.notify.prompt(promptObject);
  }

  navigateToPrevious() {
    _.defer(async function() {
      var isSinglePage = (Adapt.contentObjects.models.length === 1);
      await Adapt.router.navigateToElement(this.restoredLocationID, { trigger: true, replace: isSinglePage, duration: 400 });
    }.bind(this));

    this.stopListening(Adapt, 'bookmarking:cancel');
  }

  navigateCancel() {
    this.stopListening(Adapt, 'bookmarking:continue');
  }

  resetLocationID() {
    this.setLocationID('');
  }

  /**
   * if the learner navigates to the top-level menu, clear the stored bookmark
   * if it's a sub-menu, store the menu's id as the bookmark
   */
  setupMenu(menuView) {
    var menuModel = menuView.model;

    if (!menuModel.get('_parentId')) {
      this.resetLocationID();
      return;
    }

    this.setLocationID(menuModel.get('_id'));
  }

  /**
   * Calculates what the bookmarking 'level' will be for any given page.
   * First sets a default using the course-level setting (or 'component' if that's not been set)
   * then checks to see if that's being overridden at page level or not
   * @param {Backbone.Model} pageModel The model for the current page view
   * @return {String} Either 'page', 'block', or 'component' - with 'component' being the default
   */
  getBookmarkLevel(pageModel) {
    var defaultLevel = Adapt.course.get('_bookmarking')._level || 'component';
    var bookmarkModel = pageModel.get('_bookmarking');
    var isInherit = !bookmarkModel || !bookmarkModel._level || bookmarkModel._level === 'inherit';
    return isInherit ? defaultLevel : bookmarkModel._level;
  }

  /**
   * Sets up bookmarking for the page the learner just navigated to
   * If bookmarking is disabled for the current page, clear the stored bookmark and return.
   * Otherwise, bookmark the page then - if necessary - set up to calculate which block or component
   * should be bookmarked as the learner scrolls up/down the page
   * @param {Backbone.View} pageView The current page view
   */
  setupPage(pageView) {
    var pageBookmarkModel = pageView.model.get('_bookmarking');
    if (pageBookmarkModel && pageBookmarkModel._isEnabled === false) {
      this.resetLocationID();
      return;
    }

    this.setLocationID(pageView.model.get('_id'));

    this.bookmarkLevel = this.getBookmarkLevel(pageView.model);
    if (this.bookmarkLevel === 'page') {
      return;
    }

    this.watchViewIds = pageView.model.findDescendantModels(this.bookmarkLevel + 's').map(desc => desc.get('_id'));

    this.listenTo(Adapt, this.bookmarkLevel + 'View:postRender', this.captureViews);
    this.listenToOnce(Adapt, 'remove', this.releaseViews);

    $(window).on('scroll', this._onScroll);
  }

  captureViews(view) {
    this.watchViews.push(view);
  }

  setLocationID(id) {
    if (!Adapt.offlineStorage) return;
    if (this.currentLocationID === id) return;
    Adapt.offlineStorage.set('location', id);
    this.currentLocationID = id;
  }

  releaseViews() {
    this.watchViews.length = 0;
    this.watchViewIds.length = 0;
    this.stopListening(Adapt, 'remove', this.releaseViews);
    this.stopListening(Adapt, this.bookmarkLevel + 'View:postRender', this.captureViews);
    $(window).off('scroll', this._onScroll);
  }

  checkLocation() {
    var highestOnscreen = 0;
    var highestOnscreenLocation = '';

    for (var i = 0, l = this.watchViews.length; i < l; i++) {
      var view = this.watchViews[i];

      var isViewAPageChild = (this.watchViewIds.indexOf(view.model.get('_id')) > -1);

      if (!isViewAPageChild) continue;

      var element = $('.' + view.model.get('_id'));
      var measurements = element.onscreen();

      if (!measurements.onscreen) continue;
      if (measurements.percentInview > highestOnscreen) {
        highestOnscreen = measurements.percentInview;
        highestOnscreenLocation = view.model.get('_id');
      }
    }

    // set location as most inview component
    if (highestOnscreenLocation) this.setLocationID(highestOnscreenLocation);
  }
}

export default new Bookmarking();
