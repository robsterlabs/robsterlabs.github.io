var myModule = angular.module('ngcart', []);

myModule.factory('ngcartHelper', function () {
    var sort_by = function (field, reverse, primer) {
        var key = primer ? function (x) {
            return primer(x[field])
        } : function (x) {
            return x[field]
        };
        reverse = [-1, 1][+!!reverse];
        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
    };

    return {
        sort_by: sort_by
    };
});

myModule.service('ngcartModel', function () {
    var service = this,
            pricing = {
                "id": 1,
                "extra": 0.33,
                "taxrate": 0.15,
                "delivery": 1.3,
                "discount": 0,
                "saving": 0,
                "ticket": 0,
                "taxes": 0,
                "total": 0
            };

    service.getPricing = function () {
        return pricing;
    };
});

myModule.controller('myCtrl', function ($scope, $http) {
    $http.get("welcome.htm")
            .then(function (response) {
                $scope.myWelcome = response.data;
            });
});

myModule.controller('ShopCtrl', function (ngcartModel, ngcartHelper, $http) {
    $http({
        method: 'GET',
        url: 'http://robsterlabs.github.io/data.json'
    }).then(function successCallback(response) {
        shop.products = response.data;
    }, function errorCallback(response) {
        console.log(response)
    });

    var shop = this;

    shop.pricing = ngcartModel.getPricing();
    shop.cartindex = [];
    shop.cart = [];

    shop.add = function (product) {
        var element = document.getElementById('product' + product.id);
        var extras = [];
        var detail = [];
        var cartid = [product.title, product.id];
        for (var j = 0, k = product.modifiers.length; j < k; j++) {
            var inputs = element.getElementsByClassName('class' + product.modifiers[j].title);
            var mod = false;
            for (var i = 0, l = inputs.length; i < l; i++) {
                if (inputs[i].type === 'checkbox' && inputs[i].checked === true) {
                    mod = true;
                    detail[detail.length] = inputs[i].parentNode.innerText;
                    extras[extras.length] = inputs[i].value;
                }
            }
            cartid[cartid.length] = !mod ? [product.modifiers[j].title, extras.join('')] : '';
        }
        cartid = hex_md5(cartid.join(''));
        if (shop.cartindex.indexOf(cartid) === -1) {
            shop.cart[cartid] = [];
            shop.cartindex[shop.cartindex.length] = cartid;
        }
        shop.cart[cartid][shop.cart[cartid].length] = {
            id: cartid,
            grossprice: product.price + (extras.length * shop.pricing.extra) - shop.pricing.discount - (shop.pricing.saving * shop.pricing.ticket),
            title: product.title,
            extras: extras,
            detail: detail.join(',')
        };
        shop.setTotals();
    };

    shop.setTotals = function () {
        var total = 0;
        var html = [];
        var helper = [];
        for (var j = 0, k = shop.cartindex.length; j < k; j++) {
            var cartid = shop.cartindex[j];
            var amount = shop.cart[cartid].length;
            var adding = shop.cart[cartid][0].extras.length === 0 ? '' : 'Adding:' + shop.cart[cartid][0].detail;
            var template = ['<a href="#" title="', adding, '" class="list-group-item overauto', '">', amount, '&nbsp;', shop.cart[cartid][0].title, '<span class="pull-right">$', shop.cart[cartid][0].grossprice, '</span></a>'];
            helper[helper.length] = {title: shop.cart[cartid][0].title, line: template.join('')};
            total += shop.cart[cartid][0].grossprice * amount;
        }
        helper = helper.sort(ngcartHelper.sort_by("title", true));
        for (var j = 0, k = helper.length; j < k; j++) {
            html[html.length] = helper[j].line;
        }
        document.getElementById('cart').innerHTML = html.join('');
        var taxes = total * shop.pricing.taxrate;
        var final = shop.pricing.delivery + taxes + total;
        shop.pricing.taxes = taxes.toFixed(2) - 0;
        shop.pricing.total = final.toFixed(2) - 0;
    }
});

myModule.directive('modifier', function () {
    return {
        scope: true,
        replace: true,
        template: '<div><p>{{product.modifiers.title}}</h4></div>'
    }
});