const path = require('path');
const { generateConfigFile } = require('../lib/utils');

(async () => {
  await generateConfigFile({
    // saveDir: path.join(__dirname, 'tmp'),
    // fileName: 'test.whistle.js',
    getWhistleRules: () => {
      return {
        name: 'mmm',
        rules: [
          'now.qq.com 1.2.3.4',
        ].join('\n'),
      };
    },
    // handleRuleContent: (ruleContent, outputPath) => {
    //   return ruleContent + '\n# ' + outputPath;
    // },
  });
})();
