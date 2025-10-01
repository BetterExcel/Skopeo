#!/usr/bin/env bash
set -euo pipefail

# Options:
# - Set SKOPEO_SETUP_NO_PY=1 to skip Python venv
# - Set SKOPEO_SETUP_FORCE_BREW_PY=1 to force Homebrew Python
# - Set SKOPEO_VERBOSE=1 for more logs

log() { echo "[setup] $*"; }
vlog() { [[ "${SKOPEO_VERBOSE:-0}" == "1" ]] && echo "[setup] $*"; }

is_macos() { [[ "$(uname -s)" == "Darwin" ]]; }

ensure_node() {
  # Fast-path: already present
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    vlog "Node present: $(node -v), npm: $(npm -v)"
    return 0
  fi

  if is_macos; then
    log "Ensuring Node/npm via macOS bootstrap (Homebrew if admin, else nvm)…"
    bash "$(dirname "$0")/macos-bootstrap.sh" || true
    # Reload shell env in case bootstrap wrote to ~/.zprofile
    if [[ -f "$HOME/.zprofile" ]]; then
      # shellcheck disable=SC1090
      source "$HOME/.zprofile" || true
    fi
    # Also try zshrc (nvm installer appends here by default)
    # Do NOT source ~/.zshrc here; it's zsh-specific and may error under bash
    # Try sourcing nvm directly if present
    if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
      # shellcheck disable=SC1090
      source "$HOME/.nvm/nvm.sh" || true
      nvm use --lts >/dev/null 2>&1 || true
    fi
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
      vlog "Node ready: $(node -v), npm: $(npm -v)"
      return 0
    fi
    log "Node is still not available. Open a new terminal or run: source ~/.zprofile, then rerun setup."
    exit 1
  fi

  log "Please install Node.js (npm included) for your platform."
  exit 1
}

# Detect a usable Python for venv creation that won't trigger the GUI CLT prompt
pick_python() {
  local cand ver path
  # If forced, prefer brew python
  if [[ "${SKOPEO_SETUP_FORCE_BREW_PY:-0}" == "1" ]] && command -v brew >/dev/null 2>&1; then
    if brew list --versions python@3.12 >/dev/null 2>&1 || brew install -q python@3.12; then
      echo "$(brew --prefix)/opt/python@3.12/bin/python3.12"
      return 0
    fi
  fi
  # Candidates: Homebrew first (if installed), then common python3 names, but avoid /usr/bin/python3 if CLT missing
  for cand in python3.12 python3.11 python3.10 python3; do
    if command -v "$cand" >/dev/null 2>&1; then
      path="$(command -v "$cand")"
      if is_macos && [[ "$path" == "/usr/bin/python3" ]]; then
        if ! xcode-select -p >/dev/null 2>&1; then
          vlog "Skipping /usr/bin/python3 because Command Line Tools are not installed."
          continue
        fi
      fi
      if "$path" -c 'import sys, venv, ensurepip; print(sys.version)' >/dev/null 2>&1; then
        echo "$path"
        return 0
      fi
    fi
  done
  # Try installing Homebrew Python on macOS if none found
  if is_macos && command -v brew >/dev/null 2>&1; then
    log "Installing Homebrew Python 3.12 (to avoid CLT GUI prompt)..."
    brew install python@3.12
    echo "$(brew --prefix)/opt/python@3.12/bin/python3.12"
    return 0
  fi
  return 1
}

setup_python_venv() {
  if [[ "${SKOPEO_SETUP_NO_PY:-0}" == "1" ]]; then
    log "Skipping Python venv (SKOPEO_SETUP_NO_PY=1)."
    return 0
  fi

  local py
  if ! py="$(pick_python)"; then
    log "No suitable Python3 found with venv module."
    if is_macos; then
      log "Tip: Install Homebrew Python: brew install python@3.12, then rerun."
    fi
    return 1
  fi
  vlog "Using Python at: $py"

  # Create venv if requirements exist in repo root
  if [[ -f "requirements.txt" || -f "requirements-dev.txt" ]]; then
    log "Creating Python venv with $py ..."
    "$py" -m venv .venv
    # shellcheck disable=SC1091
    source .venv/bin/activate
    log "Installing Python requirements..."
    if [[ -f "requirements.txt" ]]; then pip install -r requirements.txt; fi
    if [[ -f "requirements-dev.txt" ]]; then pip install -r requirements-dev.txt; fi
  else
    vlog "No Python requirements file found. Skipping venv."
  fi
}

install_js_deps() {
  if [[ -d "apps/ai-calc-assistant" ]]; then
    pushd apps/ai-calc-assistant >/dev/null
    if [[ -f package.json ]]; then
      log "Installing JS deps in apps/ai-calc-assistant ..."
      npm install
      # Install Playwright browsers if dep present
      # Detect Playwright without requiring jq
      if grep -q '"@playwright/test"' package.json; then
        npx playwright install chromium
      fi
    fi
    popd >/dev/null
  fi
}

print_e2e_hint() {
  cat <<'EOF'
[setup] E2E quick start:
- Ensure your Nextcloud + Collabora instance is running and the Calc sidebar loads.
- From apps/ai-calc-assistant:
    npm run test           # unit tests
    E2E_BASE_URL="https://your-nextcloud/calc-doc-url" npm run test:e2e
EOF
}

main() {
  ensure_node
  setup_python_venv || log "Continuing without Python venv."
  install_js_deps
  print_e2e_hint
  log "Setup complete."
}

main "$@"
