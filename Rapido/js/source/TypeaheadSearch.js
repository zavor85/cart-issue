function TypeaheadSearch(id, options) {
    const self = this;
    const defaults = {
        pageSize: 6,
        searchParameter: "Search",
        groupsParameter: "GroupId",
        selectedGroup: null,
        groupsFeedUrl: null,
        searchFeedUrls: [],
        resultsPageUrl: null,
        resultsTemplateIds: [],
        onResultClick: null,
        onSearchBtnClick: null,
        goToFirstSearchResultOnEnter: false,
        forceInit: true,
        inputDelayTimer: 500
    };

    this.settings = Object.assign({}, defaults, options);
    this.search = document.getElementById(id);

    if (this.settings.forceInit) {
        self.Init();
    } else {
        document.addEventListener("DOMContentLoaded", function () {
            self.Init();
        });
    }
}

TypeaheadSearch.prototype.InitGroupSelector = function () {
    let _data = this.data;
    let _elements = this.elements;
    let _settings = this.settings;

    if (!_elements.groupsBtn || !_elements.groupsContent || !_settings.groupsFeedUrl) {
        return;
    }

    //init groups
    Request.Fetch().get(_settings.groupsFeedUrl,
        function (result) {
            result.forEach(function (group) {
                let groupElement = document.createElement("li");
                groupElement.setAttribute("data-value", group.id);
                groupElement.innerText = group.name;
                groupElement.classList.add("dropdown__item");
                if (_settings.selectedGroup == group.id) {
                    _elements.groupsBtn.innerText = group.name; //set selected group
                    groupElement.classList.add("dropdown__item--active");
                    _data.groupId = group.id;
                } else {
                    groupElement.onclick = function () {
                        _data.groupId = group.id != "all" ? group.id : null;
                        _elements.groupsBtn.innerText = group.name; //set selected group on click
                    }
                }
                _elements.groupsContent.appendChild(groupElement);
            });
        }
    );

    //groups selector onclick
    _elements.groupsBtn.onclick = function (event) {
        if (!this.classList.contains("search__groups-btn--active")) {
            document.addEventListener("click", hideGroupsDropdown);
        } else {
            document.removeEventListener("click", hideGroupsDropdown);
        }
        this.classList.toggle("search__groups-btn--active");
    }

    function hideGroupsDropdown(event) {
        if (!_elements.groupsBtn.contains(event.target)) {
            _elements.groupsBtn.classList.remove("search__groups-btn--active");
            document.removeEventListener("click", hideGroupsDropdown);
        }
    }
}

