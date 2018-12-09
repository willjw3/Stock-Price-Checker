/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
//var Request = require('request');
//require('dotenv').config();
const axios = require('axios');
const APIURL = 'https://api.iextrading.com/1.0/stock/';
const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
var likes;
var setDoc;

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get((req, res) => {

      MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true }, function(err, client) {
        if (!err) {
          console.log('Database connection established...');
        }
        var db = client.db('infosecqa');


        async function getOneStock(symbol, like, userip) {
          const theLikes = await db.collection('stocks').findOne({stock: symbol}, (err, doc) => {
            if (err) {console.error(err);}
            if (!doc) {
                console.log(symbol+' not found in database');
                setDoc = (like === 'true') ? {stock: symbol, likes: 1, ip: [userip] } :
                              {stock: symbol, likes: 0, ip: []};
                db.collection('stocks').insertOne(setDoc, (err, result) => {
                  if (err) {console.error(err);}
                    console.log('document inserted into stocks collection');
                });
            }
            if (doc) {
              console.log("Document matching query parameters found");
              if (like === 'true' && !doc.ip.includes(userip)) {
                doc.ip.push(userip);
                var upDoc = {$set: {likes: doc.likes+1, ip: doc.ip}};
                setDoc = {stock: doc.stock, likes: doc.likes+1, ip: doc.ip};
                db.collection('stocks').updateOne({stock: symbol}, upDoc, (err, result) => {
                  if (err) {console.error(err.message);}
                    console.log('like added to '+symbol);
                });
              } else {
                console.log('user has already liked this stock');
                setDoc = {stock: doc.stock, likes: doc.likes, ip: doc.ip};
              }
            }
            likes = setDoc.likes;
          });

          const results = await axios.get(APIURL+symbol+'/price')
            .then(res => {
              //console.log({symbol, price: res.data, likes});
              return {symbol, price: res.data, likes};
            })
            .catch(error => {
              console.log({ERROR: 'Could not access stock data. Try Again.'});
              return {ERROR: 'Could not access stock data. Try Again.'}
            });

          return results;
        }

        async function getStocks(req) {
          const symbol = req.query.stock;
          const like   = (req.query.like === 'true') ? 'true' : 'false';
          const userip = req.ip;

          if (Array.isArray(symbol)) {
            const stock1 = await getOneStock(symbol[0], like, userip);
            const stock2 = await getOneStock(symbol[1], like, userip);

            if (stock1.ERROR || stock2.ERROR) {
              return stock1.ERROR || stock2.ERROR;
            }

            return res.json({
              "stockData": [
                {stock: stock1.symbol.toUpperCase(), price: stock1.price, rel_likes: stock1.likes - stock2.likes},
                {stock: stock2.symbol.toUpperCase(), price: stock2.price, rel_likes: stock2.likes - stock1.likes}
              ]
            });
          }

          const stock = await getOneStock(symbol, like, userip);
          if (stock.ERROR) {
            return stock.ERROR;
          }
          return res.json({"stockData": {stock: stock.symbol.toUpperCase(), price: stock.price, likes: stock.likes}});
        }

        getStocks(req);


      });

    });

};
