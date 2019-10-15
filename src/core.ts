import child_process = require('child_process');
import util = require('util');
const exec = util.promisify(child_process.exec);
export async function getCount(
  path: string
): Promise<[number, number] | undefined> {
  const cmd = `git diff --shortstat`;
  const res = await exec(cmd, {
    cwd: path,
  });
  const resStr = res.stdout;
  const insertionReg = /(\d+) insertions/;
  const deletionReg = /(\d+) deletion/;
  let insertCount = NaN;
  let deleteCount = NaN;
  resStr.replace(insertionReg, (_match: string, p1: string | undefined) => {
    const count: string = p1 ? p1.trim() : '';
    if (count) {
      insertCount = Number.isNaN(+count) ? NaN : +count;
    }
    return `$$`;
  });
  resStr.replace(deletionReg, (_match: string, p1: string | undefined) => {
    const count: string = p1 ? p1.trim() : '';
    if (count) {
      deleteCount = Number.isNaN(+count) ? NaN : +count;
    }
    return `$$`;
  });

  if (Number.isNaN(insertCount) || Number.isNaN(deleteCount)) {
    return undefined;
  } else {
    return [insertCount, deleteCount];
  }
}
