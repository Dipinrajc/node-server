const http = require('http');
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

const httpServer = http.createServer(requestResponseHandler);
httpServer.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

function requestResponseHandler(req, res) {
  console.log(`Request came: ${req.url}`);
  console.log(`Request came: ${req}`);
  if (req.method === 'GET') {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    console.log('Key is ' + query.apiKey);
    let callback = query.callback;
    checkApiKey(req, res, query.apiKey).then((result) => {
      if (req.url.indexOf('get-rating') > -1) {
        console.log(`Get Rating`);
        getRating(req, res, query.productId, query.callback);
      } else if (req.url.indexOf('update-rating') > -1) {
        console.log(`Update Rating`);
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
    console.log("Connected to aniq database!");
    var rating = 0;
    findByProductId(db, productId).then((result) => {
      if (null != result) {
        console.log("Found product with productId " + productId);
        rating = result.rating | 0;
      } else {
        console.log("Not Found product with productId " + productId);
      }
      console.log("Current rating is " + rating);
      content = { 'success': true, 'rating': rating };
      dataToSent = callback + "(" + JSON.stringify(content) + ")";
      client.close();
      sendResponse(dataToSent, 'application/json', res);
    });
  });
}

function updateRating(req, res, productId, callback) {
  MongoClient.connect(mongoHost, function (err, client) {
    if (err) throw err;
    const db = client.db('aniq');
    console.log("Connected to aniq database!");
    var rating = 0;
    findByProductId(db, productId).then((result) => {
      if (null != result) {
        console.log("Found product with productId " + productId);
        rating = result.rating | 0;
      } else {
        console.log("Not Found product with productId " + productId);
        result = {};
        result.productId = productId;
      }
      console.log("Current rating is " + rating);
      rating++;
      console.log("Updated rating is " + rating);
      result.rating = rating;
      updateProductRating(db, result).then((result) => {
        console.log("Result is " + result);
        content = { 'success': true, 'rating': rating };
        dataToSent = callback + "(" + JSON.stringify(content) + ")";
        client.close();
        sendResponse(dataToSent, 'application/json', res);
      });
    });
  });
}

const findByProductId = (db, productId) => {
  return new Promise(function (resolve, reject) {
    const collection = db.collection('products');
    console.log('Fetching products collection');
    collection.findOne({ "productId": productId }, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
}

const updateProductRating = (db, data) => {
  return new Promise(function (resolve, reject) {
    const collection = db.collection('products');
    console.log('Updating products collection');
    collection.save(data, function (err, result) {
      console.log('Error ' + err);
      if (err) reject(err);
      console.log('Updated Successfully');
      resolve(result);
    });
  });
}

function checkApiKey(req, res, apiKey) {
  return new Promise(function (resolve, reject) {
    MongoClient.connect(mongoHost, function (err, client) {
      if (err) throw err;
      const db = client.db('aniq');
      console.log("Connected to aniq database!");
      var enabled = false;
      const collection = db.collection('apikeys');
      console.log('Fetching apikeys collection');
      collection.findOne({ "apiKey": apiKey }, function (err, result) {
        if (err) reject(err);
        if (null != result) {
          console.log("Found apikey");
          enabled = result.enabled | false;
        } else {
          console.log("Not Found apikey");
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
