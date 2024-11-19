#!/bin/bash

echo "🚗 Starting CarCare Installation Script..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Installing npm..."
    sudo apt-get install -y npm
fi

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Installing Python3..."
    sudo apt-get install -y python3
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Installing pip3..."
    sudo apt-get install -y python3-pip
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib
fi

echo "📦 Installing Node.js dependencies..."
npm install

echo "📦 Installing Python dependencies..."
pip3 install python-dotenv psycopg2-binary