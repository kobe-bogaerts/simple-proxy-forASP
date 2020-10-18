const express = require('express'),
    https = require('https'),
    fs = require("fs"),
    fetch = require("node-fetch"),
    FormData = require('form-data')

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
const app = express()
const port = 9001
const toWebAddress = "https://localhost:44379"

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('*', async (req, res) => {
    console.log(req.url, req.headers)
    delete req.headers.host
    try {
        if(req.originalUrl.endsWith(".jpg") || req.originalUrl.endsWith(".png") || req.originalUrl.endsWith(".mp4") || req.originalUrl.endsWith(".apk")){
            const response = await fetch(toWebAddress + req.originalUrl, {
                headers: req.headers,
                agent: httpsAgent
            })
            if(response.status == 200) {
                const blob = response.blob()
                fs.writeFile(__dirname + "/temp.temp", blob, () => {
                    res.sendFile(__dirname + "/temp.temp")
                })
                
            }
            return
        }
        const response = await fetch(toWebAddress + req.originalUrl, {
            headers: req.headers,
            agent: httpsAgent
        })
        if(response.status == 200){
            let json = await response.json()
            json = JSON.parse(JSON.stringify(json).replace(/127.0.0.1:44380/g, "192.168.0.16:9001"))
            console.log(json)
            res.json(json)
        }else {
            res.status(response.status).end()
        }
    } catch (err) {
        console.log(err)
        res.json({})
    }
})
app.post('*', async (req, res) => {
    try {
        console.log("POST", req.url,req.headers, req.body)
        delete req.headers.host
        let builder = []
        for (const key in req.body) {
            builder.push(`${key}=${req.body[key]}`)
        }
        let formData = builder.join("&")

        const response = await fetch(toWebAddress + req.originalUrl, {
            method: "POST",
            body: JSON.stringify(req.body),
            headers: req.headers,
            agent: httpsAgent
        })
        if(response.status == 200){
            const json = await response.json()
            console.log(req.body)
            res.json(json)
        }else {
            res.status(response.status).end()
        }
    } catch (err) {
        console.log(err)
        res.json({})
    }
})

https.createServer({
    key: fs.readFileSync("./key.pem"),
    cert: fs.readFileSync("./cert.crt"),
    passphrase: "1234"
}, app).listen(port, '0.0.0.0', () => console.log(`Example app listening on port ${port}!`))