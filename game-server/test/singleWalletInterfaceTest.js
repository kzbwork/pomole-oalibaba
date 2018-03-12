/**
 *
 * author:
 * date:
 */

'use strict';

let singleWalletInterface = require('../app/libs/singleWallat/singleWalletInterface');
let roundId = 102;

describe('singleWalletInterface', function () {
  it('ping', function (done) {
    singleWalletInterface.ping({
      host: 'uatapi.hgline88.com',
      port: '8087',
      gameProvider: 'whg',
      apiVersion: '1.2',
			pwd: '12345678',
			loginName: 'whg',
    }, {
    }).then(function (res) {
      console.log(`ping: res = ${JSON.stringify(res)}`);
      if (res.responseCode === 0) {
        done();
      } else {
        done(new Error(`ping error`));
      }
    });
  });

  it('getAccount', function (done) {
    singleWalletInterface.getAccount({
      host: 'uatapi.hgline88.com',
      port: '8087',
      gameProvider: 'whg',
      apiVersion: '1.2',
			pwd: '12345678',
			loginName: 'whg',
    }, {
      session: '6F33903E-EBA7-4D23-9D3F-C40D9B7CE001',
      isMobile: false
    }).then(function (res) {
      console.log(`getAccount: res = ${JSON.stringify(res)}`);
      if (res.responseCode === 0) {
        done();
      } else {
        done(new Error(`getAccount error`));
      }
    });
  });

  it('getBalance', function (done) {
    singleWalletInterface.getBalance({
      host: 'uatapi.hgline88.com',
      port: '8087',
      gameProvider: 'whg',
      apiVersion: '1.2',
			pwd: '12345678',
			loginName: 'whg',
    }, {
      session: '6F33903E-EBA7-4D23-9D3F-C40D9B7CE001',
      accountId: 'TSTtestwh001',
      isMobile: false,
      gameId: 'SW01'
    }).then(function (res) {
      console.log(`getBalance: res = ${JSON.stringify(res)}`);
      if (res.responseCode === 0) {
        done();
      } else {
        done(new Error(`getBalance error`));
      }
    });
  });

  it('bet', function (done) {
    singleWalletInterface.bet({
      host: 'uatapi.hgline88.com',
      port: '8087',
      gameProvider: 'whg',
      apiVersion: '1.2',
			loginName: 'whg',
			pwd: '12345678'
    }, {
      session: '6F33903E-EBA7-4D23-9D3F-C40D9B7CE001',
      accountId: 'TSTtestwh001',
      isMobile: false,
      gameId: 'SW01',
      amount: 0,
      roundId: roundId,
      transactionId: 78
    }).then(function (res) {
      console.log(`bet: res = ${JSON.stringify(res)}`);
      if (res.responseCode === 0) {
        done();
      } else {
        done(new Error(`bet error`));
      }
    });
  });

	it('reward result', function (done) {
		singleWalletInterface.result({
			host: 'uatapi.hgline88.com',
			port: '8087',
			gameProvider: 'whg',
			apiVersion: '1.2',
			loginName: 'whg',
			pwd: '12345678'
		}, {
			session: '6F33903E-EBA7-4D23-9D3F-C40D9B7CE001',
			accountId: 'TSTtestwh001',
			isMobile: false,
			gameId: 'SW01',
			amount: 1,
			roundId: roundId,
			result: '',
			transactionId: roundId * 10 + 2,
		}).then(function (res) {
			console.log(`result: res = ${JSON.stringify(res)}`);
			if (res.responseCode === 0) {
				done();
			} else {
				done(new Error(`result error`));
			}
		});
	});

  it('bonus result', function (done) {
    singleWalletInterface.result({
      host: 'uatapi.hgline88.com',
      port: '8087',
      gameProvider: 'whg',
      apiVersion: '1.2',
			loginName: 'whg',
			pwd: '12345678'
    }, {
      session: '6F33903E-EBA7-4D23-9D3F-C40D9B7CE001',
      accountId: 'TSTtestwh001',
      isMobile: false,
      gameId: 'SW01',
      amount: 2,
      roundId: roundId,
      result: '',
      transactionId: roundId * 10 + 1,
			type: 'jackpot',
			remarks: 'remarks'
    }).then(function (res) {
      console.log(`result: res = ${JSON.stringify(res)}`);
      if (res.responseCode === 0) {
        done();
      } else {
        done(new Error(`result error`));
      }
    });
  });
	//
  // it('refund', function (done) {
  //   singleWalletInterface.refund({
  //     host: 'uatapi.hgline88.com',
  //     port: '8087',
  //     gameProvider: 'whg',
  //     apiVersion: '1.2',
		// 	loginName: 'whg',
		// 	pwd: '12345678'
  //   }, {
  //     session: '6F33903E-EBA7-4D23-9D3F-C40D9B7CE001',
  //     accountId: 'TSTtestwh001',
  //     isMobile: false,
  //     gameId: 'SW01',
  //     amount: 1,
  //     roundId: roundId,
  //     transactionId: roundId * 10 + 2
  //   }).then(function (res) {
  //     console.log(`refund: res = ${JSON.stringify(res)}`);
  //     if (res.responseCode === 0) {
  //       done();
  //     } else {
  //       done(new Error(`refund error`));
  //     }
  //   });
  // });
});


