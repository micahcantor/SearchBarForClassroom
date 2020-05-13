
// When user presses the search button: 
  // try to use access token from storage
  // if authorization error, handle it:
    // check if there is a refresh token in storage
      // if so, exchange for access token and use that
    // else launch oauth2 interactive
      // exchange code for fresh tokens
      // save refresh and access tokens to storage
      // use access token

pageChangeListener();
onSearch();

function pageChangeListener() {
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log(changeInfo)
    if (changeInfo.hasOwnProperty("title") && changeInfo.title.includes("https")) {
      chrome.tabs.sendMessage(tabId, changeInfo)
    }
  })
}

function onSearch () {
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    var email = null;
    if (request.message == "userEmail") email = request.email;                   // runs on page load and sends the user's email
    else {                                                                      // message from search button press
      (async function tokenFlow() {                                             // container function since the addListener callback can't be async
        const token_response = await getToken("access");
        var access_token = await token_response.access
        var myHeaders = new Headers({
          "Authorization": "Bearer " + access_token,
          "Accept": "application/json"
        });

        fetch(request.url, {headers: myHeaders})
          .then(function (response) {
            console.log(response.status)
            if (response.status == 401) throw new Error("authorization error");
            return response.json()
          })
          .then(function (data) {
            console.log("access token used... success")
            sendResponse(cleanData(request, data));
          })
          .catch(async function (error) {
            console.log("no access token... catching")
            const token_response = await getToken("refresh");
            const refresh_token = await token_response.refresh;
            if (refresh_token != null) {                                          // refresh token found in storage
              console.log("refresh token found")
              access_token = await refreshAccess(refresh_token);                  // update access token with refresh token
              saveTokens(refresh_token, access_token)                             // update storage with new tokens
              myHeaders.set("Authorization", "Bearer " + access_token);         
              response = await fetch(request.url, {headers: myHeaders});          // resend GET request with updated access token
              data = await response.json();
              sendResponse(cleanData(request, data));
            }
            else {                                                                // no refresh token found in storage
              console.log("no refresh token found")
              access_token = await oauth2(email, true);                           // gets and saves new tokens from oauth2 interactive
              myHeaders.set("Authorization", "Bearer " + access_token);         
              response = await fetch(request.url, {headers: myHeaders});          // resend GET request with updated access token
              data = await response.json();
              console.log(data)
              sendResponse(cleanData(request, data));
            }
          })
      })()
    }
    return true; // return true in the message listener callback to make it async
  })
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

function oauth2(email, interactive) {
  var auth_url = "https://accounts.google.com/o/oauth2/auth?";
  const client_id = "809411372636-42mpeh1d7ntk8vor0kuhtsg66ug1olcd.apps.googleusercontent.com";
  const redirect_uri = "https://hkipfjomcdcmllhnkpmbndggbgdicmic.chromiumapp.org/oauth2";

  const auth_params = {
    client_id: client_id,
    redirect_uri: redirect_uri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me https://www.googleapis.com/auth/classroom.announcements.readonly",
    login_hint: email
  }

  const url = new URLSearchParams(Object.entries(auth_params));
  url.toString();
  auth_url += url;

  return new Promise (function(resolve, reject) {
    chrome.identity.launchWebAuthFlow({url: auth_url, interactive: interactive}, async function(response) {
      const code = response.slice(response.indexOf("=") + 1, response.indexOf("&"));
      token = await exchangeCode(code, client_id, redirect_uri);
      resolve(token);
    })
  })
}

async function exchangeCode(code, client_id, redirect_uri) {
  const url = 'https://www.googleapis.com/oauth2/v4/token'
  const client_secret = "FOVBbXcMD84uFzIHpYvNOBOk";
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
  saveTokens(json.refresh_token, json.access_token);
  return json.access_token
}

async function refreshAccess(refresh_token) {
  const url = "https://oauth2.googleapis.com/token";
  const client_id = "809411372636-42mpeh1d7ntk8vor0kuhtsg66ug1olcd.apps.googleusercontent.com";
  const client_secret = "FOVBbXcMD84uFzIHpYvNOBOk";
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
  const token = await json.access_token;
  return token
}

function getCourseID(data, request) {
  console.log(data)
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
            created: created,
            updated: updated,
            id : courseWork[i].id
        })
    }
  }
  return courseWorkValues
}

function getAnnouncements(data, request) {
  console.log(data)
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
    console.log("refresh token stored")
  })
}

function getToken(type) {
  return new Promise(function(resolve, reject) {
    chrome.storage.sync.get([type], function (result) {
      resolve(result)
    })
  })
}

