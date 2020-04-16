// this is all boiler plate code for autherization

const API_KEY = 'AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac'
const DISCOVERY_DOCS = ["https://classroom.googleapis.com/$discovery/rest?version=v1"]

function onGAPILoad() {
    gapi.client.init({
      // Don't pass client nor scope as these will init auth2, which we don't want
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    }).then(function () {
      console.log('gapi initialized')
      chrome.identity.getAuthToken({interactive: true}, function(token) {
        gapi.auth.setToken({
            'access_token' : token
        });
        console.log('got token', token)
      })

    }, function(error) {
      console.log('error', error)
    });
}

