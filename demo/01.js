const WhistleSDK = require('../').default;

(async () => {
  const whistleSDK = new WhistleSDK();

  await whistleSDK.start();
})();
