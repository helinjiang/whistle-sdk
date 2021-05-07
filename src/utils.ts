import path from "path";
import fse from 'fs-extra';
import { util as cmdHubUtil } from "cmd-hub";

interface IWhistleRuleConfigResult {
  filePath: string;
  content: string
}

/**
 * 检查 whistle 是否已经启动
 * @param port
 */
export async function checkIfWhistleStarted(port?: number): Promise<boolean> {
  if (!port) {
    return Promise.reject(`Could not check because port is unknown!`);
  }

  // 自检一下 whistle 是否真正启动了
  const checkURL = `http://127.0.0.1:${port}/cgi-bin/server-info`;

  return await cmdHubUtil.base.checkAndWaitURLAvailable(checkURL, { debug: process.env.DEBUG === '1' })
    .catch((err) => {
      const errMsg = err?.message || err;

      return Promise.reject(`Whistle is not started! checkURL=${checkURL}, err=${errMsg}`);
    });
}

export interface IGenerateConfigFileOpts {
  outputPath: string;
  ruleConfigFileName: string;
  getWhistleRules: () => { name: string; rules: string };
  handleRuleContent?: (ruleContent: string, outputPath: string) => string;
}

/**
 * 产生 whistle 规则配置文件
 *
 * @param opts
 */
export async function generateConfigFile(
  opts: IGenerateConfigFileOpts,
): Promise<IWhistleRuleConfigResult> {
  const whistleRules = opts.getWhistleRules();

  // 校验合法性
  if (!whistleRules || !whistleRules.name || !whistleRules.rules) {
    console.error('无法自动生成 whistle 代理规则！', JSON.stringify(opts));
    return Promise.reject('无法自动生成 whistle 代理规则！');
  }

  // 额外处理下代理规则
  let ruleContent = whistleRules.rules;

  // 设置开启 Capture TUNNEL CONNECTs，否则 https 情况下可能会有问题
  const shouldEnableCapture = '* enable://capture';
  ruleContent = `${shouldEnableCapture}\n\n${ruleContent}`;

  // 在 devnet 机器中，需要额外配置一个 pac 文件，否则无法直接访问外网
  // 自定义修改规则内容
  if (typeof opts.handleRuleContent === 'function') {
    ruleContent = opts.handleRuleContent(ruleContent, opts.outputPath);
  }

  // 更新
  whistleRules.rules = ruleContent;

  // 文件内容
  const ruleConfigFileContent = `module.exports = ${JSON.stringify(whistleRules, null, 2)};`;

  // whistle 配置文件路径，自动生成，一般情况下无需修改
  const ruleConfigFile = path.join(opts.outputPath, opts.ruleConfigFileName);

  // 保存文件
  fse.outputFileSync(ruleConfigFile, ruleConfigFileContent);

  return {
    filePath: ruleConfigFile,
    content: ruleConfigFileContent
  };
}
