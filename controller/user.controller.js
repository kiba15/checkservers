//import {db} from '../modules/db.js'
// import { ipFromString} from "../modules/common.js"
import {bot} from '../modules/telegram.js'
// import { createHash } from 'crypto'

import dotenv from "dotenv"
dotenv.config()
//  *****************************************************

class UserController {

      async checkHealth(req, res) {
        
        res.status(200).json('health is ok')

    } 

}

export default new UserController()