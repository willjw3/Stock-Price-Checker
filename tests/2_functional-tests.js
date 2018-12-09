/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

    suite('GET /api/stock-prices => stockData object', function() {

      this.timeout(4000);
      let numLikes = 0;

      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.type, "application/json");
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isNumber(res.body.stockData.likes);
          numLikes = res.body.stockData.likes;
          done();
        });
      });

      test('1 stock with like', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: 'goog', like: 'true'})
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.equal(res.type, "application/json");
           assert.equal(res.body.stockData.stock, 'GOOG');
           assert.isNumber(res.body.stockData.likes);
           assert.isAtLeast(res.body.stockData.likes, numLikes);
           assert.isAtMost(res.body.stockData.likes, numLikes+1)
           numLikes = res.body.stockData.likes;
           done();  
         })

      });

      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: 'goog', like: 'true'})
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.equal(res.type, "application/json");
           assert.equal(res.body.stockData.stock, 'GOOG');
           assert.isNumber(res.body.stockData.likes);
           assert.equal(res.body.stockData.likes, numLikes);
           setTimeout(done, 300);
         })
      });

      test('2 stocks', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: ['goog', 'msft']})
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.equal(res.type, "application/json");
           assert.equal(res.body.stockData[0].stock, 'GOOG');
           assert.equal(res.body.stockData[1].stock, 'MSFT');
           assert.isNumber(res.body.stockData[0].rel_likes);
           assert.isNumber(res.body.stockData[1].rel_likes);
           numLikes = [ res.body.stockData[0].rel_likes, res.body.stockData[1].rel_likes ];
           setTimeout(done, 300);
         });
      });

      test('2 stocks with like', function(done) {
        chai.request(server)
         .get('/api/stock-prices')
         .query({stock: ['goog', 'msft'], like: 'true'})
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.equal(res.type, "application/json");
           assert.equal(res.body.stockData[0].stock, 'GOOG');
           assert.equal(res.body.stockData[1].stock, 'MSFT');
           assert.isNumber(res.body.stockData[0].rel_likes);
           assert.isNumber(res.body.stockData[1].rel_likes);
           assert.equal(res.body.stockData[0].rel_likes, numLikes[0] + numLikes[1]);
           assert.equal(res.body.stockData[1].rel_likes, numLikes[1] + numLikes[0]);
           setTimeout(done, 300);
         });
      });

    });

});
