
# Twilight

A Git-based package manager made for Minteck's infrastructure and other things

Install on Windows:
```plaintext
cmd /c 'curl https://twipkg.cdn.minteck.org/~installer/twipkg-onlineinstall-win32-x86_64.bat > "%temp%\install.bat" && "%temp%\install.bat"'
```

Install on Linux (x86_64 or ARM64):
```plaintext
bash -c "$(curl https://twipkg.cdn.minteck.org/~installer/twipkg-onlineinstall-linux-$(uname -p).sh)"
```

Install on macOS (Intel x86 or Apple Silicon):
```plaintext
bash -c "$(curl https://twipkg.cdn.minteck.org/~installer/twipkg-onlineinstall-darwin-$(uname -p).sh)"
```

> **Notice:** Twilight Package Manager is experimental on macOS, use with caution.