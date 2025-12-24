@echo off
git add .
git commit -m "Auto-sync from Laptop"
git push origin main --force
echo ---
echo YOUR WORK IS NOW SAFE ON GITHUB!
pause
