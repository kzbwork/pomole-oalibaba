let co = require('co');
let singleWalletInterface = require('../libs/singleWallat/singleWalletInterface');
let app = require('pomelo').app;
let logger = app.logger.getWalletLog(__filename);

let walletService = {};

module.exports = walletService;

let pro =  walletService;

pro.open = true;

pro.isOpenForUser = function (user) {
	return this.open && user.type === app.consts.USER_TYPE.CREDIT;
};

/**
 * 获取接口链接数据
 * @returns {{host: string, port: string, gameProvider: string, apiVersion: string}}
 */
pro.getInterfaceInfo = function() {
	return {
		host: 'uatapi.hgline88.com',
		port: '8087',
		gameProvider: 'whg',
		apiVersion: '1.2',
		loginName: 'whg',
		pwd: '12345678'
	}
};

/**
 * 获取钱包的数据
 * @param user
 * @returns {{loginName: string, pwd: string, session: string, accountId: string}}
 */
pro.getWalletInfo = function(user) {
	let info = {};
	let walletInfo = user.walletInfo;

	for (let key in walletInfo) {
		info[key] = walletInfo[key];
	}

	info.isMobile = user.isMobile;

	return info;
};

/**
 * 获取账号信息
 * @param user
 * @returns {*}
 */
pro.getAccount = function (user) {
	let self = this;

	return co(function*(){
		let info = yield singleWalletInterface.getAccount(self.getInterfaceInfo(), self.getWalletInfo(user));

		if (info.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
			logger.warn(`uid:${user.id},getAccount failed,error msg:${JSON.stringify(info)},interfaceInfo:${JSON.stringify(self.getInterfaceInfo())},userInfo:${JSON.stringify(self.getWalletInfo(user))}`);
		}
		user.walletInfo.accountId = info.accountId;

		return info;
	});
};

/**
 * 获取玩家钱包金额
 * @param user
 * @param gameId
 * @returns {*}
 */
pro.getBalance = function(user, gameId) {
	let self = this;

	return co(function*(){
		let walletInfo = self.getWalletInfo(user);

		walletInfo.gameid = gameId;

		let info = yield singleWalletInterface.getBalance(self.getInterfaceInfo(), walletInfo);

		if (info.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
			logger.warn(`uid:${user.id},getBalance failed,error msg:${JSON.stringify(info)},interfaceInfo:${JSON.stringify(self.getInterfaceInfo())},userInfo:${JSON.stringify(walletInfo)}`);
		}

		return info;
	});
};

/**
 * 玩家下注
 * @param user
 * @param gameId
 * @param amount	下注金额
 * @param roundId	轮次
 * @param transactionId	变化id
 * @param type
 * @param remarks
 * @returns {*}
 */
pro.bet = function(user, gameId, amount, roundId, transactionId, type, remarks) {
	let self = this;

	return co(function*(){
		let walletInfo = self.getWalletInfo(user);

		walletInfo.gameId = gameId;
		walletInfo.amount = amount;
		walletInfo.roundId = roundId;
		walletInfo.transactionId = transactionId;
		walletInfo.type = type;
		walletInfo.remarks = remarks;

		let info = yield singleWalletInterface.bet(self.getInterfaceInfo(), walletInfo);

		if (info.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
			logger.warn(`uid:${user.id},bet failed,error msg:${JSON.stringify(info)},interfaceInfo:${JSON.stringify(self.getInterfaceInfo())},userInfo:${JSON.stringify(walletInfo)}`);
		}

		return info;
	}).catch(function (err) {
		logger.error(err.stack);
	});
};

/**
 * 玩家中奖
 * @param user
 * @param gameId
 * @param amount	中奖金额
 * @param roundId
 * @param transactionId
 * @param result
 * @param type
 * @param remarks
 * @returns {*}
 */
pro.result = function(user, gameId, amount, roundId, transactionId, result, type, remarks) {
	let self = this;

	return co(function*(){
		let walletInfo = self.getWalletInfo(user);

		walletInfo.gameId = gameId;
		walletInfo.amount = amount;
		walletInfo.roundId = roundId;
		walletInfo.transactionId = transactionId;
		walletInfo.result = result;
		walletInfo.type = type;
		walletInfo.remarks = remarks;

		let info = yield singleWalletInterface.result(self.getInterfaceInfo(), walletInfo);

		if (info.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
			logger.warn(`uid:${user.id},result failed,error msg:${JSON.stringify(info)},interfaceInfo:${JSON.stringify(self.getInterfaceInfo())},userInfo:${JSON.stringify(walletInfo)}`);
		}

		return info;
	}).catch(function (err) {
		logger.error(err.stack);
	});
};

/**
 * 请求退款
 * @param user
 * @param gameId
 * @param amount
 * @param roundId
 * @param transactionId
 * @returns {*}
 */
pro.refund = function (user, gameId, amount, roundId, transactionId) {
	let self = this;

	return co(function*(){
		let walletInfo = self.getWalletInfo(user);

		walletInfo.gameId = gameId;
		walletInfo.amount = amount;
		walletInfo.roundId = roundId;
		walletInfo.transactionId = transactionId;

		let info = yield singleWalletInterface.refund(self.getInterfaceInfo(), walletInfo);

		if (info.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
			logger.warn(`uid:${user.id},refund failed,error msg:${JSON.stringify(info)},interfaceInfo:${JSON.stringify(self.getInterfaceInfo())},userInfo:${JSON.stringify(walletInfo)}`);
		}

		return info;
	}).catch(function (err) {
		logger.error(err.stack);
	});
};

/**
 * ping
 * @param user
 * @returns {*}
 */
pro.ping = function(user) {
	let self = this;

	return co(function*(){
		let info = yield singleWalletInterface.ping(self.getInterfaceInfo(), self.getWalletInfo(user));

		if (info.responseCode !== app.consts.SINGLE_WALLET_CODE.OK) {
			logger.warn(`uid:${user.id},ping failed,error msg:${JSON.stringify(info)},interfaceInfo:${JSON.stringify(self.getInterfaceInfo())},userInfo:${JSON.stringify(self.getWalletInfo(user))}`);
		}

		return info;
	});
};



