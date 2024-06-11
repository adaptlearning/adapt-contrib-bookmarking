export default class BookmarkingModel extends Backbone.Model {

  defaults () {
    return {
      label: '',
      ariaLabel: '',
      _location: 'previous'
    };
  }

}
