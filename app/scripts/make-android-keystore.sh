#!/usr/bin/env bash
# Crée la clé d’upload Google Play pour Gemelo (une seule fois).
# Ne jamais committer le résultat.
set -euo pipefail

SIGN="${HOME}/Desktop/Gemelo-Android-signing"
mkdir -p "$SIGN"
chmod 700 "$SIGN"

if [[ -f "$SIGN/gemelo-upload.p12" ]]; then
  echo "Le keystore existe déjà : $SIGN/gemelo-upload.p12"
  echo "On ne le régénère pas."
  exit 0
fi

PASS="$(openssl rand -base64 32 | tr -d '/+=' | head -c 28)"

openssl req -x509 -newkey rsa:2048 -sha256 -days 10000 \
  -keyout "$SIGN/gemelo-upload.key.pem" \
  -out "$SIGN/gemelo-upload.crt.pem" \
  -nodes \
  -subj "/C=FR/ST=France/L=Paris/O=Blue Costard Compagnie/OU=Gemelo/CN=Gemelo"

openssl pkcs12 -export \
  -inkey "$SIGN/gemelo-upload.key.pem" \
  -in "$SIGN/gemelo-upload.crt.pem" \
  -out "$SIGN/gemelo-upload.p12" \
  -name gemelo \
  -passout "pass:${PASS}"

base64 < "$SIGN/gemelo-upload.p12" | tr -d '\n' > "$SIGN/CM_KEYSTORE.b64"
echo >> "$SIGN/CM_KEYSTORE.b64"

umask 077
cat > "$SIGN/signing-secrets.txt" << EOF
Signature Google Play — Gemelo
Ne jamais mettre ces fichiers dans git, ni les envoyer par mail.

CM_KEYSTORE_PATH = chemin vers gemelo-upload.p12
CM_KEYSTORE_PASSWORD = ${PASS}
CM_KEY_ALIAS = gemelo
CM_KEY_PASSWORD = ${PASS}

Package Play Store : online.gemelo.app
Fichier : gemelo-upload.p12
Garde ce dossier. Sans lui tu ne pourras plus mettre l’app à jour sur Google Play.
EOF

chmod 600 "$SIGN"/*

FINGERPRINT="$(openssl x509 -in "$SIGN/gemelo-upload.crt.pem" -noout -fingerprint -sha256 \
  | awk -F= '{print $2}')"

{
  echo ""
  echo "SHA-256 de la clé d’upload (Digital Asset Links) :"
  echo "$FINGERPRINT"
  echo "Après le 1er AAB, ajoute aussi le SHA-256 « App signing key » de Play Console."
} >> "$SIGN/signing-secrets.txt"

echo "Clé créée dans $SIGN"
echo "Ouvre signing-secrets.txt pour les mots de passe."
echo "SHA-256 upload : $FINGERPRINT"
