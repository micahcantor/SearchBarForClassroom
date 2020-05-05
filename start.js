
// TODO: Improve search with quotations and types of posts
// TODO: have extension load not only on refresh
// DONE: refactor get functions with fetch api 
// TODO: add timer reset auth token silently
// TODO: display announcements in the stream or in a popup. 
    // DONE: fill teacher name and date into the assignment
    // DONE: fill basic info into announcements
    // fix announcement text overflow
    // fix displaying assignments with comments
    // DONE: fix issue of doubling up style ids in announcements  
    // general style improvements
        // DONE: add loading icon 
        // DONE: add reset icon
        // ?DONE: visually separate the search results

(async function() {
    addFormStyle();
    getUserEmail();
    let form = await insertFormHTML();
    listenForSearch(form);
})()

function listenForSearch(form) {
  var button = form.children[1];
  button.addEventListener("click", async function(event) {            // when search button is pressed
    event.preventDefault();
    if (button.children[0].textContent == "Reset") {
        button.children[0].textContent = "Search";
        form.children[0].value = "";
        document.getElementById("searchResultContainer").innerHTML = "";
    } else {
        button.children[0].textContent = "Loading";
        const courseID = await getCurrentCourseID();
        const assignments = await getCourseAssignments(courseID);
        const combinedWork = await getCourseAnnouncements(assignments, courseID);
        const input = form.children[0].value
        const searchResults = await searchCourseWork(combinedWork, input);
        await displayResults(searchResults);
        button.children[0].textContent = "Reset";
    }
  });
}

async function displayResults(matches) {

/*  Hide existing div with all the assignments
    Reconstruct div structure for each matched assignment
    Insert created structure beneath the form tag
 */
    var resultContainer = document.createElement("div");
    resultContainer.setAttribute("id", "searchResultContainer")
    await displayAssignments(matches, resultContainer);
    await displayAnnouncements(matches, resultContainer);

    var assignmentStyle = document.createElement("link");
    assignmentStyle.setAttribute("id", "assignment_style")
    assignmentStyle.setAttribute("rel", "stylesheet");
    assignmentStyle.setAttribute("href", chrome.runtime.getURL('assignmentStyle.css'));
    document.head.appendChild(assignmentStyle);

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
            doc.getElementById("SPAN_8").textContent = "Announcement" + match.item.description.split(0, 38) + "...";
            doc.getElementById("SPAN_10").textContent = teacher;
            doc.getElementById("SPAN_12").textContent = "Created " + match.item.created;
            doc.getElementById("SPAN_13").textContent = match.item.created;
            doc.getElementById("DIV_31").textContent = match.item.description;
            if (match.item.updated != null) {
                doc.getElementById("SPAN_13").textContent += " (Edited " + match.item.updated + ")"
            }
            matchedAnnouncements.push(doc.getElementById("DIV_1"));
        }
    }
    for (const div of matchedAnnouncements) {
        resourceContainer.appendChild(div);
    }
}

async function displayAssignments(matches, resourceContainer) {
    let response = await fetch(chrome.runtime.getURL('assignment.html'));
    let text = await response.text();

    var parser = new DOMParser();
    var matchedAssignments = [];
    for (const match of matches) {
        if (match.item.type == "assignment") {
            var doc = parser.parseFromString(text, 'text/html');
            editDOMIDs(doc.getElementById("as_DIV_1"));
            const teacher = getTeacherName();
            doc.getElementById("as_DIV_1").setAttribute("data-stream-item-id", match.item.id);
            doc.getElementById("as_SPAN_12").textContent = "Assignment: " + match.item.title;
            doc.getElementById("as_SPAN_14").textContent = teacher + "posted a new assignment: " + match.item.title;
            match.item.updated == null ? doc.getElementById("as_SPAN_17").textContent = match.item.created : doc.getElementById("as_SPAN_17").textContent = match.item.updated;
            matchedAssignments.push(doc.getElementById("as_DIV_1"));
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

function getUserEmail() {
    const userElement = document.getElementsByClassName("gb_D gb_Ra gb_i")[0]
    const userInfo = userElement.attributes.getNamedItem("aria-label").value;
    const emailParenthesis = userInfo.split(" ")[5]
    const email = emailParenthesis.slice(2, email.length - 1);
    chrome.runtime.sendMessage({message: "userEmail", email: email}, function(response) {
        console.log(response)
    })
}

function editDOMIDs(top_div) {
    if (top_div.children.length == 0 & top_div.nextSibling == null) {
        return
    }
    else if (top_div.children.length > 0) {
        for (const node of top_div.children) {
            node.setAttribute("id", "as_" + node.id);
            editDOMIDs(node);
        }
    }
}

function addFormStyle() {
    var styleLink = document.createElement("link");
    styleLink.setAttribute("rel", "stylesheet");
    styleLink.setAttribute("href", chrome.runtime.getURL('searchStyle.css'));

    var fontawesome = document.createElement("script");
    //fontawesome.setAttribute("src", "https://cdnjs.chttps://kit.fontawesome.com/715d9f8095.jsloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
    fontawesome.setAttribute("crossorigin", "anonymous");

    document.head.appendChild(styleLink);
    document.head.appendChild(fontawesome);
}

async function insertFormHTML() {
    let form = await addFormHTML();
    var intervalID = setInterval(function() {
        targetDiv = document.getElementById("ow43");
        if (targetDiv != null) {
            targetDiv.insertBefore(form, targetDiv.children[1]);
            clearInterval(intervalID);
        }
    }, 500);
    return form
}

async function addFormHTML () {
    let response = await fetch(chrome.extension.getURL("searchbar.html"))
    let text = await response.text()
    parser = new DOMParser();
    return parser.parseFromString(text, "text/html").getElementById("searchForm_1");
}


///NOTE: put ttps://icons8.com in the about section of the extension

