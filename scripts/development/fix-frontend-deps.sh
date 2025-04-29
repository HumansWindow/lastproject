#!/bin/bash

echo "=== Installing missing frontend dependencies ==="

# Navigate to the frontend folder
cd /home/alivegod/Desktop/LastProject/frontend

# Install React, Axios, and Ethers with their type declarations
npm install --save react react-dom axios ethers
npm install --save-dev @types/react @types/react-dom @types/axios

echo "=== Frontend dependencies installed ==="
echo "Now you can restart your frontend development server"
