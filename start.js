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

  var input = form.children[0];
  var button = form.children[1];

  button.addEventListener("click", function(event) {

    var data = {
        text: input.text
    };
    chrome.runtime.sendMessage(data, function(response) {
        console.log('response', response.access_token)

        const API_KEY = "AIzaSyARs46G8mYoI1nzgPJztAzdYOdYoiZXTac"
        function reqListener () {
            console.log(this.responseText);
        }

        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", reqListener);
        oReq.open("GET", "https://classroom.googleapis.com/v1/courses?key=" + API_KEY);
        oReq.setRequestHeader("Authorization", "Bearer " + response.access_token);
        oReq.setRequestHeader("Accept", "application/json");
        oReq.send();
    })
    event.preventDefault();
  });
  
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


