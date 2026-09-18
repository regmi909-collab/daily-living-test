#!/bin/bash
# ==============================================================================
# Setup Script for Oracle Cloud Always Free VM (Ubuntu 22.04 / 24.04 LTS)
# Installs Docker, Docker Compose, opens firewall ports 80/443, and launches app.
# ==============================================================================

set -e

echo "=== 1. Updating System Packages ==="
sudo apt-get update -y && sudo apt-get upgrade -y

echo "=== 2. Installing Docker & Dependencies ==="
sudo apt-get install -y ca-certificates curl gnupg lsb-release iptables-persistent

# Add Docker Official GPG Key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker without sudo
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

echo "=== 3. Opening Oracle Cloud Firewall Ports (80, 443) ==="
# Oracle Cloud Ubuntu images have strict iptables rules that block port 80/443 by default
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

echo "=== 4. Starting Meditation Guru Stack ==="
docker compose down || true
docker compose up -d --build

echo "=============================================================================="
echo "Daily Living — Meditation Guru is now running!"
echo "Access your web app at: http://$(curl -s ifconfig.me)"
echo "Access API documentation at: http://$(curl -s ifconfig.me)/docs"
echo "=============================================================================="
