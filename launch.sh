git stash && \
git pull origin master &&  \
while true; do python3 FrontendServer/src/backend/app.py ; done
