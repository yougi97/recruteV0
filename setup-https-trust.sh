#!/usr/bin/env bash
# Trusts the local Caddy reverse-proxy's TLS certificate authority so that
# https://localhost works in your browser without a security warning.
#
# Run this once per machine, after `docker compose up -d caddy` has started
# at least once (Caddy generates its CA on first start).
#
#   ./setup-https-trust.sh
#
# Firefox does not use the OS trust store. If you use Firefox, import the
# generated caddy-root-ca.crt manually via:
#   about:preferences#privacy -> Certificates -> View Certificates
#   -> Authorities -> Import

set -euo pipefail

CERT_PATH="./caddy-root-ca.crt"

echo "Extracting Caddy's local CA certificate from the running container..."
docker cp recrute-caddy:/data/caddy/pki/authorities/local/root.crt "$CERT_PATH"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    echo "Installing into the macOS System keychain (you will be prompted for your password)..."
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_PATH"
    echo "Done. Restart your browser, then https://localhost should show no warning (Firefox excluded, see note above)."

elif [ "$OS" = "Linux" ]; then
    if [ -d /etc/pki/ca-trust/source/anchors ]; then
        echo "Installing into the system trust store (Fedora/RHEL-style, requires sudo)..."
        sudo cp "$CERT_PATH" /etc/pki/ca-trust/source/anchors/caddy-local-ca.crt
        sudo update-ca-trust
    elif [ -d /usr/local/share/ca-certificates ]; then
        echo "Installing into the system trust store (Debian/Ubuntu-style, requires sudo)..."
        sudo cp "$CERT_PATH" /usr/local/share/ca-certificates/caddy-local-ca.crt
        sudo update-ca-certificates
    else
        echo "Could not detect a known Linux trust store. Install $CERT_PATH manually for your distro."
        exit 1
    fi
    echo "Done. Restart your browser, then https://localhost should show no warning (Firefox excluded, see note above)."

else
    echo "Unsupported OS for automatic install: $OS"
    echo "On Windows, run this in an elevated PowerShell prompt instead:"
    echo "  Import-Certificate -FilePath \"$CERT_PATH\" -CertStoreLocation Cert:\\LocalMachine\\Root"
    exit 1
fi
