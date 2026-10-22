# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI; it infers the repo from
`git remote -v` when run inside the clone.

- **Read an issue**: `gh issue view <number> --comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`, with `--label` and `--state` filters as needed.
- **Read a PR**: `gh pr view <number> --comments`, and `gh pr diff <number>` for the diff.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve
with `gh pr view 42` and fall back to `gh issue view 42`.
