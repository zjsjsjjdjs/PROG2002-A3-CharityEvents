# User1 local technical materials — preserved 18 October 2026

This directory uploads existing local technical and review materials as supplied.
It does not replace current application code or the repository's maintained docs.
All 202 supplied files are copied byte-for-byte; their original text, dates and
version labels are preserved. Older statements such as pending deployment, old
branch names or unmerged PRs describe their source snapshot, not today's status.

## Contents

- `review-documents/`: local delivery-review and checklist files, plus the two
  local acceptance/handoff documents. Contents were not rewritten.
- `historical-review-bundle/`: the previously assembled review materials, scripts,
  screenshots, raw logs and historical deploy/source archives, preserving their
  folder structure. These are historical snapshots, not current install advice.
- `technical-packages/`: the five technical ZIPs and their original manifests
  from `E:/workplace/A3-1`, plus the supplied deployment screenshots/record.
  The packaged source is `df0d5e6`; later main documentation/tooling changes are
  not retroactively inserted. Original archive metadata remains unchanged.
- `evidence/`: retained public/admin visual checks, test outputs, Node 18 checks,
  reference documentation and the most recent packaging build log.
- `local-tools/`: retained local preparation/verification utilities. They contain
  machine-specific paths and describe the original local workflow; they are not
  invoked by application startup and have not been rerun for this upload.

## Preservation and scope

The student's original files are unchanged. Missing material was also copied to
`E:/workplace/A3-1/04-GitHub同步材料-20261018`; files already in A3-1 were not overwritten.
Personal video, peer evaluation, the combined personal submission ZIP, report
submission drafts, course handouts, the database backup, real environment files,
dependencies and caches are excluded. Those are not missing application code.

`file-manifest.json` lists byte sizes and SHA256 values of every supplied file.
The directory's .gitattributes disables text conversion so Git preserves bytes.
Source/ZIP contents were checked for private environment values and credential
signatures; a literal scanner pattern inside the scanner itself is not a key.
No application tests, website deployment, database changes or final school
submission were performed as part of this archival upload.
