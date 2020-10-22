window.addEventListener("load", (event) => {
    const title = document.getElementById("title");
    title.addEventListener("click", (event) => {
        event.preventDefault();
        newTab("https://github.com/micahcantor/ClassroomSearchbar")
    })

    const manage = document.getElementById("manage");
    manage.addEventListener("click", (event) => {
        event.preventDefault();
        newTab("chrome://extensions")
    })

    const clear = document.getElementById("clear");
    clear.addEventListener("click", (event) => {
        event.preventDefault();
        chrome.storage.sync.clear();
    });

    function newTab(url) {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
            const tabIndex = tabs[0].index;
            chrome.tabs.create({url: url, index: tabIndex + 1});
        }); 
    }
    
})
