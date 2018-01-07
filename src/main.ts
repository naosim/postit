module ddd {
  export class StringVo {
    readonly value: string
    constructor(value: string) {
      this.value = value;
    }

    private _type_StringVo() {}
  }
}

module postit {
  export class Package extends ddd.StringVo {
    getName():Name {
      var a = this.value.split('.');
      return new Name(a[a.length - 1]);
    }
    getParent():Package {
      var i = this.value.lastIndexOf('.');
      if(i == -1) {
        throw new Error('parent not found')// いいの？ 空文字返して無限ループに入るよりは良い
      }
      return new Package(this.value.slice(0, i));
    }
    append(name: Name):Package {
      return new Package(`${this.value}.${name.value}`);
    }

    private _type_Package() {}
  }
  export class Name extends ddd.StringVo {
    private _type_Name() {}
  }
  export class Text extends ddd.StringVo {
    private _type_Text() {}
  }
  enum Type { package, element }
  export class Node {
    readonly package: Package
    readonly type: Type
    constructor(p: Package, t:Type) {
      this.package = p;
      this.type = t;
    }
  }
  class Element extends Node {
    readonly text: Text
    readonly dependences: Package[]
    constructor(p: Package, t:Type, text: Text, dependences: Package[]) {
      super(p, t);
      this.text = text;
      this.dependences = dependences;
    }
  }

  export function isNode(key:string, value:any) {
    if(key[0] == key[0].toLocaleUpperCase()) {
      return false;
    }
    if(typeof value == 'string') {
      return false;
    }
    return true;
  }

  export function isElement(key:string) {
    return key[0] == key[0].toLocaleUpperCase();
  }

  export function parse(data, package?:Package):Node[] {
    var nodes:Node[] = [];
    //package = package || new Package('$');
    Object.keys(data)
      .map(key => {
        const value = data[key];
        const currentPackage:Package = package ? package.append(new Name(key)) : new Package(key);
        if(isElement(key)) {
          nodes.push(
            new Element(
              currentPackage,
              Type.element,
              new Text(value.text),
              (value.dependences || []).map(v => new Package(v[0] !== '$' ? v : v.split('$').join(package.value)))
            )
          );
        } else if(isNode(key, value)) {
          nodes = parse(value, currentPackage).reduce((m, n)=>{ m.push(n); return m }, nodes);
        }
      });
    return nodes;
  }
}

module dom {
  export class ElementDomModel {
    readonly package:postit.Package;
    readonly text:postit.Text;
    readonly x: number;
    readonly y: number;
    readonly centerX: number;
    readonly centerY: number;
    readonly width: number;
    readonly height: number;
    readonly right: number;
    readonly bottom: number;
    constructor(p:postit.Package, t:postit.Text, x:number, y:number, cX:number, cY:number, w:number, h:number) {
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
  }

  export class LineModel {
    from: ElementDomModel;
    to: ElementDomModel;
    constructor(from: ElementDomModel, to: ElementDomModel) {
      this.from = from;
      this.to = to;
    }
    getSvgLine() {
      const dotMargin = 12;
      var x1 = this.from.centerX;
      var y1 = this.from.centerY;
      if(this.to.centerY - this.from.centerY >= 0) {
        y1 = this.from.y + this.from.height;
      } else {
        y1 = this.from.y;
      }

      // 線の計算をする
      return {
        x1: x1,
        y1: y1,
        x2: this.to.x + dotMargin,
        y2: this.to.centerY,
      }
    }
  }

