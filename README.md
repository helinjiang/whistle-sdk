# whistle-sdk

为 whistle 封装的 npm 库，用于在模块中调用。

## 安装

```
$ npm install whistle-sdk --save
```

示例：

```js
const WhistleSDK = require('../').default;

(async () => {
  const whistleSDK = new WhistleSDK();

  // 启动
  await whistleSDK.start();
  
  // 设置代理规则
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
  
  // 停止
  setTimeout(async () => {
    await whistleSDK.stop();
  }, 6000);
})();
```

## TODO

自定义存储目录文件在 `~/.WhistleAppData/.whistle/custom_dirs` ，应该要提供一个方法用于清理或者备份它。

