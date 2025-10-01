#!/usr/bin/env bash
set -euo pipefail

echo "[bootstrap] macOS dev environment setup (Homebrew or nvm for Node)"
is_admin_group() { id -Gn | tr ' ' '\n' | grep -qx admin; }
can_sudo() { sudo -n -v >/dev/null 2>&1; }
is_arm() { [[ "$(uname -m)" == "arm64" ]]; }

ensure_brew_shellenv() {
  if command -v brew >/dev/null 2>&1; then
    if is_arm; then
      eval "$(/opt/homebrew/bin/brew shellenv)" || true
      grep -q 'brew shellenv' "${HOME}/.zprofile" 2>/dev/null || echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "${HOME}/.zprofile"
    else
      eval "$(/usr/local/bin/brew shellenv)" || true
      grep -q 'brew shellenv' "${HOME}/.zprofile" 2>/dev/null || echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "${HOME}/.zprofile"
    fi
  fi
}

install_brew_if_possible() {
  if command -v brew >/dev/null 2>&1; then
    echo "[bootstrap] Homebrew already installed."
    ensure_brew_shellenv
    return 0
  fi
  if is_admin_group && can_sudo; then
    echo "[bootstrap] Installing Homebrew (sudo available)…"
    if NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; then
      ensure_brew_shellenv
      if command -v brew >/dev/null 2>&1; then
        return 0
      else
        echo "[bootstrap] Homebrew install did not complete successfully."
      fi
    else
      echo "[bootstrap] Homebrew installation failed."
    fi
  else
    echo "[bootstrap] Skipping Homebrew install (no sudo/admin)."
  fi
  return 1
}

install_node_with_brew() {
  echo "[bootstrap] Installing Node (npm included) via Homebrew…"
  if command -v brew >/dev/null 2>&1; then
    brew update || true
    brew install node
  else
    echo "[bootstrap] brew not available to install node."
    return 1
  fi
}

install_nvm_and_node() {
  echo "[bootstrap] Installing Node via nvm (no admin required)…"
  # Install nvm
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1090
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion" || true
  # Persist to shell
  if ! grep -q 'NVM_DIR' "${HOME}/.zprofile" 2>/dev/null; then
    {
      echo 'export NVM_DIR="$HOME/.nvm"'
      echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"'
    } >> "${HOME}/.zprofile"
  fi
  nvm install --lts
  nvm use --lts
}

main() {
  if install_brew_if_possible; then
    # Brew present; prefer brew node
    if ! command -v node >/dev/null 2>&1; then
      install_node_with_brew || true
    fi
  fi

  # Ensure Node installed; if not, use nvm (no admin required)
  if ! command -v node >/dev/null 2>&1; then
    install_nvm_and_node
  fi

  echo "[bootstrap] Done. Open a new terminal or run: source ~/.zprofile"
  echo "[bootstrap] node: $(command -v node || echo 'not found'), npm: $(command -v npm || echo 'not found')"
}
main "$@"
