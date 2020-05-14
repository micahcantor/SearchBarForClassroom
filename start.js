
// DONE: have extension load not only on refresh
// DONE: refactor get functions with fetch api 
// DONE: reset auth token silently

// TODO: fix bug of some assignments not reacting to click
// TODO: Inline comments and read me
// TODO: Improve search with quotations and types of posts
// TODO: display announcements in the stream or in a popup. 
    // DONE: fill teacher name and date into the assignment
    // DONE: fill basic info into announcements
    // DONE: fix inserting assignments into the correct div
    // DONE: fix issue of doubling up style ids in announcements  
    // DONE: fix content script running on class list overview page
    // DONE: fix announcement text overflow
    // DONE: fix ordering of assignments/announcements

    // DONE: load search bar after pressing back in the browser
    // DONE: support materials in announcements
        //DONE: links
        // DONE: drive files
    // match tokens to google account in storage to support multiple accounts
    // general style improvements
        // change color based on class theme
        // put teacher's picture into announcement
        // DONE: add loading icon 
        // DONE: add reset icon
        // DONE: visually separate the search results

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (onCorrectPage()) {
        addFormStyle();
        getUserEmail();
        insertFormHTML().then(function(form) {
            listenForSearch(form);
        })
    } 
    else {
        const searchStyle = document.getElementById("searchStyle");
        if (searchStyle != null) searchStyle.remove();
    }
})

