const BoxSDK = require('box-node-sdk');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

/**
 * User:
 * create a box user
 */
class User {
	constructor({name, id}){
		this.name = name;
		this.id = id;
	}
	static set tokenInfo(token){
		this.tokenInfo = token
	}
	static get tokenInfo(){
		return this.tokenInfo
	}
}

/**
 * boxUsers:
 * on box we have 3 accounts that can make requests to each of their own folders, 
 * their id's are needed to get tokens
 */
const boxUsers = {
	prod: new User({
		name: "prod_mock_maker",
		id: "6240158494"
	}),
	staging: new User({
		name: "staging_mock_maker",
		id: "6242217010"
	}),
	dev: new User({
		name: "dev_mock_maker",
		id: "6242409161"
	})
}

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').load();
}

// Box app secrets stored as environment variables.
const boxClientID = process.env.boxClientID;
const boxClientSecret = process.env.boxClientSecret;
const privateKey = process.env.boxPrivateKey;
const publicKeyId = process.env.boxKeyID;
const publicKeyPassphrase = process.env.boxKeyPassphrase;
const boxEnterpriseId = process.env.boxEnterpriseId;
let currentBoxUser = boxUsers.dev;

// find what user you want to use.
if (process.env.NODE_ENV === 'production') {
	currentBoxUser = boxUsers.prod
}
if (process.env.NODE_ENV === 'staging') {
	currentBoxUser = boxUsers.staging
}


// Initialize SDK
let sdk = new BoxSDK({
	clientID: boxClientID,
	clientSecret: boxClientSecret,
	appAuth: {
		keyID: publicKeyId,
		privateKey: privateKey,
		passphrase: publicKeyPassphrase
	}
});


/**
 * Old code:
 * Keeping this here because it took me forever to get this to work.
 * and if we need the enterprise account we still have methods we can use
 */
// sdk.getEnterpriseAppAuthTokens(boxEnterpriseId, null)
//   .then((data)=>{
//     console.log('boxEnterpriseId', data);
//   })
//   .catch((err) => {
//     console.log(err.message)
//   });
		
/**
 * Old code:
 * this will tell you info about the current user even if it's the enterprise account
 */
// let userClient = sdk.getAppAuthClient('user', currentBoxUser.id)
// userClient.users.get('me', null)
//   .then((serviceAccountUser) => {
//     console.log('serviceAccountUser', serviceAccountUser)
//   })
//   .catch((err) => {
//     console.log(err.message)
//   })



/**
 * CORS options:
 * whitelisted locations are allowed to hit this server,
 * otherwise they're blocked by CORS 
 */
const whitelist = [
	'http://localhost:3001',
	'http://localhost:3000',
	'http://mockmaker.staging.microzines.com.s3-website-us-east-1.amazonaws.com',
	'https://mockmaker.staging.microzines.com'
];
let corsOptions = {
	origin: (origin, callback) => {
		if (whitelist.indexOf(origin) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

/**
 * get the token for a user's given ID
 *
 * @param {String} boxUserID
 * @returns {Object} tokenInfo
 */
const getTokenInfo = (boxUserID) => {
	return sdk
		.getAppUserTokens(boxUserID)
		.then(({ accessToken, acquiredAtMS, accessTokenTTLMS }) => {
			//tokenExpirationMS: this is the time that in Milliseconds that it will be when the token expires.
			const tokenExpirationMS = acquiredAtMS + accessTokenTTLMS;
			return {
				tokenInfo:{
					accessToken,
					acquiredAtMS,
					accessTokenTTLMS,
					tokenExpirationMS
				}
			};
		})
		.catch(err => {
			console.log(`Error: getTokenInfo: ${err.message}`);
		});
};

/**
 * decides if it needs to fetch a new token, 
 * and when it gets one it applies it to the user that it was given (currentUser)
 *
 * @param {User Object} {currentUser}
 * @returns access token
 */
const getUserToken = ({currentUser})=>{
	let tenMinMS = 600000;
	if (
		!currentUser.tokenInfo ||
		currentUser.tokenInfo.tokenExpirationMS - tenMinMS < new Date().getTime()
	) {
		console.log('currentUser', currentUser);
		return getTokenInfo(currentUser.id).then(({tokenInfo}) => {
			currentUser.tokenInfo = tokenInfo
			return currentUser.tokenInfo.accessToken;
		});
	} else {
		return Promise.resolve(currentUser.tokenInfo.accessToken);
	}
}


/**
 * ------------
 * ROUTING 
 * ------------
 */

app.get('/token/:env', (req, res) => {
	// if the env is dev then get the dev user
	if(req.params.env === 'dev'){
		let currentUser = boxUsers.dev;
		getUserToken({currentUser}).then(token=>{
			res.json({token})
		})
	} else {
		// don't accept other envs
		res.status(404).send('sorry player, nothing here.')
	}
});

app.get('/token', (req, res) => {
	// take the current currentBoxUser and get it's token
	getUserToken({currentUser: currentBoxUser}).then(token=>{
		res.json({token})
	})
});


// Launch! 🚀
app.listen(port, () => console.log(`App listening on port ${port}!`));