var express = require('express');
var config = require('./config/admin');

var app = express();

// screen 设置 NODE_ENV 无效,改为传参数实现

if (process.argv.length > 2){
  app.set('env',process.argv[process.argv.length-1] || 'development');
}else{
  app.set('env','development');
}

console.log('env:' + app.get('env'));

//--------------------configure app----------------------
var pub = __dirname + '/public';
var view = __dirname + '/views';

app.configure(function() {
	app.set('view engine', 'html');
	app.set('views', view);
	app.engine('.html', require('ejs').__express);

	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.set('basepath', __dirname);
});

app.configure('development','localtest', function() {
	app.use(express.static(pub));
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

app.configure('remotetest','production', 'production_america', function() {
	var oneYear = 31557600000;
	app.use(express.static(pub, {
		maxAge: oneYear
	}));
	app.use(express.errorHandler());
});

app.on('error', function(err) {
	console.error('app on error:' + err.stack);
});

app.get('/test', function (req, resp) {
  resp.render('test');
});

app.get('/', function(req, resp) {
  console.log('config:' + config[app.get('env')]);
	resp.render('index', config[app.get('env')]);
});

app.get('/module/:mname', function(req, resp) {
	resp.render(req.params.mname);
});

app.listen(7777);
console.log('[AdminConsoleStart] visit http://0.0.0.0:7777');
