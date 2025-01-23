import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

describe('Bookmarking - v3.0.0 to v4.3.2', async () => {

  let course, bookmarkingCfg, courseBookmarkingGlobals;
  const resumeButtonText = 'Resume';
  const resumeButtonAriaLabel = 'Navigate to your furthest point of progress.';
  const location = 'previous';

  whereFromPlugin('Bookmarking - from v3.0.0', { name: 'adapt-contrib-bookmarking', version: '<4.3.2' });
  whereContent('Bookmarking - where config is present', async (content) => {
    [course] = content.filter(({ _type }) => _type === 'course');
    bookmarkingCfg = course._bookmarking;
    if (bookmarkingCfg) return true;
  });

  mutateContent('Bookmarking - add globals if missing', async (content) => {
    if (course?._globals?._extensions?._bookmarking) return true;
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
  });
  mutateContent('Bookmarking - add _autoRestore', async (content) => {
    bookmarkingCfg._autoRestore = true;
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

  updatePlugin('Bookmarking - update to v4.3.2', { name: 'adapt-contrib-bookmarking', version: '4.3.2', framework: '>=5.31.11' });
});
