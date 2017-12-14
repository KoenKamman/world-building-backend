const mongoose = require('mongoose');
const config = require('./env');

mongoose.Promise = global.Promise;

mongoose.connect(config.dburl, {useMongoClient: true});
let connection = mongoose.connection
	.once('open', () => {
		console.log('Connected to Mongo on ' + config.dburl);
		console.log('');
	})
	.on('error', (error) => {
		console.warn('Warning', error.toString());
	});

module.exports = connection;
