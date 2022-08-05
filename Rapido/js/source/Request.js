var requestDebug = window.location.search.indexOf('debug=true') >= 0 ? true : false;

function Request() {
    this.xhr;
}

Request.prototype.newRequest = function (url, method, data, successCallback, errorCallback, returnJson) {

    if (returnJson == null) {
        returnJson = true;
    }

    this.xhr = new XMLHttpRequest();
    this.xhr.open(method, url, true);
    this.xhr.onreadystatechange = function () {
        const self = this;
        function error(message) {
            console.warn(message);

            if (typeof errorCallback == "function") {
                errorCallback(this.response);
            }
        }

        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            var data;

            if (this.responseType === 'json') {
                data = this.response.message.trim();
            } else {
                data = this.response.trim();
            }

            if (requestDebug) {
                console.info("%cData: ", consoleStyles.success, data);
            }

            if (returnJson) {
                if (data == "") {
                    console.warn(url + ": Response is empty");
                    data = {};
                } else if (data.indexOf("<") == 0) {
                    error.call(self, url + ": URL returned HTML instead of JSON");
                    return;
                } else {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        error.call(self, url + ": Could not parse the JSON data");
                        return;
                    }
                }
            }

            if (typeof successCallback == "function") {
                successCallback(data);
            }
        } else if (this.readyState == XMLHttpRequest.DONE && this.status != 200) {
            error.call(self, url + ": XMLHttpRequest failed");
        }
    };

    this.xhr.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
    this.xhr.setRequestHeader('cache-control', 'max-age=0');
    this.xhr.setRequestHeader('expires', '0');
    this.xhr.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
    this.xhr.setRequestHeader('pragma', 'no-cache');

    if (data) {
        if (data instanceof FormData) {
            this.xhr.send(data);
        } else {
            let formData = new FormData();
            for (let key in data) {                                                                                        
                formData.append(key, data[key]);
            }
            this.xhr.send(formData);
        }
        
    } else {
        this.xhr.send();
    }
};

Request.prototype.Fetch = function () {
    var self = this;

    return {
        get: function (url, successCallback, errorCallback, returnJson) {
            self.newRequest(url, "GET", null, successCallback, errorCallback, returnJson);
        },

        post: function (url, data, successCallback, errorCallback, returnJson) {
            self.newRequest(url, "POST", data, successCallback, errorCallback, returnJson);
        }
    };
};

Request.prototype.AjaxFormSubmit = function (event, form, successCallback, errorCallback) {
    event.preventDefault(); //prevent native form submit

    if (!form.reportValidity()) { //activate native validation
        return false;
    }

    let formData = new FormData(form); //create object with all form fields

    if (form.method.toLowerCase() == "get") {
        let queryArray = new QueryArray(form.action);
        for (var key of formData.keys()) {
            queryArray.setValue(key, formData.get(key));
        }
        Request.Fetch().get(
            queryArray.getFullUrl(),
            successCallback,
            errorCallback
        );
    } else {
        Request.Fetch().post(
            form.action,
            formData,
            successCallback,
            errorCallback
        );
    }
}

var Request = new Request();