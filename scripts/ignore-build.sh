#!/bin/bash
# Cancel build if only assets changed
# Returns 0 to cancel, 1 to build

# Check if we have the commit refs
if [ -z "$CACHED_COMMIT_REF" ] || [ -z "$COMMIT_REF" ]; then
  echo "Missing commit refs, proceeding with build"
  exit 1
fi

echo "Checking for changes between $CACHED_COMMIT_REF and $COMMIT_REF"

# Check if there are changes OUTSIDE of src/assets
# --quiet returns 0 if NO changes (matches exclusion), 1 if changes exist
git diff --quiet "$CACHED_COMMIT_REF" "$COMMIT_REF" -- . ':!src/assets'

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "Only assets changed. Cancelling build."
  exit 0
else
  echo "Relevant files changed. Proceeding with build."
  exit 1
fi
