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
  export enum Type { package, element }
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
    readonly type:postit.Type;
    readonly package:postit.Package;
    readonly name:postit.Name;
    readonly text:postit.Text;
    readonly x: number;
    readonly y: number;
    readonly centerX: number;
    readonly centerY: number;
    readonly width: number;
    readonly height: number;
    readonly right: number;
    readonly bottom: number;
    constructor(type:postit.Type, p:postit.Package, n:postit.Name, t:postit.Text, x:number, y:number, cX:number, cY:number, w:number, h:number) {
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

  // 本当はここでdomを使わずに計算的に位置を決定したい
  export function createHtml(data, path?) {
    var memo = '';
    Object.keys(data)
      .map(key => {
        const value = data[key];
        const currentPath = path ? `${path}.${key}` : key;
        if(postit.isElement(key)) {
          let text = value.text.split('\n').map((v, i) => i == 0 ? `${v}` : `<p>${v}</p>`).join('\n');
          let style = ['margin-left', 'margin-top']
            .filter(key => value[key])
            .map(key => `${key}:${value[key]}px`)
            .join(';');
          
          memo += `<li data-package="${currentPath}" data-name="${key}" style="${style}">${text}</li>\n`;
        } else if(postit.isNode(key, value)) {
          memo += `<ul class="package" data-package="${currentPath}" data-name="${key}">${createHtml(value, currentPath)}</ul>\n`;
        }
      });
    return memo;
  }
}
interface ElementDomModelRepository {
  findByPackage(p:postit.Package): dom.ElementDomModel;
  findPackageType(): dom.ElementDomModel[]
}
class ElementDomModelRepositoryImpl implements ElementDomModelRepository {
  readonly domList: dom.ElementDomModel[]
  constructor(offset, liList, ulList) {
    var screenPos = offset;
  var list = [];
  liList.forEach(v => list.push(v));
  if(ulList) {
    ulList.forEach(v => list.push(v));
  }
  this.domList = list
    .map(v => ({ tagName: v.tagName, package: v.getAttribute('data-package'), rect: v.getBoundingClientRect(), text:v.innerText, name:v.getAttribute('data-name')}))
    .map(v => ({
      tagName:v.tagName,
      package:v.package,
      name: v.name,
      text:v.text,
      x: window.scrollX + v.rect.left - screenPos.x,
      y: window.scrollY + v.rect.top - screenPos.y,
      centerX: window.scrollX + v.rect.left + v.rect.width / 2 - screenPos.x,
      centerY: window.scrollY + v.rect.top + v.rect.height / 2 - screenPos.y,
      w: v.rect.width,
      h: v.rect.height
    }))
    .map(v => new dom.ElementDomModel(
      v.tagName == 'UL' ? postit.Type.package : postit.Type.element,
      new postit.Package(v.package),
      new postit.Name(v.name),
      new postit.Text(v.text),
      v.x,
      v.y,
      v.centerX,
      v.centerY,
      v.w,
      v.h)
    );
  }

  findByPackage(p:postit.Package): dom.ElementDomModel {
    const a = this.domList.filter(v => v.package.value == p.value);
    if(a.length == 0) {
      throw new Error(`dom not found: ${p}`);
    }
    return a[0];
  }
  findPackageType(): dom.ElementDomModel[] {
    return this.domList.filter(v => v.type == postit.Type.package);
  }
}

function createLineRaw(parsedInput, elementDomModelRepository: ElementDomModelRepository) {
  var lineList = [];
  parsedInput.forEach(v => {
    var from = elementDomModelRepository.findByPackage(v.package);
    v.dependences
      .map(d => new dom.LineModel(from, elementDomModelRepository.findByPackage(d)))
      .map(d => d.getSvgLine())
      .map(d => `<polyline points="${d.x1},${d.y1} ${d.x2},${d.y2}"  />`)
      .forEach(t => lineList.push(t))
  });
   return lineList.join('\n');
}

function createSvg(
  viewBoxSize: {width, height},
  elementDomModelRepository: ElementDomModelRepository,
  parsedInput:postit.Node[]
) {
  const lineRaw = createLineRaw(parsedInput, elementDomModelRepository);
  const textRaw = parsedInput
    .map(v => elementDomModelRepository.findByPackage(v.package))
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
    .map(v => elementDomModelRepository.findByPackage(v.package))
    .map(v => `<rect x="${v.x}" y="${v.y}" rx="3" ry="3" width="${v.width}" height="${v.height}" />`)
    .join('\n');

  
  const packageTextRaw = elementDomModelRepository.findPackageType()
    .map(v => `<text dx="24" dy="24" x="${v.x}" y="${v.y}" font-size="11">${v.name.value}</text>`)
    .join('\n');

  return `
<svg xmlns="http://www.w3.org/2000/svg" id="svgCanvas" viewBox="0 0 ${viewBoxSize.width} ${viewBoxSize.height}">
  <defs>
    <style>
    #package-text-group {
      stroke:#333;
      dominant-baseline:text-before-edge;
    }
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
  <g id="package-text-group">${packageTextRaw}</g>
  <g id="rect-group">${rectRaw}</g>
  <g id="text-group">${textRaw}</g>
  <g id="line-group">${lineRaw}</g>
</svg>
  `.trim();

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

  const elementDomModelRepository = new ElementDomModelRepositoryImpl(
    [document.querySelector('.screen').getBoundingClientRect()].map(s => ({x: window.scrollX + s.left, y: window.scrollY + s.top}))[0],
    querySelectorAll('li'),
    querySelectorAll('ul')
  );
  
  const svg = createSvg(
    [document.querySelector('#root')].map(v => ({width: v.clientWidth, height: v.clientHeight}))[0],
    elementDomModelRepository,
    postit.parse(input)
  );

  // テキスト計算用DOM削除
  document.querySelector('#root').innerHTML = '';
  return svg;
}
