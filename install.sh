#!/bin/bash

echo "📦 Installing CarCare dependencies..."

# Install Node.js dependencies
npm install \
  next@15.0.3 \
  react@18.2.0 \
  react-dom@18.2.0 \
  pg@8.13.1 \
  @react-three/drei@9.117.2 \
  @react-three/fiber@8.17.10 \
  three@0.170.0

# Install dev dependencies
npm install --save-dev \
  eslint@8 \
  eslint-config-next@15.0.3 \
  postcss@8 \
  tailwindcss@3.4.1

# Create necessary directories
mkdir -p src/app/fonts

echo "✅ Node.js dependencies installed"
echo "🎉 Installation complete! Run 'npm run dev' to start the development server"
