window.onload = function preprareNavDropdown() {
    var isNavOpen = false;
    var mobileNavBtn = document.getElementById("mobileNavBtn");
    var mobileNav = document.getElementById("mobileNav");

    mobileNavBtn.onclick = function () {
        // use to toggle onclick on and off
        isNavOpen = !isNavOpen;
        if (isNavOpen) {
            // show nav
            mobileNav.style = "display:flex;margin-top: 0;"
            mobileNavBtn.style = "margin-bottom: 0;"
        } 
        else {
            // hide nav
            mobileNav.style = "display:none;"
            mobileNavBtn.style = "margin-bottom: 100px;"
        }
    }
}