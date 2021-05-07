const WhistleSDK = require('../').default;

(async () => {
  const whistleSDK = new WhistleSDK();

  // await whistleSDK.start();
  // await whistleSDK.stop(9428);
  await whistleSDK.stopAll();
})();
