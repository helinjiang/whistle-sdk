const WhistleSDK = require('../').default;

(async () => {
  const whistleSDK = new WhistleSDK({
    port: 9422,
    seqId: 'test',
  });

  await whistleSDK.start();
  // await whistleSDK.stop(9428);
  // await whistleSDK.stopAll();
})();
