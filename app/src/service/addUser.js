'use strict';
import { v4 as uuidv4 } from 'uuid';
import db from '../persistence/index.js';
import AddUserResponse from '../response/AddUserResponse.js';

export default async (username, password, inquiringURL) => {
   const user = {
      id: uuidv4(),
      username: username,
      password: password,
   };
   if (await db.usernameExists(user.username)) {
      return new AddUserResponse(`Username "${user.username}" already exists`, null, null);
   }
   await db.storeUser(user).catch((error) => {
      return new AddUserResponse(`Database error: ${error}`, user.id, null);
   });
   return new AddUserResponse(null, user.id, inquiringURL);
}
