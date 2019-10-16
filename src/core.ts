import child_process = require('child_process');
import util = require('util');
const exec = util.promisify(child_process.exec);
type ParsedRes = {
  stdout: string;
  modifiedFileCount: number;
  insertCount: number;
  deleteCount: number;
};

export async function getCount(path: string): Promise<ParsedRes | undefined> {
  try {
    const cmd = `git diff --shortstat`;
    const res = await exec(cmd, {
      cwd: path,
    });
    const resStr = res.stdout;
    const modifiedFileReg = /(\d+) file/;
    const insertionReg = /(\d+) insertion/;
    const deletionReg = /(\d+) deletion/;

    const extract = (reg: RegExp): number | typeof NaN => {
      const list = reg.exec(resStr);
      if (!list) {
        return NaN;
      }
      const count: string = list[1].trim();
      return Number.isNaN(+count) ? NaN : +count;
    };
    const counts = [modifiedFileReg, insertionReg, deletionReg]
      .map(reg => {
        return extract(reg);
      })
      .filter(v => !Number.isNaN(v));
    if (counts.length !== 3) {
      return undefined;
    } else {
      const parsedRes: ParsedRes = {
        stdout: resStr,
        modifiedFileCount: counts[0],
        insertCount: counts[1],
        deleteCount: counts[2],
      };
      return parsedRes;
    }
  } catch {
    return undefined;
  }
}
