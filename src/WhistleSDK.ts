import { processHandler, util as cmdHubUtil } from "cmd-hub";
import { checkIfWhistleStarted } from './utils';

interface IWhistleSDKOpts {
  seqId?: string;
  port?: number;
  useCurrentStartedWhistle?: boolean;
  forceOverride?: boolean;
}

const logger = cmdHubUtil.log.createLogger('whistle-sdk');

const PROCESS_KEY = 'auto-whistle-sdk';

export default class WhistleSDK {
  public seqId?: string;
  public port?: number;
  public useCurrentStartedWhistle?: boolean;
  public forceOverride?: boolean;

  constructor(opts?: IWhistleSDKOpts) {
    this.port = opts?.port;
    this.useCurrentStartedWhistle = opts?.useCurrentStartedWhistle;
    this.forceOverride = opts?.forceOverride;

    this.seqId = this.getSeqId(opts?.seqId);
  }

  /**
   * 启动 whistle
   */
  public async start(): Promise<void> {
    logger.info('Ready to start whistle ...');

    // 寻找并设置即将要占用的端口
    await this.findAndSetPort();

    // 启动参数中，用于定义是否自定义存储目录，以便独立空间互不干扰
    let whistleCustomNamespaceArgs = '';
    if (!this.useCurrentStartedWhistle) {
      whistleCustomNamespaceArgs = `-S ${this.getStorageDir()}`;
    }

    // whistle: 启动
    const startCmd = `w2 start ${whistleCustomNamespaceArgs} -p ${this.port}`;
    logger.info(startCmd);

    await cmdHubUtil.runCmd.runByExec(
      startCmd,
      {},
      data => data && data.indexOf(`127.0.0.1:${this.port}`) > -1,
    );

    // 自检一下 whistle 是否真正启动了
    await checkIfWhistleStarted(this.port);

    logger.info('Start whistle success!');
  }

  /**
   * 设置 whistle rules
   */
  public async setRules(): Promise<void> {
    logger.info('Ready to set whistle rules ...');

    // // 获取 rules
    // // const whistleRules = opts.getWhistleRules();
    // const whistleRules = '';
    //
    // // 校验合法性
    // if (!whistleRules || !whistleRules.name || !whistleRules.rules) {
    //   logger.error('无法自动生成 whistle 代理规则！', JSON.stringify(opts));
    //   return Promise.reject('无法自动生成 whistle 代理规则！');
    // }

    logger.info('Set whistle rules success!');
  }

  /**
   * 停止单个 whistle 进程
   */
  public async stop(port?: number): Promise<void> {
    logger.info('Ready to stop whistle ...');

    const targetPort = port || this.port;
    if (!targetPort) {
      logger.info('Skip to stop because whistle port in unknown!');
      return;
    }

    await cmdHubUtil.port.killPort(targetPort);

    logger.info(`Stop whistle(http://127.0.0.1:${targetPort}) success!`);
  }

  /**
   * 停止所有的 whistle 进程
   */
  public async stopAll(): Promise<void> {
    logger.info('Ready to stop all whistle ...');

    await processHandler.kill(PROCESS_KEY);

    logger.info('Stop all whistle success!');
  }

  private async findAndSetPort() {
    // 启动 whistle 所需要的端口号，其中来自环境变量的优先级最高，因为在自动化测试时可以动态设置
    this.port = parseInt(`${process.env.WHISTLE_PORT || this?.port || 0}`, 10);

    if (!this.port) {
      // 如果没有指定端口，则自动查找一个未被占用的端口
      this.port = await cmdHubUtil.port.findAvailablePort(9421);
    }

    logger.info(`Whistle port is ${this.port}`);

    // 在使用之前，尝试杀掉该端口
    await cmdHubUtil.port.killPort(this.port);
  }

  private getStorageDir(): string {
    // 需要追加一个 seqId，生成唯一的命名空间，以便独立
    return `${encodeURIComponent(PROCESS_KEY)}-${this.seqId}`;
  }

  private getSeqId(seqId?: string): string {
    // 来自环境变量的优先级最高，因为在自动化测试时可以动态设置
    if (process.env.WHISTLE_SEQ_ID) {
      return process.env.WHISTLE_SEQ_ID;
    }

    if (seqId) {
      return seqId;
    }

    const date = new Date();

    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
      (Math.random() * 10000).toFixed(0),
    ].join('-');
  }

}
