const mongoose = require('mongoose');
const config = require('./env');

mongoose.Promise = global.Promise;

mongoose.connect(config.dburl);
let connection = mongoose.connection
	.once('open', () => console.log('Connected to Mongo on ' + config.dburl))
	.on('error', (error) => {
		console.warn('Warning', error.toString());
	});

module.exports = connection;