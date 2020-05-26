const sync = require('../helpers/sync');
const db = require('../persistence');

async function makeSuggestions(accessToken, trackID, userID) {
   const sourceAudioFeatures = (await sync.fetchAudioFeatures(accessToken, [trackID])).map((item) => Object.assign({
      danceability: item.danceability,
      acousticness: item.acousticness,
      energy: item.energy,
      loudness: item.loudness,
      mode: item.mode,
      tempo: item.tempo,
      valence: item.valence,
   }));
   return await db.getSuggestedTracks(sourceAudioFeatures, userID);
}

module.exports = {
   makeSuggestions,
};