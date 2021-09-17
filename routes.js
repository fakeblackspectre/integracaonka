
const http = require('http'); 
const express = require('express'); 
const app = express(); 
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const Utente = require('./utente');

app.get('/utentes', verifyJWT, (req, res, next) => { 

    Utente.getUtente(req.body.id).then(result => {
      res.json(result)
    }).catch(err => {
      next(createError(500, err.message))
    })
})

app.post('/login', (req, res, next) => {
   //esse teste abaixo deve ser feito no seu banco de dados

   if(req.body.user === 'bruno' && req.body.password === 'eira'){
       //auth ok
     const id = 1; //esse id viria do banco de dados
     const token = jwt.sign({ id }, process.env.SECRET, {
       expiresIn: 300 // expires in 5min
     });
     return res.json({ auth: true, token: token });
   }
   
   res.status(500).json({message: 'Login inválido!'});
  })

app.post('/logout', function(req, res) {
   res.json({ auth: false, token: null });
})


function verifyJWT(req, res, next){
   const token = req.headers['x-access-token'];
   if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
   
   jwt.verify(token, process.env.SECRET, function(err, decoded) {
     if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
     
     // se tudo estiver ok, salva no request para uso posterior
     req.userId = decoded.id;
     next();
   });
}

app.use((req, res, next) =>{
  next(createError(404, 'Not found'));
})

app.use((err, req, res, next) =>{
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message || "Internal Server Error"
    }
  })
})