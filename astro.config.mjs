import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.kimupe.education',
  // Old Wix addresses that have a new name, so existing links keep working.
  redirects: {
    '/copy-of-approach': '/publications',
    '/copy-of-dissemination': '/resources',
    '/copy-of-resources': '/videos',
  },
});
