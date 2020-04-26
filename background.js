// this is all boiler plate code for authorization

const API_KEY = 'AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac'
const CLIENT_ID = '809411372636-isaj4trbcg56tnmdevf3qhv1vk57kttb.apps.googleusercontent.com'
const DISCOVERY_DOCS = ["https://classroom.googleapis.com/$discovery/rest?version=v1"]

function onGAPILoad() {
  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      gapi.auth.setToken({'access_token': token});

      sendResponse({
        access_token: token,
        success: true
      });
    })
    // Wait for response
    return true;
  }
); 
    

