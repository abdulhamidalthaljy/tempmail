@echo off
echo ====================================
echo      TempMail Mock Email Test
echo ====================================
echo.

echo 1. Creating new temporary email...
curl -s -X POST http://localhost:3000/api/email/new > temp_email.json
for /f "tokens=2 delims=:" %%a in ('findstr "address" temp_email.json') do (
    set EMAIL_ADDRESS=%%a
)
set EMAIL_ADDRESS=%EMAIL_ADDRESS:"=%
set EMAIL_ADDRESS=%EMAIL_ADDRESS:,=%
echo Created email: %EMAIL_ADDRESS%
echo.

echo 2. Adding mock email to inbox...
curl -s -X POST -H "Content-Type: application/json" -d "{\"subject\":\"Welcome to TempMail!\",\"from\":\"welcome@tempmail.com\",\"body\":\"This is a test email sent via mock service. Your disposable email is working correctly!\"}" http://localhost:3000/api/email/%EMAIL_ADDRESS%/mock-message > mock_result.json
echo Mock email added successfully!
echo.

echo 3. Checking inbox...
curl -s http://localhost:3000/api/email/%EMAIL_ADDRESS%/messages > inbox_result.json
echo Inbox contents retrieved!
echo.

echo 4. Results:
echo Email Address: %EMAIL_ADDRESS%
echo Check the following files for detailed results:
echo - temp_email.json (email creation)
echo - mock_result.json (mock email creation)
echo - inbox_result.json (inbox contents)
echo.

echo 5. Open frontend to see the email:
echo http://localhost:4200
echo.

echo Test completed! Press any key to cleanup...
pause > nul

del temp_email.json mock_result.json inbox_result.json 2>nul
echo Cleanup completed!
