
// TODO: Improve search with quotations and types of posts
// DONE: have extension load not only on refresh
// DONE: refactor get functions with fetch api 
// DONE: reset auth token silently
// TODO: display announcements in the stream or in a popup. 
    // DONE: fill teacher name and date into the assignment
    // DONE: fill basic info into announcements
    // fix announcement text overflow
    // DONE: fix inserting assignments into the correct div
    // fix bug of some assignments not reacting to click
    // DONE: fix issue of doubling up style ids in announcements  
    // general style improvements
        // DONE: add loading icon 
        // DONE: add reset icon
        // ?DONE: visually separate the search results

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    addFormStyle();
    getUserEmail();
    insertFormHTML().then(function(form) {
        listenForSearch(form);
    })
})

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
        const courseID = await getCourseID();
        const assignments = await getCourseAssignments(courseID);
        const combinedWork = await getCourseAnnouncements(assignments, courseID);
        const input = form.children[0].value
        const searchResults = await searchCourseWork(combinedWork, input);
        console.log(searchResults)
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
    assignmentStyle.setAttribute("href", chrome.runtime.getURL('resources/assignmentStyle.css'));
    document.head.appendChild(assignmentStyle);

    var announcementStyle = document.createElement("link");
    announcementStyle.setAttribute("rel", "stylesheet");
    announcementStyle.setAttribute("href", chrome.runtime.getURL('resources/announcementStyle.css'));
    document.head.appendChild(announcementStyle);
    
    const currentClassDiv = document.getElementsByClassName("v7wOcf ZGnOx")[0].lastChild;
    const target = currentClassDiv.querySelector("div[jscontroller=ZMiF]");
    target.insertBefore(resultContainer, target.children[2]);
    console.log(target)
}


async function displayAnnouncements(matches, resourceContainer) {
    let response = await fetch(chrome.runtime.getURL('resources/announcement.html'));
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
    let response = await fetch(chrome.runtime.getURL('resources/assignment.html'));
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
        const fields = "&fields=announcements(id,text,creationTime,updateTime)"
        const URL = "https://classroom.googleapis.com/v1/courses/" + COURSE_ID + "/announcements?key=" + API_KEY + fields
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
        const fields = "&fields=courseWork(id,title,description,creationTime,updateTime)"
        const URL = "https://classroom.googleapis.com/v1/courses/" + COURSE_ID + "/courseWork?key=" + API_KEY + fields
        const reqOptions = {
            url: URL,
            type: "assignments"
        }
        getClassroomData(reqOptions)
            .then(response => resolve(response))
    })
}

function getCourseID() {
    return new Promise(function(resolve, reject) {
        const currentClassDiv = document.getElementsByClassName("v7wOcf ZGnOx")[0].lastChild; 
        const courseName = currentClassDiv.getElementsByClassName("tNGpbb uTUgB YVvGBb")[0].textContent;   // Finds element with the name of the course
        const API_KEY = "AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac";
        const fields = "&fields=courses(id,name)"
        const URL = "https://classroom.googleapis.com/v1/courses?key=" + API_KEY + "&courseStates=ACTIVE" + fields
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
    const currentClassDiv = document.getElementsByClassName("v7wOcf ZGnOx")[0].lastChild;
    const firstAssignmentText = currentClassDiv.getElementsByClassName("YVvGBb asQXV")[0].textContent.split(" ")
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
    const email = emailParenthesis.slice(2, emailParenthesis.length - 1);
    chrome.runtime.sendMessage({message: "userEmail", email: email})
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
    styleLink.setAttribute("href", chrome.runtime.getURL('resources/searchStyle.css'));

    var fontawesome = document.createElement("script");
    //fontawesome.setAttribute("src", "https://cdnjs.chttps://kit.fontawesome.com/715d9f8095.jsloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
    fontawesome.setAttribute("crossorigin", "anonymous");

    document.head.appendChild(styleLink);
    document.head.appendChild(fontawesome);
}

async function insertFormHTML() {
    const currentClassDiv = document.getElementsByClassName("v7wOcf ZGnOx")[0].lastChild;
    const target = currentClassDiv.querySelector("div[jscontroller=ZMiF]");
    var form = null;
    if (target != null) form = target.querySelector("form[id=searchForm_1]")

    if (form == null) {
        form = await addFormHTML();
        var intervalID = setInterval(function() {
            if (target != null) {
                target.insertBefore(form, target.children[1]);
                clearInterval(intervalID);
            }
        }, 500);
    }
    return form
}

async function addFormHTML () {
    let response = await fetch(chrome.extension.getURL("resources/searchbar.html"))
    let text = await response.text()
    parser = new DOMParser();
    return parser.parseFromString(text, "text/html").getElementById("searchForm_1");
}


///NOTE: put ttps://icons8.com in the about section of the extension
