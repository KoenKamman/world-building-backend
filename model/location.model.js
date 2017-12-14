const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	}
});

const Location = mongoose.model('location', LocationSchema);

module.exports = Location;
