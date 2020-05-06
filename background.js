
var email = null;
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse){
    if (request.message == "userEmail") {
      email = request.email;
      getAuthTokenSilent(email);
      sendResponse(email);
    } 
    else {
       chrome.identity.getAuthToken({interactive: true}, function (token) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          getAuthTokenSilent(email);
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
    }
})

function getAuthTokenSilent(email) {
  chrome.identity.getAuthToken({account: {id: email}}, function(token) {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message)
      return
    }
    console.log(token)
  })
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
