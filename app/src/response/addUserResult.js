export default class AddUserResult {
   constructor(error, userID) {
      this._error = error;
      this._userID = userID;
   }

   get redirect_url() {
      const callback_uri = encodeURIComponent(`${process.env.APPLICATION_URL}/callback`);
      const scopes = [
         'playlist-read-private',
         'user-read-currently-playing',
         'playlist-read-collaborative',
      ];
      return `https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${callback_uri}&scope=${scopes.join('%20')}&state=${this._userID}`;
   }

   get error() {
      return this._error;
   }
}
