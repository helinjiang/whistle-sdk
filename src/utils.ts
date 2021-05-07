import { util as cmdHubUtil } from "cmd-hub";

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
