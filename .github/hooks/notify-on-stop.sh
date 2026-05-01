#!/bin/bash

set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  exit 0
fi

osascript -e 'display notification "The Copilot agent finished working." with title "GitHub Copilot"'

exit 0