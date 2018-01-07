const jsFile = './docs/js/main.js';
const buildScript = `tsc src/main.ts --outFile ${jsFile}`;

const http = require('http');
const fs = require('fs');
const exec = require('child_process').exec;

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/javascript');

  exec(buildScript, (err, body) => {
    if(err) {
      console.log(err);
      console.log(body);

      const message = body.split('\n').join('\\n').split("'").join("\\'");
      res.end(`alert('${message}')`);
    } else {
      res.end(fs.readFileSync(jsFile, 'utf8'));
    }

  })
});

server.listen(port, hostname, () => console.log(`Server running at http://${hostname}:${port}/`));
