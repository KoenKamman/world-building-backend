const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RaceSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	strength_mod: Number,
	agility_mod: Number,
	intelligence_mod: Number

});

const Race = mongoose.model('race', RaceSchema);

module.exports = Race;
