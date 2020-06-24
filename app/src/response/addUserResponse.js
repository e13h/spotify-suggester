export default class AddUserResponse {
   constructor(error, userID, inquiringURL) {
      this.error = error;
      if (error !== null && error !== undefined) {
         this.content = null
      } else {
         this.content = {
            userID: userID,
            redirectURL: this.redirect_url(userID, inquiringURL)
         }
      }
   }

   redirect_url(userID, inquiringURL) {
      const callback_uri = encodeURIComponent(`${process.env.APPLICATION_URL}/callback`);
      const scopes = [
         'playlist-read-private',
         'user-read-currently-playing',
         'playlist-read-collaborative',
      ];
      const state = {
         userID: userID,
         inquirer: inquiringURL,
      }
      return `https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${callback_uri}&scope=${scopes.join('%20')}&state=${JSON.stringify(state)}`;
   }
}
