const BUTTON_MODE_REMOVE = "remove";
const BUTTON_MODE_ADD = "add";

function DownloadCart(options) {
    const self = this;
    const defaults = {
        addButtonText: "Add",
        removeButtonText: "Remove",
        removeIcon: "fa-minus",
        addIcon: "fa-plus"
        //cartPageId
        //contextId
    };

    this.settings = Object.assign({}, defaults, options);
    this.Init();
}

DownloadCart.prototype.Init = function () {
    const self = this;
    let settings = this.settings;

    document.addEventListener("downloadCartContentLoaded", function (event) {
        self.cartContent = event.detail.cart;
        self.UpdateMiniCartCounter();
    }, false);

    document.addEventListener("DOMContentLoaded", function (event) {
        self.UpdateCartContent(function () {
            self.AddEventsToButtons(document);
        });

        //Make it work with Ajax loaded content
        document.addEventListener("contentLoaded", function (event) {
            self.AddEventsToButtons(document.getElementById(event.detail.containerId));
        }, false);

        //Make it work with updating templates
        document.addEventListener("updateTemplate", function (event) {
            self.AddEventsToButtons(document.getElementById(event.detail.containerId));
        }, false);
    });
}

DownloadCart.prototype.UpdateMiniCartCounter = function () {
    let miniCartCounter = document.querySelector(".js-download-cart-counter");
    miniCartCounter.classList.remove("u-hidden");
    miniCartCounter.innerText = this.cartContent.numberofproducts;
}

DownloadCart.prototype.AddEventsToButtons = function (container) {
    const self = this;
    let settings = this.settings;

    let buttons = container.querySelectorAll(".js-add-to-downloads");
    if (!buttons.length) {
        return;
    }

    let orderLines = this.cartContent.OrderLines;

    buttons.forEach(function (button) {
        let productItem = self.GetProductItemFromButton(button);
        let orderLine = orderLines.length > 0 ? self.GetOrderLine(productItem, orderLines) : null;

        if (orderLine != null) {
            self.SwitchButtonMode(button, BUTTON_MODE_REMOVE, function () {
                self.RemoveFromDownloadCart(orderLine.orderLineId, button);
            });
        } else {
            self.SwitchButtonMode(button, BUTTON_MODE_ADD, function () {
                self.AddToDownloadCart(productItem, button);
            });
        }
    });
}

DownloadCart.prototype.EnableButton = function (button) {
    button.removeChild(button.querySelector(".btn-spinner"));
    button.classList.remove("u-position-relative");
    for (let i = 0; i < button.children.length; i++) {
        button.children[i].classList.remove("u-visibility-hidden");
    };
    button.classList.remove("disabled");
    button.disabled = false;
}

DownloadCart.prototype.DisableButton = function (button) {
    button.classList.add("u-position-relative");

    for (let i = 0; i < button.children.length; i++) {
        button.children[i].classList.add("u-visibility-hidden");
    };

    button.classList.add("disabled");
    button.disabled = true;
    let spinner = document.createElement("i");
    spinner.className = "fas fa-circle-notch fa-spin btn-spinner";

    button.appendChild(spinner);
}

DownloadCart.prototype.GetOrderLine = function (productItem, orderLines) {
    return orderLines.find(function(orderline, index, array){
        return orderline.id == productItem.productId;
    });
}

DownloadCart.prototype.AddToDownloadCart = function (productItem, button, onSuccessHandler) {
    const self = this;
    let settings = this.settings;

    let url = "/Default.aspx?ID=" + settings.cartPageId + "&Quantity=1&redirect=false&CartCmd=add&ProductID=" + productItem.productId;
    if (settings.contextId) {
        url += "&OrderContext=" + settings.contextId;
    }

    this.DisableButton(button);

    Request.Fetch().get(url,
        function (result) {
            if (onSuccessHandler) {
                onSuccessHandler(result);
            } else {
                //default
                self.SwitchButtonMode(button, BUTTON_MODE_REMOVE, function () {
                    self.RemoveFromDownloadCart(self.GetOrderLine(productItem, result[0].OrderLines).orderLineId, button)
                });
                self.EnableButton(button);
            }
            let event = new CustomEvent("downloadCartContentLoaded", { "detail": { "cart": result[0] } });
            document.dispatchEvent(event);
        },
        function () {
            console.error("DownloadCart: Error in AddToDownloadCart request");
        }
    );
}

