const mongoose = require('mongoose');
const neo4j = require('../config/neo4j.db');

mongoose.Promise = global.Promise;

let connection;

before((done) => {
	mongoose.connect('mongodb://localhost/worldbuilding_test', {useMongoClient: true});
	connection = mongoose.connection
		.once('open', () => {
			console.log('Connected to MongoDB worldbuilding_test on localhost');
			console.log('');
			done();
		})
		.on('error', (error) => {
			console.warn('Warning', error.toString());
		});
});

beforeEach((done) => {
	connection.db.dropDatabase()
		.then(() => {
			return neo4j.driver.session().run('MATCH (n) DETACH DELETE n');
		})
		.then(() => {
			done();
		})
		.catch((error) => {
			console.error(error);
		})
});