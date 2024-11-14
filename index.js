const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    let url = req.url;
    let method = req.method;
    let ipAddress = (() => {
        if (req.headers['x-forwarded-for']) {
            return req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
        } else if (req.connection.remoteAddress) {
            return req.connection.remoteAddress;
        } else {
            return req.socket.remoteAddress;
        }
    })();
    let userAgent = req.headers['user-agent'];
    let date = new Date().toISOString();
    let log = `${date}に${ipAddress}から${method}で${url}へのアクセスが要求されたにゃ${userAgent}というアプリケーションを使用していたにゃん！\n`;
    console.log(log);
    fs.appendFile('private/access.log', log, (err) => {
        if (err) console.error(err);
    });
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': 86400
        });
        res.end();
    }
    else if (method === 'GET') {
        if (url.endsWith('/') || !url.split('/').splice(-1)[0].includes('.')) url += 'index.html';
        fs.readFile('public' + url, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write(fs.readFileSync('public/404.html'));
                res.end();
            } else {
                if (url.endsWith('.html')) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                } else if (url.endsWith('.css')) {
                    res.writeHead(200, { 'Content-Type': 'text/css' });
                } else {
                    res.writeHead(200);
                }
                res.write(data);
                res.end();
            }
        });
    }
    else if (method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                let data = JSON.parse(body);
                let dataLog = `${ipAddress}からPOST通信でデータが送られてきたにゃ！\n${body}というデータを受け取ったにゃん！\n`;
                console.log(dataLog);
                fs.appendFile('private/access.log', dataLog, (err) => { if (err) console.error(err); });
                let response = {
                    message: `Hello, ${data.name}!`
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(response));
                res.end();
            }
            catch (err) {
                console.error(err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({ message: 'Bad Request' }));
                res.end();
            }
        });
    }
    else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ message: 'Method Not Allowed' }));
        res.end();
    }
});

server.listen(25505, () => {
    console.log('Server started on https://howtoprogram.net');
});