DownloadCart.prototype.SwitchButtonMode = function (button, mode, onclick) {
    if (button.getAttribute("data-mode") == mode) {
        return;
    }

    let settings = this.settings;

    let iconElement = button.getElementsByClassName("js-button-icon")[0];
    iconElement.classList.toggle(settings.addIcon, mode == BUTTON_MODE_ADD);
    iconElement.classList.toggle(settings.removeIcon, mode == BUTTON_MODE_REMOVE);

    let span = button.getElementsByClassName("js-button-text")[0];
    if (span != null) {
        span.innerText = (mode == BUTTON_MODE_REMOVE ? settings.removeButtonText : settings.addButtonText);
    }

    button.title = (mode == BUTTON_MODE_REMOVE ? settings.removeButtonText : settings.addButtonText);
    button.setAttribute("data-mode", mode);
    button.onclick = onclick;
}

DownloadCart.prototype.GetProductItemFromButton = function (button) {
    return {
        productId: button.getAttribute("data-product-id")
    };
}

DownloadCart.prototype.RemoveFromDownloadCart = function (orderLineId, button, onSuccessHandler) {
    const self = this;
    let settings = this.settings;

    let url = "/Default.aspx?ID=" + settings.cartPageId + "&redirect=false&CartCmd=DelOrderLine&key=" + orderLineId;
    if (settings.contextId) {
        url += "&OrderContext=" + settings.contextId;
    }

    this.DisableButton(button);

    Request.Fetch().get(url,
        function (result) {
            if (onSuccessHandler) {
                onSuccessHandler(result);
            } else {
                //default
                self.SwitchButtonMode(button, BUTTON_MODE_ADD, function () {
                    self.AddToDownloadCart(self.GetProductItemFromButton(button), button)
                });
                self.EnableButton(button);
            }
            let event = new CustomEvent("downloadCartContentLoaded", { "detail": { "cart": result[0] } });
            document.dispatchEvent(event);
        },
        function () {
            console.error("DownloadCart: Error in RemoveFromDownloadCart request");
        }
    );
}

DownloadCart.prototype.EmptyCart = function (callBack) {
    let settings = this.settings;

    let url = "/Default.aspx?ID=" + settings.cartPageId + "&cartcmd=emptycart";
    if (settings.contextId) {
        url += "&OrderContext=" + settings.contextId;
    }

    Request.Fetch().get(url,
        function (result) {
            if (callBack != null) {
                callBack(result);
            }
            let event = new CustomEvent("downloadCartContentLoaded", { "detail": { "cart": result[0] } });
            document.dispatchEvent(event);
        },
        function (result) {
            console.error("DownloadCart: Error in Empty cart request request");
        },
        false
    );
}

DownloadCart.prototype.UpdateCartContent = function (onSuccess) {
    const self = this;
    let settings = this.settings;

    let url = "/Default.aspx?ID=" + settings.cartPageId;

    if (settings.contextId) {
        url += "&OrderContext=" + settings.contextId;
    }

    Request.Fetch().get(url,
        function (result) {
            //here actually will be cartContent property update
            let event = new CustomEvent("downloadCartContentLoaded", { "detail": { "cart": result[0] } });
            document.dispatchEvent(event);

            //be sure that content is assigned (fix)
            self.cartContent = result[0];
            onSuccess(result[0]);
        }, function (result) {
            console.error("DownloadCart: Error in GetCartContent request");
        }
    );
}

//useless function
DownloadCart.prototype.GetOrderLines = function () {
    return this.cartContent.OrderLines;
}