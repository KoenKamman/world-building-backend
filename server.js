const http = require('http');
const express = require('express');
var bodyParser = require('body-parser');
const characterRoutes = require('./api/character.route');
const config = require('./config/env');

const app = express();

app.use(bodyParser.urlencoded({
	'extended': 'true'
}));
app.use(bodyParser.json());
app.use(bodyParser.json({
	type: 'application/vnd.api+json'
}));

app.set('port', (process.env.PORT || config.env.webPort));
app.set('env', (process.env.ENV || 'development'));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN || 'http://localhost:4200');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

app.use('/api/v1', characterRoutes);

app.use('*', (req, res) => {
	res.status(400);
	res.json({
		'error': 'This URL is unavailable.'
	});
});

app.listen(config.env.webPort, () => {
	console.log('Server is running on port ' + app.get('port'));
});

module.exports = app;