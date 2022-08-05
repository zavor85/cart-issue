var Buttons = function () { }

Buttons.prototype.LockButton = function (e, lockScreen, validation = true) {
    var isFieldsValid = true;
    var clickedButton = e.currentTarget;
  
    if (clickedButton.type == "submit" && validation == true) {
        var form = document.forms[clickedButton.closest("form").name];

        if (form) {
            isFieldsValid = [].slice.call(form.elements).every(function (field) {
                return field.validity.valid;
            });
        } else {
            isFieldsValid = false;
        } 
    } 

    console.log(isFieldsValid);

    //Secure that there is time for a form time to submit
    if (!isFieldsValid) {
        return false;
    }

    setTimeout(function () {
        if (lockScreen) {
            var overlayElement = document.createElement('div');
            overlayElement.className = "preloader-overlay";
            overlayElement.setAttribute('id', "ButtonOverlay");
            var overlayElementIcon = document.createElement('div');
            overlayElementIcon.className = "preloader-overlay__icon dw-mod";
            overlayElementIcon.style.top = window.pageYOffset + "px";
            overlayElement.appendChild(overlayElementIcon);

            document.getElementById('content').parentNode.insertBefore(overlayElement, document.getElementById('content'));
        } else {
            var clickedButtonText = clickedButton.innerHTML;
            var clickedButtonWidth = clickedButton.offsetWidth;
            clickedButton.classList.add("disabled");
            clickedButton.disabled = true;
            clickedButton.innerHTML = "<i class=\"fas fa-circle-notch fa-spin\"></i>";
            clickedButton.style.width = clickedButtonWidth + "px";

            var event = new CustomEvent('buttonIsLocked');
            document.dispatchEvent(event);
            clickedButton.dispatchEvent(event);
        }
    }, 50);
}

var Buttons = new Buttons();