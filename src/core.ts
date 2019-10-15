import child_process = require('child_process');
import util = require('util');
const exec = util.promisify(child_process.exec);
export async function getCount(
  path: string
): Promise<[number, number] | undefined> {
  try {
    const cmd = `git diff --shortstat`;
    const res = await exec(cmd, {
      cwd: path,
    });
    const resStr = res.stdout;
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
    const counts = [insertionReg, deletionReg]
      .map(reg => {
        return extract(reg);
      })
      .filter(v => !Number.isNaN(v));
    if (counts.length !== 2) {
      return undefined;
    } else {
      return counts as [number, number];
    }
  } catch {
    return undefined;
  }
}
