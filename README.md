# README

## Features

- Display `git diff` result in editor status bar realtime
- Warn if git diff line count is too big

## setting
```json
{
// Max counts for 'changed files','insertions','deletions',and 'insertions deletions sum'.Set `null` to ignore specific one.
  "gitDiffWarning.maxCountEachTypeAndSum": [
    null,
    200,
    200,
    200
  ]
}
```
![screenshot](media/desc.png)
