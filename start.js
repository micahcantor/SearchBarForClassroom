addFormStyle();
addFormScript();
addFormHTML();

function addFormHTML () {
    var form = document.createElement('form');
    var input = document.createElement('input');
    var btn = document.createElement('button');
    var searchIcon = document.createElement('i');

    form.setAttribute("class", "example");
    form.setAttribute("action", "/contact");
    form.setAttribute("method", "POST");
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
    document.body.appendChild(form);
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
function addFormScript () {
    var content = document.createElement('script');
    content.src = chrome.runtime.getURL('content.js');
    content.onload = function() {
        this.remove();
    };
    document.body.appendChild(content);
}




