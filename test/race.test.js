const Race = require('../model/race.model');
const chai = require('chai');
const assert = chai.assert;
const app = require('../server');
const request = require('supertest');

describe('Race Tests', () => {
	let race, race2, race3;

	beforeEach((done) => {
		request(app).post('/api/v1/races').send({
			name: 'testing race',
			description: 'testing description',
			strength_mod: 5,
			agility_mod: 5,
			intelligence_mod: 5
		})
			.then((result) => {
				race = result.body;
				return request(app).post('/api/v1/races').send({
					name: 'testing race 2',
					description: 'testing description 2',
					strength_mod: 5,
					agility_mod: 5,
					intelligence_mod: 5
				});
			})
			.then((result) => {
				race2 = result.body;
				return request(app).post('/api/v1/races').send({
					name: 'testing race 3',
					description: 'testing description 3',
					strength_mod: 7,
					agility_mod: 7,
					intelligence_mod: 7
				});
			})
			.then((result) => {
				race3 = result.body;
				done();
			})
			.catch((error) => {
				console.error(error);
			});

	});

	it('GET request at /api/v1/races returns a list of all races', (done) => {
		request(app)
			.get('/api/v1/races')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isArray(body);
				assert.lengthOf(body, 3);
				assert(body[0]._id === race._id);
				done();
			});
	});

	it('GET request at /api/v1/races/:id/related returns a list of related races', (done) => {
		request(app)
			.get('/api/v1/races/' + race._id + '/related')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isArray(body);
				assert.lengthOf(body, 1);
				done();
			});
	});

	it('GET request at /api/v1/races/:id returns a single race', (done) => {
		request(app)
			.get('/api/v1/races/' + race._id)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === race._id);
				done();
			});
	});

	it('POST request at /api/v1/races returns a new race', (done) => {
		const newrace = new Race({
			name: 'just posted',
			description: 'new description',
			strength_mod: 10,
			agility_mod: 10,
			intelligence_mod: 10
		});

		request(app)
			.post('/api/v1/races/')
			.send(newrace)
			.expect(201)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === newrace._id);
				done();
			});
	});

	it('PUT request at api/v1/races/:id returns an updated race', (done) => {
		const updatedrace = new Race({
			name: 'just updated',
			description: 'updated description',
			strength_mod: 9,
			agility_mod: 9,
			intelligence_mod: 9
		});

		request(app)
			.put('/api/v1/races/' + race._id)
			.send(updatedrace)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === race._id);
				done();
			});
	});

	it('DELETE request at api/v1/races/:id returns the deleted race', (done) => {
		request(app)
			.delete('/api/v1/races/' + race._id)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === race._id);

				request(app)
					.get('/api/v1/characters/' + race._id)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(404, done);
			})
	});

});
