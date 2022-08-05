var Checkout = function() {};


/**
 * Initialize
 */

Checkout.prototype.init = function () {
    const self = this;
    this.form = document.querySelector(this.options.form);

    // Bail if form not found
    if (this.form == null) return;

    this.cart = this.form.dataset.request;
    this.wrapper = document.querySelector(this.options.selectors.parcel.wrapper);

    this.zip = document.querySelector(this.options.selectors.parcel.zip);
    this.street = document.querySelector(this.options.selectors.parcel.street);

    // Bail early
    if (this.zip == null || this.street == null) return;


    /**
     * Array of fields to interact with
     * formdata key : DOM element
     */

    this.searchfields = {
        'EcomOrderCustomerZip': this.zip,
        'EcomOrderCustomerAddress': this.street,
    }

    // Global object to store all data
    this.formData = {};

    // Collect data on load
    this.setFormData();

    // Search parcel onload, required since it uses EcomOrderCustomer values to display parcels
    this.searchParcel();

    // Triggers search on input change
    this.search();
}



/**
 * Set current available formdata
 */

Checkout.prototype.setFormData = function () {
    const self = this;

    Object.keys(self.searchfields).forEach(function (key) {
        let field = self.searchfields[key];

        // Skip items that doesn't exist
        if (field == null) return;

        self.formData[key] = field.value;
    });
}



/**
 * Get current available formdata
 */

Checkout.prototype.getFormData = function () {
    return self.formData;
}



/**
 * AJAX request when changing input values of search fields
 */

Checkout.prototype.search = function () {
    const self = this;

    Object.keys(self.searchfields).forEach(function (key) {
        let field = self.searchfields[key];

        field.addEventListener('input', Helpers.debounce(500, function (e) {

            // Change / add value in global from data object
            self.formData[key] = e.target.value;

            self.searchParcel();

        }));
    });

}



/**
 * Helper to send parcelshop request
 */

Checkout.prototype.searchParcel = function () {
    const self = this;
    let Ajax = new rapidoAjax(self.options.form);

    Ajax.request(self.formData, 'ParcelShop', false, function (xhr) {
        self.wrapper.classList.remove(self.options.states.hidden);
        self.wrapper.innerHTML = xhr.response;
    });
}


var Checkout = new Checkout();


document.addEventListener('DOMContentLoaded', function() {
    
    /**
     * Setup defaults
     */

    Checkout.Defaults = {
        form: '#AjaxContainer',

        selectors: {
            content: 'content',
            parcel: {
                wrapper: '.js-parcels',
                zip: '.js-parcel-zip',
                street: '.js-parcel-street',
            },
        },

        states: {
            hidden: 'u-hidden',
        }
    }

    Checkout.options = Object.assign({}, Checkout.Defaults);

    document.addEventListener('rapidoAjaxComplete', function() {
        Checkout.init();
    }, false);

});