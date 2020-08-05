/**
 * ネットワークグラフ描画クラス
 * ライブラリはD3.jsを使用
 */
export default class networkGraph {

  svg = null;     // ネットワークグラフのSVG画像
  nodes = null;   // ネットワークグラフのnodeリスト
  labels = null;  // ネットワークグラフのlabelリスト
  links = null;   // ネットワークグラフのlinkリスト
  target = null;  // SVG画像を挿入するHTMLElement
  data = null;    // 描画用データ
  nodeClickFlag = false;

  options = {
    max: "all",   // 最大表示数
    group: null,  // グループ毎の表示数
  }

  //---- ネットワークグラフの環境設定 ----

  friction = 0.9; // 摩擦力（1.0が最大）
  charge = -350;  // 反発力

  //----

  //---- 要素の円の設定 ----

  colors = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3", "#ff472d"]; // グループ毎のカラーリスト
  minRange = 15;              // 最小直径
  rateRange = 2.5;            // 直径の補正倍率
  circleOpacity = 0.75;       // 透明度
  circleStrokeColor = "#fff"; // 枠線の色
  circleStrokeWidth = 1;      // 枠線の幅
  
  fontSize = 12;              // 文字サイズ
  fontStrongSize = 16;        // 強調されているときの文字サイズ
  fontWeight = "bold";        // 文字の太さ
  textAnchor = "middle";      // 文字の位置
  textColor = "#545454";      // 文字の色
  textShadowWidth = 2;        // 文字の影幅
  textShadowColor = "#ffffff";// 文字の影色

  notSelectionNodeOpacity = 0.5; // 選択していないノードの透明度

  // ----

  //---- 要素同士を結ぶ線の設定 ----

  lineColor = "#999";     // 色
  lineOpacity = 0.7;      // 透明度
  minLineWeight = 1.0;    // 最小幅
  rateLineWeight = 5.0;   // 幅の補正倍率

  selectLineColor = "#666";   // 選択同士の線の色

  // ----

    
  constructor() {

  }
  
  /**
   * ターゲットの設定
   * @param {*} target 
   */
  setTarget (target) {
    this.target = target;
  }

  /**
   * ネットワークグラフのデータ設定
   * @param {*} data 
   */
  setData (data) {
    this.data = data;
  }

  /**
   * ネットワークグラフ生成
   */
  createGraph (options) {

    if (!this.data || !this.target) return;

    let width = this.target.clientWidth;
    let height = this.target.clientHeight;

    const that = this;

    // ネットワークグラフの環境設定
    let simulation = d3.forceSimulation(this.data.nodes)
      .velocityDecay(this.friction)                               // 摩擦力
      .force("link", d3.forceLink(this.data.links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(this.charge))  // 反発力
      .force("collision", d3.forceCollide()                       // 要素の重なり設定
        .radius(d => { 
          let range = d.size * that.rateRange;
          return range < that.minRange ? that.minRange : range;
         }))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // SVG画像作成
    this.svg = d3.select(this.target).append("svg").attr("viewBox", [0, 0, width, height]);

    // リンクの設定
    this.links = this.svg.append("g")
      .selectAll("line")
      .data(this.data.links)
      .join("line")
        .attr("stroke-width", d => { 
          let weight = d.weight * that.rateLineWeight;
          return weight < that.minLineWeight ? that.minLineWeight : weight
        })
        .attr("stroke", this.lineColor)
        .attr("stroke-opacity", this.lineOpacity)
        .attr("stroke-dasharray", d => d.line === "solid" ? null : "2, 2");

    // ノードの設定
    this.nodes = this.svg.append("g")
      .selectAll("g")
      .data(this.data.nodes)
      .enter()
      .append("circle")
        .attr("r", d => { 
          let range = d.size * that.rateRange;
          return range < that.minRange ? that.minRange : range })
          .attr("opacity", this.circleOpacity)
        .attr("fill", d => that.colors[Number(d.com)-1])
        .attr("stroke", this.circleStrokeColor)
        .attr("stroke-width", this.circleStrokeWidth)
        .on("click", d => {
          // ノードと関連ノードを強調させる
          that.strongNodeEntities(d);
        });

    // ラベルのグループ
    this.labels = this.svg.append("g")
      .selectAll("g")
      .data(this.data.nodes)
      .enter()
      .append("g")
        .attr("font-size", this.fontSize)
        .attr("pointer-events", "none")
        .attr("text-anchor", this.textAnchor);

    // 文字の影
    this.labels.append("text")
      .text(d => d.lab)
      .attr("font-weight", this.fontWeight)
      .attr("stroke", this.textShadowColor)
      .attr("stroke-width", this.textShadowWidth);

    // 文字
    this.labels.append("text")
      .text(d => d.lab)
      .attr("font-weight", this.fontWeight)
      .attr("fill", this.textColor);

    

    // 移動、ズームの設定
    this.svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([1, 8])
      .on("zoom", () => {
        // svg直下のgタグをズームや移動させる
        let target = $("svg").children("g");
        d3.selectAll(target).attr("transform", d3.event.transform);
      }))
      .on("click", () => {
        if (that.nodeClickFlag) {
          // nodeがクリックされていたらイベントを実行しない
          that.nodeClickFlag = false;
          return;
        }

        // 関連ワードの強調を解除
        that.resetStrongNodeEntites();
      });

    this.setOptions(options);

    //動作開始！
    simulation.on("tick", () => {
      this.links
        .attr("x1", d => d.source.x)
        .attr("y1", d => height- d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => height - d.target.y);
      this.nodes
        .attr("cx", d => d.x)
        .attr("cy", d => height- d.y);
      this.labels
        .attr("transform", d => { return 'translate(' + d.x + ',' +(height - d.y) + ')'; });
    });
  }

