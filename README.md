# メモ
  
「[D3.js](https://d3js.org/)」でネットワークグラフの表示をしてみたサンプルです。  
設定項目やSVGのスタイルをフル活用しています。

## 「[D3.js](https://d3js.org/)」のメリット
 - JQuery風なコーディングで使いやすい
 - 画像フォーマットがSVGのためスタイルの調整が容易

## 他ライブラリ
### 「[vis.js](https://visjs.org/)」、「[sigma.js](https://www.sigmajs.org/)」
 - コード量をかなり抑えて実装できる
 - スタイルの調整に難あり

### 「[cytoscape.js](https://js.cytoscape.org/)」
 - カスタマイズ幅はD3.js以上かも
 - ドキュメントの熟読が必須

## プロジェクトのローカル環境での実行方法
### 1.パッケージのインストール（初回のみ）
~~~
npm install
~~~

### 2.テストの実行
~~~
gulp
~~~
