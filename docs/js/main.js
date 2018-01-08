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
        function Node(p, n, t) {
            this.package = p;
            this.name = n;
            this.type = t;
        }
        Node.prototype._type_Node = function () { };
        return Node;
    }());
    postit.Node = Node;
    var Element = /** @class */ (function (_super) {
        __extends(Element, _super);
        function Element(p, n, t, text, dependences) {
            var _this = _super.call(this, p, n, t) || this;
            _this.text = text;
            _this.dependences = dependences;
            return _this;
        }
        Element.prototype._type_Element = function () { };
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
                nodes.push(new Element(currentPackage, new Name(key), Type.element, new Text(value.text), (value.dependences || value.dep || []).map(function (v) { return new Package(v[0] !== '$' ? v : v.split('$').join(package.value)); })));
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
            var dotMargin = 8;
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
})(dom || (dom = {}));
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
    var textRaw = querySelectorAll('#svgCalcCanvas>text').map(function (v) { return v.outerHTML; }).join('\n');
    var rectRaw = parsedInput
        .map(function (v) { return elementDomModelRepository.findByPackage(v.package); })
        .map(function (v) {
        console.log(v);
        return v;
    })
        .map(function (v) { return "<rect x=\"" + v.x + "\" y=\"" + v.y + "\" rx=\"3\" ry=\"3\" width=\"" + v.width + "\" height=\"" + v.height + "\" />"; })
        .join('\n');
    return ("\n<svg xmlns=\"http://www.w3.org/2000/svg\" id=\"svgCanvas\" viewBox=\"0 0 " + viewBoxSize.width + " " + viewBoxSize.height + "\">\n  <defs>\n    <style>\n    #package-text-group {\n      stroke:#333;\n      dominant-baseline:text-before-edge;\n    }\n    #rect-group {\n      stroke:#880;\n      fill:#ff8\n    }\n    #text-group {\n      stroke:#333;\n      dominant-baseline:text-before-edge;\n    }\n    #line-group {\n      stroke:#333;\n      marker-end:url(#Triangle);\n      fill:none;\n      stroke-width:1;\n    }\n    </style>\n    <marker id=\"Triangle\" viewBox=\"0 0 10 10\" refX=\"12\" refY=\"5\"\n        markerWidth=\"6\" markerHeight=\"6\" orient=\"auto\" fill=\"#333\">\n      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\n    </marker>\n  </defs>\n  <g id=\"rect-group\">" + rectRaw + "</g>\n  <g id=\"text-group\">" + textRaw + "</g>\n  <g id=\"line-group\">" + lineRaw + "</g>\n</svg>\n  ").trim();
}
var ElementDomModelRepositoryLogic = /** @class */ (function () {
    function ElementDomModelRepositoryLogic(data) {
        this.viewBoxSize = [document.querySelector('.screen')].map(function (v) { return ({ width: v.clientWidth, height: 1000 }); })[0];
        document.querySelector('#calc').innerHTML = ("\n    <svg xmlns=\"http://www.w3.org/2000/svg\" id=\"svgCalcCanvas\" viewBox=\"0 0 " + this.viewBoxSize.width + " " + this.viewBoxSize.height + "\">\n      <defs>\n        <style>\n        text {\n          dominant-baseline:text-before-edge;\n        }\n        </style>\n      </defs>\n      " + ElementDomModelRepositoryLogic.createSizeDecideSvg(data) + "\n    </svg>\n      ").trim();
        var screenPos = [document.querySelector('.screen').getBoundingClientRect()].map(function (s) { return ({ x: window.scrollX + s.left, y: window.scrollY + s.top }); })[0];
        var list = [];
        querySelectorAll('#svgCalcCanvas>text').forEach(function (v) { return list.push(v); });
        ElementDomModelRepositoryLogic.setupText(this.viewBoxSize);
        var marginX = 16;
        var marginY = 8;
        this.domList = list
            .map(function (v) { return ({ tagName: v.tagName, package: v.getAttribute('data-package'), type: v.getAttribute('data-type'), rect: v.getBoundingClientRect(), text: v.innerText, name: v.getAttribute('data-name') }); })
            .map(function (v) { return ({
            tagName: v.tagName,
            package: v.package,
            type: v.type,
            name: v.name,
            text: v.text,
            x: window.scrollX + v.rect.left - screenPos.x - marginX,
            y: window.scrollY + v.rect.top - screenPos.y - marginY,
            centerX: window.scrollX + v.rect.left + v.rect.width / 2 - screenPos.x,
            centerY: window.scrollY + v.rect.top + v.rect.height / 2 - screenPos.y,
            w: v.rect.width + marginX * 2,
            h: v.rect.height + marginY * 2
        }); })
            .map(function (v) { return new dom.ElementDomModel(v.type == 'package' ? postit.Type.package : postit.Type.element, new postit.Package(v.package), new postit.Name(v.name), new postit.Text(v.text), v.x, v.y, v.centerX, v.centerY, v.w, v.h); });
    }
    ElementDomModelRepositoryLogic.createSizeDecideSvg = function (data, path) {
        var memo = '';
        Object.keys(data)
            .map(function (key) {
            var value = data[key];
            var currentPath = path ? path + "." + key : key;
            if (postit.isElement(key)) {
                var marginLeft = value['margin-left'] ? "margin-left=\"" + value['margin-left'] + "\"" : '';
                var marginTop = value['margin-top'] ? "margin-top=\"" + value['margin-top'] + "\"" : '';
                var text = value.text.indexOf('\n') == -1 ? value.text : value.text.split('\n').map(function (v, i) { return "<tspan x=\"0\" dx=\"0\" dy=\"" + (i == 0 ? '0' : '1.2') + "em\">" + v + "</tspan>"; }).join('\n');
                memo += "<text id=\"" + currentPath + "\" data-package=\"" + currentPath + "\" data-name=\"" + key + "\" data-type=\"element\" " + marginLeft + " " + marginTop + ">" + text + "</text>\n";
            }
            else if (postit.isNode(key, value)) {
                memo += "<text  id=\"" + currentPath + "\" data-package=\"" + currentPath + "\" data-name=\"" + key + "\" data-type=\"package\">" + key + "</text>\n";
                memo += ElementDomModelRepositoryLogic.createSizeDecideSvg(value, currentPath);
            }
        });
        return memo;
    };
    ElementDomModelRepositoryLogic.setupText = function (viewBoxSize) {
        var marginX = 48;
        var marginY = 24;
        var lastPackage = { x: 0, y: 0, width: 0, height: 0 };
        var lastElement = { x: 0, y: 0, width: 0, height: 0 };
        var maxY = -1;
        querySelectorAll('#svgCalcCanvas>text').forEach(function (v) {
            var packageIndent = v.getAttribute('data-package').split('.').length * 24;
            if (v.getAttribute('data-type') == 'package') {
                var y = maxY + marginY;
                v.setAttribute('x', packageIndent);
                v.setAttribute('y', y);
                lastPackage = v.getBBox();
                maxY = lastPackage.y + lastPackage.height;
                lastElement = { x: 0, y: 0, width: 0, height: 0 };
            }
            else if (v.getAttribute('data-type') == 'element') {
                var userMarginLeft = v.getAttribute('margin-left') ? parseInt(v.getAttribute('margin-left')) : 0;
                var userMarginTop = v.getAttribute('margin-top') ? parseInt(v.getAttribute('margin-top')) : 0;
                var x = Math.max(packageIndent, lastElement.x + lastElement.width) + marginX + userMarginLeft;
                var y = Math.max(lastPackage.y + lastPackage.height + marginY, lastElement.y + userMarginTop);
                // 左端がはみ出した場合は改行する
                if (x + v.getBBox().width > viewBoxSize.width) {
                    x = packageIndent + marginX;
                    y = maxY + marginY;
                }
                v.setAttribute('x', x);
                v.setAttribute('y', y);
                // サブテキスト更新
                var sub = v.querySelectorAll('tspan');
                sub.forEach = Array.prototype.forEach;
                sub.forEach(function (s) { return s.setAttribute('x', v.getAttribute('x')); });
                lastElement = v.getBBox();
                maxY = Math.max(maxY, lastElement.y + lastElement.height);
            }
        });
    };
    ElementDomModelRepositoryLogic.prototype.findByPackage = function (p) {
        var a = this.domList.filter(function (v) { return v.package.value == p.value; });
        if (a.length == 0) {
            throw new Error("dom not found: " + p);
        }
        return a[0];
    };
    ElementDomModelRepositoryLogic.prototype.findPackageType = function () {
        return this.domList.filter(function (v) { return v.type == postit.Type.package; });
    };
    ElementDomModelRepositoryLogic.prototype.getViewBoxSize = function () {
        return this.viewBoxSize;
    };
    return ElementDomModelRepositoryLogic;
}());
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
    var elementDomModelRepository = new ElementDomModelRepositoryLogic(input);
    var svg = createSvg(elementDomModelRepository.getViewBoxSize(), elementDomModelRepository, postit.parse(input));
    return svg;
}