function listenForSearch(form) {
    var button = form.children[1];
    button.addEventListener("click", async function(event) {            // when search button is pressed
        event.preventDefault();
        if (button.children[0].textContent == "Reset") {
            button.children[0].textContent = "Search";
            form.children[0].value = "";
            const currentClassDiv = getCurrentClassDiv();
            currentClassDiv.querySelectorAll("div[id=searchResultContainer").forEach((container) => container.remove())
        } else {
            button.children[0].textContent = "Loading";
            const courseID = await getCourseID();        
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

    var resultContainer = document.createElement("div");
    resultContainer.setAttribute("id", "searchResultContainer")
    const assignments = await displayAssignments(matches);
    const announcements = await displayAnnouncements(matches);
    insertIntoContainer(assignments, announcements, resultContainer)

    const currentClassDiv = getCurrentClassDiv();
    const target = currentClassDiv.querySelector("div[jscontroller=ZMiF]");
    target.insertBefore(resultContainer, target.children[2]);
}

function insertIntoContainer(assignments, announcements, container) {
    const combined = {
        work: assignments.htmls.concat(announcements.htmls),
        indeces: assignments.indeces.concat(announcements.indeces)
    }

    for (i = 0; i < combined.work.length; i++) {
        const position = combined.indeces.indexOf(i);
        const value = combined.work[position];
        container.appendChild(value);
    }
    return container;
}

async function displayAssignments(matches) {
    let response = await fetch(chrome.runtime.getURL('resources/assignment.html'));
    let text = await response.text();

    var parser = new DOMParser();
    var assignmentsObject = {htmls: [], indeces: []};
    var idx = 0;
    for (const match of matches) {
        if (match.item.type == "assignment") {
            var doc = parser.parseFromString(text, 'text/html');
            editDOMIDs(doc.getElementById("as_DIV_1"));
            const teacher = getTeacherName();
            doc.getElementById("as_DIV_1").setAttribute("data-stream-item-id", match.item.id);
            doc.getElementById("as_SPAN_12").textContent = "Assignment: " + match.item.title;
            doc.getElementById("as_SPAN_14").textContent = teacher + "posted a new assignment: " + match.item.title;
            match.item.updated == null ? doc.getElementById("as_SPAN_17").textContent = match.item.created : doc.getElementById("as_SPAN_17").textContent = match.item.updated;
            
            assignmentsObject.htmls.push(doc.getElementById("as_DIV_1"));
            assignmentsObject.indeces.push(idx)
        }
        idx++;
    }

    addResourceStyle("assignment");
    return assignmentsObject;
}

async function displayAnnouncements(matches) {
    let response = await fetch(chrome.runtime.getURL('resources/announcement.html'));
    let text = await response.text()

    var parser = new DOMParser();
    var announcementsObject = {htmls: [], indeces: []};
    var idx = 0;
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
            doc.getElementById("DIV_32").setAttribute("data-stream-item-id", match.item.id)

            if (match.item.updated != null) 
                doc.getElementById("SPAN_13").textContent += " (Edited " + match.item.updated + ")"

            if (match.item.materials != null) {
                var materialContainer = doc.getElementById("DIV_32");
                await displayAnnounceMaterials(match.item.materials, materialContainer)
            }

            announcementsObject.htmls.push(doc.getElementById("DIV_1"));
            announcementsObject.indeces.push(idx)
        }
        idx++;
    }
    addResourceStyle("announcement");
    return announcementsObject
}

async function displayAnnounceMaterials(materials, container) {

    let response = await fetch(chrome.runtime.getURL('resources/materialTemplate.html'));
    let text = await response.text();
    var parser = new DOMParser();
    var doc = parser.parseFromString(text, 'text/html');

    var pattern = new UrlPattern('https\\://classroom.google.com/u/:userID/c/:classID');
    const URL = window.location.href;
    const userID = pattern.match(URL)[0];

    var materialsHTML = []
    for (const material of materials) {
        if (material.link) {
            doc.getElementById("link_A_2").setAttribute("href", material.link.url);
            doc.getElementById("link_A_2").setAttribute("data-focus-id", "eTkQDe-" + material.link.url);
            doc.getElementById("link_A_9").setAttribute("data-focus-id", "hSRGPd-" + material.link.url)
            doc.getElementById("link_DIV_7").innerText = material.link.title;
            doc.getElementById("link_IMG_11").setAttribute("src","https://classroom.google.com/u/" + userID + "/webthumbnail?url=" + material.link.url);
            doc.getElementById("link_DIV_13").innerText = material.link.title;
            doc.getElementById("link_DIV_15").innerText = material.link.url;
            materialsHTML.push(doc.getElementById("link_DIV_1"))
        }
        if (material.driveFile) {
            const driveURL = material.driveFile.alternateLink + "&amp;authuser=" + userID;
            doc.getElementById("file_A_2").setAttribute("href", driveURL);
            doc.getElementById("file_A_2").setAttribute("aria-label", material.driveFile.title);
            doc.getElementById("file_DIV_7").textContent = material.driveFile.title;
            doc.getElementById("file_A_9").setAttribute("title", material.driveFile.title);
            doc.getElementById("file_A_9").setAttribute("href", driveURL);
            doc.getElementById("file_IMG_11").setAttribute("src", material.driveFile.thumbnailURL + "&amp;authuser=" + userID + "&amp;sz=w105-h70-c")
            doc.getElementById("file_DIV_20").textContent = material.driveFile.title;
            materialsHTML.push(doc.getElementById("file_DIV_1"))
        }
    }

    materialsHTML.forEach((material) => {
        container.appendChild(material)
    })

    addResourceStyle("material");
}

function addResourceStyle(type) {
    const resourceStyle = type + "Style"
    var styleLink = document.createElement("link");
    styleLink.setAttribute("rel", "stylesheet");
    styleLink.setAttribute("id", resourceStyle)
    styleLink.setAttribute("href", chrome.runtime.getURL("resources/" + resourceStyle + ".css"));

    if (document.getElementById(resourceStyle) == null) {
        document.head.appendChild(styleLink);
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
        const fields = "&fields=announcements(id,text,materials,creationTime,updateTime)"
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
        const currentClassDiv = getCurrentClassDiv(); 
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
    const currentClassDiv = getCurrentClassDiv();
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

function onCorrectPage() {
    var pattern = new UrlPattern('https\\://classroom.google.com/u/:userID/c/:classID');
    const match = pattern.match(window.location.href);
    if (match == null) return false;
    else return true;
}

function getCurrentClassDiv() {
    const classDivContainer = document.getElementsByClassName("v7wOcf ZGnOx")[0];
    const classDivs = classDivContainer.getElementsByClassName("dbEQNc");
    const currentClassDiv = classDivs[classDivs.length - 1];
    return currentClassDiv;
}

function addFormStyle() {
    var styleLink = document.createElement("link");
    styleLink.setAttribute("rel", "stylesheet");
    styleLink.setAttribute("id", "searchStyle")
    styleLink.setAttribute("href", chrome.runtime.getURL('resources/searchStyle.css'));

    if (document.getElementById("searchStyle") == null) {
        document.head.appendChild(styleLink);
    }
}

async function insertFormHTML() {
    const forms = document.getElementsByTagName("form");
    for (const form of forms) 
        form.remove()
    
    const currentClassDiv = getCurrentClassDiv();
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
        }, 250);
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
