// ビルド設定
const jsFile = './docs/js/main.js';
const buildScript = `tsc src/main.ts --outFile ${jsFile}`;

// 標準ライブラリの読み込み
const fs = require('fs');
const exec = require('child_process').exec;

/**
* サーバ作成
*
* action: (req, res) => void
* option: {
*   hostname:string,
*   port:number,
*   timeout:number,
*   onCatchException: (e, req, res) => void,
*   onTimeout: (req, res) => void
* }
*/
function createServer(
  action,
  option
) {
  const domain = require('domain');
  const hostname = (option && option.hostname) || '127.0.0.1';
  const port = (option && option.port) || 3000;
  const timeout = (option && option.timeout) || 30 * 1000;
  const onCatchException = (option && option.onCatchException) || ((e, req, res) => {res.statusCode = 500; res.end(e);});
  const onTimeout = (option && option.onTimeout) || ((req, res) => {res.statusCode = 408; res.end('');});

  var server = require('http').createServer((req, res)=> {
    res.on('timeout', () => onTimeout(req, res));

    var d = domain.create();
    d.on('error', (e) => onCatchException(e, req, res));
    d.run(() => action(req, res));
  });

  server.setTimeout(timeout);
  server.listen(port, hostname, () => console.log(`Server running at http://${hostname}:${port}/`));

  process.on('uncaughtException', (e) => console.log(e));
}

function createBuildServer(
  buildScript,
  jsFile,
  contentType, // 任意, デフォルト: 'text/javascript'
  serverOption
) {
  contentType = contentType || 'text/javascript';
  createServer(
    (req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);

      exec(buildScript, (err, body) => {
        if(err) {// ビルド失敗
          console.log(err);
          console.log(body);

          // エラーメッセージの取得 (改行等を適当にエスケープする)
          const message = body.split('\n').join('\\n').split("'").join("\\'");
          res.end(`alert('${message}')`);
        } else {// ビルド成功
          // 生成されたjsを返す
          res.end(fs.readFileSync(jsFile, 'utf8'));
        }
      })
    },
    serverOption
  );
}

// 実行
createBuildServer(buildScript, jsFile);
