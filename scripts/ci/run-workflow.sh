#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: run-workflow.sh <workflow_file> [-r <ref>] [-d] [-f key=value ...]

Options:
  -r <ref>           Git ref to run on (branch name), default: current default branch (main)
  -d                 Download artifacts after completion into artifacts/<workflow>-<run_id>
  -f key=value       Input key=value pairs for workflow_dispatch (repeatable)

Examples:
  scripts/ci/run-workflow.sh .github/workflows/fast-feedback.yml -r main
  scripts/ci/run-workflow.sh .github/workflows/bdd-tests.yml -r main -f test_suite=smoke
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

WORKFLOW_FILE=""
REF="main"
DOWNLOAD=false
INPUTS=()

WORKFLOW_FILE="$1"; shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--ref)
      REF="$2"; shift 2 ;;
    -d|--download)
      DOWNLOAD=true; shift ;;
    -f|--field)
      INPUTS+=("$2"); shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

# Check gh availability
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) is not installed. Install on macOS: brew install gh" >&2
  exit 1
fi

# Ensure authenticated
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh is not authenticated. Set GH_TOKEN and run: gh auth login --with-token <<<\"$GH_TOKEN\"" >&2
  exit 1
fi

# Build -f args
FIELDS=( )
for kv in "${INPUTS[@]}"; do
  FIELDS+=( -f "$kv" )
done

# Trigger workflow
echo "🚀 Triggering workflow: $WORKFLOW_FILE on ref: $REF"
if [[ ${#FIELDS[@]} -gt 0 ]]; then
  gh workflow run "$WORKFLOW_FILE" -r "$REF" "${FIELDS[@]}"
else
  gh workflow run "$WORKFLOW_FILE" -r "$REF"
fi

# Determine run ID (the latest for this workflow and ref)
# Poll a few times in case of delayed creation
RUN_ID=""
for i in {1..10}; do
  RUN_ID=$(gh run list --workflow "$WORKFLOW_FILE" --json databaseId,headBranch,status -L 1 \
    --jq ".[0] | select(.headBranch == \"$REF\") | .databaseId") || true
  if [[ -n "$RUN_ID" ]]; then break; fi
  sleep 2
done

if [[ -z "$RUN_ID" ]]; then
  echo "❌ Could not determine run ID. Check 'gh run list' manually." >&2
  exit 1
fi

echo "⏳ Watching run: $RUN_ID"
# Watch until completion and exit with status
if ! gh run watch "$RUN_ID" --exit-status; then
  echo "❌ Workflow failed"
  exit 1
fi

echo "✅ Workflow succeeded: $RUN_ID"

if [[ "$DOWNLOAD" == true ]]; then
  OUTDIR="artifacts/$(basename "$WORKFLOW_FILE" .yml)-$RUN_ID"
  mkdir -p "$OUTDIR"
  echo "⬇️  Downloading artifacts to $OUTDIR"
  gh run download "$RUN_ID" -D "$OUTDIR" || echo "No artifacts to download"
  echo "📁 Artifacts available in $OUTDIR"
fi