  export function createHtml(data, path) {
    var memo = '';
    Object.keys(data)
      .map(key => {
        const value = data[key];
        const currentPath = path ? `${path}.${key}` : key;
        if(postit.isElement(key)) {
          let text = value.text.split('\n').map((v, i) => i == 0 ? `${v}` : `<p>${v}</p>`).join('\n');
          memo += `<li data-package="${currentPath}" data-name="${key}">${text}</li>\n`;
        } else if(postit.isNode(key, value)) {
          memo += `<ul data-package="${currentPath}" data-name="${key}">${createHtml(value, currentPath)}</ul>\n`;
        }
      });
    return memo;
  }
}

function createFindElementDomPosition(offset, liList): (string)=>dom.ElementDomModel {
  var screenPos = offset;
  var domList = liList
    .map(v => ({ package: v.getAttribute('data-package'), rect: v.getBoundingClientRect(), text:v.innerText}))
    .map(v => ({
      package:v.package,
      text:v.text,
      x: window.scrollX + v.rect.left - screenPos.x,
      y: window.scrollY + v.rect.top - screenPos.y,
      centerX: window.scrollX + v.rect.left + v.rect.width / 2 - screenPos.x,
      centerY: window.scrollY + v.rect.top + v.rect.height / 2 - screenPos.y,
      w: v.rect.width,
      h: v.rect.height
    }))
    .map(v => new dom.ElementDomModel(
      new postit.Package(v.package),
      new postit.Text(v.text),
      v.x,
      v.y,
      v.centerX,
      v.centerY,
      v.w,
      v.h)
    );

    return (p) => {
      var a = domList.filter(v => v.package.value == p);
      if(a.length == 0) {
        throw new Error(`dom not found: ${p}`);
      }
      return a[0];
    };
}

function createLineRaw(parsedInput, findElementDomPosition) {
  var lineList = [];
  parsedInput.forEach(v => {
    var from = findElementDomPosition(v.package.value);
    v.dependences
      .map(d => new dom.LineModel(from, findElementDomPosition(d.value)))
      .map(d => d.getSvgLine())
      .map(d => `<polyline points="${d.x1},${d.y1} ${d.x2},${d.y2}"  />`)
      .forEach(t => lineList.push(t))
  });
   return lineList.join('\n');
}

function createSvg(
  viewBoxSize: {width, height},
  findElementDomPosition: (string)=>dom.ElementDomModel,
  parsedInput:postit.Node[]
) {
  const lineRaw = createLineRaw(parsedInput, findElementDomPosition);
  const textRaw = parsedInput
    .map(v => findElementDomPosition(v.package.value))
    .map(v => {
      var t = v.text.value.trim().split('\n')
        .filter(v => v.trim().length > 0)
        .map((p, i) => {
          var dx = (i == 0 ? '4' : '19');
          var dy;
          if(i == 0) {
            dy = '12';
          } else if(i == 1) {
            dy = '20';
          } else {
            dy = '16';
          }
          return `<tspan x="${v.x}" dx="${dx}" dy="${dy}">${i == 0 ? '・' : ''}${p}</tspan>`;
        })
        .join('');
      return `<text dx="4" x="${v.x}" y="${v.y-6}">${t}</text>`;
    })
    .join('\n');

  const rectRaw = parsedInput
    .map(v => findElementDomPosition(v.package.value))
    .map(v => `<rect x="${v.x}" y="${v.y}" rx="3" ry="3" width="${v.width}" height="${v.height}" />`)
    .join('\n');

  return `
<svg xmlns="http://www.w3.org/2000/svg" id="svgCanvas" viewBox="0 0 ${viewBoxSize.width} ${viewBoxSize.height}">
  <defs>
    <style>
    #rect-group {
      stroke:#880;
      fill:#ff8
    }
    #text-group {
      stroke:#333;
      dominant-baseline:text-before-edge;
    }
    #line-group {
      stroke:#333;
      marker-end:url(#Triangle);
      fill:none;
      stroke-width:1;
    }
    </style>
    <marker id="Triangle" viewBox="0 0 10 10" refX="12" refY="5"
        markerWidth="6" markerHeight="6" orient="auto" fill="#333">
      <path d="M 0 0 L 10 5 L 0 10 z" />
    </marker>
  </defs>
  <g id="rect-group">${rectRaw}</g>
  <g id="text-group">${textRaw}</g>
  <g id="line-group">${lineRaw}</g>
</svg>
  `.trim();

}
