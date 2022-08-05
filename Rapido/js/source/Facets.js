var Facets = function () { }

Facets.prototype.Init = function (selectedFacetsListId, containerId) {
    this.selectedFacets = document.querySelectorAll("#" + selectedFacetsListId + " [data-check]");
    this.container = document.getElementById(containerId);
    this.facetsQueryList = [];
    this.facetsToRemove = [];
    this.facetsToAdd = [];
    this.selectedFacets.forEach(function (facet) {
        var name = facet.getAttribute("name");
        var value = facet.getAttribute("value");
        this.facetsQueryList.push({ name: name, value: value });
    }, this);
}
//now this.facetsQueryList contains all preselected facets

Facets.prototype.UpdateFacets = function (facet) {
    var name = facet.getAttribute("name");
    var value = facet.getAttribute("value");
    if (facet.checked || facet.getAttribute("data-check") == "") {
        if (!this.facetsQueryList.hasOwnProperty(name)) {
            this.facetsQueryList[name] = [];
        }
        this.facetsQueryList[name].push(value);
        facet.setAttribute("data-check", "checked");
        facet.classList.add("checked");
        this.facetsToAdd.push({ name: name, value: value });
    } else {
        this.facetsQueryList.splice(this.facetsQueryList.indexOf({ name: name, value: value }), 1);
        facet.setAttribute("data-check", "");
        facet.classList.remove("checked");
        this.facetsToRemove.push({ name: name, value: value });
    }
    this.Synchronize();
}

Facets.prototype.ResetFacets = function () {
    this.facetsQueryList.forEach(function (facet) {
        this.facetsToRemove.push({ name: facet.name, value: facet.value });
    }, this);
    this.Synchronize();
}

//Synchronize virtual facets state with real DOM and URL
Facets.prototype.Synchronize = function () {
    var queryParams = new QueryArray(this.container.getAttribute("data-json-feed"));
    var browserParams = new QueryArray(window.location.href);

    //sync adding
    this.facetsToAdd.forEach(function (facet) {
        if (queryParams.hasParam(facet.name) && queryParams.getValue(facet.name).trim() != "") {
            facet.value = queryParams.getValue(facet.name) + "," + facet.value;
        }
        queryParams.setValue(facet.name, facet.value);
        browserParams.setValue(facet.name, facet.value);
    });
    this.facetsToAdd = [];

    //sync removing
    this.facetsToRemove.forEach(function (facet) {
        if (queryParams.hasParam(facet.name)) {
            var commaArray = queryParams.getValue(facet.name).split("],[");

            if (commaArray.length > 1) {
                commaArray[0] = commaArray[0].substring(1); // delete first [
                commaArray[commaArray.length - 1] = commaArray[commaArray.length - 1].slice(0, -1); //delete last ]
                commaArray = commaArray.map(function (el) { return '[' + el + ']' });

                var i = commaArray.indexOf(facet.value);
                if (i != -1) {
                    commaArray.splice(i, 1);
                    queryParams.setValue(facet.name, commaArray.join(","));
                    browserParams.setValue(facet.name, commaArray.join(","));
                }
            } else {
                if (queryParams.getValue(facet.name) == facet.value) {
                    queryParams.remove(facet.name);
                    browserParams.remove(facet.name);
                }
            }
        }
    });
    this.facetsToRemove = [];

    //update container
    HandlebarsBolt.UpdateContent(this.container.getAttribute("id"), queryParams.getFullUrl(), false, this.container.getAttribute("data-template"), "overlay");
    //update url
    history.pushState(null, null, browserParams.getFullUrl());
}



/**
 * Remove "view more" expand
 * If content height is less than fixed height
 */

Facets.prototype.CollapseBoxesOutOfView = function () {
    let containers = document.querySelectorAll('.js-facet-container');

    for (var i = 0; containers.length > i; i++) {
        let item = containers[i];

        let trigger = document.querySelector('input[id="' + item.dataset.input + '"]');
        let triggerState = trigger.checked;
        let list = item.querySelector('.facets-container__list');
        let expand = item.querySelector('.js-facet-expand');

        // Expand to get fixed height set from website settings
        trigger.checked = true;

        // Collect data of item
        let style = window.getComputedStyle(list);
        let maxHeight = style.getPropertyValue('max-height');
        let maxHeightInt = parseInt(maxHeight);
        let scrollHeight = list.scrollHeight;

        // Set back to initial state
        trigger.checked = triggerState;

        if (expand != null && list != null) {
            if (scrollHeight <= maxHeightInt) {
                expand.parentNode.removeChild(expand);
            }
        }
    }

}


/**
 * Expand container
 * @param {DOM Element} button
 */

Facets.prototype.ExpandToggle = function (button) {
    let target = button.dataset.target;
    let text = button.querySelector('.js-facet-trigger-text');
    let list = document.querySelector(`#${target}`);

    list.classList.toggle('is-open');
    button.parentNode.classList.toggle('is-toggled');

    if (button.parentNode.classList.contains('is-toggled')) {
        text.innerHTML = button.dataset.toggleText;
    } else {
        text.innerHTML = button.title;
    }
}

var Facets = new Facets();


document.addEventListener('DOMContentLoaded', function () {
    let productList = document.getElementById('productList');

    if (productList != null) {
        productList.addEventListener('contentLoaded', function (event) {
            Facets.CollapseBoxesOutOfView();
        });
    }
});