var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ddd;
(function (ddd) {
    var StringVo = /** @class */ (function () {
        function StringVo(value) {
            this.value = value;
        }
        StringVo.prototype._type_StringVo = function () { };
        return StringVo;
    }());
    ddd.StringVo = StringVo;
})(ddd || (ddd = {}));
var postit;
(function (postit) {
    var Package = /** @class */ (function (_super) {
        __extends(Package, _super);
        function Package() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Package.prototype.getName = function () {
            var a = this.value.split('.');
            return new Name(a[a.length - 1]);
        };
        Package.prototype.getParent = function () {
            var i = this.value.lastIndexOf('.');
            if (i == -1) {
                throw new Error('parent not found'); // いいの？ 空文字返して無限ループに入るよりは良い
            }
            return new Package(this.value.slice(0, i));
        };
        Package.prototype.append = function (name) {
            return new Package(this.value + "." + name.value);
        };
        Package.prototype._type_Package = function () { };
        return Package;
    }(ddd.StringVo));
    postit.Package = Package;
    var Name = /** @class */ (function (_super) {
        __extends(Name, _super);
        function Name() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Name.prototype._type_Name = function () { };
        return Name;
    }(ddd.StringVo));
    postit.Name = Name;
    var Text = /** @class */ (function (_super) {
        __extends(Text, _super);
        function Text() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Text.prototype._type_Text = function () { };
        return Text;
    }(ddd.StringVo));
    postit.Text = Text;
    var Type;
    (function (Type) {
        Type[Type["package"] = 0] = "package";
        Type[Type["element"] = 1] = "element";
    })(Type = postit.Type || (postit.Type = {}));
    var Node = /** @class */ (function () {
        function Node(p, t) {
            this.package = p;
            this.type = t;
        }
        return Node;
    }());
    postit.Node = Node;
    var Element = /** @class */ (function (_super) {
        __extends(Element, _super);
        function Element(p, t, text, dependences) {
            var _this = _super.call(this, p, t) || this;
            _this.text = text;
            _this.dependences = dependences;
            return _this;
        }
        return Element;
    }(Node));
    function isNode(key, value) {
        if (key[0] == key[0].toLocaleUpperCase()) {
            return false;
        }
        if (typeof value == 'string') {
            return false;
        }
        return true;
    }
    postit.isNode = isNode;
    function isElement(key) {
        return key[0] == key[0].toLocaleUpperCase();
    }
    postit.isElement = isElement;
    function parse(data, package) {
        var nodes = [];
        //package = package || new Package('$');
        Object.keys(data)
            .map(function (key) {
            var value = data[key];
            var currentPackage = package ? package.append(new Name(key)) : new Package(key);
            if (isElement(key)) {
                nodes.push(new Element(currentPackage, Type.element, new Text(value.text), (value.dependences || []).map(function (v) { return new Package(v[0] !== '$' ? v : v.split('$').join(package.value)); })));
            }
            else if (isNode(key, value)) {
                nodes = parse(value, currentPackage).reduce(function (m, n) { m.push(n); return m; }, nodes);
            }
        });
        return nodes;
    }
    postit.parse = parse;
})(postit || (postit = {}));
var dom;
(function (dom) {
    var ElementDomModel = /** @class */ (function () {
        function ElementDomModel(type, p, n, t, x, y, cX, cY, w, h) {
            this.type = type;
            this.package = p;
            this.name = n;
            this.text = t;
            this.x = x;
            this.y = y;
            this.centerX = cX;
            this.centerY = cY;
            this.width = w;
            this.height = h;
            this.right = x + w;
            this.bottom = y + h;
        }
        return ElementDomModel;
    }());
    dom.ElementDomModel = ElementDomModel;
    var LineModel = /** @class */ (function () {
        function LineModel(from, to) {
            this.from = from;
            this.to = to;
        }
        LineModel.prototype.getSvgLine = function () {
            var dotMargin = 12;
            var x1 = this.from.centerX;
            var y1 = this.from.centerY;
            if (this.to.centerY - this.from.centerY >= 0) {
                y1 = this.from.y + this.from.height;
            }
            else {
                y1 = this.from.y;
            }
            // 線の計算をする
            return {
                x1: x1,
                y1: y1,
                x2: this.to.x + dotMargin,
                y2: this.to.centerY
            };
        };
        return LineModel;
    }());
    dom.LineModel = LineModel;
    // 本当はここでdomを使わずに計算的に位置を決定したい
    function createHtml(data, path) {
        var memo = '';
        Object.keys(data)
            .map(function (key) {
            var value = data[key];
            var currentPath = path ? path + "." + key : key;
            if (postit.isElement(key)) {
                var text = value.text.split('\n').map(function (v, i) { return i == 0 ? "" + v : "<p>" + v + "</p>"; }).join('\n');
                var style = ['margin-left', 'margin-top']
                    .filter(function (key) { return value[key]; })
                    .map(function (key) { return key + ":" + value[key] + "px"; })
                    .join(';');
                memo += "<li data-package=\"" + currentPath + "\" data-name=\"" + key + "\" style=\"" + style + "\">" + text + "</li>\n";
            }
            else if (postit.isNode(key, value)) {
                memo += "<ul class=\"package\" data-package=\"" + currentPath + "\" data-name=\"" + key + "\">" + createHtml(value, currentPath) + "</ul>\n";
            }
        });
        return memo;
    }
    dom.createHtml = createHtml;
})(dom || (dom = {}));
var ElementDomModelRepositoryImpl = /** @class */ (function () {
    function ElementDomModelRepositoryImpl(offset, liList, ulList) {
        var screenPos = offset;
        var list = [];
        liList.forEach(function (v) { return list.push(v); });
        if (ulList) {
            ulList.forEach(function (v) { return list.push(v); });
        }
        this.domList = list
            .map(function (v) { return ({ tagName: v.tagName, package: v.getAttribute('data-package'), rect: v.getBoundingClientRect(), text: v.innerText, name: v.getAttribute('data-name') }); })
            .map(function (v) { return ({
            tagName: v.tagName,
            package: v.package,
            name: v.name,
            text: v.text,
            x: window.scrollX + v.rect.left - screenPos.x,
            y: window.scrollY + v.rect.top - screenPos.y,
            centerX: window.scrollX + v.rect.left + v.rect.width / 2 - screenPos.x,
            centerY: window.scrollY + v.rect.top + v.rect.height / 2 - screenPos.y,
            w: v.rect.width,
            h: v.rect.height
        }); })
            .map(function (v) { return new dom.ElementDomModel(v.tagName == 'UL' ? postit.Type.package : postit.Type.element, new postit.Package(v.package), new postit.Name(v.name), new postit.Text(v.text), v.x, v.y, v.centerX, v.centerY, v.w, v.h); });
    }
    ElementDomModelRepositoryImpl.prototype.findByPackage = function (p) {
        var a = this.domList.filter(function (v) { return v.package.value == p.value; });
        if (a.length == 0) {
            throw new Error("dom not found: " + p);
        }
        return a[0];
    };
    ElementDomModelRepositoryImpl.prototype.findPackageType = function () {
        return this.domList.filter(function (v) { return v.type == postit.Type.package; });
    };
    return ElementDomModelRepositoryImpl;
}());
function createLineRaw(parsedInput, elementDomModelRepository) {
    var lineList = [];
    parsedInput.forEach(function (v) {
        var from = elementDomModelRepository.findByPackage(v.package);
        v.dependences
            .map(function (d) { return new dom.LineModel(from, elementDomModelRepository.findByPackage(d)); })
            .map(function (d) { return d.getSvgLine(); })
            .map(function (d) { return "<polyline points=\"" + d.x1 + "," + d.y1 + " " + d.x2 + "," + d.y2 + "\"  />"; })
            .forEach(function (t) { return lineList.push(t); });
    });
    return lineList.join('\n');
}
function createSvg(viewBoxSize, elementDomModelRepository, parsedInput) {
    var lineRaw = createLineRaw(parsedInput, elementDomModelRepository);
    var textRaw = parsedInput
        .map(function (v) { return elementDomModelRepository.findByPackage(v.package); })
        .map(function (v) {
        var t = v.text.value.trim().split('\n')
            .filter(function (v) { return v.trim().length > 0; })
            .map(function (p, i) {
            var dx = (i == 0 ? '4' : '19');
            var dy;
            if (i == 0) {
                dy = '12';
            }
            else if (i == 1) {
                dy = '20';
            }
            else {
                dy = '16';
            }
            return "<tspan x=\"" + v.x + "\" dx=\"" + dx + "\" dy=\"" + dy + "\">" + (i == 0 ? '・' : '') + p + "</tspan>";
        })
            .join('');
        return "<text dx=\"4\" x=\"" + v.x + "\" y=\"" + (v.y - 6) + "\">" + t + "</text>";
    })
        .join('\n');
    var rectRaw = parsedInput
        .map(function (v) { return elementDomModelRepository.findByPackage(v.package); })
        .map(function (v) { return "<rect x=\"" + v.x + "\" y=\"" + v.y + "\" rx=\"3\" ry=\"3\" width=\"" + v.width + "\" height=\"" + v.height + "\" />"; })
        .join('\n');
    var packageTextRaw = elementDomModelRepository.findPackageType()
        .map(function (v) { return "<text dx=\"24\" dy=\"24\" x=\"" + v.x + "\" y=\"" + v.y + "\" font-size=\"11\">" + v.name.value + "</text>"; })
        .join('\n');
    return ("\n<svg xmlns=\"http://www.w3.org/2000/svg\" id=\"svgCanvas\" viewBox=\"0 0 " + viewBoxSize.width + " " + viewBoxSize.height + "\">\n  <defs>\n    <style>\n    #package-text-group {\n      stroke:#333;\n      dominant-baseline:text-before-edge;\n    }\n    #rect-group {\n      stroke:#880;\n      fill:#ff8\n    }\n    #text-group {\n      stroke:#333;\n      dominant-baseline:text-before-edge;\n    }\n    #line-group {\n      stroke:#333;\n      marker-end:url(#Triangle);\n      fill:none;\n      stroke-width:1;\n    }\n    </style>\n    <marker id=\"Triangle\" viewBox=\"0 0 10 10\" refX=\"12\" refY=\"5\"\n        markerWidth=\"6\" markerHeight=\"6\" orient=\"auto\" fill=\"#333\">\n      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\n    </marker>\n  </defs>\n  <g id=\"package-text-group\">" + packageTextRaw + "</g>\n  <g id=\"rect-group\">" + rectRaw + "</g>\n  <g id=\"text-group\">" + textRaw + "</g>\n  <g id=\"line-group\">" + lineRaw + "</g>\n</svg>\n  ").trim();
}
// ----------------------------------
// これより下は document に触れる系
function querySelectorAll(selector) {
    var l = document.querySelectorAll(selector);
    l.filter = Array.prototype.filter;
    l.map = Array.prototype.map;
    l.forEach = Array.prototype.forEach;
    return l;
}
function main(input) {
    // テキスト計算用DOMを作る
    document.querySelector('#root').innerHTML = dom.createHtml(input);
    var elementDomModelRepository = new ElementDomModelRepositoryImpl([document.querySelector('.screen').getBoundingClientRect()].map(function (s) { return ({ x: window.scrollX + s.left, y: window.scrollY + s.top }); })[0], querySelectorAll('li'), querySelectorAll('ul'));
    var svg = createSvg([document.querySelector('#root')].map(function (v) { return ({ width: v.clientWidth, height: v.clientHeight }); })[0], elementDomModelRepository, postit.parse(input));
    // テキスト計算用DOM削除
    document.querySelector('#root').innerHTML = '';
    return svg;
}
