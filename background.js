
// When user presses the search button: 
  // try to use access token from storage
  // if authorization error, handle it:
    // check if there is a refresh token in storage
      // if so send get request to server/refresh
      // save new access token to storage and use it
    // else send get request to server/auth
      // save refresh and access tokens to storage
      // use access token

initEmptyStorage();
pageChangeListener();
assignmentCLickListener();
onSearch();

function initEmptyStorage() {
  chrome.storage.sync.get(null, contents => {
    if (Object.entries(contents).length == 0) {
      chrome.storage.sync.set('users' = {}, () => console.log("initialized empty storage"))
    }
  });
}

function pageChangeListener() {
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.hasOwnProperty("title") && changeInfo.title.includes("https")) {
      chrome.tabs.sendMessage(tabId, changeInfo);
    }
  })
}

function assignmentCLickListener() {
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "assignment click") {
      chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        const tabIndex = tabs[0].index;
        chrome.tabs.create({url: request.url, index: tabIndex + 1});
      });
    }
  })
}

function onSearch () {
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "auth") {                                        // message from search button press
      (async function tokenFlow() {                                             // container function since the addListener callback can't be async

        var token_response = await getToken("access");                        // gets access token from browser local storage 
        var access_token = await token_response.access
        var myHeaders = new Headers({
          "Authorization": "Bearer " + access_token,
          "Accept": "application/json"
        });

        fetch(request.url, {headers: myHeaders})                                // makes request to Google auth servers
          .then(function (response) { 
            console.log(response.status)
            if (response.status == 401) throw new Error("authorization error"); // throw error if access token is invalid
            return response.json()
          })
          .then(function (data) {
            console.log("access token used... success")
            sendResponse(cleanData(request, data));
          })
          .catch(async function (error) {                                         // catches when access token in storage fails

            console.log("no access token... catching")
            const token_response = await getToken("refresh");                     // tries to find a refresh token in browser storage
            const refresh_token = await token_response.refresh;

            if (refresh_token != null) {                                          // if refresh token found in storage

              console.log("refresh token found");
              access_token = await refreshAccessSafe(refresh_token);                  // update access token with refresh token
              console.log("new access token acquired");
              saveTokens(refresh_token, access_token);                             // update storage with new tokens
              myHeaders.set("Authorization", "Bearer " + access_token);         
              response = await fetch(request.url, {headers: myHeaders});          // resend GET request with updated access token
              data = await response.json();
              sendResponse(cleanData(request, data));

            }
            else {                                                                // no refresh token found in storage

              console.log("no refresh token found")
              access_token = await oauth2();                           // gets and saves new tokens from oauth2 interactive
              console.log("access token obtained through interactive oauth2")
              myHeaders.set("Authorization", "Bearer " + access_token);         
              response = await fetch(request.url, {headers: myHeaders});          // resend GET request with updated access token
              data = await response.json();
              sendResponse(cleanData(request, data));

            }
          })
      })()
    }
    return true; // return true in the message listener callback to make it async
  })
}

function oauth2() {
  var auth_url = "https://accounts.google.com/o/oauth2/auth?";
  const client_id = "809411372636-42mpeh1d7ntk8vor0kuhtsg66ug1olcd.apps.googleusercontent.com";
  const redirect_uri = "https://hkipfjomcdcmllhnkpmbndggbgdicmic.chromiumapp.org/oauth2";

  const auth_params = {
    client_id: client_id,
    redirect_uri: redirect_uri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me https://www.googleapis.com/auth/classroom.announcements.readonly https://www.googleapis.com/auth/classroom.coursework.students",
  }

  const url = new URLSearchParams(Object.entries(auth_params));
  url.toString();
  auth_url += url;

  return new Promise (function(resolve, reject) {
    chrome.identity.launchWebAuthFlow({url: auth_url, interactive: true}, async function(response) {
      const code = response.slice(response.indexOf("=") + 1, response.indexOf("&"));
      token = await exchangeCodeSafe(code);
      resolve(token);
    })
  })
}

async function exchangeCodeSafe(code) {
  const url = "https://classroom-searchbar.herokuapp.com/exchange"

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({code: code})
  })
  const json = await response.json()
  saveTokens(json.refresh, json.access)
  return json.access
}

async function refreshAccessSafe(refresh_token) {
  const url = "https://classroom-searchbar.herokuapp.com/refresh"

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({refresh_token: refresh_token})
  })
  const json = await response.json()
  return json.access_token
}

function cleanData (request, data) {
  if (request.type == "courseID") {
    return getCourseID(data, request);
  }
  else if (request.type == "assignments") {
    return getAssignments(data);
  }
  else if (request.type == "announcements") {
    return getAnnouncements(data, request);
  }
}

function getCourseID(data, request) {
  var courseList = data.courses
  for (const course of courseList) {
    if (course.name == request.courseName) {
        return course.id                                          // find course with the name on the current page
    }
  }
}

function getAssignments(data) {
  var courseWork = data.courseWork;
  var courseWorkValues = [];
  if (courseWork.length > 0) {
    var descriptions = [];
    for (let i = 0; i < courseWork.length; i++) { 
        if (courseWork[i].hasOwnProperty("description")) {     
            descriptions.push(courseWork[i].description);
        }
        else {descriptions.push("")}                         // push empty string to preserve indeces

        var created = new Date(courseWork[i].creationTime).toLocaleDateString('default', {month: 'short', day: 'numeric'});
        var updated = null;
        if (courseWork[i].hasOwnProperty("updateTime")) updated = new Date(courseWork[i].updateTime).toLocaleDateString('default', {month: 'short', day: 'numeric'})
        
        courseWorkValues.push({
            title: courseWork[i].title,
            description : descriptions[i],
            type: "assignment",
            link: courseWork[i].alternateLink,
            created: created,
            updated: updated,
            id : courseWork[i].id
        })
    }
  }
  return courseWorkValues
}

function getAnnouncements(data, request) {
  var announcements = data.announcements;
  var courseWorkValues = request.values;
  if (announcements != null) {
    for (const announce of announcements) {
      var updated = null;
      if (announce.hasOwnProperty("updateTime")) {
        updated = new Date(announce.updateTime).toLocaleDateString('default', {month: 'short', day: 'numeric'})
      }
      courseWorkValues.push({
            description : announce.text,
            materials: announce.materials,
            type: "announcement",
            created: new Date(announce.creationTime).toLocaleDateString('default', {month: 'short', day: 'numeric'}),
            updated: updated,
            id : announce.id
        })
    }
  }
  return courseWorkValues;
}

function saveTokens(refresh_token, access_token) {
  chrome.storage.sync.set({
    'refresh': refresh_token,
    'access': access_token
  }, 
  function callback() {
    console.log("new tokens stored")
  })
}

function saveTokensMulti(refresh_token, access_token, userIndex) {
  chrome.storage.sync.get(["users"], users => {
    users[userIndex] = {
      'refresh': refresh_token,
      'access': access_token
    }
  }, () => console.log("new tokens stored"))
}

function getToken(type) {
  return new Promise(function(resolve, reject) {
    chrome.storage.sync.get([type], function (result) {
      resolve(result)
    })
  })
}

function getTokenMulti(type, userIndex) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['users'], users => {
      resolve(users.userIndex.type);
    })
  })
}
