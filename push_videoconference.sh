cd video-conference
yarn build:prod

cd -

docker build -f Dockerfile-videoconference.prod -t darkzeratul64/webrtc-videoconference:latest .
docker push darkzeratul64/webrtc-videoconference:latest