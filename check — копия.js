import echoRouter from './routes/echo.routes.js'
import settings from './settings.json' assert { type: "json" }


import {bot} from './modules/telegram.js'
import { dateTimeToLocale } from "./modules/common.js";
import express from 'express'
import dotenv from "dotenv"
// import https from 'https'
import http from 'http'
import fs from 'fs'
dotenv.config()
//  *****************************************************

const intervalSeconds = 10
// const optionsServer = { key: fs.readFileSync('../certMM/key.pem'), cert: fs.readFileSync('../certMM/cert.pem') };
const PORT = process.env.PORT || 3000
const app = express()
app.use(express.json())
app.use(process.env.API_ECHO_PATH,   echoRouter)

// let server = https.createServer(optionsServer, app);
let server = http.createServer(app);

server.listen(PORT, () => console.log(`server started on port ${PORT}`))

const checkEcho = async(serverslist) => {

    for (const element of serverslist) {

        if (element.active) {

            let response = undefined
            let status = 0
            try {
                response = await fetch(
                element.address,
                {
                    method: "GET",
                    port: element.port,
                    headers: {
                    "Content-Type": "application/json",
                  //  Authorization: auth,
                    },
                }
                );

                status = response.status

             } catch (err) {
                console.log(err.message);
                console.log(element.address + ' ' + element.port)
             }
            
            // console.log(element.datetime)
            // console.log('seconds ' + ((new Date() - element.datetime) / 1000))
            // console.log('minutes' + ((new Date() - element.datetime) / 60000))
            // console.log('hours' + ((new Date() - element.datetime) / 3600000))
            const hoursPassedSinceLasteActive = ((new Date() - element.datetime) / 3600 / 1000).toFixed(2)  

            if (status === 200) {

                element.datetime = new Date()

                // console.log(element.datetime)
                // console.log(new Date())
                // console.log(hoursPassedSinceLasteActive)
                // console.log(' ')
            }

            else {

                console.log(status)

                if (hoursPassedSinceLasteActive > 0.5) {
                    const errorMessage = `Warning! Server ${element.name} is inactive for ${hoursPassedSinceLasteActive} hour!`
                     console.log(errorMessage)
                     bot.sendMessage(process.env.TG_USER, errorMessage) 
                }
            }

        }

    };

}

const serverslist = settings.serverslist
console.log(serverslist)
serverslist.forEach( (element) => {
    element.datetime = new Date()
}
)
setInterval(function() { checkEcho(serverslist) }, 60 * 1000);
