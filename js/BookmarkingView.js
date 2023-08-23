import Adapt from 'core/js/adapt';
import React from 'react';
import ReactDOM from 'react-dom';
import { templates, classes } from 'core/js/reactHelpers';

export default class BookmarkingView extends Backbone.View {

  get config() {
    return Adapt.course.get('_bookmarking');
  }

  className() {
    return classes([
      'bookmarking-resume'
    ]);
  }

  events() {
    return {
      'click .js-bookmarking-resume-button': 'onResumeClicked'
    };
  }

  initialize() {
    this._classSet = new Set(_.result(this, 'className').trim().split(/\s+/));
    this.render();
  }

  render() {
    const Template = templates.bookmarkingResume;
    this.updateViewProperties();
    ReactDOM.render(<Template {...this.model.toJSON()} />, this.el);
  }

  updateViewProperties() {
    const classesToAdd = _.result(this, 'className').trim().split(/\s+/);
    classesToAdd.forEach(i => this._classSet.add(i));
    const classesToRemove = [ ...this._classSet ].filter(i => !classesToAdd.includes(i));
    classesToRemove.forEach(i => this._classSet.delete(i));
    this._setAttributes({ ..._.result(this, 'attributes'), id: _.result(this, 'id') });
    this.$el.removeClass(classesToRemove).addClass(classesToAdd);
  }

  onResumeClicked() {
    Adapt.trigger('bookmarking:resume');
  }
}
