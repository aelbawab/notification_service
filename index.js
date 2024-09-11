const express = require('express');
const { google } = require('googleapis');
const { default: Axios } = require('axios');
const dotenv = require('dotenv');


dotenv.config();
const app = express();
const port = process.env.port;

app.use(express.json());


app.post('/', (req, res) => {
    // console.log('Received request:', req.body);
    res.send('200');
    sendNotification(req);

});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

var MESSAGING_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
var SCOPES = [MESSAGING_SCOPE];

function getAccessToken() {
    return new Promise(function (resolve, reject) {
        const jwtClient = new google.auth.JWT(
            process.env.client_email,
            null,
            process.env.private_key,
            SCOPES,
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            // console.log({ tokens: tokens.access_token })
            // console.log(tokens)
            resolve(tokens);
        });
    });
}

let expiry_date = Date.now();
let access_token = null;

const sendNotification = async (req) => {

    let data = JSON.stringify(req.body)
    let tokens =req.body.message.token ||[];
    try {
        if (!access_token || expiry_date < Date.now()) {
            const googleResponse = await getAccessToken();
            access_token = googleResponse.access_token;
            expiry_date = googleResponse.expiry_date - (300 * 1000);
        }
        // console.log(expiry_date, access_token)

        var config = {
            method: 'post',
            url: 'https://fcm.googleapis.com/v1/projects/attendance-84eba/messages:send',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
        };
        
        tokens.forEach(token => {
          req.body.message.token=token;
          let data = JSON.stringify(req.body);
          Axios({...config,data: data})
              .then(function (response) {
                  console.log(JSON.stringify(response.data));
              })
              .catch(function (error) {
                  console.log("error from axios",error.toJSON()||"something wrong");
              });
        });


         } catch (error) {
            console.log('Error:', error);

        }


}

