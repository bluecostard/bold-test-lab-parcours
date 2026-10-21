#!/usr/bin/env bash
# Choisit un JDK x86_64 (ce Mac) pour Gradle / Capacitor Android.
set -euo pipefail

candidates=(
  "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  "/usr/local/opt/openjdk@17"
  "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
)

for home in "${candidates[@]}"; do
  if [[ -x "$home/bin/java" ]]; then
    arch="$(file -b "$home/bin/java" 2>/dev/null || true)"
    if [[ "$arch" == *"x86_64"* ]] || [[ "$(uname -m)" == "arm64" && "$arch" == *"arm64"* ]]; then
      export JAVA_HOME="$home"
      export PATH="$JAVA_HOME/bin:${PATH:-}"
      echo "JAVA_HOME=$JAVA_HOME"
      java -version
      return 0 2>/dev/null || exit 0
    fi
  fi
done

echo "Aucun JDK 17 compatible trouvé. Installe : brew install openjdk@17" >&2
exit 1
