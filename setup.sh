#!/bin/bash

echo "========================================"
echo "FPED Dashboard - Setup Script"
echo "========================================"
echo ""

echo "[1/4] Installing Backend Dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend installation failed!"
    exit 1
fi
echo "Backend dependencies installed successfully!"
echo ""

echo "[2/4] Installing Frontend Dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend installation failed!"
    exit 1
fi
echo "Frontend dependencies installed successfully!"
echo ""

echo "[3/4] Seeding Database..."
cd ../server
npm run seed
if [ $? -ne 0 ]; then
    echo "WARNING: Database seeding failed. Make sure MongoDB is running!"
    echo "You can run 'npm run seed' manually later."
fi
echo ""

echo "[4/4] Setup Complete!"
echo ""
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo "1. Make sure MongoDB is running"
echo "2. Start Backend:  cd server && npm run dev"
echo "3. Start Frontend: cd client && npm run dev"
echo "4. Open browser: http://localhost:5173"
echo ""
echo "Default Login:"
echo "  Email: admin@fped.com"
echo "  Password: Admin@123"
echo "========================================"
echo ""
