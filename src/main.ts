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
    readonly name: Name
    readonly type: Type
    constructor(p: Package, n: Name, t: Type) {
      this.package = p;
      this.name = n;
      this.type = t;
    }
    private _type_Node() {}
  }
  class Element extends Node {
    readonly text: Text
    readonly dependences: Package[]
    constructor(p: Package, n: Name, t:Type, text: Text, dependences: Package[]) {
      super(p, n, t);
      this.text = text;
      this.dependences = dependences;
    }
    private _type_Element() {}
  }

  export function isNode(key:string, value:any) {
    if(key == '$config') {
      return false;
    }
    if(key[0] == key[0].toLocaleUpperCase()) {
      return false;
    }
    if(typeof value == 'string') {
      return false;
    }
    return true;
  }

  export function isElement(key:string) {
    if(key == '$config') {
      return false;
    }
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
              new Name(key),
              Type.element,
              new Text(value.text),
              (value.dependences || value.dep || []).map(v => new Package(v[0] !== '$' ? v : v.split('$').join(package.value)))
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
    readonly frame:boolean;
    readonly x: number;
    readonly y: number;
    readonly centerX: number;
    readonly centerY: number;
    readonly width: number;
    readonly height: number;
    readonly right: number;
    readonly bottom: number;
    constructor(type:postit.Type, p:postit.Package, n:postit.Name, t:postit.Text, frame:boolean, x:number, y:number, cX:number, cY:number, w:number, h:number) {
      this.type = type;
      this.package = p;
      this.name = n;
      this.text = t;
      this.frame = frame;
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
      const dotMargin = 8;
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
}
interface ElementDomModelRepository {
  findByPackage(p:postit.Package): dom.ElementDomModel;
  findPackageType(): dom.ElementDomModel[];
  findInclude(p:postit.Package): dom.ElementDomModel[];
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
  elementDomModelRepository: ElementDomModelRepository,
  parsedInput:postit.Node[]
) {
  const lineRaw = createLineRaw(parsedInput, elementDomModelRepository);
  const textRaw = querySelectorAll('#svgCalcCanvas>text').map(v => v.outerHTML).join('\n');
  const rectRaw = parsedInput
    .map(v => elementDomModelRepository.findByPackage(v.package))
    .map(v => `<rect x="${v.x}" y="${v.y}" rx="3" ry="3" width="${v.width}" height="${v.height}" />`)
    .join('\n');

    const viewBoxWidth = parsedInput
    .map(v => elementDomModelRepository.findByPackage(v.package))
    .map(v => v.right)
    .reduce((memo, v) => Math.max(memo, v), 0) + 48;

    const viewBoxHeight = parsedInput
    .map(v => elementDomModelRepository.findByPackage(v.package))
    .map(v => v.bottom)
    .reduce((memo, v) => Math.max(memo, v), 0) + 48;

  // const packageRectRaw = '';
  // パッケージに枠を表示する
  const packageRectRaw = elementDomModelRepository.findPackageType()
    .filter(v => v.frame)
    .map(v => v.package)
    .map(v => {
      const list = elementDomModelRepository.findInclude(v);
      let minX = viewBoxWidth;
      let minY = viewBoxHeight;
      let maxX = 0;
      let maxY = 0;
      list.forEach(v => {
        minX = Math.min(v.x, minX);
        minY = Math.min(v.y, minY);
        maxX = Math.max(v.right, maxX);
        maxY = Math.max(v.bottom, maxY);
      });
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    })
    .map(v => `<rect x="${v.x}" y="${v.y}" width="${v.width + 4}" height="${v.height + 4}" fill="none" stroke="#aaa" stroke-width="1"  />`)
    .join('\n');

  return `
<svg xmlns="http://www.w3.org/2000/svg" id="svgCanvas" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
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
  <g id="package-rect-group">${packageRectRaw}</g>
  <g id="rect-group">${rectRaw}</g>
  <g id="text-group">${textRaw}</g>
  <g id="line-group">${lineRaw}</g>
</svg>
  `.trim();

}

class ElementDomModelRepositoryLogic implements ElementDomModelRepository {
  readonly domList: dom.ElementDomModel[]
  constructor(data) {
    const viewBoxSize = [document.querySelector('.screen')].map(v => ({width: v.clientWidth, height: 1000}))[0]

    document.querySelector('#calc').innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" id="svgCalcCanvas" viewBox="0 0 ${viewBoxSize.width} ${viewBoxSize.height}">
      <defs>
        <style>
        #svgCalcCanvas {
          opacity:0;
        }
        text {
          dominant-baseline:text-before-edge;
        }
        </style>
      </defs>
      ${ElementDomModelRepositoryLogic.createSizeDecideSvg(data)}
    </svg>
      `.trim();

    var screenPos = [document.querySelector('.screen').getBoundingClientRect()].map(s => ({x: window.scrollX + s.left, y: window.scrollY + s.top}))[0];
    var list = [];
    querySelectorAll('#svgCalcCanvas>text').forEach(v => list.push(v));
    ElementDomModelRepositoryLogic.setupText(viewBoxSize);
    const marginX = 16;
    const marginY = 8;
    this.domList = list
      .map(v => ({ 
        tagName: v.tagName, 
        package: v.getAttribute('data-package'), 
        type: v.getAttribute('data-type'), 
        rect: v.getBoundingClientRect(), 
        text:v.innerText, 
        name:v.getAttribute('data-name'),
        frame:v.getAttribute('frame')
      }))
      .map(v => ({
        tagName:v.tagName,
        package:v.package,
        type: v.type,
        name: v.name,
        text:v.text,
        frame:v.frame == 'true',
        x: window.scrollX + v.rect.left - screenPos.x - marginX,
        y: window.scrollY + v.rect.top - screenPos.y - marginY,
        centerX: window.scrollX + v.rect.left + v.rect.width / 2 - screenPos.x,
        centerY: window.scrollY + v.rect.top + v.rect.height / 2 - screenPos.y,
        w: v.rect.width + marginX * 2,
        h: v.rect.height + marginY * 2
      }))
      .map(v => new dom.ElementDomModel(
        v.type == 'package' ? postit.Type.package : postit.Type.element,
        new postit.Package(v.package),
        new postit.Name(v.name),
        new postit.Text(v.text),
        v.frame,
        v.x,
        v.y,
        v.centerX,
        v.centerY,
        v.w,
        v.h)
      );
  }

  static createSizeDecideSvg(data, path?) {
    var memo = '';
    Object.keys(data)
      .map(key => {
        const value = data[key];
        const currentPath = path ? `${path}.${key}` : key;

        let config = '';
        if(value['$config']) {
          config = Object.keys(value['$config']).map(configKey => `${configKey}="${value['$config'][configKey]}"`).join(' ');
        }
        
        if(postit.isElement(key)) {
          let text = value.text.indexOf('\n') == -1 ? value.text : value.text.split('\n').map((v, i) => `<tspan x="0" dx="0" dy="${i == 0 ? '0' : '1.2'}em">${v}</tspan>`).join('\n');
          memo += `<text id="${currentPath}" data-package="${currentPath}" data-name="${key}" data-type="element" ${config}>${text}</text>\n`;
        } else if(postit.isNode(key, value)) {
          memo += `<text id="${currentPath}" data-package="${currentPath}" data-name="${key}" data-type="package" ${config}>${key}</text>\n`;
          memo += ElementDomModelRepositoryLogic.createSizeDecideSvg(value, currentPath);
        }
      });
    return memo;
  }

  static setupText(viewBoxSize: {width:number, height:number}) {
    const marginX = 48;
    const marginY = 24;
    var lastPackage = {x: 0, y: 0, width: 0, height: 0};
    var lastElement = {x: 0, y: 0, width: 0, height: 0};
    var maxY = -1;
    querySelectorAll('#svgCalcCanvas>text').forEach(v => {
      const packageIndent = v.getAttribute('data-package').split('.').length * 24;
      if(v.getAttribute('data-type') == 'package') {// パッケージ
        let y = maxY + marginY;
        v.setAttribute('x', packageIndent);
        v.setAttribute('y', y);
        
        lastPackage = v.getBBox();
        maxY = lastPackage.y + lastPackage.height;
        lastElement = {x: 0, y: 0, width: 0, height: 0};
      } else if(v.getAttribute('data-type') == 'element') {// エレメント
        let userMarginLeft = v.getAttribute('margin-left') ? parseInt(v.getAttribute('margin-left')) : 0;
        let userMarginTop = v.getAttribute('margin-top') ? parseInt(v.getAttribute('margin-top')) : 0;
        let x = Math.max(packageIndent, lastElement.x + lastElement.width) + marginX + userMarginLeft;
        let y = Math.max(lastPackage.y + lastPackage.height + marginY, lastElement.y + userMarginTop);
        // 左端がはみ出した場合は改行する
        if(x + v.getBBox().width > viewBoxSize.width) {
          x = packageIndent + marginX;
          y = maxY + marginY;
        }
        v.setAttribute('x', x);
        v.setAttribute('y', y);

        // サブテキスト更新
        let sub = v.querySelectorAll('tspan');
        sub.forEach = Array.prototype.forEach;
        sub.forEach(s => s.setAttribute('x', v.getAttribute('x')))

        lastElement = v.getBBox();
        maxY = Math.max(maxY, lastElement.y + lastElement.height);
      }
      
    });
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

  findInclude(p:postit.Package): dom.ElementDomModel[] {
    return this.domList.filter(v => v.package.value.indexOf(p.value) == 0);
  }
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
  const elementDomModelRepository = new ElementDomModelRepositoryLogic(input);
  
  const svg = createSvg(
    elementDomModelRepository,
    postit.parse(input)
  );
  return svg;
}
