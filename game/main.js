// main.js have access to variables declared in game.js
// equivalent of putting all these code bellow game.js

date = new Date();
var MONTH_NAMES = 
["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
var startingTime;


// make connection
var username = "unknown";
// have io from socket script linked by index.html
// each client have a unique socket when connected
// modify this to local if socket does not connect
// var socket = io.connect('http://localhost:32236');
var socket = io.connect('http://cmpt218.csil.sfu.ca:13706');
var roomStatus = document.getElementById('roomStatus');
var turnIndicator = document.getElementById('turnIndicator');
var victoryStatus = document.getElementById('victoryStatus');
var currentGameStats = document.getElementById('currentGameStats');

socket.on('playerEnterRoom', function(playerCount){
	if(playerCount == 1){
		roomStatus.innerHTML = `1 player in the room`;
	} else if(playerCount == 2){
		roomStatus.innerHTML = `2 players in the room, ready to start the game`;
	}
});

socket.on('sideAssignment', function(side){
	turnIndicator.innerHTML = `You are Player ${side+1}`;
	console.log('Received side assignment, I am Player: ', side);
	// -1 for turn management
	playerSide = side;
});

function playerReady(){
	socket.emit('playerReady', null);
}

socket.on('readyUpdate', function(){
	console.log('Server registered your ready status');
	roomStatus.innerHTML = `Waiting for other player to join or ready`;
});

socket.on('startGame', function(playerTurn){
	turn = playerTurn;
	roomStatus.innerHTML = `Game started. First move is Player ${playerTurn+1}`;

	// Starting date calculations
	var min = date.getMinutes();
	var ampm = '';
	if(date.getMinutes() <= 10){
		min = '0' + min;
	} 
	if(date.getHours() < 12){
		ampm = ampm + 'am';
	} else {
		ampm = ampm + 'pm';
	}
	var hours = date.getHours()%12;
	if(hours == 0){
		hours = 12;
	}
	startingTime = MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + hours + ':' + min + ampm;
});

// need some sort of lock mechanism to ensure no repeated input
function makeMove(layer, cell, playerSide){
	if(playerSide != turn){
		alert('Not your turn');
		return;
	}
	var x = cell.cellIndex;
	var y = layer;
	var z = cell.rowIndex;
	console.log('correct turn');
	var input = {
		x:x,
		y:y,
		z:z,
		side:playerSide

	}
	console.log('makemove obj ', input);
	socket.emit('playerMove', input);
}

// input is obj same as above
socket.on('validMove', function(input){
	console.log('input obj under validMove: ', input);
	updateCell(input.x, input.y, input.z, input.side);
});


function handleVictory(playerSide){
	var victor = { numMoves: moveCount, startTime: startingTime };
	socket.emit('playerVictory', victor);
	socket.close();
	victoryStatus.innerHTML = 'You won :), refresh page to play another round';
}

function handleLoss(playerSide){
	var loser = { numMoves: moveCount, startTime: startingTime };
	socket.emit('playerLoss', loser);
	victoryStatus.innerHTML = 'You lost :(, refresh page to play another round';
	socket.close();
}

socket.on('roomFull', function(){
	alert('Room is full');
});

socket.on('winByDisconnect', function(){
	handleVictory(1);
});
socket.on('opponentLeft', function(){
	roomStatus.innerHTML = 'opponent left, waiting for another to join';
});

socket.on('message', function(message){
	displayMessage(message);
});

function displayMessage(message){
	var chatDiv = document.getElementById('chatWindow');
	var newMsg = `<p>${message}</p>`;
	chatDiv.innerHTML += newMsg;
}

var sendButton = document.getElementById('sendMessage');
sendButton.onclick = function(){
	var message = document.getElementById('message');
	displayMessage(`You: ${message.value}`);
	socket.emit('chat', `Opponent: ${message.value}`);
}
