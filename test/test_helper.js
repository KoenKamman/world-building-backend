const mongoose = require('mongoose');
const neo4j = require('../config/neo4j.db');

mongoose.Promise = global.Promise;

before((done) => {
	mongoose.connect('mongodb://localhost/worldbuilding_test', {useMongoClient: true});
	mongoose.connection
		.once('open', () => done())
		.on('error', (err) => {
			console.warn('Warning', err);
		});
});

beforeEach((done) => {
	const {characters, races, adventures} = mongoose.connection.collections;
	const session = neo4j.driver.session();
	Promise.all([characters.drop(), races.drop(), adventures.drop(), session.run('MATCH (n) DETACH DELETE n')])
		.then(() => {
			done();
		})
		.catch(() => {
			done();
		});
});
