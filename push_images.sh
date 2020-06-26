#!/bin/bash

cd video-conference
yarn build:prod

cd -

docker build -f Dockerfile-redis -t darkzeratul64/webrtc-redis:latest .
docker push darkzeratul64/webrtc-redis:latest

docker build -f Dockerfile-mongodb -t darkzeratul64/webrtc-mongodb:latest .
docker push darkzeratul64/webrtc-mongodb:latest

docker build -f Dockerfile-signalingserver.prod -t darkzeratul64/webrtc-signalingserver:latest .
docker push darkzeratul64/webrtc-signalingserver:latest

docker build -f Dockerfile-videoconference.prod -t darkzeratul64/webrtc-videoconference:latest .
docker push darkzeratul64/webrtc-videoconference:latest

docker build -f Dockerfile-coturn.prod -t darkzeratul64/webrtc-coturn:latest .
docker push darkzeratul64/webrtc-coturn:latest

