var Scroll = function () { }

document.addEventListener("DOMContentLoaded", function (event) {
    var productList = document.getElementById("productList");

    if (productList && productList.classList.contains("js-handlebars-root")) {
        productList.addEventListener('contentLoaded', function (e) {
            setTimeout(function () {
                var scrollPos = QueryArray.getParameterFromCurrentURL("ScrollPos");
                if (scrollPos != null) {
                    window.scroll(0, scrollPos);
                }
            }, 1000);
        }, false);
    } else {
        var ajaxContainer = document.getElementsByClassName("js-handlebars-root");
        if (ajaxContainer.length > 0) {
            for (var i = 0; i < ajaxContainer.length; i++) {
                ajaxContainer[i].addEventListener('contentLoaded', function (e) {
                    Scroll.SetPosition();
                    Scroll.SetPagePosition();
                }, false);
            }
        }
    }

    Scroll.SetPagePosition();
});

Scroll.prototype.SavePosition = function (e) {
    e.preventDefault();

    var url = window.location.href;

    var seperator = "?";
    if (url.indexOf("?") != -1) {
        seperator = "&";
    }

    var scrollPos = document.documentElement.scrollTop || document.body.scrollTop;

    if (QueryArray.getParameterFromCurrentURL("ScrollPos")) {
        url = url.replace(/\bScrollPos=[^&#]+/g, "ScrollPos=" + Math.round(scrollPos));
    } else {
        url = window.location + seperator + "ScrollPos=" + Math.round(scrollPos);
    }

    history.replaceState(null, null, url);

    var event = new CustomEvent('saveScrollPosition', { 'detail': { 'scrollPos': scrollPos } });
    document.dispatchEvent(event);

    window.location.href = e.currentTarget.getAttribute("href");
}

Scroll.prototype.SetPosition = function () {
    var scrollPos = QueryArray.getParameterFromCurrentURL("ScrollPos");;

    if (scrollPos != null) {
        setTimeout(function () {
            window.scroll(0, scrollPos);
        }, 500);

        var event = new CustomEvent('setScrollPosition', { 'detail': { 'scrollPos': scrollPos } });
        document.dispatchEvent(event);

        if (bLazy != null) {
            bLazy.revalidate();
        }
    }
}

Scroll.prototype.SetPagePosition = function () {
    var topElement = document.getElementById("Top");
    var topHeight = topElement ? topElement.clientHeight : "90";
    var fullHeightItems = document.querySelectorAll('.screen-height');
    fullHeightItems.forEach(function (filterItem) {
        filterItem.style.minHeight = topElement.classList.contains('top-container--sticky') ? 'calc(100vh - ' + topHeight + 'px)' : '100vh';
    });

    var page = document.getElementById("Page");

    if (page.classList.contains("js-page-pos")) {
        var scrollDelay = 1;

        if (/Edge\/\d./i.test(navigator.userAgent)) {
            scrollDelay = 500;
        }

        var event = new CustomEvent('savePagePosition', { 'detail': { 'scrollPos': topHeight } });

        if (topHeight > 0) {
            page.style.marginTop = topHeight + "px";
            document.dispatchEvent(event);
        } else {
            setTimeout(function () {
                topHeight = topElement.clientHeight;
                page.style.marginTop = topHeight + "px";
                document.dispatchEvent(event);
            }, scrollDelay);
        }
    }
}

let windowInnerHeight = window.innerHeight;
let windowInnerWidth = window.innerWidth;
let documentElementClientHeight = document.documentElement.clientHeight;
let documentElementClientWidth = document.documentElement.clientWidth;

Scroll.prototype.IsInViewport = function (elem) {
    let bounding = elem.getBoundingClientRect();
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (windowInnerHeight || documentElementClientHeight) &&
        bounding.right <= (windowInnerWidth || documentElementClientWidth)
    );
}

Scroll.prototype.AddIsInViewportListener = function (selector, callBack) {
    window.addEventListener("scroll", function (event) {
        let isInViewportTriggers = document.querySelectorAll(selector);
        isInViewportTriggers.forEach(function (elem) {
            if (Scroll.IsInViewport(elem)) {
                callBack(elem);
            }
        });
    }, false);
}

var Scroll = new Scroll();