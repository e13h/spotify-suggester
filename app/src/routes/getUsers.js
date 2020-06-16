'use strict';
import db from '../persistence/index.js';

export default async (req, res) => {
   const users = await db.getUsers().catch((error) => {
      res.send('Error getting users from database: ' + error);
      return;
   });
   res.send(users);
};
