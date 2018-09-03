var l1 = document.getElementById('layer1');
var l2 = document.getElementById('layer2');
var l3 = document.getElementById('layer3');

// player side assigned upon connection
var playerSide = -1;

// save these stats at the end of game
// reset upon refresh (new game)
var moveCount = 0;
var didIWin = -1;

// change to 0 upon start of game
var turn = -1;
var state = 
[	[
	[-1, -1, -1],[-1, -1, -1],[-1, -1, -1]
	], 
	
	[
	[-1, -1, -1],[-1, -1, -1],[-1, -1, -1]
	], 

	[
	[-1, -1, -1],[-1, -1, -1],[-1, -1, -1]
	]
];

// x, y, z
var solutions = [];
// y = 1
solutions[0]  = [[0,0,0],[1,0,0],[2,0,0]]; 	// x axis solutions
solutions[1]  = [[0,0,1],[1,0,1],[2,0,1]]; 
solutions[2]  = [[0,0,2],[1,0,2],[2,0,2]]; 
solutions[3]  = [[0,0,0],[0,0,1],[0,0,2]]; 	// z axis solutions
solutions[4]  = [[1,0,0],[1,0,1],[1,0,2]]; 
solutions[5]  = [[2,0,0],[2,0,1],[2,0,2]]; 
// y = 2
solutions[6]  = [[0,1,0],[1,1,0],[2,1,0]]; // x axis solutions
solutions[7]  = [[0,1,1],[1,1,1],[2,1,1]]; 
solutions[8]  = [[0,1,2],[1,1,2],[2,1,2]]; 
solutions[9]  = [[0,1,0],[0,1,1],[0,1,2]]; // z axis solutions
solutions[10] = [[1,1,0],[1,1,1],[1,1,2]]; 
solutions[11] = [[2,1,0],[2,1,1],[2,1,2]]; 
// y = 3
solutions[12]  = [[0,2,0],[1,2,0],[2,2,0]]; // x axis solutions
solutions[13]  = [[0,2,1],[1,2,1],[2,2,1]]; 
solutions[14]  = [[0,2,2],[1,2,2],[2,2,2]]; 
solutions[15]  = [[0,2,0],[0,2,1],[0,2,2]]; // z axis solutions
solutions[16]  = [[1,2,0],[1,2,1],[1,2,2]]; 
solutions[17]  = [[2,2,0],[2,2,1],[2,2,2]]; 

// y vertical solutions
// x = 1
solutions[18] = [[0,0,0],[0,1,0],[0,2,0]];
solutions[19] = [[0,0,1],[0,1,1],[0,2,1]];
solutions[20] = [[0,0,2],[0,1,2],[0,2,2]];
// x = 2
solutions[21] = [[1,0,0],[1,1,0],[1,2,0]];
solutions[22] = [[1,0,1],[1,1,1],[1,2,1]];
solutions[23] = [[1,0,2],[1,1,2],[1,2,2]];
// x = 3
solutions[24] = [[2,0,0],[2,1,0],[2,2,0]];
solutions[25] = [[2,0,1],[2,1,1],[2,2,1]];
solutions[26] = [[2,0,2],[2,1,2],[2,2,2]];

// diagonal solutions
// y plane diagonal solutions
solutions[27] = [[0,0,0],[1,0,1],[2,0,2]];	// x == z diagonal
solutions[28] = [[0,1,0],[1,1,1],[2,1,2]];
solutions[29] = [[0,2,0],[1,2,1],[2,2,2]];
solutions[30] = [[2,0,0],[1,0,1],[0,0,2]];	// x != z diagonal
solutions[31] = [[2,1,0],[1,1,1],[0,1,2]];	
solutions[32] = [[2,2,0],[1,2,1],[0,2,2]];	

