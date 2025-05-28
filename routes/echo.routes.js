import Router from 'express'
const router = new Router()
import newController from '../controller/user.controller.js' 
//  *****************************************************

router.get('/checkservers', newController.checkHealth)

export default router