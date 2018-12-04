# MZ_mock_maker_server

A server that responds with a box api user token for the requested user.

dev user:

`<server URL>/token/dev`

staging or production user (dependant on NODE_ENV variable setting: 'staging' or 'production':

`<server URL>/token`

Currently we have a server set for staging here:
  - https://mockmaker-api.staging.microzines.com
And one for production:
  - https://mockmaker-api.microzines.com/token

##Prerequisites:
  - node version >= 8.0.0

## Running

**IMPORTANT:** Since we already have a server running that gets tokens and refreshes them, you probably wont want to use this server locally. You'll want to use the one that's already set up. Using two servers for the same account means that you'll get a new token for that user (dev staging or prod) and it will invalidate the token on the other server, so either staging or your local server will get a user and a token that work for a little while and then break. Just use the live server.

**A NOTE ABOUT TOKENS:** Tokens are invalidated on box.com's end every hour or so (the returned token will say how long for every new token). We refresh the user token ten minutes before it's expiration time (check out `getUserToken()`).

Install packages:
```
npm i
```

run the server:
```
node index.js
```

go to 
`http://localhost:3000/token`
to get a token for staging

go to 
`http://localhost:3000/token/dev`
to get a token for development

### Production token

run the server with NODE_ENV parameters:
```
NODE_ENV=production node index.js
```
