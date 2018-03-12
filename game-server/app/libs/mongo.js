/**
 * Created by wyang on 16/4/2.
 */

'use strict';

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

mongoose.Promise = global.Promise;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('mongodb open');
});

module.exports = mongoose;