// this is all boiler plate code for autherization

const API_KEY = 'AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac'
const CLIENT_ID = '809411372636-isaj4trbcg56tnmdevf3qhv1vk57kttb.apps.googleusercontent.com'
const DISCOVERY_DOCS = ["https://classroom.googleapis.com/$discovery/rest?version=v1"]

function onGAPILoad() {
  gapi.client.init({
      // Don't pass client nor scope as these will init auth2, which we don't want
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    // Get the token
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      // Set GAPI auth token
      gapi.auth.setToken({
        'access_token': token,
      });

      //API Classroom stuff here
      var response = gapi.client.classroom.courses.list();
      var courses = response.courses;
      console.log("Courses:");
      for (course in courses) {
        console.log('%s (%s)', courses[course].name, courses[course].id);
      }
      /////////
      
      sendResponse({
        text: request.text,
        list: courses,
        success: true
      });
    })
    // Wait for response
    return true;
  }
); 
    

