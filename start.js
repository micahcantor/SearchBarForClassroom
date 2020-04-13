var s = document.createElement('script');
s.src = chrome.runtime.getURL('content.js');

var form = document.createElement('form')
var input = document.createElement('input')
var btn = document.createElement('button')
var searchIcon = document.createElement('i')
form.setAttribute("class", "example")
btn.setAttribute("type", "submit")
searchIcon.setAttribute("class", "fa fa-search")
Object.assign(input, {
    type : "text",
    placeholder: "Search the stream",
    name : "search"
})
btn.appendChild(searchIcon)
form.appendChild(input)
form.appendChild(btn)

var styleLink = document.createElement("link")
styleLink.setAttribute("rel", "stylesheet")
styleLink.setAttribute("href", chrome.runtime.getURL('searchStyle.css'))

var imgStyle = document.createElement("link")
imgStyle.setAttribute("rel", "stylesheet")
imgStyle.setAttribute("href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css")

console.log(form)
console.log(s)
console.log(styleLink)
s.onload = function() {
    this.remove();
};

document.head.appendChild(styleLink)
document.head.appendChild(imgStyle)
document.body.appendChild(s);
document.body.appendChild(form)
