# Install package

- npm install --legacy-peer-deps
- Add "legacy-peer-deps=true" to .npmrc

# Login heroku

- heroku login

# Set heroku remote

- heroku git:remote -a [app_name]

# Push heroku

- git push heroku [branch_name]:master

# Log heroku

- heroku logs --tail

# Set config heroku

- heroku config:set GITHUB_USERNAME=joesmith

# Set build with cache in heroku

- heroku config:set NODE_MODULES_CACHE=true -a APP_NAME

# Shell in heroku

- heroku ps:exec