TypeaheadSearch.prototype.Init = function () {
    const self = this;
    let search = this.search;

    this.data = {
        selectionPosition: -1,
        listSelectionPosition: 0
    };

    this.settings = self.settings;

    this.elements = {
        groupsBtn: search.querySelector(".js-search-groups-btn"), //groups selector
        groupsContent: search.querySelector(".js-search-groups-list"), //groups list
        searchField: search.querySelector(".js-search-field"), //search input
        searchContents: [
            search.querySelector(".js-search-results-list"), //search results list
        ],
        searchButton: search.querySelector(".js-search-btn"), //search button
        searchResults: search.querySelector(".js-search-results"), //results dropdown
        viewAllButtons: search.querySelectorAll(".js-view-all-button") //results dropdown
    };

    if (search.querySelector(".js-search-results-second-list")) {
        this.elements.searchContents.push(search.querySelector(".js-search-results-second-list"));
    }
    
    let _elements = this.elements;
    let _settings = this.settings;
    let _data = this.data;

    if (_elements.viewAllButtons.length > 0) {
        _settings.viewAllButtonsLinks = [];

        for (let i = 0; i < _elements.viewAllButtons.length; i++) {
            _elements.viewAllButtons[i].classList.add("hidden");
            let link = _elements.viewAllButtons[i].getAttribute("href");
            if (link != null) {
                _settings.viewAllButtonsLinks[i] = link;
            }
        }
    }

    this.InitGroupSelector();

    function createLoader() {
        let loader = document.createElement("div");
        loader.className = "search__loader u-hidden";
        let spinner = document.createElement("i");
        spinner.className = "fa-2x fa-circle-notch fa-spin fas u-color-light";
        loader.appendChild(spinner);
        return loader;
    }

    function addContentLoadedListener(number) {
        let loader = createLoader();
        _elements.loaders.push(loader);
        _elements.searchContents[number].parentElement.appendChild(loader);
        _elements.searchContents[number].addEventListener("contentLoaded", function (data) {
            loader.classList.add("u-hidden");
            if (_elements.viewAllButtons[number] != null) {
                if (data.detail.data.length > 0) {
                    _elements.viewAllButtons[number].classList.remove("u-hidden");
                    if (_settings.viewAllButtonsLinks[number]) {
                        let queryArray = new QueryArray(_elements.viewAllButtons[number].getAttribute("href"));
                        queryArray.setValue(_settings.searchParameter, _elements.searchField.value);
                        if (_data.groupId) {
                            queryArray.setValue(_settings.groupsParameter, _data.groupId);
                        }
                        _elements.viewAllButtons[number].setAttribute("href", queryArray.getFullUrl());
                    }
                }
            }
        });
    }

    _elements.loaders = [];

    for (let i = 0; i < _elements.searchContents.length; i++) {
        addContentLoadedListener(i);
    }

    //update results
    let inputDelayTimer;
    let query = _elements.searchField.value;

    const KEY_CODE = {
        LEFT: 37,
        TOP: 38,
        RIGHT: 39,
        BOTTOM: 40,
        ENTER: 13
    };

    _elements.searchField.onkeyup = function (event) {
        if (event && [KEY_CODE.LEFT, KEY_CODE.TOP, KEY_CODE.RIGHT, KEY_CODE.BOTTOM, KEY_CODE.ENTER].indexOf(event.keyCode) > -1) {
            return;
        }
        if (query != _elements.searchField.value) {
            let customEvent = new CustomEvent("searchValueChanged", { "detail": { searchValue: _elements.searchField.value } });
            self.search.dispatchEvent(customEvent);

            clearTimeout(inputDelayTimer);
            inputDelayTimer = setTimeout(function () {
                self.UpdateSearchResults();
            }, _settings.inputDelayTimer);
        }
    };

    _elements.searchField.onkeydown = function (event) {
        if (!event || [KEY_CODE.LEFT, KEY_CODE.TOP, KEY_CODE.RIGHT, KEY_CODE.BOTTOM, KEY_CODE.ENTER].indexOf(event.keyCode) == -1) {
            query = _elements.searchField.value;
            return;
        }
        self.ControlSearchResults(event);
    }

    //bind searchButton onclick
    if (_elements.searchButton != null) {
        if (_elements.searchButton.onclick == null) {
            if (_settings.resultsPageUrl) {
                _elements.searchButton.onclick = function () { self.LocateToSearchResults.call(self); };
            } else {
                _elements.searchButton.onclick = function () { self.EnterClick.call(self); };
            }
        }
    }

    _elements.searchContents.forEach(function (searchContent) {
        searchContent.addEventListener("contentLoaded", function (event) {
            [].slice.call(searchContent.children).forEach(function (result) {
                result.addEventListener("click", function () {
                    _data.selectedElement = result;
                    self.ActivateSelectedResult();
                });
            });
        });
    });
}

TypeaheadSearch.prototype.UpdateSearchResults = function () {
    const self = this;
    let _settings = this.settings;
    let _elements = this.elements;
    let _data = this.data;

    var query = _elements.searchField.value;

    _data.selectedElement = null;
    _data.selectionPosition = -1
    _data.listSelectionPosition = 0;

    function updateResultsList(number) {
        let queryArray = new QueryArray(_settings.searchFeedUrls[number]);
        queryArray.setValue(_settings.searchParameter, query);
        queryArray.setValue("pagesize", _settings.pageSize);
        if (_data.groupId) {
            queryArray.setValue(_settings.groupsParameter, _data.groupId);
        }
        HandlebarsBolt.UpdateContent(
            _elements.searchContents[number].getAttribute("id"),
            queryArray.getFullUrl(),
            false,
            _settings.resultsTemplateIds[number]
        );
    }

    function hideResultsList(event) {
        if (event == null || (!_elements.searchField.contains(event.target) && !_elements.searchResults.contains(event.target))) {
            _elements.searchField.classList.remove("search__field--active");
            document.removeEventListener("click", hideResultsList);
        }
    }

    if (query.length > 0) {
        document.addEventListener("click", hideResultsList);
        _elements.searchField.classList.add("search__field--active");

        for (let i = 0; i < _elements.searchContents.length; i++) {
            _elements.loaders[i].classList.remove("u-hidden");
            if (_elements.viewAllButtons[i] != null) {
                _elements.viewAllButtons[i].classList.add("u-hidden");
            }
            updateResultsList(i);
        }
    } else {
        hideResultsList();
    }
}

