const path = require('path');
const WhistleSDK = require('../').default;

(async () => {
  const whistleSDK = new WhistleSDK({
    port: 9422,
    seqId: 'test',
  });

  await whistleSDK.start();

  await whistleSDK.setRules({
    forceOverride: true,
    saveDir: path.join(__dirname, 'tmp'),
    fileName: 'test.whistle.js',
    getWhistleRules: () => {
      return {
        name: 'mmm2',
        rules: [
          'now.qq.com 1.2.3.4',
        ].join('\n'),
      };
    },
    handleRuleContent: (ruleContent, saveDir) => {
      return ruleContent + '\n# ' + saveDir;
    },
  });
  // await whistleSDK.stop(9428);
  // await whistleSDK.stopAll();
})();
