//invoca a express
const express = require('express');
const app = express();

//2 - setea url para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//3 - Invoca dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

//4 - el direcctorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//5- motor de plantillas ejs
app.set('view engine', 'ejs');

//6- Invoca bcryptjs
const bcryptjs = require('bcryptjs');

//7- var session
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//8- invocamos modulo de la  BD
const connection = require('./database/db'); 

//9- Estableciendo las rutas

app.get('/login',(req,res)=>{
    res.render('login');
})

app.get('/register',(req,res)=>{
    res.render('register');
})

//10- Registro
app.post('/register', async(req,res)=>
{
    const user = req.body.user;
    const name = req.body.name;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO usuarios SET ?', 
    {user:user, name:name, pass:passwordHash}, 
    async (error, results) => 
    {
        if (error) 
        {
          console.log(error);
        }
        else 
        {
          res.render('register',
          {
            alert:true,
            alertTitle: "Registro",
            alertMessage: "Registro Exitoso",
            alertIcon: 'success',
            showConfirmButton: false,
            timer: 1500,
            ruta:'',
          });
        }
    })
})

//11- Autenticacion Login
app.post('/auth', async (req, res)=>
{
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    if (user && pass)
    {
        connection.query('SELECT * FROM usuarios WHERE user = ?', [user], async(error, results, fields)=>
        {
            if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))) 
            {
                res.render('login',{
                    alert:true,
                    alertTitle: "Error",
                    alertMessage: "Datos ingresados incorrectamente",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta:'login'
                });
            }
            else
            {
                req.session.loggedin = true;
                req.session.name = results[0].name;
                res.render('login',{
                    alert:true,
                    alertTitle: "Conexion exitosa",
                    alertMessage: "Login correcto",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta:'/'
                });
            }
            res.end();
        });
    } 
    else
    {
        res.render('login',{
            alert:true,
            alertTitle: "Advertencia",
            alertMessage: "Ingrese los datos ",
            alertIcon: "warning ",
            showConfirmButton: true,
            timer: false,
            ruta:'login'
        });
    }
})

//12- Autenticacion para las paginas(Auth)
app.get('/',(req, res)=>{
    if (req.session.loggedin){
        res.render('index',{
            login: true,
            name: req.session.name
        });
    }
    else
    {
        res.render('index',{
            login: false,
            name:'Debe iniciar sesión'
        });
    }
    res.end();
})

//13- Boton Logout
app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})


app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
})