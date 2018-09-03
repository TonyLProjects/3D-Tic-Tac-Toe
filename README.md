Project completed in April 2018

INSTRUCTIONS :
	- To start the application, run node server.js in the terminal
	- Register and login
	- Connect to a game from the user landing page

CREATIVITY/USABILITY:
- Does not allow same usernames in the database
	- when a user tries to signup but the username exists, they'll get an error and be redirected to try another username

- An admin page (which can be found by accessing /admin)
	- where (supposedly the admin) can delete users that match the 'uname' inputted at the bottom of the screen
	- describes the username, age, registration date, total games, wins, and losses of each registered user
	- can sort all the users in the database by username, age, registration date, etc.

- A leaderboard (which can be found by accessing /leaderboard)
	- where users can see the 'best' players registered in the database
	- describes the username, total games, wins, and loss of all the players
	- is by default sorted by wins (descending)

- A matches page (which can be found by accessing /matches)
	- where users can see all the matches played in the database 
	- is by default sorted by date (descending)
	- describes the start time of the match, the winner, loser, as well as number of moves it took for the winner to secure a victory

- A chat
	-implemented with socket.io

