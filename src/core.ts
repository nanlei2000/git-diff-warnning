import child_process = require("child_process");
import util = require("util");
const exec = util.promisify(child_process.exec);
type ParsedRes = {
  stdout: string;
  modifiedFileCount: number;
  insertCount: number;
  deleteCount: number;
};

export async function getCount(
  path: string,
  baseReference: string
): Promise<ParsedRes | undefined> {
  try {
    const cmd = `git diff --shortstat ${baseReference}`;
    const { stdout } = await exec(cmd, {
      cwd: path,
    });
    // https://github.com/git/git/blob/108b97dc372828f0e72e56bbb40cae8e1e83ece6/diff.c#L2588
    // 1 file changed, 1 deletion(-)
    if (!stdout) {
      return undefined;
    }
    const modifiedFileReg = /(\d+) file/;
    const insertionReg = /(\d+) insertion/;
    const deletionReg = /(\d+) deletion/;

    const extract = (reg: RegExp): number => {
      const list = reg.exec(stdout);
      if (!list) {
        return 0;
      }
      return +list[1];
    };

    const counts = [modifiedFileReg, insertionReg, deletionReg].map(extract);
    const parsedRes: ParsedRes = {
      stdout: stdout,
      modifiedFileCount: counts[0],
      insertCount: counts[1],
      deleteCount: counts[2],
    };
    return parsedRes;
  } catch {
    return undefined;
  }
}
