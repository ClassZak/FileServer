. .ven/bin/activate && \
git stash && \
git pull origin master &&  \
./setup.sh && \
while true; do python3 FrontendServer/src/backend/app.py ; done
