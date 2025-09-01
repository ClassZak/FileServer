. .ven/bin/activate && \
git stash && \
git pull origin master &&  \
chmod +x *.sh && \
./setup.sh && \
while true; do python3 FrontendServer/src/backend/app.py ; done
