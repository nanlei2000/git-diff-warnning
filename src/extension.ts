import * as vscode from "vscode";
import { QuickPickItem } from "vscode";
import { getBranches, getCount } from "./core";

const PRIORITIZED_BRANCHES = ["main", "master", "staging"];

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
    updateStatus(selectedBranch);
  });
  vscode.workspace.onDidChangeConfiguration(() => {
    updateStatus(selectedBranch);
  });
  updateStatus(selectedBranch);

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

    if (branches == null || branches.length === 0) {
      vscode.window.showErrorMessage("Can't get branches");
      return;
    }

    const formattedBranches: QuickPickItem[] = [];

    let currentBranch: string | undefined = undefined;
    // current branch
    const _currentBranch = branches.find((branch) => branch.startsWith("* "));
    if (_currentBranch) {
      currentBranch = _currentBranch.replace("* ", "");
    }

    const sortedBranches = branches.sort((a) => {
      if (a === "") {
        return -1;
      }

      if (PRIORITIZED_BRANCHES.includes(a)) {
        return -1;
      }

      return 0;
    });

    // format branches to quickPickItems
    sortedBranches.forEach((branch) => {
      // remove current branch
      if (branch.startsWith("*")) {
        return;
      }

      if (branch === "") {
        formattedBranches.push({
          label: "Compare within commits",
          description: "Number of added and deleted lines.",
          detail: "Show changes between commits",
        });
        return;
      }

      // add branch to quickPickItems
      formattedBranches.push({
        label: branch,
        description: branch,
        detail: currentBranch
          ? `Select ${branch} to compare with "${currentBranch}"`
          : `Select ${branch} to compare`,
      });
    });

    const _selectedBranch = await vscode.window.showQuickPick(
      formattedBranches,
      {
        matchOnDetail: true,
      }
    );

    if (_selectedBranch == null) return;

    selectedBranch = _selectedBranch.label;
    await updateStatus(_selectedBranch.label);

    // vs code show message
    vscode.window.showInformationMessage(
      `Now comparing diff with branch: "${selectedBranch}"`
    );
  });

  // click status bar to show quick pick
  status.command = "git-diff.branchSearch";

  async function updateStatus(selectedBranch?: string): Promise<void> {
    const maxCountEachType = getMaxCountFromConfig();
    const res = await getCount({ rootPath, selectedBranch });
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

      status.tooltip = selectedBranch
        ? res.stdout + `Comparing with: ${selectedBranch}`
        : res.stdout + `Comparing with: commits`;

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
