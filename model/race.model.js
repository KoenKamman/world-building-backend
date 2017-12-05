const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RaceSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	strength_mod: {
		type: Number,
		required: true
	},
	agility_mod: {
		type: Number,
		required: true
	},
	intelligence_mod: {
		type: Number,
		required: true
	}
});

const Race = mongoose.model('race', RaceSchema);

module.exports = Race;