TypeaheadSearch.prototype.ControlSearchResults = function (event) {
    const KEY_CODE = {
        LEFT: 37,
        TOP: 38,
        RIGHT: 39,
        BOTTOM: 40,
        ENTER: 13
    };

    if ([KEY_CODE.LEFT, KEY_CODE.TOP, KEY_CODE.RIGHT, KEY_CODE.BOTTOM].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }

    const self = this;
    let _settings = this.settings;
    let _elements = this.elements;
    let _data = this.data;
    let multipleLists = _elements.searchContents.length > 1;
    let lists = _elements.searchContents;

    //navigation between lists
    if (multipleLists && event.keyCode == KEY_CODE.RIGHT && _data.selectionPosition > -1 && _data.listSelectionPosition < lists.length - 1 && lists[_data.listSelectionPosition + 1].childElementCount > 1) {
        _data.listSelectionPosition++;
        _data.selectionPosition = 0;
    }

    if (multipleLists && event.keyCode == KEY_CODE.LEFT && _data.selectionPosition > -1 && _data.listSelectionPosition > 0 && lists[_data.listSelectionPosition - 1].childElementCount > 1) {
        _data.listSelectionPosition--;
        _data.selectionPosition = 0;
    }

    //switch to second list if first is empty (have only no result item)
    if (multipleLists && event.keyCode == KEY_CODE.BOTTOM && lists[_data.listSelectionPosition].childElementCount == 1) {
        _data.listSelectionPosition = 1;
    }

    if (event.keyCode == KEY_CODE.BOTTOM && _data.selectionPosition < lists[_data.listSelectionPosition].childElementCount - 1) {
        _data.selectionPosition++;
    }

    if (event.keyCode == KEY_CODE.TOP && _data.selectionPosition > 0) {
        _data.selectionPosition--;
    }

    if (lists[_data.listSelectionPosition].childElementCount <= 0) {
        return;
    }

    if (_data.selectedElement) {
        _data.selectedElement.classList.remove('typeahead-search-result--active');
    }

    _data.selectedElement = lists[_data.listSelectionPosition].children[_data.selectionPosition];

    if ([KEY_CODE.LEFT, KEY_CODE.TOP, KEY_CODE.RIGHT, KEY_CODE.BOTTOM].indexOf(event.keyCode) > -1) {
        self.SelectCurrentResult();
    }

    if (event.keyCode == KEY_CODE.ENTER) {
        event.preventDefault();
        self.EnterClick();
    }
}

TypeaheadSearch.prototype.EnterClick = function () {
    const self = this;
    let _settings = this.settings;
    let _elements = this.elements;
    let _data = this.data;

    if (_data.selectedElement) {
        self.ActivateSelectedResult();
    } else {
        let resultItems = _elements.searchContents[_data.listSelectionPosition].querySelectorAll("li:not(.js-no-result)");
        let isHereOnlyOneResult = resultItems.length == 1;
        if ((_settings.goToFirstSearchResultOnEnter && resultItems.length > 0) || isHereOnlyOneResult) {
            _data.selectedElement = resultItems[0];
            self.ActivateSelectedResult();
        } else {
            self.LocateToSearchResults();
        }
    }
}

TypeaheadSearch.prototype.ActivateSelectedResult = function () {
    const self = this;
    let _settings = this.settings;
    let _elements = this.elements;
    let _data = this.data;

    if (_data.selectedElement) {
        _elements.searchField.classList.remove("search__field--active");
        _elements.searchField.value = "";

        let customEvent = new CustomEvent("resultSelected", { "detail": { selectedElement: _data.selectedElement } });
        this.search.dispatchEvent(customEvent);

        if (_data.selectedElement.onclick) {
            _data.selectedElement.onclick();
        }
        self.OpenLinkFromSelectedElement(_data.selectedElement);
    }
}

