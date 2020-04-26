addFormStyle();
listenAndLoad();

function listenAndLoad() {
  var form = addFormHTML();
  var intervalID = setInterval(function() {
      targetDiv = document.getElementById("ow43");
      if (targetDiv != null) {
          console.log(targetDiv);
          targetDiv.insertBefore(form, targetDiv.children[1]);
          clearInterval(intervalID);
      }
  }, 500);

  var button = form.children[1];

  button.addEventListener("click", function(event) {           // when search button is pressed
    getCurrentCourseID().then(function(resultID) {             // gets course id for the current course
        getCourseWork(resultID).then(function(resultWork) {    // gets an array of the course work in that course
            var input = form.children[0].value;                // get current value of the input form
            searchCourseWork(resultWork, input)
        });
    });
    event.preventDefault();
  });
  
}

function searchCourseWork(courseWork, input) {
    console.log(courseWork[0])
    var inTitle = courseWork[0].filter(el => el.includes(input));
    var inDescription = courseWork[1].filter(el => el.includes(input));
    var matching = inTitle.concat(inDescription);
    console.log(matching);
}

// TODO: make function to get announcement bodies, add it to the search function
// TODO: have extension load not only on refresh
// TODO: display announcements in the stream or in a popup. 

function getCourseWork(COURSE_ID) {
    const API_KEY = "AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac";
    var data = {}
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage(data, function(response) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var courseWork = JSON.parse(this.responseText).courseWork;
                var titles = [];
                var descriptions = [];
                var materials = [];
                var IDs = [];
                for (const assignment of courseWork) { 
                    titles.push(assignment.title);
                    IDs.push(assignment.id);
                    if (assignment.hasOwnProperty("description")) {     
                        descriptions.push(assignment.description);
                    }
                    else {descriptions.push("")}                   // push empty string to preserve indeces
                }
                var courseWorkValues = [titles, descriptions, IDs];
                resolve(courseWorkValues);
            }
            xhr.open("GET", "https://classroom.googleapis.com/v1/courses/" + COURSE_ID + "/courseWork?key=" + API_KEY);
            xhr.setRequestHeader("Authorization", "Bearer " + response.access_token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.send();
        })
    })
}

function getCurrentCourseID() {
    var data = {};
    const courseName = document.getElementsByClassName("tNGpbb uTUgB YVvGBb")[0].innerHTML;   // Finds element with the name of the course
    return new Promise(function(resolve, reject) {                                          
        chrome.runtime.sendMessage(data, function(response) {
            const API_KEY = "AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac";
    
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var courseList = JSON.parse(this.responseText).courses;                     // parse request string into JSON
                for (const course of courseList) {
                    if (course.name == courseName) {
                        resolve(course.id)                                                  // find course with the name on the current page
                    }
                }
            };
            xhr.open("GET", "https://classroom.googleapis.com/v1/courses?key=" + API_KEY + "&courseStates=ACTIVE");
            xhr.setRequestHeader("Authorization", "Bearer " + response.access_token);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.send();
        });
    })
}
function addFormStyle() {
    var styleLink = document.createElement("link");
    styleLink.setAttribute("rel", "stylesheet");
    styleLink.setAttribute("href", chrome.runtime.getURL('searchStyle.css'));

    var imgStyle = document.createElement("link");
    imgStyle.setAttribute("rel", "stylesheet");
    imgStyle.setAttribute("href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");

    document.head.appendChild(styleLink);
    document.head.appendChild(imgStyle);
}

function addFormHTML () {
    var form = document.createElement('form');
    var input = document.createElement('input');
    var btn = document.createElement('button');
    var searchIcon = document.createElement('i');

    form.setAttribute("class", "example");
    btn.setAttribute("type", "submit");
    searchIcon.setAttribute("class", "fa fa-search");
    Object.assign(input, {
        type : "text",
        placeholder: "Search the stream",
        name : "search"
    });

    btn.appendChild(searchIcon);
    form.appendChild(input);
    form.appendChild(btn);
    return (form);
}


///NOTE: put ttps://icons8.com in the about section of the extension


