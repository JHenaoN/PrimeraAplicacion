const express = require('express')
const rutas = express.Router()

rutas.use('/admin/',function(pet,res,siguiente){
    if(!pet.session.usuario){
        pet.flash('mensaje','Debe iniciar sesion')
        res.redirect('/iniciosesion')
    }
    else{
        siguiente()
    }
})

module.exports = rutas