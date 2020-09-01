const express = require('express')
const rutas = express.Router()
const mysql = require('mysql')
const correo = require('nodemailer')

const configuracorreo = correo.createTransport({
    service: 'hotmail',
    auth: {
        user: 'juheno@hotmail.com',
        pass: 'jualhe'
    }
})

function enviarcorreo(email,nombre){
    const opciones = {
        from: 'juheno@hotmail.com',
        to: email,
        subject: 'Bienvenido al blog de viajes',
        text: `Hola ${nombre}`
    }
    configuracorreo.sendMail(opciones,(error,info)=>{

    })
}

var pool = mysql.createPool({
    connectionLimit :20,
    host :          'fongracetales.com',
    user :          'fongrace_jhenao',
    password :      'Juhe@1596',
    database :      'fongrace_db'
})

// var pool = mysql.createPool({
//     connectionLimit :20,
//     host :          'localhost',
//     user :          'root',
//     password :      '12345',
//     database :      'blog_viajes'
// })

rutas.get('/', function (peticion, respuesta) {
    pool.getConnection(function(err, conexion) {
       const buscar = (peticion.query.busqueda) ? peticion.query.busqueda : ""
       var consulta =""
       if (buscar !=""){
           consulta =`SELECT
           publicaciones.id, titulo, resumen, fecha_hora, pseudonimo, votos
           FROM publicaciones
           INNER JOIN autores
           ON publicaciones.autor_id = autores.id
           WHERE titulo like '%${buscar}%' or
           resumen like '%${buscar}%' or
           contenido like '%${buscar}%'
           ORDER BY fecha_hora DESC
            `
       }else{
            consulta = `
                SELECT
                publicaciones.id, titulo, resumen, fecha_hora, pseudonimo, votos
                FROM publicaciones
                INNER JOIN autores
                ON publicaciones.autor_id = autores.id
                ORDER BY fecha_hora DESC
                LIMIT 5
        `
        }
        
        conexion.query(consulta, function (error, filas, campos) {
            respuesta.render('index', {publicaciones: filas, busqueda: buscar })
      })
      conexion.release()
    })
  })

  rutas.get('/registro',function(pet,res){
      res.render('registro',{mensaje:pet.flash('mensaje')})
  })

  rutas.get('/iniciosesion',function(pet,res){
    res.render('inicio',{mensaje:pet.flash('mensaje')})
  })

  rutas.get('/admin/agregar-publicacion',function(pet,res){
      res.render('admin/agregar',{mensaje:pet.flash('mensaje'),usuario:pet.session.usuario})
  })
  
  rutas.get('/procesar-iniciado',function(pet,res){
      pool.getConnection(function(err,conexion){
          const consulta = `Select * from publicaciones
                            Where autor_id=${conexion.escape(pet.session.usuario.id)}`

          conexion.query(consulta,function(error,filas,campos){
              if (filas.length == 0){
                pet.flash('mensaje','Autor no tiene publicaciones')  
              }
                res.render('iniciado',{usuario:pet.session.usuario, publicaciones:filas ,mensaje:pet.flash('mensaje')})
          })
          conexion.release()
      })
  })
  rutas.post('/procesar-agregar',function(pet,res){
    pool.getConnection(function(err,conexion){
        const fecha = new Date()
        const fecha2 = `${fecha.getFullYear()}-${(fecha.getMonth() +1)}-${fecha.getDate()}`
        
        const consulta = `INSERT INTO publicaciones
                           (autor_id, titulo, resumen, contenido, fecha_hora )
                           VALUES
                           (
                            ${conexion.escape(pet.session.usuario.id)},
                            ${conexion.escape(pet.body.titulo)},
                            ${conexion.escape(pet.body.resumen)},
                            ${conexion.escape(pet.body.contenido)},
                            ${conexion.escape(fecha2)}
                            ) `
        console.log(consulta)                            
        conexion.query(consulta,function(error,filas,campos){
            pet.flash('mensaje',"Publicacion Agregada")
            res.redirect('/procesar-iniciado')
        })
        conexion.release()
    })
  })

  rutas.post('/procesar-inicio',(pet,res)=>{
    pool.getConnection(function(err,conexion){
        const consulta = `Select * from autores
                          Where email=${conexion.escape(pet.body.email)} and
                          contrasena=${conexion.escape(pet.body.contrasena)}`
        conexion.query(consulta,function(error,filas,campos){
            if (filas.length > 0){
                pet.session.usuario = filas[0]
                res.redirect('/procesar-iniciado')
            }else{
                pet.flash('mensaje','Usuario o clave invalidos')
                res.redirect('/iniciosesion')
            }
        })
        conexion.release()
    })
  })

  rutas.post('/procesar-registro',(pet,res)=>{
        pool.getConnection(function(err,conexion){
            const consulta = `Select * from autores where email=${conexion.escape(pet.body.email)}`
            conexion.query(consulta,function(error,filas,campos){
                if (filas.length > 0){
                    pet.flash('mensaje','Email duplicado')
                    res.redirect('/registro')
                }else   {
                            const consulta2 = `Select * from autores where pseudonimo=${conexion.escape(pet.body.pseudonimo)}`
                            conexion.query(consulta2,function(error,filas,campos){
                                if (filas.length > 0) {
                                    pet.flash('mensaje','Pseudonimo duplicado')
                                    res.redirect('/registro')
                                }
                                else   {
                                            const consultaregistro = `INSERT INTO autores
                                                            (email, contrasena, pseudonimo)
                                                            VALUES(
                                                                    ${conexion.escape(pet.body.email)},
                                                                    ${conexion.escape(pet.body.contrasena)},
                                                                    ${conexion.escape(pet.body.pseudonimo)}
                                                                )`
                                            conexion.query(consultaregistro,function(error,filas,campos){
                                                if (res.status=202){
                                                    pet.flash('mensaje',"Usuario Registrado")
                                                    enviarcorreo(pet.body.email,pet.body.pseudonimo)
                                                }else {
                                                    pet.flash('mensaje',"Error en la consulta")
                                                }
                                                res.redirect('/registro')
                                            })
                                        }
                                 
                                    
                            })
                        }
                
            })
            conexion.release()
        })
   })

  rutas.get('/autores',function(pet,res){
    pool.getConnection(function(err,conexion){
        const consulta = `Select * from autores ORDER BY id DESC`
        conexion.query(consulta,function(error,filas,campos){
            if(filas.length > 0){
                res.render('autores',{autores:filas}) 
            }
        })
        conexion.release()
    })  
    
  }) 

  rutas.get('/publicacion/:id',(pet,res)=>{
        pool.getConnection(function(err,conexion){
          const consulta = `
            SELECT * FROM publicaciones
            WHERE id=${conexion.escape(pet.params.id)}
          `
          conexion.query(consulta,(error,filas,campos)=>{
                if(filas.length > 0){
                  res.render('publicacion',{publicacion:filas[0]})
                } else {
                    res.redirect('/')
                }
          })
          conexion.release()
        })
  })

  rutas.get('/publicacion/:id/votar',function(pet,res){
      pool.getConnection(function(err,conexion){
          const consulta = `
                    SELECT * FROM publicaciones
                    WHERE id = ${conexion.escape(pet.params.id)}      
                    `
          conexion.query(consulta,(error,filas,campos)=>{
              if(filas.length >0){
                    const consultavotos =`
                        UPDATE publicaciones
                        SET
                        votos = votos + 1
                        WHERE id = ${conexion.escape(pet.params.id)} 
                    `
                    conexion.query(consultavotos,(error,filas,campos)=>{
                        res.redirect(`/publicacion/${pet.params.id}`)
                    })
              }else{
                  pet.flash('mensaje',"Publicacion No Existe")
                  res.redirect('/')
              }
          })
          conexion.release()
      })
  })

  rutas.get('/procesar-cerrar-sesion',function(pet,res){
      pet.session.destroy();
      res.redirect('/')
  })






module.exports = rutas