#!/usr/bin/env bash

set -v -e -x

# Update packages.
export DEBIAN_FRONTEND=noninteractive
apt-get -y update && apt-get -y upgrade

# Need this to add keys for PPAs below.
apt-get install -y --no-install-recommends apt-utils

apt_packages=()
apt_packages+=('build-essential')
apt_packages+=('ca-certificates')
apt_packages+=('curl')
apt_packages+=('git')
apt_packages+=('gyp')
apt_packages+=('ninja-build')
apt_packages+=('pkg-config')
apt_packages+=('zlib1g-dev')

# Latest Mercurial.
apt_packages+=('mercurial')
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 41BD8711B1F0EC2B0D85B91CF59CE3A8323293EE
echo "deb http://ppa.launchpad.net/mercurial-ppa/releases/ubuntu xenial main" > /etc/apt/sources.list.d/mercurial.list

# Install packages.
apt-get -y update
apt-get install -y --no-install-recommends ${apt_packages[@]}

# Install LLVM/clang-4.0.
mkdir clang-tmp
git clone -n --depth 1 https://chromium.googlesource.com/chromium/src/tools/clang clang-tmp/clang
git -C clang-tmp/clang checkout HEAD scripts/update.py
clang-tmp/clang/scripts/update.py
rm -fr clang-tmp

# Generate locales.
locale-gen en_US.UTF-8
dpkg-reconfigure locales

# Cleanup.
rm -rf ~/.ccache ~/.cache
apt-get autoremove -y
apt-get clean
apt-get autoclean
rm $0
