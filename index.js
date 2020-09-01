const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mysql = require('mysql')
const session = require('express-session')
const flash = require('express-flash')
const rutasMiddleware = require('./routes/middleware')
const rutasPrincipales = require('./routes/principales')

const port = process.env.PORT || 8080

app.set('view engine','ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'));  //Esto es para inciar el servicio de archivos estaticos
app.use(session({secret: "token-muy-secreto", resave: true, saveUninitialized: true}))
app.use(flash())

app.use(rutasMiddleware)
app.use(rutasPrincipales)

  
app.listen(8080,function(pet,res){
    console.log("Servidor Iniciado")
})