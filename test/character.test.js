const Race = require('../model/race.model');
const Character = require('../model/character.model');
const chai = require('chai');
const assert = chai.assert;
const app = require('../server');
const request = require('supertest');

describe('Character Tests', () => {
	let race, character;

	beforeEach((done) => {
		const race = new Race({
			name: 'testing race',
			description: 'testing description',
			strength_mod: 5,
			agility_mod: 5,
			intelligence_mod: 5
		});

		const character = new Character({
			name: 'testing character',
			description: 'testing description',
			experience: 1000,
			race: race._id
		});

		// request(app).post('/api/v1/characters').send(character)
		// 	.then((result) => {
		// 		this.character = result.body;
		// 		return request(app).post('/api/v1/races').send(race);
		// 	})
		// 	.then((result) => {
		// 		this.race = result.body;
		// 		done();
		// 	})
		// 	.catch((error) => {
		// 		console.error(error);
		// 	});

		race.save()
			.then(() => {
				return character.save();
			})
			.then(() => {
				this.race = race;
				this.character = character;
				done();
			})
			.catch((error) => {
				console.log(error);
			});

	});

	it('GET request at /api/v1/characters returns a list of all characters', (done) => {
		request(app)
			.get('/api/v1/characters')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isArray(body);
				assert.lengthOf(body, 1);
				assert(body[0]._id = this.character._id);
				assert(body[0].level = body[0].experience / 10);
				assert(body[0].strength = body[0].race.strength_mod * body[0].level);
				assert(body[0].agility = body[0].race.agility_mod * body[0].level);
				assert(body[0].intelligence = body[0].race.intelligence_mod * body[0].level);
				done();
			});
	});

	it('GET request at /api/v1/characters/:id returns a single character', (done) => {
		request(app)
			.get('/api/v1/characters/' + this.character._id)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id = this.character._id);
				assert(body.level = body.experience / 100);
				assert(body.strength = body.race.strength_mod * body.level);
				assert(body.agility = body.race.agility_mod * body.level);
				assert(body.intelligence = body.race.intelligence_mod * body.level);
				done();
			});
	});

	it('POST request at /api/v1/characters returns a new character', (done) => {
		const character = new Character({
			name: 'just posted',
			description: 'new description',
			experience: 4000,
			race: this.race._id
		});

		request(app)
			.post('/api/v1/characters/')
			.send(character)
			.expect(201)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id = character._id);
				assert(body.level = body.experience / 100);
				assert(body.strength = body.race.strength_mod * body.level);
				assert(body.agility = body.race.agility_mod * body.level);
				assert(body.intelligence = body.race.intelligence_mod * body.level);
				done();
			});
	});

	it('PUT request at api/v1/characters/:id returns an updated character', (done) => {
		const character = new Character({
			name: 'just updated',
			description: 'updated description',
			experience: 5000,
			race: this.race._id
		});

		request(app)
			.put('/api/v1/characters/' + this.character._id)
			.send(character)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id = character._id);
				assert(body.level = body.experience / 100);
				assert(body.strength = body.race.strength_mod * body.level);
				assert(body.agility = body.race.agility_mod * body.level);
				assert(body.intelligence = body.race.intelligence_mod * body.level);
				done();
			});
	});

	it('DELETE request at api/v1/characters/:id returns the deleted character', (done) => {
		request(app)
			.delete('/api/v1/characters/' + this.character._id)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((result) => {
				const body = result.body;
				assert.isNotArray(body);
				assert(body._id = this.character._id);
				assert(body.level = body.experience / 100);
				assert(body.strength = body.race.strength_mod * body.level);
				assert(body.agility = body.race.agility_mod * body.level);
				assert(body.intelligence = body.race.intelligence_mod * body.level);

				request(app)
					.get('/api/v1/characters/' + this.character._id)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(404, done);
			})
	});
});