  /**
   * ネットワークグラフ削除
   */
  removeGraph () {
    $(target).children("svg").remove();
    this.svg = null;
    this.nodes = null;
    this.links = null;
  }

  /**
   * 表示オプションの設定
   * @param {*} options 
   */
  setOptions (options) {

    if (!this.data) return;

    if (options.max) {
      this.options.max = options.max;
    }
    if (options.group) {
      this.options.group = options.group;
    }

    // 表示・非表示フラグ付与
    let max = this.options.max;
    let group = this.options.group;
    this.data.nodes.map((node, index) => {
      node.isShow = true;
      if (max !== "all" && index >= max) {
        node.isShow = false;
      }
      let targetGroup = group.find(g => g.com === node.com);
      if (!targetGroup || !targetGroup.isShow) {
        node.isShow = false;
      }
    });
    
    // 円の表示・非表示設定
    this.nodes
      .data(this.data.nodes)
      .attr("display", d => d.isShow ? null : "none");

    // ラベルの表示・非表示設定
    this.labels
      .data(this.data.nodes)
      .attr("display", d => d.isShow ? null : "none");

    // 円と円の関連線の表示・非表示設定
    this.links
      .attr("display", d => d.target.isShow && d.source.isShow ? null : "none" );
  }

  /**
   * 関連キーワードの強調
   * @param {*} node 
   */
  strongNodeEntities (node) {

    // 関連キーワードの強調解除
    this.resetStrongNodeEntites();

    // 強調するノードの設定（クリックしたワードと線で結ばれているワードを検索）
    this.data.links.map(link => {
      if (link.target.id === node.id) {
        link.target.isStrong = true;
        link.source.isStrong = true;
      } else if (link.source.id === node.id) {
        link.target.isStrong = true;
        link.source.isStrong = true;
      } else {
        link.target.isStrong = link.target.isStrong ? link.target.isStrong : false;
        link.source.isStrong = link.source.isStrong ? link.source.isStrong : false;
      }
    });

    // 円の強調設定
    const that = this;
    this.nodes
      .data(this.data.nodes)
      .attr("opacity", d => d.isStrong ?  null : that.notSelectionNodeOpacity);

    //ラベルの強調設定
    this.labels
      .data(this.data.nodes)
      .attr("opacity", d => d.isStrong ?  null : that.notSelectionNodeOpacity)
      .attr("font-size", d => d.id === node.id ?  that.fontStrongSize : that.fontSize );

    // 対象のラベルを最前面に
    svgz_element(this.labels.filter(d => d.id === node.id).node()).toTop(); 

    // 円と円の関連線の強調設定
    this.links
      .attr("stroke", d => d.target.isStrong && d.source.isStrong && (d.target.id === node.id || d.source.id === node.id) ? that.selectLineColor : that.lineColor)
      .attr("stroke-opacity", d => d.target.isStrong && d.source.isStrong && (d.target.id === node.id || d.source.id === node.id) ? null : that.lineOpacity);

    // クリックフラグをtrueにする
    this.nodeClickFlag = true;
  }

  /**
   * 関連キーワードの強調解除
   */
  resetStrongNodeEntites () {

    this.data.nodes.map(node => {
      node.isStrong = false;
    });

    // 円の設定を元に戻す
    this.nodes
      .data(this.data.nodes)
        .attr("opacity", this.circleOpacity);

    // ラベルの設定を元に戻す
    this.labels
      .data(this.data.nodes)
        .attr("opacity", null)
        .attr("font-size", this.fontSize)
        .attr("stroke", null);

    // 線の設定を元に戻す
    this.links
      .attr("stroke", this.lineColor)
      .attr("stroke-opacity", this.lineOpacity );
  }
};