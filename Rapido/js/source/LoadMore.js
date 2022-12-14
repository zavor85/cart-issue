var LoadMore = function () { }

let productListScrollPos = window.scrollY;

LoadMore.prototype.Next = function (selected, options) {
    if (typeof options === 'undefined') {
        options = {};
    }

    var pagesize = parseInt(selected.getAttribute("data-page-size"));
    var queryParams = new QueryArray(window.location.search);
    var containerId = selected.getAttribute("data-container");
    var container = document.getElementById(containerId);
    var currentPage = selected.getAttribute("data-current");
    var totalPages = selected.getAttribute("data-total");

    queryParams.setValue("feedType", "productsOnly");
    queryParams.setPath(selected.getAttribute("data-feed-url"), true);
    queryParams.setValue("pagesize", pagesize, true);

    currentPage++;

    selected.setAttribute("data-current", currentPage);

    queryParams.setValue("pagenum", currentPage);
    queryParams.setValue("redirect", "false");

    if (currentPage <= totalPages) {

        HandlebarsBolt.AddContent(containerId, queryParams.getFullUrl());

        queryParams = new QueryArray(window.location.href);

        if (queryParams.hasParam("pagesize")) {
            pagesize += parseInt(queryParams.getValue("pagesize"));
        } else {
            pagesize *= 2;
        }

        queryParams.setValue("pagesize", pagesize);

        history.pushState(null, null, queryParams.getFullUrl());
    }

    if (currentPage == totalPages) {
        selected.classList.add('u-hidden');
    }

    options = Object.assign(options, {
        'currentPage': currentPage,
        'totalPages': totalPages,
        'url': queryParams.getFullUrl(),
        'container': containerId
    });

    productListScrollPos = window.scrollY - 30;

    if (document.getElementById("ProductsContainer")) {
        document.getElementById("ProductsContainer").addEventListener("contentLoaded", function (e) {
            window.scrollTo(0, productListScrollPos);
        }, false);
    }

    var event = new CustomEvent('loadMore', { 'detail': options });
    document.dispatchEvent(event);
    container.dispatchEvent(event);
}


var LoadMore = new LoadMore();