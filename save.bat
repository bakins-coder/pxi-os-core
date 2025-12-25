@echo off
git add .
git commit -m "Auto-sync: %date% %time%"
git push origin main
echo ---
echo Work is now safe on GitHub!
pause