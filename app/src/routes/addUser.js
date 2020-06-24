'use strict';
import service from '../service/addUser.js';

export default async (req, res) => {
   req.session.fastSync = req.body.fastSync === 'on' ? true : false;
   const result = await service(req.body.username, req.body.password, req.body.inquirer);
   // if (result.error) {
   //    res.send(result.error);
   //    return;
   // }
   // res.redirect(result.content.redirectURL);
   res.send(result);
};
