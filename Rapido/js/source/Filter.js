var Filter = function () { }

Filter.prototype.FilterItems = function (e) {
    let currentFilter = e.currentTarget;
    let searchString = currentFilter.value.toLowerCase();
    let jsFilter = currentFilter.closest(".js-filter")
    let filterItems = jsFilter.querySelectorAll("[data-filter-value]");
    let notFoundEl = jsFilter.querySelector(".js-filter-not-found");
    if (notFoundEl) {
        notFoundEl.classList.add("u-hidden");
    }

    filterItems.forEach(function (filterItem) {
        let filterItemValue = filterItem.getAttribute("data-filter-value").toLowerCase();
        filterItem.classList.toggle("u-hidden", filterItemValue.indexOf(searchString) == -1);
    });

    if (notFoundEl && !jsFilter.querySelector("[data-filter-value]:not(.u-hidden)")) {
        notFoundEl.classList.remove("u-hidden");
    }
}

var Filter = new Filter();