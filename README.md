# README

![screenshot](media/desc.png)

## Features

- Display `git diff` result in editor status bar realtime
- Warn if git diff line count is too big

## Settings

```json
{
  // Max counts for 'changed files','insertions','deletions',and 'insertions deletions sum'.Set `null` to ignore specific one.
  "gitDiffWarning.maxCountEachTypeAndSum": [null, 200, 200, 200],

  // Define which branch, commit, tag or symbolic reference must be used as base for diff comparison. One can set 'origin/main', for instance.
  "gitDiffWarning.baseReference": "HEAD"
}
```

### gitDiffWarning.baseReference

By default, the extension will compare against `HEAD` in local repository in order to count changes. That means changes are counted only since the last commit has been done in local folder.

However, one can use setting `gitDiffWarning.baseReference` to change that behaviour, for instance to "origin/main" or "origin/master", which will compare with the main branch in GitHub remote. That is particularly useful to forsee the size of the pull request that's going to be created out of this change, because sometimes we commit multiple times into a feature branch before creating a pull request for it.
