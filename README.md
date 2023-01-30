# Install package

- npm install --legacy-peer-deps
- Add "legacy-peer-deps=true" to .npmrc

# Build in heroku

## Login

- heroku login

## Set heroku remote

- heroku git:remote --app [app_name]

## Push heroku

- git push heroku [branch_name]:master

## Log heroku

- heroku logs --tail --app [app_name]

# Setting in heorku

## List config heroku

- heroku config:set GITHUB_USERNAME=joesmith --app [app_name]

## Set config heroku

- heroku config:set GITHUB_USERNAME=joesmith --app [app_name]

## Set build with cache in heroku

- heroku config:set NODE_MODULES_CACHE=true --app [app_name]

## Shell in heroku

- heroku ps:exec

## App in heroku

- heroku apps
- heroku apps:info (--app [app_name])
