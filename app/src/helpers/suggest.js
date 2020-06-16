'use strict';
import sync from '../helpers/sync.js'
import db from '../persistence/index.js';

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
   return await db.getSuggestedTracks(sourceAudioFeatures[0], userID, trackID);
}

export default {
   makeSuggestions,
};
