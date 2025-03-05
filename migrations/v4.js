import { describe, getCourse, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Bookmarking - v4.2.1 to v4.3.0', async () => {

  // https://github.com/adaptlearning/adapt-contrib-bookmarking/compare/v4.2.1..v4.3.0

  let course, courseBookmarkingGlobals;
  const resumeButtonText = 'Resume';
  const resumeButtonAriaLabel = 'Navigate to your furthest point of progress.';
  const location = 'previous';

  whereFromPlugin('Bookmarking - from v4.2.1', { name: 'adapt-contrib-bookmarking', version: '<4.3.0' });

  whereContent('Bookmarking - where config is present', async (content) => {
    course = getCourse();
    return course._bookmarking;
  });

  mutateContent('Bookmarking - add globals if missing', async (content) => {
    if (!_.has(course, '_globals._extensions._bookmarking')) _.set(course, '_globals._extensions._bookmarking', {});
    courseBookmarkingGlobals = course._globals._extensions._bookmarking;
    return true;
  });

  mutateContent('Bookmarking - add global attribute resumeButtonText', async (content) => {
    courseBookmarkingGlobals.resumeButtonText = resumeButtonText;
    return true;
  });

  mutateContent('Bookmarking - add global attribute resumeButtonAriaLabel', async (content) => {
    courseBookmarkingGlobals.resumeButtonAriaLabel = resumeButtonAriaLabel;
    return true;
  });

  mutateContent('Bookmarking - add course _location', async (content) => {
    course._bookmarking._location = location;
    return true;
  });

  mutateContent('Bookmarking - add course _autoRestore', async (content) => {
    course._bookmarking._autoRestore = true;
    return true;
  });

  checkContent('Bookmarking - check global attribute resumeButtonText', async (content) => {
    const isValid = courseBookmarkingGlobals.resumeButtonText === resumeButtonText;
    if (!isValid) throw new Error('Bookmarking - global attribute resumeButtonText');
    return true;
  });

  checkContent('Bookmarking - check global attribute resumeButtonAriaLabel', async (content) => {
    const isValid = courseBookmarkingGlobals.resumeButtonAriaLabel === resumeButtonAriaLabel;
    if (!isValid) throw new Error('Bookmarking - global attribute resumeButtonAriaLabel');
    return true;
  });

  checkContent('Bookmarking - check course attribute _location', async (content) => {
    const isValid = course._bookmarking._location === location;
    if (!isValid) throw new Error('Bookmarking - course attribute _location');
    return true;
  });

  checkContent('Bookmarking - check course attribute _autoRestore', async (content) => {
    const isValid = course._bookmarking._autoRestore === true;
    if (!isValid) throw new Error('Bookmarking - course attribute _autoRestore');
    return true;
  });

  updatePlugin('Bookmarking - update to v4.3.0', { name: 'adapt-contrib-bookmarking', version: '4.3.0', framework: '>=5.31.11' });

  testSuccessWhere('bookmarking with course._bookmarking, no globals', {
    fromPlugins: [{ name: 'adapt-contrib-bookmarking', version: '4.2.1' }],
    content: [
      { _type: 'course', _bookmarking: {} }
    ]
  });

  testSuccessWhere('bookmarking with course._bookmarking, with globals', {
    fromPlugins: [{ name: 'adapt-contrib-bookmarking', version: '4.2.1' }],
    content: [
      { _type: 'course', _bookmarking: {}, _globals: { _extensions: { _bookmarking: {} } } }
    ]
  });

  testStopWhere('bookmarking with empty course', {
    fromPlugins: [{ name: 'adapt-contrib-bookmarking', version: '4.2.1' }],
    content: [
      { _type: 'course' }
    ]
  });

  testStopWhere('bookmarking incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-bookmarking', version: '4.3.0' }]
  });
});
