const http = require('http');
const fs = require('fs');
const port = process.env.PORT || 3000;
const hostname = 'localhost';

const server = http.createServer(function(req, res){
    res.writeHead(200, { 'Content-Type': 'text/html' })
    fs.readFile('tribespot', (error, data) => {
        if (error) {
            res.writeHead(404);
            res.write('File not found');
        } else {
            res.write(data);
        }
        res.end();
    })
}); 

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});             