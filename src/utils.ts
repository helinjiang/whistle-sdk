import path from "path";
import fse from 'fs-extra';
import { util as cmdHubUtil } from "cmd-hub";

export interface IGenerateConfigFileOpts {
  saveDir?: string;
  fileName?: string;
  getWhistleRules: () => { name: string; rules: string };
  handleRuleContent?: (ruleContent: string, saveDir: string) => string;
}

interface IGenerateConfigFileResult {
  fullPath: string;
  content: string;
  saveDir: string;
  fileName: string;
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

/**
 * 产生 whistle 规则配置文件
 *
 * @param opts
 */
export async function generateConfigFile(
  opts: IGenerateConfigFileOpts,
): Promise<IGenerateConfigFileResult> {
  const whistleRules = opts.getWhistleRules();

  // 校验合法性
  if (!whistleRules || !whistleRules.name || !whistleRules.rules) {
    console.error('无法自动生成 whistle 代理规则！', JSON.stringify(opts));
    return Promise.reject('无法自动生成 whistle 代理规则！');
  }

  // 配置文件生成的目录
  const saveDir = opts?.saveDir || path.join(__dirname, '../tmp');

  // 配置文件的文件名字
  const fileName = opts?.fileName || '.whistle.js';

  // 代理规则的内容
  let ruleContent = whistleRules.rules;

  // 设置开启 Capture TUNNEL CONNECTs，否则 https 情况下可能会有问题
  const shouldEnableCapture = '* enable://capture';
  ruleContent = `${shouldEnableCapture}\n\n${ruleContent}`;

  // 自定义修改规则内容
  if (typeof opts.handleRuleContent === 'function') {
    ruleContent = opts.handleRuleContent(ruleContent, saveDir);
  }

  // 更新
  whistleRules.rules = ruleContent;

  // 配置文件内容
  const content = `module.exports = ${JSON.stringify(whistleRules, null, 2)};`;

  // whistle 配置文件路径
  const fullPath = path.join(saveDir, fileName);

  // 移除旧的
  fse.removeSync(fullPath);

  // 保存文件到指定目录下
  fse.outputFileSync(fullPath, content);

  return {
    fullPath,
    content,
    saveDir,
    fileName,
  };
}
