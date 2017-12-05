const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

before((done) => {
	mongoose.connect('mongodb://localhost/worldbuilding_test');
	mongoose.connection
		.once('open', () => done())
		.on('error', (err) => {
			console.warn('Warning', err);
		});
});

beforeEach((done) => {
	const {characters, races} = mongoose.connection.collections;
	Promise.all([characters.drop(), races.drop()])
		.then(() => {
			done();
		})
		.catch((error) => {
			console.log(error);
			done();
		});
});
