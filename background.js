
function oauth(email) {
  var url = "https://accounts.google.com/o/oauth2/auth" +
    "?client_id" + "809411372636-42mpeh1d7ntk8vor0kuhtsg66ug1olcd.apps.googleusercontent.com" +
    "&response_type=token" +
    "&redirect_uri=" + "https://hkipfjomcdcmllhnkpmbndggbgdicmic.chromiumapp.org/provider_cb" +
    "&login_hint=" + email +
    "&scope=" + [
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
      "https://www.googleapis.com/auth/classroom.announcements.readonly"
    ]
  chrome.identity.launchWebAuthFlow({'url': url, 'interactive': true}, 
    function (redirectedTo) {
      // check errors and get token from redirect url
    });
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse){
    chrome.identity.getAuthToken({interactive: true}, function (token) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message)
        return
      }

      const myHeaders = new Headers({
        "Authorization": "Bearer " + token,
        "Accept": "application/json"
      })

      fetch(request.url, {headers: myHeaders})
        .then(response => response.json())
        .then(function(data) {
          if (request.type == "courseID") {
            sendResponse(getCourseID(data, request));
          }
          else if (request.type == "assignments") {
            sendResponse(getAssignments(data));
          }
          else if (request.type == "announcements") {
            sendResponse(getAnnouncements(data, request));
          }
        })
    })
    return true;
})


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
    console.log(data)
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
            type: "announcement",
            created: new Date(announce.creationTime).toLocaleDateString('default', {month: 'short', day: 'numeric'}),
            updated: updated,
            id : announce.id
        })
    }
  }
  return courseWorkValues;
}