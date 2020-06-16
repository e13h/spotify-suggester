'use strict';
import { v4 as uuidv4 } from 'uuid';
import db from '../persistence/index.js';
import AddUserResult from '../response/addUserResult.js';

export default async (username, password) => {
   const user = {
      id: uuidv4(),
      username: username,
      password: password,
   };
   if (await db.usernameExists(user.username)) {
      return new AddUserResult(`Username "${user.username}" already exists`, null);
   }
   await db.storeUser(user).catch((error) => {
      return new AddUserResult(`Database error: ${error}`, user.id);
   });
   return new AddUserResult(null, user.id);
}
