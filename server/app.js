const express = require("express")
const cors = require("cors")
var fetch = require("node-fetch")
require("dotenv").config()
const app = express()

const getRedirectURI = () => {
    if (process.env.NODE_ENV === "DEVELOPMENT") {
        return process.env.DEV_REDIRECT_URI;
    }
    else return process.env.PROD_REDIRECT_URI;
}
const REDIRECT_URI = getRedirectURI();

app.use(express.json());
app.use(cors({
    origin: ["chrome-extension://apcbfgfefnmfnpopdalikdechohapgcm", "chrome-extension://dmlfplbdckbemkkhkojekbagnpldghnc"]
}))

app.post('/refresh', async (req, res) => {
    const access_token = await refreshAccess(req.body.refresh_token)
    res.json(access_token)
});

app.post('/exchange', async (req, res) => {
    const tokens = await exchangeCode(req.body.code)
    res.json(tokens)
})

app.listen(3000, function () {
    console.log('Listening on port 3000!');
});

app.listen(process.env.PORT, () => {})
  
async function exchangeCode(code) {
    const url = 'https://www.googleapis.com/oauth2/v4/token'
    const redirect_uri = REDIRECT_URI;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;

    const body ="code=" + code + "&" +
                "client_id=" + client_id + "&" +
                "client_secret=" + client_secret + "&" +
                "redirect_uri=" + redirect_uri + "&" + 
                "grant_type=authorization_code"

    const response = await fetch(url, {
        method: "POST",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
    })

    const json = await response.json();
    return {refresh: json.refresh_token, access: json.access_token}
}

async function refreshAccess(refresh_token) {
    const url = "https://oauth2.googleapis.com/token";
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    const body ="client_id=" + client_id + "&" +
                "client_secret=" + client_secret + "&" +
                "refresh_token=" + refresh_token + "&" + 
                "grant_type=refresh_token"

    const response = await fetch(url, {
        method: "POST",
        headers: {
        "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
    })
    const json = await response.json();
    return json
}