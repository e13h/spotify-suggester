const db = require('../persistence');

async function makeSuggestions(trackID) {
   return ['one', 'two', 'three'];
}

module.exports = {
   makeSuggestions,
};