const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { query } = require('express');
const session = require("express-session");
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// MySql
const pool = mysql.createPool({
    connectionLimit : 50,
    host            :'localhost',
    user            :'root',
    password        :"",
    database        :'servicesdb'
});
const connection = mysql.createConnection({
    host            :'localhost',
    user            :'root',
    password        :"",
    database        :'servicesdb'
})

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'static')));


// Get data on url
app.get('/',(req, res) => {
        pool.getConnection((err, conn) => {
            if(err) throw err
            const params = req.body
            conn.query('SELECT * FROM books ?', params, (err, rows) => {
            conn.release() // return the connection to pool
            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
            })
        })
    
});

app.get('/login',(req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get(`/users`, (req, res) => {getData(req, res,`users`)});
app.get(`/users/:id`, (req, res) => {getData(req, res,`users`,`user_id`)});
app.get(`/users`, (req, res) => {getData(req, res,`books`)});
app.get(`/books/:id`, (req, res) => {getData(req, res,`books`,`b_id`)});

//Destroy session and logout user
app.get(`/logout`,(req,res) => {
    if (req.session.loggedin) {
        req.session.destroy();
        res.redirect('/')
	} else {
		// Not logged in
		res.send('Please login to logout!');
	}
    
})

// Authenticate user by username and password and create a session.
app.post('/auth', function(req, res) {
	// Capture the input fields
	let username = req.body.username;
	let password = req.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM users WHERE user_name = ? AND user_password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				req.session.loggedin = true;
				req.session.username = username;
				// Redirect to home page
				res.redirect('/home');
			} else {
				res.send('Incorrect Username and/or Password!');
			}			
			res.end();
		});
	} else {
		res.redirect('/')
		res.end();
	}
});

// http://localhost:3000/home
app.get('/home', function(req, res) {
	// If the user is loggedin
	if (req.session.loggedin) {
		// Output username
		res.send('Welcome back, ' + req.session.username + '!' + '<br /><a href="/home/addbook">Add a book</a><br /><a href="/logout">Logout</a>');
	} else {
		// Not logged in
		res.send('Please login to view this page!');
	}
	res.end();
});

app.get('/home/addbook', function(req, res) {
	// If the user is loggedin
	if (req.session.loggedin) {
		// Output username
		return res.sendFile(path.join(__dirname + "/addbook.html"))
	} else {
		// Not logged in
		return res.send('Please login to view this page!');
	}
	res.end();
});

//data input into DB
app.post('/addbook',(req,res)=>{
    if(req.session.loggedin){
        pool.getConnection((err, conn) => {
            if(err) throw err
            const params = req.body
            conn.query('INSERT INTO books SET ?', params, (err, rows) => {
            conn.release() // return the connection to pool
            if (!err) {
                res.send(`Data with the record ID  has been added.`)
            } else {
                console.log(err)
            }
            })
        })
    }else{
        res.send('Please login to view this page');
    } 
})

app.post('/addUser',(req,res)=>{
    pool.getConnection((err, connection) => {
        if(err) throw err
        const params = req.body
        connection.query('INSERT INTO ***** SET ?', params, (err, rows) => {
        connection.release() // return the connection to pool
        if (err) {
        } 
        })
    })
})

app.listen(port, () => console.log(`Listen on port: ${port}`));

//function for getting data from database on two conditions: all data, and by id, if tableId is provided.
function getData (req, res, table, tableId){
    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log(`connected as id ${connection.threadId}`);
        if(typeof tableId==='undefined'){
            queryData = `SELECT * FROM ${table} = ?`
            console.log(queryData)
        }    
        else{
            queryData = `SELECT * FROM ${table} WHERE ${tableId} = ?`
            console.log(queryData)
        }
        connection.query (queryData, [req.params.id], (err, rows) => {
            connection.release() // return the connection to pool
        if (!err) {
            res.send(rows)
        } else {
            console.log(err)
        }
    })}
    )
}