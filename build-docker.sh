ATHENTICATION_METHOD="$1"
if [ "$ATHENTICATION_METHOD" = "LOCAL" ]
then
  WEBPACK_COMMAND="build-local-login"
else 
  WEBPACK_COMMAND="build-prod"
fi
mkdir -p docker
cp -Rf node-backend docker
cp -Rf ../gemtc-web/ssl docker
cp -Rf public docker
cp -Rf app docker
cp -Rf examples docker
cp -f webpack* docker
cp -f package.json docker
cp -f Dockerfile docker
cp -f yarn.lock docker
cp -f index.js docker
cd docker
docker build --build-arg WEBPACK_COMMAND=$WEBPACK_COMMAND --tag addis/mcda .
cd ..
rm -rf docker
