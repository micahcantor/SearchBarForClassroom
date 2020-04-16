listenAndLoad();

function listenAndLoad() {
    window.addEventListener("load", function() {
        var form = document.getElementsByTagName("form")[0];
        var main = document.getElementById("ow43");
        main.insertBefore(form, main.children[1]);
    
        form.addEventListener('submit', event => {
            event.preventDefault();
            // search code here
            console.log('submit');
          });
    });
}





    
