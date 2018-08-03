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
//const cosmosHost = "mongodb://mongoani:mUby2OvPiKegjDgct9SjrBhYwSvVWZkmKbG0viDCKDIRLVg48LLbngHADydFgb8mbs3X1fQkgjIQOftwyupMCw%3D%3D@mongoani.documents.azure.com:10255/?ssl=true";
const cosmosHost = "mongodb://animongo:eTDJLkDMz0UhctTrjYNbj51R8H7JjsTOyKH1SLu9Z1MrWEMNcmWlqZxiKd6hjeZaFeaSz6PkO2i4PhZtbC3Rmw%3D%3D@animongo.documents.azure.com:10255/?ssl=true";
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
    if(req.url.indexOf('v1/') > -1){
      checkApiKeyFirst(req, res, query.apiKey).then((result) => {
        if (req.url.indexOf('v1/get-rating') > -1) {
          getRatingFirst(req, res, query.productId, query.callback);
        } else if (req.url.indexOf('v1/update-rating') > -1) {
          updateRatingFirst(req, res, query.productId, query.callback);
        }   
      }).catch((error) => {
        content = { 'success': false, 'error': 'Invalid Api key' };
        dataToSent = callback + "(" + JSON.stringify(content) + ")";
        sendResponse(dataToSent, 'application/json', res);
      });
    }else if(req.url.indexOf('v2/') > -1){
      checkApiKeySecond(req, res, query.apiKey).then((result) => {
        if (req.url.indexOf('v2/get-rating') > -1) {
          getRatingSecond(req, res, query.productId, query.callback);
        } else if (req.url.indexOf('v2/update-rating') > -1) {
          updateRatingSecond(req, res, query.productId, query.callback);
        }      
      }).catch((error) => {
        content = { 'success': false, 'error': 'Invalid Api key' };
        dataToSent = callback + "(" + JSON.stringify(content) + ")";
        sendResponse(dataToSent, 'application/json', res);
      });
    } else if(req.url.indexOf('v3/') > -1){
      checkApiKeyFirst(req, res, query.apiKey).then((result) => {
        if (req.url.indexOf('v3/update-rating') > -1) {
          updateRatingThird(req, res, query.productId, query.callback);
        }    
      }).catch((error) => {
        content = { 'success': false, 'error': 'Invalid Api key' };
        dataToSent = callback + "(" + JSON.stringify(content) + ")";
        sendResponse(dataToSent, 'application/json', res);
      });
    } else if(req.url.indexOf('v4/') > -1){
      checkApiKeySecond(req, res, query.apiKey).then((result) => {
        if (req.url.indexOf('v4/update-rating') > -1) {
          updateRatingFourth(req, res, query.productId, query.callback);
        }      
      }).catch((error) => {
        content = { 'success': false, 'error': 'Invalid Api key' };
        dataToSent = callback + "(" + JSON.stringify(content) + ")";
        sendResponse(dataToSent, 'application/json', res);
      });
    }    
  }
}

function sendResponse(content, contentType, res) {
  res.writeHead(200, { 'Content-Type': contentType });
  res.write(content);
  res.end();
}


function getRatingFirst(req, res, productId, callback) {
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

function getRatingSecond(req, res, productId, callback) {
  MongoClient.connect(cosmosHost, function (err, client) {
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

function updateRatingFirst(req, res, productId, callback) {
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

function updateRatingSecond(req, res, productId, callback) {
  MongoClient.connect(cosmosHost, function (err, client) {
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

function updateRatingThird(req, res, productId, callback) {
  MongoClient.connect(mongoHost, function (err, client) {
    if (err) throw err;
    const db = client.db('aniq');
    var rating = 0;
    const collection = db.collection('products');
    collection.findAndModify({ "productId": productId }, [], { $inc: { rating: 1 } }, { upsert: true, new: true }, function (err, result) {
      client.close();
      if (err) throw err; 
      if (null != result) {
        rating = result.value.rating | 0;
      }
      content = { 'success': true, 'rating': rating };
      dataToSent = callback + "(" + JSON.stringify(content) + ")";
      sendResponse(dataToSent, 'application/json', res);
    });
  });
}

function updateRatingFourth(req, res, productId, callback) {
  MongoClient.connect(cosmosHost, function (err, client) {
    if (err) throw err;
    const db = client.db('aniq');
    var rating = 0;
    const collection = db.collection('products');
    collection.findAndModify({ "productId": productId }, [], { $inc: { rating: 1 } }, { upsert: true, new: true }, function (err, result) {
      client.close();
      if (err) throw err; 
      if (null != result) {
        rating = result.value.rating | 0;
      }
      content = { 'success': true, 'rating': rating };
      dataToSent = callback + "(" + JSON.stringify(content) + ")";
      sendResponse(dataToSent, 'application/json', res);
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

function checkApiKeyFirst(req, res, apiKey) {
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

function checkApiKeySecond(req, res, apiKey) {
  return new Promise(function (resolve, reject) {
    MongoClient.connect(cosmosHost, function (err, client) {
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
