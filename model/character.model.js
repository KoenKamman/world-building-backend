const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CharacterSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	experience: {
		type: Number,
		required: true
	},
	race: {type: Schema.Types.ObjectId, ref: 'race', required: true}
}, {
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true
	}
});


// Middleware

CharacterSchema.pre('find', function (next) {
	this.populate('race');
	next();
});

CharacterSchema.pre('findOne', function (next) {
	this.populate('race');
	next();
});


// Virtual Attributes

CharacterSchema.virtual('level').get(function () {
	return this.experience / 100;
});

CharacterSchema.virtual('strength').get(function () {
	return this.race.strength_mod * this.level;
});

CharacterSchema.virtual('agility').get(function () {
	return this.race.agility_mod * this.level;
});

CharacterSchema.virtual('intelligence').get(function () {
	return this.race.intelligence_mod * this.level;
});


const Character = mongoose.model('character', CharacterSchema);

module.exports = Character;
