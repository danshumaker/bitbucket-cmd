/*global path*/
define([
  'path'
], function (path) {

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

  return {
    cfgPath: getCfgPath(),
	cfgFilePath: path.join(getCfgPath(), 'config.json'),
	cacheFilePath: path.join(getCfgPath(), 'cache.json'),
    auth: {},
    options: {}
  };

  function getCfgPath () {
    return path.join(process.cwd(), '/.bitbucket/');
  }
});
