const assert = require('assert');
const Character = require('../model/character.model');
const Race = require('../model/race.model');

describe('Querying a character in the database', () => {

	beforeEach((done) => {
		let race = new Race({
			name: 'testing race',
			strength_mod: 5,
			agility_mod: 5,
			intelligence_mod: 5
		});

		let character = new Character({
			name: 'testing character',
			experience: 1000,
			race: race._id
		});

		Promise.all([character.save(), race.save()])
			.then(() => {
				done();
			});

	});

	it('returns a character', (done) => {
		Character.findOne()
			.then((character) => {
				assert(character.name === 'testing character');
				assert(character.experience === 1000);
				done();
			});
	});

	it('returns a character with a reference to a race', (done) => {
		Character.findOne()
			.then((character) => {
				assert(character.race);
				done();
			});
	});

	it('returns a character with correct virtual properties', (done) => {
		Character.findOne()
			.then((character) => {
				assert(character.level === 10);
				assert(character.strength === 50);
				assert(character.agility === 50);
				assert(character.intelligence === 50);
				done();
			});
	});

});
