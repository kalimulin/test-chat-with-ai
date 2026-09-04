# Issue tracker: local markdown

Issues for this repo are tracked as plain markdown files in the repo — no external service, no CLI.

## Location

- Issues live under `.scratch/<feature>/`, one markdown file per issue.
- `<feature>` is a short kebab-case folder name for the feature or theme the issue belongs to (e.g. `.scratch/deep-search/`).
- Name issue files `NNN-short-slug.md`, numbered sequentially within the folder (e.g. `001-score-results-with-llm.md`).

## Issue file format

```markdown
# <Issue title>

Status: open | in-progress | done

<Description: the problem, the desired outcome, and any constraints
or pointers to relevant code.>
```

## Conventions

- **Creating**: add a new numbered markdown file in the appropriate `.scratch/<feature>/` folder (create the folder if it doesn't exist).
- **Updating**: edit the file in place; append findings or decisions to the body as work progresses.
- **Closing**: set `Status: done`. Don't delete closed issues — they are the repo's work history.
- **No CLI**: nothing to install or authenticate; skills read and write these files directly.

## How skills use this

- `to-tickets` writes tickets into `.scratch/<feature>/`.
- `to-spec` and planning skills read issues from here as their input.
- If a future remote is added and the tracker moves to GitHub/GitLab, update this file and the pointer in `AGENTS.md`.
