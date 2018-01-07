# postit

## これなに？
ドメインモデルやクラス図などを表示するアプリ。  
PLANTUMLのようなもの。  

## PLANTUMLとの違い
- ブラウザだけあれば図を作成できる(javaとかgraphvizとか不要)
- サーバサイドが無いので情報流出とかしない(PLANTUMLのWebAPIとの違い)
- 出力がSVGなのでブログとかに貼りやすい(PLANTUMLでもで可能ですが...)

## 動作サンプル
https://naosim.github.io/postit/

### クラス図のようなもの
<svg xmlns="http://www.w3.org/2000/svg" id="svgCanvas" viewBox="0 0 1059 680">
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
  <g id="package-text-group"><text dx="24" dy="24" x="0" y="16" font-size="11">domain</text>
<text dx="24" dy="24" x="24" y="55" font-size="11">member</text>
<text dx="24" dy="24" x="48" y="130" font-size="11">vo</text>
<text dx="24" dy="24" x="24" y="205" font-size="11">contract</text>
<text dx="24" dy="24" x="48" y="328" font-size="11">vo</text>
<text dx="24" dy="24" x="72" y="403" font-size="11">term</text>
<text dx="24" dy="24" x="24" y="478" font-size="11">option</text>
<text dx="24" dy="24" x="48" y="553" font-size="11">vo</text></g>
  <g id="rect-group"><rect x="52" y="98" rx="3" ry="3" width="160" height="28" />
<rect x="76" y="173" rx="3" ry="3" width="80.125" height="28" />
<rect x="52" y="248" rx="3" ry="3" width="160" height="76" />
<rect x="76" y="371" rx="3" ry="3" width="80.125" height="28" />
<rect x="205.4375" y="371" rx="3" ry="3" width="96" height="28" />
<rect x="100" y="446" rx="3" ry="3" width="112" height="28" />
<rect x="225.3125" y="446" rx="3" ry="3" width="112" height="28" />
<rect x="52" y="521" rx="3" ry="3" width="208" height="28" />
<rect x="76" y="596" rx="3" ry="3" width="128.125" height="28" />
<rect x="217.4375" y="632" rx="3" ry="3" width="160" height="28" /></g>
  <g id="text-group"><text dx="4" x="52" y="92"><tspan x="52" dx="4" dy="12">・会員エンティティ</tspan></text>
<text dx="4" x="76" y="167"><tspan x="76" dx="4" dy="12">・会員ID</tspan></text>
<text dx="4" x="52" y="242"><tspan x="52" dx="4" dy="12">・契約エンティティ</tspan><tspan x="52" dx="19" dy="20">ほげ</tspan><tspan x="52" dx="19" dy="16">ふーーー</tspan><tspan x="52" dx="19" dy="16">ばーーー</tspan></text>
<text dx="4" x="76" y="365"><tspan x="76" dx="4" dy="12">・契約ID</tspan></text>
<text dx="4" x="205.4375" y="365"><tspan x="205.4375" dx="4" dy="12">・契約状態</tspan></text>
<text dx="4" x="100" y="440"><tspan x="100" dx="4" dy="12">・契約開始日</tspan></text>
<text dx="4" x="225.3125" y="440"><tspan x="225.3125" dx="4" dy="12">・契約開始日</tspan></text>
<text dx="4" x="52" y="515"><tspan x="52" dx="4" dy="12">・オプションエンティティ</tspan></text>
<text dx="4" x="76" y="590"><tspan x="76" dx="4" dy="12">・オプションID</tspan></text>
<text dx="4" x="217.4375" y="626"><tspan x="217.4375" dx="4" dy="12">・オプションタイプ</tspan></text></g>
  <g id="line-group"><polyline points="132,126 88,187"  />
<polyline points="132,324 88,385"  />
<polyline points="132,248 88,187"  />
<polyline points="132,324 217.4375,385"  />
<polyline points="132,324 112,460"  />
<polyline points="132,324 237.3125,460"  />
<polyline points="156,549 88,610"  />
<polyline points="156,521 88,385"  />
<polyline points="156,549 229.4375,646"  />
<polyline points="140.0625,624 229.4375,646"  /></g>
</svg>

### KPTのようなもの
![KPT](https://naosim.github.io/postit/img/kpt.svg)
