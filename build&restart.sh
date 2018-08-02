#!/bin/bash
echo "################################################"
echo "Build server-app image"
echo "################################################"

docker build -t server-app

echo "################################################"
echo "Deletes the old dangling images"
echo "################################################"

docker 2>/dev/null rmi -f $(docker images -q --filter "dangling=true")
docker images --quiet --filter=dangling=true | xargs --no-run-if-empty docker rmi -f

echo "################################################"
echo "Run Images"
echo "################################################"

docker-compose rm -f
docker-compose up -d
