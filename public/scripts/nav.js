window.onload = function preprareNavDropdown() {
    var isNavOpen = false;
    var mobileNavBtn = document.getElementById("mobileNavBtn");
    mobileNavBtn.onclick = function () {
        // use to toggle onclick on and off
        isNavOpen = !isNavOpen;
        if (isNavOpen) {
            // show nav
            document.getElementById("mobileNav").style = "display:flex;opacity:100%;"
        } 
        else {
            // hide nav
            document.getElementById("mobileNav").style = "display:none;opacity:0;"
        }
    }
}