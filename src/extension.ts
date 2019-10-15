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
  updateStatus();
  async function updateStatus() {
    const res = await getCount(rootPath);
    if (res) {
      status.text = `${res[0]} $(diff-added) ${res[1]} $(diff-removed)`;
      status.show();
    } else {
      console.warn(`得不到count!`);
    }
  }
}

export function deactivate() {}
