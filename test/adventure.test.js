const Race = require('../model/race.model');
const Character = require('../model/character.model');
const Adventure = require('../model/adventure.model');
const chai = require('chai');
const assert = chai.assert;
const app = require('../server');
const request = require('supertest');

describe('Adventure Tests', () => {
	let race, character, adventure;

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
				return request(app).post('/api/v1/characters').send({
					name: 'testing character',
					description: 'testing description',
					experience: 1000,
					race: result.body._id
				})
			})
			.then((result) => {
				character = result.body;
				return request(app).post('/api/v1/adventures').send({
					name: 'testing adventure',
					description: 'testing description',
					experience_gain: 2000,
					characters: [result.body._id]
				});
			})
			.then((result) => {
				adventure = result.body;
				done();
			})
			.catch((error) => {
				console.error(error);
			});
	});

	it('GET request at /api/v1/adventures returns a list of all adventures', (done) => {
		request(app)
			.get('/api/v1/adventures')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isArray(body);
				assert.lengthOf(body, 1);
				assert(body[0]._id === character._id);
				done();
			});
	});

	it('GET request at /api/v1/adventures/:id returns a single adventure', (done) => {
		request(app)
			.get('/api/v1/adventures/' + adventure._id)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === character._id);
				done();
			});
	});

	it('POST request at /api/v1/adventures returns a new adventure', (done) => {
		const adventure = new Adventure({
			name: 'just posted',
			description: 'new description',
			experience_gain: 3000,
			characters: [character._id]
		});

		request(app)
			.post('/api/v1/adventures/')
			.send(adventure)
			.expect(201)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === adventure._id);
				done();
			});
	});

	it('PUT request at api/v1/adventures/:id returns an updated adventure', (done) => {
		const adventure = new Adventure({
			name: 'just updated',
			description: 'updated description',
			experience_gain: 4000,
			characters: [character._id]
		});

		request(app)
			.put('/api/v1/adventures/' + adventure._id)
			.send(adventure)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === adventure._id);
				done();
			});
	});

	it('DELETE request at api/v1/adventures/:id returns the deleted adventure', (done) => {
		request(app)
			.delete('/api/v1/adventures/' + adventure._id)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id === adventure._id);

				request(app)
					.get('/api/v1/characters/' + adventure._id)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(404, done);
			})
	});
});
