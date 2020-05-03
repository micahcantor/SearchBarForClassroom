
// TODO: Improve search with quotations and types of posts
// TODO: have extension load not only on refresh
// DONE: refactor get functions with fetch api 
// TODO: add timer reset auth token silently
// TODO: display announcements in the stream or in a popup. 
    // DONE: fill teacher name and date into the assignment
    // fix displaying assignments with comments
    // implement displaying announcements
        // fix issue of doubling up style ids
    // general style improvements
        // add loading icon 
        // turn search icons into reset button
        // visually separate the search results

addFormStyle();
var form = insertFormHTML();
listenForSearch(form);

function insertFormHTML() {
  var form = addFormHTML();
  var intervalID = setInterval(function() {
      targetDiv = document.getElementById("ow43");
      if (targetDiv != null) {
          targetDiv.insertBefore(form, targetDiv.children[1]);
          clearInterval(intervalID);
      }
  }, 500);
  return form
}

function listenForSearch(form) {
  var button = form.children[1];
  button.addEventListener("click", async function(event) {            // when search button is pressed
    event.preventDefault();
    const courseID = await getCurrentCourseID();
    const assignments = await getCourseAssignments(courseID);
    const combinedWork = await getCourseAnnouncements(assignments, courseID);
    const input = form.children[0].value
    const searchResults = await searchCourseWork(combinedWork, input);
    displayResults(searchResults);
  });
}

async function displayResults(matches) {

/*  Hide existing div with all the assignments
    Reconstruct div structure for each matched assignment
    Insert created structure beneath the form tag
 */
    var resultContainer = document.createElement("div");
    await displayAssignments(matches, resultContainer);
    await displayAnnouncements(matches, resultContainer);

    var assignmentStyle = document.createElement("link");
    assignmentStyle.setAttribute("rel", "stylesheet");
    assignmentStyle.setAttribute("href", chrome.runtime.getURL('assignmentStyle.css'));
    //document.head.appendChild(assignmentStyle);

    var announcementStyle = document.createElement("link");
    announcementStyle.setAttribute("rel", "stylesheet");
    announcementStyle.setAttribute("href", chrome.runtime.getURL('announcementStyle.css'));
    document.head.appendChild(announcementStyle);
    
    targetDiv = document.getElementById("ow43");
    targetDiv.insertBefore(resultContainer, targetDiv.children[2]);

}

async function displayAnnouncements(matches, resourceContainer) {
    let response = await fetch(chrome.runtime.getURL('announcement.html'));
    let text = await response.text()

    var parser = new DOMParser();
    var matchedAnnouncements = [];
    for (const match of matches) {
        if (match.item.type == "announcement") {
            var doc = parser.parseFromString(text, 'text/html');
            const teacher = getTeacherName();
            doc.getElementById("DIV_1").setAttribute("data-stream-item-id", match.item.id);
            console.log(match.item.description.split(0, 38) + "...")
            doc.getElementById("SPAN_8").textContent = "Announcement" + match.item.description.split(0, 38) + "...";
            doc.getElementById("SPAN_10").textContent = teacher;
            doc.getElementById("SPAN_12").textContent = "Created " + match.item.created;
            doc.getElementById("SPAN_13").textContent = match.item.created;
            doc.getElementById("DIV_31").textContent = match.item.description;
            if (match.item.edited != null) 
                doc.getElementById("SPAN_11").textContent = "(Edited " + match.item.edited + ")"
            else
                doc.getElementById("SPAN_11").textContent = ""

            matchedAnnouncements.push(doc.getElementById("DIV_1"));
        }
    }
    for (const div of matchedAnnouncements) {
        console.log(div)
        resourceContainer.appendChild(div);
    }
}

async function displayAssignments(matches, resourceContainer) {
    let response = await fetch(chrome.runtime.getURL('assignment.html'));
    let text = await response.text()

    var parser = new DOMParser();
    var matchedAssignments = [];
    for (const match of matches) {
        if (match.item.type == "assignment") {
            var doc = parser.parseFromString(text, 'text/html');
            const teacher = getTeacherName();
            doc.getElementById("DIV_1").setAttribute("data-stream-item-id", match.item.id);
            doc.getElementById("SPAN_12").textContent = "Assignment: " + match.item.title;
            doc.getElementById("SPAN_14").textContent = teacher + "posted a new assignment: " + match.item.title;
            match.item.updated == null ? doc.getElementById("SPAN_17").textContent = match.item.created : doc.getElementById("SPAN_17").textContent = match.item.updated;
            matchedAssignments.push(doc.getElementById("DIV_1"));
        }
    }
    for (const div of matchedAssignments) {
        resourceContainer.appendChild(div);
    }
}

function searchCourseWork(courseWork, input) {
    const fuseOptions = {
        keys: ['title', 'description'],
        includeScore: true,
        tokenize: false,
        findAllMatches: true,
        threshold: 0.6,
    };
    const fuse = new Fuse(courseWork, fuseOptions);
    const result = fuse.search(input);
    return result;
}

function getCourseAnnouncements(courseWorkValues, COURSE_ID) {
    return new Promise(function(resolve, reject) {
        const API_KEY = "AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac";
        const URL = "https://classroom.googleapis.com/v1/courses/" + COURSE_ID + "/announcements?key=" + API_KEY
        const reqOptions = {
            url: URL,
            type: "announcements",
            values: courseWorkValues
        }
        getClassroomData(reqOptions)
            .then(response => resolve(response))
    })
}

function getCourseAssignments(COURSE_ID) {
    return new Promise(function(resolve, reject) {
        const API_KEY = "AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac";
        const URL = "https://classroom.googleapis.com/v1/courses/" + COURSE_ID + "/courseWork?key=" + API_KEY
        const reqOptions = {
            url: URL,
            type: "assignments"
        }
        getClassroomData(reqOptions)
            .then(response => resolve(response))
    })
}

function getCurrentCourseID() {
    return new Promise(function(resolve, reject) {
        const courseName = document.getElementsByClassName("tNGpbb uTUgB YVvGBb")[0].textContent;   // Finds element with the name of the course
        const API_KEY = "AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac";
        const URL = "https://classroom.googleapis.com/v1/courses?key=" + API_KEY + "&courseStates=ACTIVE"
        const reqOptions = {
            url: URL,
            type: "courseID",
            courseName : courseName
        }
        getClassroomData(reqOptions)
            .then(response => resolve(response))  
    })
}

function getClassroomData(data) {
    return new Promise(function(resolve, reject) {
        chrome.runtime.sendMessage(data, function(response) {
            resolve(response)
        }) 
    })
}

function getTeacherName() {
    const firstAssignmentText = document.getElementsByClassName("YVvGBb asQXV")[0].textContent.split(" ")
    const teacherName = []
    if (firstAssignmentText != null) {
        for (const word of firstAssignmentText) {
            if (word == "posted") break;
            teacherName.push(word)
        }
        return teacherName.join(" ") + " "
    }
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