// x plane diagonal solution
solutions[33] = [[0,0,0],[0,1,1],[0,2,2]];	// y == z diagonal
solutions[34] = [[1,0,0],[1,1,1],[1,2,2]];
solutions[35] = [[2,0,0],[2,1,1],[2,2,2]];
solutions[36] = [[0,0,2],[0,1,1],[0,2,0]];	// y != z diagonal
solutions[37] = [[1,0,2],[1,1,1],[1,2,0]];
solutions[38] = [[2,0,2],[2,1,1],[2,2,0]];
// z plane diagonal solutions
solutions[39] = [[0,0,0],[1,1,0],[2,2,0]];	// x == y diagonal
solutions[40] = [[0,0,1],[1,1,1],[2,2,1]];
solutions[41] = [[0,0,2],[1,1,2],[2,2,2]];
solutions[42] = [[0,2,0],[1,1,0],[2,0,0]];
solutions[43] = [[0,2,1],[1,1,1],[2,0,1]];
solutions[44] = [[0,2,2],[1,1,2],[2,0,2]];
// cross plane diagonals
solutions[45] = [[0,0,0],[1,1,1],[2,2,2]]; // top left corner and bottom right corners
solutions[46] = [[0,2,0],[1,1,1],[2,0,2]];
solutions[47] = [[2,0,0],[1,1,1],[0,2,2]];
solutions[47] = [[0,0,2],[1,1,1],[2,2,0]];



// z plane diagonal solutions


for(var i = 0; i < 3; i++){
	for(var j = 0; j < 3; j++){
		var l1Cell = l1.rows[i].cells[j];
		l1Cell.rowIndex = i;
		l1Cell.onclick = function(){
			// param: y, cell obj
			console.log('makeMove playerSide: ', playerSide);
			makeMove(0, this, playerSide);

		}
		var l2Cell = l2.rows[i].cells[j];
		l2Cell.rowIndex = i;
		l2Cell.onclick = function(){
			makeMove(1, this, playerSide);

		}
		var l3Cell = l3.rows[i].cells[j];
		l3Cell.rowIndex = i;
		l3Cell.onclick = function(){
			makeMove(2, this, playerSide);

		}	
	}
}

function updateCell(x, y, z, side){
	// console.log("state index: ", stateIndex);
	var res = 0;
	var tbl;
	var cell;
	// turn check
	if(turn == -1){
		console.log('game havent started');
		return;
	}

	if(turn == playerSide){
		moveCount++;
		currentGameStats.innerHTML = `You have made ${moveCount} moves`;		
	}
	console.log('this is receiving cell: ', cell);
	if(y == 0){
		tbl = document.getElementById('layer1');
		cell = tbl.rows[z].cells[x];
	}else if(y == 1){
		tbl = document.getElementById('layer2');
		cell = tbl.rows[z].cells[x];
	}
	else if(y == 2){
		tbl = document.getElementById('layer3');
		cell = tbl.rows[z].cells[x];

	}
	if(side == 0){
		cell.style.backgroundColor = "red";
	}else if(side == 1){
		cell.style.backgroundColor = "blue";
	}
	state[x][y][z] = side;
	// pass in turn for readability
	if(checkSolution(x, y, z, turn)){
		// send victory status
		if(turn == playerSide){
			didIWin = 1;
			handleVictory(playerSide);
		}else{
			didIWin = 0;
			handleLoss(playerSide);
		}
	}
	turn = (turn +1)%2;
}

function resetGame(){
	for(var i = 0; i < 3; i++){
		for(var j = 0; j < 3; j++){
			resetCell(l1.rows[i].cells[j]);
			resetCell(l2.rows[i].cells[j]);
			resetCell(l3.rows[i].cells[j]);
		}
	}
	console.log('done resetting color');	
	resetState(state);

}

function resetCell(cell){
	cell.style.backgroundColor = "white";
}
function resetState(state){
	for(var x = 0; x < 3; x++){
		for(var y = 0; y < 3; y++){
			for(var z = 0; z < 3; z++){
				state[x][y][z] = -1;
			}
		}
	}
	console.log('done resetting state');
}

function checkSolution(x, y, z, player){
	for(var i = 0; i < solutions.length; i++){
		var temp = [];
		for(var coord = 0; coord < 3; coord++){
			var x = solutions[i][coord][0];
			var y = solutions[i][coord][1];
			var z = solutions[i][coord][2];
			temp[coord] = state[x][y][z];	
		}
		if(temp[0] == player && temp[1] == player && temp[2] == player){
			console.log('match, positions are box(x,y,z) box2(x,y,z) box3(x,y,z)');
			return 1;
		}
	}
	return 0;
}
