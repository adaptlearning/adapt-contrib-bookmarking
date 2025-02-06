import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

const getCourse = content => {
  const course = content.find(({ _type }) => _type === 'course');
  return course;
};

describe('Bookmarking - v2.1.1 to v2.1.2', async () => {

  // https://github.com/adaptlearning/adapt-contrib-bookmarking/compare/v2.1.1..v2.1.2

  let course;
  const defaultBody = 'Bookmarking';

  whereFromPlugin('Bookmarking - from v2.1.1', { name: 'adapt-contrib-bookmarking', version: '<2.1.2' });

  whereContent('Bookmarking - where config is present', async (content) => {
    course = getCourse(content);
    return course._bookmarking;
  });

  mutateContent('Bookmarking - update course attribute body', async (content) => {
    if (course._bookmarking.body !== defaultBody) return true;
    course._bookmarking.body = 'Would you like to continue where you left off?';
    return true;
  });

  checkContent('Bookmarking - check course attribute body', async (content) => {
    const isValid = course._bookmarking.body !== defaultBody;
    if (!isValid) throw new Error('Bookmarking - course attribute body');
    return true;
  });

  updatePlugin('Bookmarking - update to v2.1.2', { name: 'adapt-contrib-bookmarking', version: '2.1.2', framework: '>=2.2.0' });
});

describe('Bookmarking - v2.1.2 to v2.1.3', async () => {

  // https://github.com/adaptlearning/adapt-contrib-bookmarking/compare/v2.1.2..v2.1.3

  let course;

  whereFromPlugin('Bookmarking - from v2.1.2', { name: 'adapt-contrib-bookmarking', version: '<2.1.3' });

  whereContent('Bookmarking - where config is present', async (content) => {
    course = getCourse(content);
    return course._bookmarking;
  });

  mutateContent('Bookmarking - add course attribute _showPrompt', async (content) => {
    course._bookmarking._showPrompt = true;
    return true;
  });

  checkContent('Bookmarking - check course attribute_showPrompt', async (content) => {
    const isValid = course._bookmarking._showPrompt === true;
    if (!isValid) throw new Error('Bookmarking - course attribute _showPrompt');
    return true;
  });

  updatePlugin('Bookmarking - update to v2.1.3', { name: 'adapt-contrib-bookmarking', version: '2.1.3', framework: '>=2.2.0' });
});
