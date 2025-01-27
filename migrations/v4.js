import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

describe('Bookmarking - v4.2.1 to v4.3.0', async () => {

  const getCourse = content => {
    const [course] = content.filter(({ _type }) => _type === 'course');
    return course;
  };

  const getGlobals = content => {
    return getCourse(content)?._globals?._extensions?._bookmarking;
  };

  let course, bookmarkingCfg, courseBookmarkingGlobals;
  const resumeButtonText = 'Resume';
  const resumeButtonAriaLabel = 'Navigate to your furthest point of progress.';
  const location = 'previous';

  whereFromPlugin('Bookmarking - from v4.2.1', { name: 'adapt-contrib-bookmarking', version: '<4.3.0' });
  whereContent('Bookmarking - where config is present', async (content) => {
    [course] = content.filter(({ _type }) => _type === 'course');
    bookmarkingCfg = course._bookmarking;
    if (bookmarkingCfg) return true;
  });

  mutateContent('Bookmarking - add globals if missing', async (content) => {
    courseBookmarkingGlobals = getGlobals(content);
    if (courseBookmarkingGlobals) return true;
    course._globals._extensions = course._globals._extensions || {};
    courseBookmarkingGlobals = course._globals._extensions._bookmarking = {};
    return true;
  });
  mutateContent('Bookmarking - add new globals', async (content) => {
    courseBookmarkingGlobals.resumeButtonText = resumeButtonText;
    courseBookmarkingGlobals.resumeButtonAriaLabel = resumeButtonAriaLabel;
    return true;
  });
  mutateContent('Bookmarking - add _location', async (content) => {
    bookmarkingCfg._location = location;
    return true;
  });
  mutateContent('Bookmarking - add _autoRestore', async (content) => {
    bookmarkingCfg._autoRestore = true;
    return true;
  });

  checkContent('Bookmarking - check new globals', async (content) => {
    return (
      courseBookmarkingGlobals.resumeButtonText === resumeButtonText &&
      courseBookmarkingGlobals.resumeButtonAriaLabel === resumeButtonAriaLabel
    );
  });
  checkContent('Bookmarking - check _location', async (content) => {
    return bookmarkingCfg._location === location;
  });
  checkContent('Bookmarking - check _autoRestore', async (content) => {
    return bookmarkingCfg._autoRestore === true;
  });

  updatePlugin('Bookmarking - update to v4.3.0', { name: 'adapt-contrib-bookmarking', version: '4.3.0', framework: '>=5.31.11' });
});
