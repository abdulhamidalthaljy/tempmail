@echo off
echo 🧪 Running TempMail Backend Integration Tests...
echo.
echo This will test all API endpoints and functionality
echo Make sure the backend server is running first!
echo.
pause

node test-integration.js

echo.
echo Test completed. Press any key to exit...
pause > nul
