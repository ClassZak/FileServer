#!/bin/sh

REPO_DIR="~/repositories/FileServer"

cd "$REPO_DIR/angular_server" &&
npm run build &&
rm -rf "$REPO_DIR/kotlin_spring_server/src/main/resources/static/"* &&
cp -r "$REPO_DIR/angular_server/dist/file_server/browser/"* "$REPO_DIR/kotlin_spring_server/src/main/resources/static/" &&
cd "$REPO_DIR/kotlin_spring_server/" &&
./gradlew bootRun > ~/kotlin_logs.log &
