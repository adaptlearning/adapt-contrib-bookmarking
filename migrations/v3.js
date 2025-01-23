import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

describe('Bookmarking - v2.0.0 to v2.1.1', async () => {
  let bookmarkingCfg;
  const defaultBody = 'Bookmarking';

  whereFromPlugin('Bookmarking - from v2.0.0', { name: 'adapt-contrib-bookmarking', version: '>=2.0.0 <2.1.2' });
  whereContent('Bookmarking - where config is present', async (content) => {
    const [course] = content.filter(({ _type }) => _type === 'course');
    bookmarkingCfg = course._bookmarking
    if (bookmarkingCfg) return true;
  });

  mutateContent('Bookmarking - update default body text', async (content) => {
    if (bookmarkingCfg.body !== defaultBody) return true;
    bookmarkingCfg.body = 'Would you like to continue where you left off?';
    return true;
  });

  checkContent('Bookmarking - check body text', async (content) => {
    return bookmarkingCfg.body !== defaultBody;
  });

  updatePlugin('Bookmarking - update to v2.1.2', { name: 'adapt-contrib-bookmarking', version: '2.1.2', framework: '>=2.2.0' });
});

describe('Bookmarking - v2.1.2 to v3.0.0', async () => {
  let bookmarkingCfg;
  whereFromPlugin('Bookmarking - from v2.1.2', { name: 'adapt-contrib-bookmarking', version: '<3.0.0' });
  whereContent('Bookmarking - where config is present', async (content) => {
    const [course] = content.filter(({ _type }) => _type === 'course');
    bookmarkingCfg = course._bookmarking
    if (bookmarkingCfg) return true;
  });

  mutateContent('Bookmarking - add _showPrompt', async (content) => {
    bookmarkingCfg._showPrompt = true;
  });

  checkContent('Bookmarking - check _showPrompt', async (content) => {
    return bookmarkingCfg._showPrompt === true;
  });

  updatePlugin('Bookmarking - update to v3.0.0', { name: 'adapt-contrib-bookmarking', version: '3.0.0', framework: '>=5' });
});
