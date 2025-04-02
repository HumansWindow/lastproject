#!/bin/bash

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch node_modules/@next/swc-linux-x64-musl/next-swc.linux-x64-musl.node node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node" \
  --prune-empty -- --all

echo "Now run: git push origin main --force"
