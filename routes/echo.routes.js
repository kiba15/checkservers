import Router from 'express'
const router = new Router()
import newController from '../controller/user.controller.js' 
//  *****************************************************

router.get('/checkhealth', newController.checkHealth)

export default router