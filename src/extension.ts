import * as vscode from 'vscode';
import { getCount } from './core';
export function activate() {
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    9999
  );
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    return;
  }
  const rootPath = folders[0].uri.path;
  const pattern = new vscode.RelativePattern(rootPath, '**/*');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  watcher.onDidChange(() => {
    updateStatus();
  });
  vscode.workspace.onDidChangeConfiguration(() => {
    updateStatus();
  });
  updateStatus();
  const getCountText = (count: number, maxCount: number): string => {
    if (maxCount < count) {
      return count + '!';
    } else {
      return count + '';
    }
  };
  function getMaxCountFromConfig(): number[] {
    let config = vscode.workspace.getConfiguration('diffWarning');
    const maxCountEachType = config
      .get<(number | null)[]>('maxCountEachType')!
      .map(v => (v !== null ? +v : Infinity));
    return maxCountEachType;
  }

  async function updateStatus() {
    const maxCountEachType = getMaxCountFromConfig();
    const res = await getCount(rootPath);
    if (res) {
      status.text = `$(file) ${getCountText(
        res.modifiedFileCount,
        maxCountEachType[0]
      )} $(diff-added) ${getCountText(
        res.insertCount,
        maxCountEachType[1]
      )} $(diff-removed) ${getCountText(res.deleteCount, maxCountEachType[2])}`;
      status.tooltip = res.stdout;
      if (
        [res.modifiedFileCount, res.insertCount, res.deleteCount].some(
          (v, index) => v > maxCountEachType[index]
        )
      ) {
        status.color = '#f00';
      } else {
        status.color = '#fff';
      }
      status.show();
    } else {
      status.hide();
      console.warn(`Can't get diff result`);
    }
  }
}

export function deactivate() {}
