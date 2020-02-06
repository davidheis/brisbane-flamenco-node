window.onload = function preprareNavDropdown() {
    var isNavOpen = false;
    var mobileNavBtn = document.getElementById("mobileNavBtn");
    mobileNavBtn.onclick = function () {
        // use to toggle onclick on and off
        isNavOpen = !isNavOpen;
        if (isNavOpen) {
            // show nav
            document.getElementById("mobileNav").style = "visibility: visible;opacity:100%;margin-top: 0;"
        } 
        else {
            // hide nav
            document.getElementById("mobileNav").style = "visibility:hidden;opacity:0;margin-top: -170px;"
        }
    }
}