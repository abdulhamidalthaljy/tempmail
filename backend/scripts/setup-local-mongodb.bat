@echo off
echo ==========================================
echo       TempMail - MongoDB Setup Script
echo ==========================================
echo.

echo This script will help you set up MongoDB locally for development.
echo.

echo 1. Download MongoDB Community Server from:
echo    https://www.mongodb.com/try/download/community
echo.

echo 2. Install MongoDB and start the service
echo.

echo 3. Verify MongoDB is running by checking:
echo    - Windows Services (mongodb service should be running)
echo    - Or run: mongod --version
echo.

echo 4. Create the TempMail database (optional):
echo    - Run: mongosh
echo    - Then: use tempmail
echo.

echo 5. Update your .env file to use local MongoDB:
echo    MONGODB_URI=mongodb://localhost:27017/tempmail
echo.

echo ==========================================
echo Once MongoDB is installed and running,
echo restart the backend server with: npm start
echo ==========================================

pause
