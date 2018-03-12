/**
 *
 * author:
 * date:
 */

'use strict';

let https = require('https');
let co = require('co');

let HttpUtil = {};

module.exports = HttpUtil;

HttpUtil.httpsRequest = function (url, route, msg) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(msg);

    const options = {
      hostname: url,
      path: route,
      method: 'POST',
      headers: {
        'Content-Type': 'application/JSON',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    let req = https.request(options, (res) => {
      res.setEncoding('utf8');

      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        const parsedData = JSON.parse(rawData);
        resolve(parsedData);
      });
    }).on('error', function (e) {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};


