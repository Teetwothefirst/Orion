netstat -ano | findstr :3001 - find and kill the process

git apply search.patch

git checkout HEAD -- src/ChatInterface.jsx


powershell -Command "New-NetFirewallRule -DisplayName 'Allow Node 3001' -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow"