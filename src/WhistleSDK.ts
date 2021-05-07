import { util as cmdHubUtil } from "cmd-hub";

interface IWhistleSDKOpts {
  seqId?: string;
  port?: number;
  useCurrentStartedWhistle?: boolean;
  forceOverride?: boolean;
}

const logger = cmdHubUtil.log.createLogger('whistle-sdk');

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
    await this.checkIfStarted();

    logger.info('Start whistle success!');
  }

  public async stop(): Promise<void> {
    console.log('whistle stop');
  }

  public async checkIfStarted(port?: number): Promise<boolean> {
    // 自检一下 whistle 是否真正启动了
    const checkURL = `http://127.0.0.1:${port || this.port}/cgi-bin/server-info`;

    return await cmdHubUtil.base.checkAndWaitURLAvailable(checkURL, { debug: true })
      .catch((err) => {
        const errMsg = err?.message || err;

        return Promise.reject(`检测 whistle 未成功启动, checkURL=${checkURL}, err=${errMsg}`);
      });
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
    return `${encodeURIComponent('whistle-sdk')}-${this.seqId}`;
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
