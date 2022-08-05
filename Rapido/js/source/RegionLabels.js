var RegionLabels = function () { };

RegionLabels.prototype.InitDictionary = function (dictionary) {
    if (this.dictionary == null) {
        this.dictionary = dictionary;
    }
}

RegionLabels.prototype.LocalizeRegionLabels = function (regionFieldId, countryFieldId, autoUpdate) {
    let countryField = document.getElementById(countryFieldId);
    let regionFieldLabel = document.querySelector("label[for='" + regionFieldId + "']");

    if (countryField) {
        let selectedCountry = countryField.value;
        if (regionFieldLabel && this.dictionary[selectedCountry]) {
            regionFieldLabel.innerText = this.dictionary[selectedCountry];
        }
    }

    if (autoUpdate) {
        let self = this;
        countryField.addEventListener("change", function () {
            self.LocalizeRegionLabels(regionFieldId, countryFieldId);
        });
    }
}

var regionLabels = new RegionLabels();