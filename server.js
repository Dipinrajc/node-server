const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const qs = require('querystring');
var MongoClient = require('mongodb').MongoClient;

const hostname = '0.0.0.0';
const port = 3000;

const mongoHost = 'mongodb://aniq-mongodb:27018/aniq';
//const mongoHost = 'mongodb://localhost:27017/aniq';
const mongoPort = 27017

var certsPath = path.join(__dirname, 'certs', 'server');
options = {
  key: fs.readFileSync(path.join(certsPath, 'my-server.key.pem'))
, cert: fs.readFileSync(path.join(certsPath, 'my-server.crt.pem'))
, requestCert: false
, rejectUnauthorized: true
};

const httpServer = https.createServer(options,requestResponseHandler);


//const httpServer = http.createServer(requestResponseHandler);
httpServer.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

function requestResponseHandler(req, res) {
  if (req.method === 'GET') {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    let callback = query.callback;
    checkApiKey(req, res, query.apiKey).then((result) => {
      if (req.url.indexOf('get-rating') > -1) {
        getRating(req, res, query.productId, query.callback);
      } else if (req.url.indexOf('update-rating') > -1) {
        updateRating(req, res, query.productId, query.callback);
      }
    }).catch((error) => {
      content = { 'success': false, 'error': 'Invalid Api key' };
      dataToSent = callback + "(" + JSON.stringify(content) + ")";
      sendResponse(dataToSent, 'application/json', res);
    });
  }
}

function sendResponse(content, contentType, res) {
  res.writeHead(200, { 'Content-Type': contentType });
  res.write(content);
  res.end();
}


function getRating(req, res, productId, callback) {
  MongoClient.connect(mongoHost, function (err, client) {
    if (err) throw err;
    const db = client.db('aniq');
    var rating = 0;
    findByProductId(db, productId).then((result) => {
      client.close();
      if (null != result) {
        rating = result.rating | 0;
      }
      content = { 'success': true, 'rating': rating };
      dataToSent = callback + "(" + JSON.stringify(content) + ")";
      sendResponse(dataToSent, 'application/json', res);
    });
  });
}

function updateRating(req, res, productId, callback) {
  MongoClient.connect(mongoHost, function (err, client) {
    if (err) throw err;
    const db = client.db('aniq');
    var rating = 0;
    findByProductId(db, productId).then((result) => {
      if (null != result) {
        rating = result.rating | 0;
      } else {
        result = {};
        result.productId = productId;
      }
      rating++;
      result.rating = rating;
      updateProductRating(db, result).then((result) => {
        client.close();
        content = { 'success': true, 'rating': rating };
        dataToSent = callback + "(" + JSON.stringify(content) + ")";
        sendResponse(dataToSent, 'application/json', res);
      });
    });
  });
}

const findByProductId = (db, productId) => {
  return new Promise(function (resolve, reject) {
    const collection = db.collection('products');
    collection.findOne({ "productId": productId }, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
}

const updateProductRating = (db, data) => {
  return new Promise(function (resolve, reject) {
    const collection = db.collection('products');
    collection.save(data, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
}

function checkApiKey(req, res, apiKey) {
  return new Promise(function (resolve, reject) {
    MongoClient.connect(mongoHost, function (err, client) {
      if (err) throw err;
      const db = client.db('aniq');
      var enabled = false;
      const collection = db.collection('apikeys');
      collection.findOne({ "apiKey": apiKey }, function (err, result) {
        client.close();
        if (err) reject(err);
        if (null != result) {
          enabled = result.enabled | false;
        }
        if (!enabled) {
          reject(0);
        } else {
          resolve(enabled)
        }
      });
    });
  });
}
