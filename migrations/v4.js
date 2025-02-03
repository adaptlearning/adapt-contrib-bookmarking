import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

const getCourse = content => {
  const [course] = content.filter(({ _type }) => _type === 'course');
  return course;
};

const getGlobals = content => {
  return getCourse(content)?._globals?._extensions?._bookmarking;
};

describe('Bookmarking - v4.2.1 to v4.3.0', async () => {

  // https://github.com/adaptlearning/adapt-contrib-bookmarking/compare/v4.2.1..v4.3.0

  let course, courseBookmarkingGlobals;
  const resumeButtonText = 'Resume';
  const resumeButtonAriaLabel = 'Navigate to your furthest point of progress.';
  const location = 'previous';

  whereFromPlugin('Bookmarking - from v4.2.1', { name: 'adapt-contrib-bookmarking', version: '<4.3.0' });

  whereContent('Bookmarking - where config is present', async (content) => {
    course = getCourse(content);
    return course._bookmarking;
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
    course._bookmarking._location = location;
    return true;
  });
  mutateContent('Bookmarking - add _autoRestore', async (content) => {
    course._bookmarking._autoRestore = true;
    return true;
  });

  checkContent('Bookmarking - check new globals', async (content) => {
    return (
      courseBookmarkingGlobals.resumeButtonText === resumeButtonText &&
      courseBookmarkingGlobals.resumeButtonAriaLabel === resumeButtonAriaLabel
    );
  });
  checkContent('Bookmarking - check _location', async (content) => {
    return course._bookmarking._location === location;
  });
  checkContent('Bookmarking - check _autoRestore', async (content) => {
    return course._bookmarking._autoRestore === true;
  });

  updatePlugin('Bookmarking - update to v4.3.0', { name: 'adapt-contrib-bookmarking', version: '4.3.0', framework: '>=5.31.11' });
});
