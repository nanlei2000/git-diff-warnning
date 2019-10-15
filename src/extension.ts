import * as vscode from 'vscode';
import * as path from 'path';
import { getCount } from './core';
export function activate() {
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    9999
  );
  const rootPath = vscode.workspace.workspaceFolders![0].uri.path;
  const pattern = new vscode.RelativePattern(rootPath, '**/*');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  watcher.onDidChange(() => {
    console.log(1);
    updateStatus();
  });

  async function updateStatus() {
    const res = await getCount(rootPath);
    if (res) {
      status.text = `${res[0]} \$(diff-added) ${res[1]} \$(diff-removed)`;
    }
    status.show();
  }
  updateStatus();
}

export function deactivate() {}
