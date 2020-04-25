// this is all boiler plate code for autherization

const API_KEY = 'AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac'
const CLIENT_ID = '809411372636-isaj4trbcg56tnmdevf3qhv1vk57kttb.apps.googleusercontent.com'
const DISCOVERY_DOCS = ["https://classroom.googleapis.com/$discovery/rest?version=v1"]

function onGAPILoad() {
  gapi.client.init({
    apiKey: API_KEY,
    client_ID: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
  });
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    // Get the token
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      // Set GAPI auth token
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
    

