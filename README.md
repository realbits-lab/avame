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

## SSL in heroku

- https://www.whynopadlock.com/
- [Force SSL/HTTPS on Next.js with Heroku](https://medium.com/@tpae/enabling-ssl-https-on-next-js-with-heroku-55d0c6ce8516)

# NPM local pacakge update error

- When local rent-market package link is not update, re-make npm link with "sudo npm link" command in package directory and "npm link rent-market" in application directory.
- Remove .next directory and restart

# v3d compatibility

- Install @babylongjs 5.0.0 version package
