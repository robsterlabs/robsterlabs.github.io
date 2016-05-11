var shop = {
    start: function (url) {
        var url = url || 'http://robsterlabs.github.io/data.json'; // url should be defined here to initialize shop. It might be called on body load (see: index.html line 18)
        httpGet(url, function (data) {
            shop.product.setData(JSON.parse(data));
            if (data.length > 0) {
                shop.init();
            }
        })
    },
    init: function () {
        var products = this.product.getAll();
        var html = [];
        for (var i = 0; i < products.length; i++) {
            var esto = products[i];
            var mods = [];
            for (var j = 0; j < esto.modifiers.length; j++) {
                var c = j % 2 === 0 ? 'pull-left' : 'pull-right';
                var template = ['<ul class="pull-left list-unstyled"><li>', esto.modifiers[j].title, '</li>'];
                for (var k = 0; k < esto.modifiers[j].mods.length; k++) {
                    var m = esto.modifiers[j].mods[k];
                    var s = m.selected === true ? 'checked' : '';
                    switch (esto.modifiers[j].id) {
                        case 2:
                            template.push('<li>&nbsp;<input type="radio" name="', esto.modifiers[j].title,
                                    esto.id, esto.modifiers[j].id, '" value="', m.id, '">&nbsp;', m.title, '</li>');
                            break;
                        case 1:
                        default:
                            template.push('<li>&nbsp;<input class="class', esto.modifiers[j].title,
                                    '" type="checkbox" value="', m.id, '" ', s, '>&nbsp;', m.title, '</li>');
                            break;
                    }
                }
                template[template.length] = '</ul>';
                mods[mods.length] = template.join('');
            }
            var template = [
                '<div id="product', esto.id, '" class="well well-sm">', esto.title,
                '<a class="btn btn-primary pull-right" type="button" href="#" onclick="shop.cart.add(', esto.id, ')">Add</a><br>',
                '<ul class="pull-left list-unstyled small"><li>', esto.description, '</li></ul><div class="clear"></div>', mods.join(''), '</div>'
            ];
            html[html.length] = template.join('');
        }
        document.getElementById('products').innerHTML = html.join('');
    },
    product: {
        data: [],
        getAll: function () {
            return this.data;
        },
        getById: function (id) {
            var p = {};
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].id === id) {
                    p = this.data[i];
                    break;
                }
            }
            return p;
        },
        setData: function (data) {
            this.data = data;
        }
    },
    cart: {
        data: [],
        add: function (id) {
            var product = shop.product.getById(id);
            var element = document.getElementById('product' + id);
            var extras = [];
            var detail = [];
            var cartid = product.title + id;
            for (var j = 0; j < product.modifiers.length; j++) {
                var inputs = element.getElementsByClassName('class' + product.modifiers[j].title);
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].type === 'checkbox' && inputs[i].checked === true) {
                        detail[detail.length] = inputs[i].parentNode.innerText;
                        extras[extras.length] = inputs[i].value;
                    }
                }
                cartid += product.modifiers[j].title + extras.join('');
            }
            shop.cart.data.push({id: product.id, price: product.price, title: product.title,
                cartid: hex_md5(cartid), extras: extras, detail: detail.join(',')});
            this.data = this.data.sort(sort_by("title", true));
            var q = [];
            for (var i = 0; i < this.data.length; i++) {
                var c = this.data[i].cartid;
                var charge = this.data[i].extras.length * 0.33;
                var price = this.data[i].price + charge;
                if (typeof (q[c]) === 'undefined') {
                    q[c] = [1, this.data[i].title, this.data[i].detail, price];
                } else {
                    q[c] = [q[c][0] + 1, this.data[i].title, this.data[i].detail, price];
                }
            }
            var html = [];
            var total = 0;
            var u = [];
            for (var i = 0; i < this.data.length; i++) {
                var c = this.data[i].cartid;
                if (u.indexOf(c) === -1) {
                    var adding = q[c][2].length === 0 ? '' : 'Adding:' + q[c][2];
                    var price = q[c][3] * q[c][0];                                        
                    var template = ['<a href="#" title="', adding, '" class="list-group-item overauto','">',q[c][0], '&nbsp;', q[c][1],'<span class="pull-right">$', price, '</span></a>'];
                    total += price;
                    u.push(c);
                    html[html.length] = template.join('');
                }
            }
            document.getElementById('cart').innerHTML = html.join('');
            var delivery = 1.3;
            var taxes = total * 0.15;
            var final = total + delivery + taxes;
            document.getElementById('delivery').innerHTML = '$' + delivery;
            document.getElementById('taxes').innerHTML = '$' + taxes.toFixed(2);
            document.getElementById('total').innerHTML = '$' + final.toFixed(2);
        }
    }
};
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
}
var httpGet = function (url, callback) {
    if (validURL(url) === true) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                callback(xmlHttp.responseText);
            }
        }
        xmlHttp.open("GET", url, true);
        xmlHttp.send(null);
    }
}
var validURL = function (url) {
    var regex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regex.test(url)
} 