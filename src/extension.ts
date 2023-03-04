import * as vscode from "vscode";
import { getBranches, getCount } from "./core";
export function activate() {
  let selectedBranch: string | undefined = undefined;

  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    9999
  );
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    return;
  }
  const rootPath = folders[0].uri.path;
  const pattern = new vscode.RelativePattern(rootPath, "**/*");
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  let isNeedWarn: boolean = false;

  watcher.onDidChange(() => {
    updateStatus();
  });
  vscode.workspace.onDidChangeConfiguration(() => {
    updateStatus();
  });
  updateStatus();

  const getCountText = (count: number, maxCount: number): string => {
    if (maxCount < count) {
      return count + "!";
    } else {
      return count + "";
    }
  };

  type MaxCountsConfig = [number, number, number, number];
  function getMaxCountFromConfig(): MaxCountsConfig {
    let config = vscode.workspace.getConfiguration("gitDiffWarning");
    const maxCountEachType = config
      .get<(number | null)[]>("maxCountEachTypeAndSum")!
      .map((v) => (v !== null ? +v : Infinity));
    return maxCountEachType as MaxCountsConfig;
  }

  // register command to select branch
  vscode.commands.registerCommand("git-diff.branchSearch", async function () {
    const branches = await getBranches(rootPath);

    // format branches to quickPickItems
    const quickPickItems = branches
      ? branches.map((branch) => {
          return {
            label: branch,
            description: "branch",
            detail: branch,
          };
        })
      : [];

    const _selectedBranch = await vscode.window.showQuickPick(quickPickItems, {
      matchOnDetail: true,
    });

    if (_selectedBranch == null) return;

    selectedBranch = _selectedBranch.label;
  });

  async function updateStatus(): Promise<void> {
    const maxCountEachType = getMaxCountFromConfig();
    const res = await getCount(rootPath);
    if (res) {
      status.text = (
        [
          ["$(file)", res.modifiedFileCount],
          ["$(diff-added)", res.insertCount],
          ["$(diff-removed)", res.deleteCount],
        ] as const
      )
        .map((v, i) => `${v[0]} ${getCountText(v[1], maxCountEachType[i])}`)
        .join(" ");
      status.tooltip = res.stdout;
      if (
        [
          res.modifiedFileCount,
          res.insertCount,
          res.deleteCount,
          res.insertCount + res.deleteCount,
        ].some((v, index) => v > maxCountEachType[index])
      ) {
        if (isNeedWarn === false) {
          vscode.window.showWarningMessage(
            "WARNING: git diff too big, consider to commit"
          );
        }
        isNeedWarn = true;
        status.color = "#f00";
      } else {
        isNeedWarn = false;
        status.color = "unset";
      }
      status.show();
    } else {
      status.hide();
      console.warn(`Can't get diff result`);
    }
  }
}

export function deactivate() {}
