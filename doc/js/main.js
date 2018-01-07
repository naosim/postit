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
    })(Type || (Type = {}));
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
        function ElementDomModel(p, t, x, y, cX, cY, w, h) {
            this.package = p;
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
    function createHtml(data, path) {
        var memo = '';
        Object.keys(data)
            .map(function (key) {
            var value = data[key];
            var currentPath = path ? path + "." + key : key;
            if (postit.isElement(key)) {
                var text = value.text.split('\n').map(function (v, i) { return i == 0 ? "" + v : "<p>" + v + "</p>"; }).join('\n');
                memo += "<li data-package=\"" + currentPath + "\" data-name=\"" + key + "\">" + text + "</li>\n";
            }
            else if (postit.isNode(key, value)) {
                memo += "<ul data-package=\"" + currentPath + "\" data-name=\"" + key + "\">" + createHtml(value, currentPath) + "</ul>\n";
            }
        });
        return memo;
    }
    dom.createHtml = createHtml;
})(dom || (dom = {}));
function createFindElementDomPosition(offset, liList) {
    var screenPos = offset;
    var domList = liList
        .map(function (v) { return ({ package: v.getAttribute('data-package'), rect: v.getBoundingClientRect(), text: v.innerText }); })
        .map(function (v) { return ({
        package: v.package,
        text: v.text,
        x: window.scrollX + v.rect.left - screenPos.x,
        y: window.scrollY + v.rect.top - screenPos.y,
        centerX: window.scrollX + v.rect.left + v.rect.width / 2 - screenPos.x,
        centerY: window.scrollY + v.rect.top + v.rect.height / 2 - screenPos.y,
        w: v.rect.width,
        h: v.rect.height
    }); })
        .map(function (v) { return new dom.ElementDomModel(new postit.Package(v.package), new postit.Text(v.text), v.x, v.y, v.centerX, v.centerY, v.w, v.h); });
    return function (p) {
        var a = domList.filter(function (v) { return v.package.value == p; });
        if (a.length == 0) {
            throw new Error("dom not found: " + p);
        }
        return a[0];
    };
}
function createLineRaw(parsedInput, findElementDomPosition) {
    var lineList = [];
    parsedInput.forEach(function (v) {
        var from = findElementDomPosition(v.package.value);
        v.dependences
            .map(function (d) { return new dom.LineModel(from, findElementDomPosition(d.value)); })
            .map(function (d) { return d.getSvgLine(); })
            .map(function (d) { return "<polyline points=\"" + d.x1 + "," + d.y1 + " " + d.x2 + "," + d.y2 + "\"  />"; })
            .forEach(function (t) { return lineList.push(t); });
    });
    return lineList.join('\n');
}
function createSvg(viewBoxSize, findElementDomPosition, parsedInput) {
    var lineRaw = createLineRaw(parsedInput, findElementDomPosition);
    var textRaw = parsedInput
        .map(function (v) { return findElementDomPosition(v.package.value); })
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
        .map(function (v) { return findElementDomPosition(v.package.value); })
        .map(function (v) { return "<rect x=\"" + v.x + "\" y=\"" + v.y + "\" rx=\"3\" ry=\"3\" width=\"" + v.width + "\" height=\"" + v.height + "\" />"; })
        .join('\n');
    return ("\n<svg xmlns=\"http://www.w3.org/2000/svg\" id=\"svgCanvas\" viewBox=\"0 0 " + viewBoxSize.width + " " + viewBoxSize.height + "\">\n  <defs>\n    <style>\n    #rect-group {\n      stroke:#880;\n      fill:#ff8\n    }\n    #text-group {\n      stroke:#333;\n      dominant-baseline:text-before-edge;\n    }\n    #line-group {\n      stroke:#333;\n      marker-end:url(#Triangle);\n      fill:none;\n      stroke-width:1;\n    }\n    </style>\n    <marker id=\"Triangle\" viewBox=\"0 0 10 10\" refX=\"12\" refY=\"5\"\n        markerWidth=\"6\" markerHeight=\"6\" orient=\"auto\" fill=\"#333\">\n      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\n    </marker>\n  </defs>\n  <g id=\"rect-group\">" + rectRaw + "</g>\n  <g id=\"text-group\">" + textRaw + "</g>\n  <g id=\"line-group\">" + lineRaw + "</g>\n</svg>\n  ").trim();
}
