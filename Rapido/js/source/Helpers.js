var Helpers = function() {};

/**
* Debounce helper
* @@param delay
* @@param fn
*/

Helpers.prototype.debounce = function (delay, fn) {
    let timerId;

    return function () {
        let args = arguments;

        if (timerId) {                                  
            clearTimeout(timerId);
        }

        timerId = setTimeout(function () {
            fn.apply(void 0, args);
            timerId = null;
        }, delay);
    };
}
                                                                                                                                           
var Helpers = new Helpers();