TypeaheadSearch.prototype.SelectCurrentResult = function () {
    let _settings = this.settings;
    let _elements = this.elements;
    let _data = this.data;
    let listItem = _data.selectedElement;

    if (!listItem || listItem.tagName != "LI") {
        return;
    }

    listItem.classList.add("typeahead-search-result--active");
    let itemName = listItem.querySelector(".js-typeahead-name");
    if (itemName) {
        _elements.searchField.value = itemName.innerText;
    }

    let customEvent = new CustomEvent("resultSelected", { "detail": { selectedElement: _data.selectedElement } });
    this.search.dispatchEvent(customEvent);
    document.dispatchEvent(customEvent);
}

TypeaheadSearch.prototype.LocateToSearchResults = function () {
    let _settings = this.settings;
    let _elements = this.elements;
    let _data = this.data;

    if (_settings.resultsPageUrl != null) {
        let queryArray = new QueryArray(_settings.resultsPageUrl);
        queryArray.setValue(_settings.searchParameter, _elements.searchField.value);
        if (_data.groupId) {
            queryArray.setValue(_settings.groupsParameter, _data.groupId);
        }
        location.href = queryArray.getFullUrl();
    }
}

TypeaheadSearch.prototype.OpenLinkFromSelectedElement = function (selectedElement) {
    var jslink = selectedElement.querySelector(".js-typeahead-link");
    if (jslink != null) {
        if (jslink.onclick != null) {
            jslink.onclick();
        }
        window.location.href = jslink.getAttribute("href");
    }
}

TypeaheadSearch.ShowMiniSearch = (function () {
    let miniSearchTimeOut;

    function hideMiniSearch(trigger) {
        trigger.classList.remove("is-dropdown--active");
        trigger.classList.remove("menu__item--active");
    }

    return function (trigger, timeout) {
        clearTimeout(miniSearchTimeOut);

        if (trigger) {
            let input = trigger.querySelector(".js-search-field");

            trigger.classList.add("is-dropdown--active");
            trigger.classList.add("menu__item--active");
            input.focus();
            trigger.onmouseleave = function () {
                miniSearchTimeOut = setTimeout(hideMiniSearch, timeout, trigger);
            };

            input.addEventListener("keyup", function () {
                clearTimeout(miniSearchTimeOut);
                miniSearchTimeOut = setTimeout(hideMiniSearch, timeout, trigger);
            });
        }
    }
})();

TypeaheadSearch.InitSearchesCollection = function (collection) {
    collection.forEach(function (dataSource) {
        let options = {
            pageSize: dataSource.dataset.pageSize,
            forceInit: dataSource.dataset.forceInit,
            searchFeedUrls: [
                dataSource.dataset.searchFeedUrl
            ],
            resultsTemplateIds: [
                dataSource.dataset.resultsTemplateId
            ]
        };
        if (dataSource.dataset.resultsPageUrl) {
            options.resultsPageUrl = dataSource.dataset.resultsPageUrl;
        }
        if (dataSource.dataset.goToFirstSearchResultOnEnter) {
            options.goToFirstSearchResultOnEnter = dataSource.dataset.goToFirstSearchResultOnEnter;
        }
        if (dataSource.dataset.groupsFeedUrl) {
            options.groupsFeedUrl = dataSource.dataset.groupsFeedUrl;
            if (dataSource.dataset.selectedGroup) {
                options.selectedGroup = dataSource.dataset.selectedGroup;
            }
            if (dataSource.dataset.groupsParameter) {
                options.groupsParameter = dataSource.dataset.groupsParameter;
            }
        }
        if (dataSource.dataset.searchParameter) {
            options.searchParameter = dataSource.dataset.searchParameter;
        }
        if (dataSource.dataset.secondSearchFeedUrl) {
            options.searchFeedUrls.push(dataSource.dataset.secondSearchFeedUrl);
            options.resultsTemplateIds.push(dataSource.dataset.secondResultsTemplateId);
        }
        new TypeaheadSearch(dataSource.id, options);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    TypeaheadSearch.InitSearchesCollection(document.querySelectorAll(".js-search-data-source"));
});

document.querySelectorAll(".js-handlebars-root").forEach(function (ajaxContainer) {
    ajaxContainer.addEventListener("contentLoaded", function (e) {
        TypeaheadSearch.InitSearchesCollection(ajaxContainer.querySelectorAll(".js-search-data-source"));
    }, false);
});