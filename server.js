var PORT = 8080
var express = require('express');
var app = express();
var flash = require('express-flash');
var session = require('express-session');
var http = require('http');
var mongoose = require('mongoose');
var server = http.createServer(app).listen(8080);
var path = require('path');

// Adding socket stuff
var socket = require('socket.io');
var io = socket(server);

// Static pages
app.use(express.static('./public'));
app.use(express.static('./game'));

// For date variables
var MONTH_NAMES = 
["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
var date = new Date();

// Parsing body 
app.use(express.json());
app.use(express.urlencoded( { extended:false }));

// Flashing errors
app.use(flash());

// Admin head
var adminhead = 
	`<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>Admin Page</title>
	</head>
	<body>
	<table>
		<h1>ALL REGISTERED USERS</h1>
		<form action="./admin" method="post">
			<button name="sortBtn" value="uname">Sort by username</button>
			<button name="sortBtn" value="age">Sort by age</button>
			<button name="sortBtn" value="created">Sort by registration date</button>
			<button name="sortBtn" value="totalGames">Sort by total games</button>
			<button name="sortBtn" value="wins">Sort by wins</button>
			<button name="sortBtn" value="losses">Sort by losses</button>
		</form>
		<thead>
			<tr>
				<br><br>
	       		<th>USERNAME</th>
	       		<th>AGE</th>
	      	 	<th>REGISTRATION DATE</th>
	      	 	<th>TOTAL GAMES</th>
	      	 	<th># wins</th>
	      	 	<th># losses</th>
	  		</tr>
	    </thead>
		<tbody>`;

// Matches head
var matcheshead = 
	`<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>Matches Page</title>
	</head>
	<body>
	<table>
		<h1>ALL MATCHES PLAYED</h1>
		<thead>
			<tr>
	       		<th>DATE</th>
	       		<th>WINNER</th>
	       		<th>LOSER</th>
	       		<th># MOVES MADE BY WINNER</th>
	  		</tr>
	    </thead>
		<tbody>`;

// Leaderboard head
var leaderboardhead = 
	`<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>Leaderboard Page</title>
	</head>
	<body>
	<table>
		<h1>LEADERBOARD</h1>
		<thead>
			<tr>
	       		<th>USERNAME</th>
	       		<th>TOTAL GAMES</th>
	       		<th># wins</th>
	       		<th># losses</th>
	  		</tr>
	    </thead>
		<tbody>`;

// Admin end
var _adminhead = `
			</tbody>
		</table>
		<form action="./admin" method="post">
			<br><br>
			<label><b>type uname to be deleted</b></label><br><br>
			<input type="text" name="uname" required></br></br>
			<button name="delBtn" value="d">Delete</button>
		</form>
	</body>
	</html>`;

// Table end
var _tablehead = `
			</tbody>
		</table>
	</body>
	</html>`;

// Middleware
function isLoggedIn(req,res,next){
	if(req.session.user){
		var sid = req.sessionID;
		console.log('SID:',sid);
		next();
	} else {
		res.redirect('./');
	}
}

app.use(session({
	name:"session",
	secret: "zordon",
	maxAge: 1000*60*30
}))

// Set up the user schema 
if('development' == app.get('env')) {
	console.log('connecting to db');
	mongoose.connect("mongodb://root:root@ds125255.mlab.com:25255/user");
	console.log('connected to db');
	// Define the schema
	var Schema = mongoose.Schema;

	var userSchema = new Schema({
		uname: { type:String },
		fname: { type:String },
		lname: { type:String },
		age: { type:Number },
		gender: { type:String },
		email: { type:String },
		pw: { type:String },
		created: { type:String },
		totalGames: { type:Number },
		wins: { type:Number },
		losses: { type:Number }
	});

	var User = mongoose.model('user', userSchema);

	var gameSchema = new Schema({
		startTime: { type:String },
		winner: { type:String },
		loser: { type:String },
		numMovesToWin: { type:Number }
	});

	var Game = mongoose.model('game', gameSchema);
}

// Game variables
var playerCount = 0;
var playerTurn = -1;
var readyCount = 0;
var playerSocketIDs = [];

// Tracks current users
var players = [];

// click play game to redirect to game page
// connection established upon landing on game page
// exchange ready message to start the game
// socket refers to socket connection with client
function findOpponentID(idArr, myID){
	if(playerSocketIDs[0] == myID){
		return playerSocketIDs[1];
	}
	return playerSocketIDs[0];
}

function getAssignedSide(){
	if(Math.random() < 0.5){
		return 0;
	} else {
		return 1;
	}
}

io.on('connection', function(socket){
	if(playerCount >= 2) {
		// disconnect
		socket.emit('roomFull', null);
		socket.disconnect();
		return;
	}

	playerSocketIDs[playerCount] = socket.id;
	playerCount++;
	console.log('Player connected, id:', socket.id);
	io.sockets.emit('playerEnterRoom', playerCount);

	socket.on('playerReady', function() {
		readyCount++;
		if(readyCount == 1){
			socket.emit('readyUpdate', null);
		} else if(readyCount == 2) {
			var assignedSide = getAssignedSide();
			console.log('Both players ready, assigning turns, res: ', assignedSide);
			io.sockets.emit('sideAssignment', assignedSide);
			var opponentID = findOpponentID(playerSocketIDs, socket.id);
			if(io.sockets.connected[opponentID]){
				io.sockets.connected[opponentID].emit('sideAssignment', (assignedSide+1)%2);
			}
			playerTurn = 0;
			io.sockets.emit('startGame', playerTurn);
		}
	});

	// input obj: layer, cellObj, side
	socket.on('playerMove', function(input){
		if(input.side == playerTurn){
			// valid move
			console.log('Move is valid');
			io.sockets.emit('validMove', input);
			playerTurn = (playerTurn+1)%2;
		}
		// invalid move
		return -1;
	});

	socket.on('playerVictory', function(winner){
		playerCount = 0;
		playerTurn = -1;
		readyCount = 0;

		// console.log(socket.handshake.headers.cookie);
		var s = '';
		for(var i = 12; i < socket.handshake.headers.cookie.length; i++){
			if(socket.handshake.headers.cookie[i] == '.'){
				break;
			}

			s += socket.handshake.headers.cookie[i];
		}
		console.log("Winner's sessionID is: ", s);

		playerSocketIDs[0] = null;
		playerSocketIDs[1] = null;

		console.log(winner);

		var tempWinner;
		var tempLoser;

		for(var i = 0; i < 2; i++){
			if(players[i].sessionID == s){
				console.log('winner is %s', players[i].uname);
				tempWinner = players[i].uname;
			} else {
				tempLoser = players[i].uname;
			}
		}

		// Update the database for the winner
		User.findOne({uname:`${tempWinner}`}, function(err,doc){
			doc.wins++;
			doc.totalGames++;
			doc.save();
		});

		// Update the database for the loser
		User.findOne({uname:`${tempLoser}`}, function(err,doc){
			doc.losses++;
			doc.totalGames++;
			doc.save();
		});

		// Insert into games database the time, winner, lsoer, and # moves to win
		var endedGame = new Game({
			startTime: winner.startTime,
			winner: tempWinner,
			loser: tempLoser,
			numMovesToWin: winner.numMoves
		});

		// Save it
		endedGame.save(function(error) {
			if(error) {
				console.log(error);
			} 
			else {
				console.log("Your game record has been saved");
			}
		})
		socket.disconnect();
		// Reset game
	});
	
	socket.on('playerLoss', function(loser){
		socket.disconnect();
		// Reset game
	});

	socket.on('disconnect', function(){
		console.log('user disconnected, socket id:', socket.id);
		// handle loss
		if(playerSocketIDs[0] != socket.id){
			var winnerID = playerSocketIDs[0];
			playerSocketIDs[1] = null;
		} else{
			var winnerID = playerSocketIDs[1];
			playerSocketIDs[0] = null;
		}

		if (io.sockets.connected[winnerID]) {
			if(readyCount == 2){
	    		io.sockets.connected[winnerID].emit('winByDisconnect', null);
			}else{
				io.sockets.connected[winnerID].emit('opponentLeft', null);
				playerCount--;
			}
		}
	});


// -------chat
	
	socket.on('chat', function(message){
		console.log('message: ', message);
		socket.broadcast.emit('message', message);
	})

// --------end chat
});

app.use('/', function(req,res,next){
	console.log(req.method, 'request:', req.url);
	next();
});

app.get('/register', function(req,res,next){
	var error = req.flash('error');
	var form = 
	`<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>Home Page</title>
	</head>
	<body>
		<h1>REGISTER HERE</h1>
		<p style="color:tomato">${error}</p>
		<form action="./register" method="post">
			<label for="uname">Username</label><br>
			<input type="text" name="uname" placeholder="bobbyc" required><br><br>

			<label for="fname">First Name</label><br>
			<input type="text" name="fname" placeholder="Bobby" required><br><br>	

			<label for="lname">Last Name</label><br>
			<input type="text" name="lname" placeholder="Chan" required><br><br>

			<label for="age">Age</label><br>
			<input type="number" name="age" placeholder="0" step="1" required><br><br>	

			<label for="gender">Gender</label><br>
			<input type="radio" name="gender" value="male" required>Male	
			<input type="radio" name="gender" value="female">Female
			<input type="radio" name="gender" value="other">Other<br><br>	

			<label for="email">Email</label><br>
			<input type="text" name="email" placeholder="bobbyc@sfu.ca" required><br><br>	

			<label for="pw">Password</label><br>
			<input type="password" name="pw" required><br><br>	

			<button>Register</button>
		</form>

		<h1>LOGIN HERE</h1>
		<form action="./login" method="post">
			<label for="uname">Username</label><br>
			<input type="text" name="uname" placeholder="bobbyc" required><br><br>	

			<label for="pw">Password</label><br>
			<input type="password" name="pw" required><br><br>	

			<button>Login</button>
		</form>
	</body>`;

	res.end(form);
});

app.post('/register', function(req,res,next){
	console.log(req.body);

	User.findOne({uname:`${req.body.uname}`}, function(err,doc){
		if(doc){
			console.log('Someone has already taken this username.');
			req.flash('error', 'Username already taken');
			res.redirect('./register');
		} else {
			console.log('No one has this username');

			// Date calculations
			var min = date.getMinutes();
			var ampm = '';

			// Changes time from 1:1 to 1:01
			if(date.getMinutes() <= 10){
				min = '0' + min;
			} 

			// Changes time from AM to PM 
			if(date.getHours() < 12){
				ampm = ampm + 'am';
			} else {
				ampm = ampm + 'pm';
			}

			// Make sure the registration date is correct
			console.log('registration date:', MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getHours()%12 + ':' + min + ampm);	
			
			var hours = date.getHours()%12;
			// Case it's 12:00, in which 12%12 == 0 but time should be 12:00, not 0:00
			if(hours == 0){
				hours = 12;
			}

			// Store it in a variable
			var registrationDate = MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + hours + ':' + min + ampm;

			// Instantiate a new user and insert it into the database
			var registered = new User({
				uname: req.body.uname,
				fname: req.body.fname,
				lname: req.body.lname,
				age: req.body.age,
				gender: req.body.gender,
				email: req.body.email,
				pw: req.body.pw,
				created: registrationDate,
				totalGames: 0,
				wins: 0,
				losses: 0
			});

			registered.save(function(error) {
				if(error) {
					console.log(error);
				} 
				else {
					console.log("Your user has been saved");
				}
			});
			res.redirect('./');
		}
	});
});

app.get('/login', function(req,res,next){
	var error = req.flash('error');
	var form = 
	`<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>Home Page</title>
	</head>
	<body>
		<h1>REGISTER HERE</h1>
		<form action="./register" method="post">
			<label for="uname">Username</label><br>
			<input type="text" name="uname" placeholder="bobbyc" required><br><br>

			<label for="fname">First Name</label><br>
			<input type="text" name="fname" placeholder="Bobby" required><br><br>	

			<label for="lname">Last Name</label><br>
			<input type="text" name="lname" placeholder="Chan" required><br><br>

			<label for="age">Age</label><br>
			<input type="number" name="age" placeholder="0" step="1" required><br><br>	

			<label for="gender">Gender</label><br>
			<input type="radio" name="gender" value="male" required>Male	
			<input type="radio" name="gender" value="female">Female
			<input type="radio" name="gender" value="other">Other<br><br>	

			<label for="email">Email</label><br>
			<input type="text" name="email" placeholder="bobbyc@sfu.ca" required><br><br>	

			<label for="pw">Password</label><br>
			<input type="password" name="pw" required><br><br>	

			<button>Register</button>
		</form>

		<h1>LOGIN HERE</h1>
		<p style="color:red">${error}</p>
		<form action="./login" method="post">
			<label for="uname">Username</label><br>
			<input type="text" name="uname" placeholder="bobbyc" required><br><br>	

			<label for="pw">Password</label><br>
			<input type="password" name="pw" required><br><br>	

			<button>Login</button>
		</form>
	</body>`;

	res.end(form);
})

app.post('/login', function(req,res,next){
	User.findOne({ 'uname':req.body.uname }, function(err, user) {
		if(user) {
			if(req.body.pw === user.pw){
				req.session.user = user;
				// console.log('%s just logged in with password %s', user.uname, user.pw);
				res.redirect('./landing');			
			} else {
				console.log('Wrong password entered');
				req.flash('error', 'Wrong password entered');
				res.redirect('./login');
			}
		} 
		else {
			console.log('No such username exists');
			req.flash('error', 'Invalid username');
			res.redirect('./login');
		}
	});
});

app.get('/', isLoggedIn, function(req,res,next){
	res.sendFile(path.join(__dirname + '/index.html'));
})

app.get('/landing', isLoggedIn, function(req,res,next){
	res.send(
	`<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<title>User Landing</title>
		</head>
		<body>
			<h1>${req.session.user.uname}'s Game Stats</h1>
			<br>
			<h3><b>Total Games: ${req.session.user.totalGames}</b></h3>
			<h3># Wins: ${req.session.user.wins}</h3>
			<h3># Losses: ${req.session.user.losses}</h3>

			<form action="./landing" method="post">
				<button name="submitBtn" value="connect">Connect to a game</button>
				<button name="submitBtn" value="logout">Log out</button>
			</form>
		</body>
		</html>`);	
});

app.post('/landing', isLoggedIn, function(req,res,next){
	if(req.body.submitBtn == "connect"){
		console.log('connecting to a game');
		res.redirect('./game');
	}

	if(req.body.submitBtn == "logout"){
		console.log('logging out..!');
		req.session.regenerate(function(err){
			res.redirect('./');
		});		
	}
});

app.get('/game', isLoggedIn, function(req,res,next){
	// New GLOBAL player object
	var player = {uname:req.session.user.uname, pw:req.session.user.pw, sessionID:req.sessionID};

	// console.log('here:', req.sessionID);
	players.push(player);
	console.log(players);

	res.sendFile(path.join(__dirname + '/game/index.html'));
})

function myFunction(){
	console.log('hello');
}


app.get('/admin', function(req,res,next){
	var admincontent = '';
	var admindelete = '';
	User.find({}, function(err, all_users){
		if(err){
			res.send(err);
		} else {
			for(var i = 0; i < all_users.length; i++){
				admincontent = admincontent + 
				`<tr>
					<th>${all_users[i].uname}</th>
					<th>${all_users[i].age}</th>
					<th>${all_users[i].created}</th>
					<th>${all_users[i].totalGames}</th>
					<th>${all_users[i].wins}</th>
					<th>${all_users[i].losses}</th>
				</tr>`;		
			}
			res.send(adminhead + admincontent + _adminhead);			
		}
	});
});

app.post('/admin', function(req,res,next){
	var admincontent = '';
	console.log(req.body);
	if(req.body.sortBtn){
		if(req.body.sortBtn == 'uname'){
			User.find({}).sort(`${req.body.sortBtn}`).exec(function(err,all_users){
				if(err){
					res.send(err);
				} else {
					for(var i = 0; i < all_users.length; i++){
						admincontent = admincontent +
						`<tr>
							<th>${all_users[i].uname}</th>
							<th>${all_users[i].age}</th>
							<th>${all_users[i].created}</th>
							<th>${all_users[i].totalGames}</th>
							<th>${all_users[i].wins}</th>
							<th>${all_users[i].losses}</th>
						</tr>`;					
					}
					res.send(adminhead + admincontent + _adminhead);
				}
			});		
		} else {
			User.find({}).sort(`-${req.body.sortBtn}`).exec(function(err,all_users){
				if(err){
					res.send(err);
				} else {
					for(var i = 0; i < all_users.length; i++){
						admincontent = admincontent +
						`<tr>
							<th>${all_users[i].uname}</th>
							<th>${all_users[i].age}</th>
							<th>${all_users[i].created}</th>
							<th>${all_users[i].totalGames}</th>
							<th>${all_users[i].wins}</th>
							<th>${all_users[i].losses}</th>
						</tr>`;					
					}
					res.send(adminhead + admincontent + _adminhead);
				}
			});		
		}		
	}
	else if(req.body.delBtn){
		User.remove({uname:`${req.body.uname}`}, function(err){
			if(err) console.log(err);
			else {
				res.redirect('./admin');
			}
		});
	}
});

app.get('/leaderboard', function(req,res,next){
	var leaderboardcontent = '';
	User.find({}).sort(`-wins`).exec(function(err,all_users){
		if(err){
			res.send(err);
		} else {
			for(var i = 0; i < all_users.length; i++){
				leaderboardcontent = leaderboardcontent +
				`<tr>
					<th>${all_users[i].uname}</th>
					<th>${all_users[i].totalGames}</th>
					<th>${all_users[i].wins}</th>
					<th>${all_users[i].losses}</th>
				</tr>`;					
			}
			res.send(leaderboardhead + leaderboardcontent + _tablehead);
		}
	});	
});

app.get('/matches', function(req,res,next){
	var matchescontent = '';
	Game.find({}).sort(`-startTime`).exec(function(err,all_matches){
		if(err){
			res.send(err);
		} else {
			for(var i = 0; i < all_matches.length; i++){
				matchescontent = matchescontent + 
				`<tr>
					<th>${all_matches[i].startTime}</th>
					<th>${all_matches[i].winner}</th>
					<th>${all_matches[i].loser}</th>
					<th>${all_matches[i].numMovesToWin}</th>
				</th>`;
			}
			res.send(matcheshead + matchescontent + _tablehead);
		}
	})
})

console.log(`App running on port ${PORT}`);
