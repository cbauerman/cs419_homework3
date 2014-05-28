You will at least simulate the balls and the table with its side walls. You do not 
have to simulate the players, the chalk, or the pockets of the table. However, 
modeling them would mean bonus points. 
 
1. (Setting up the billiard game) Position the balls as the typical starting position of a 
billiard game, with the numbered balls forming a triangle on the side of the table 
opposite where the cue ball is. If you are uncertain of this, look it up on Wikipedia or 
go to the MU and check it out. Also, all the balls should be textured to be 
distinguishable. 
 
2. (Hitting the cue ball) Implement the following interface. Press down the left button of 
your mouse, mouse the cursor, until you release the mouse. The end position, which must 
be the cue ball, is the hitting point, and the vector from which your mouse moved towards 
the hitting point gives the force on the cue ball at the hitting point. 
 
3. (Rolling a ball) Implement the physics necessary for the ball to roll given an initial 
position and velocity. Be sure to model friction. 
 4. (Collision between a ball and a sidewall of the table) Implement the physics necessary 
for the ball to collide with a sidewall of the table. Also implement the physics that 
simulates the response of this collision. 
 
(for CS 552 students) 
 
5. (Collision between two balls) Implement the physics necessary for the ball to collide 
with another ball. Also implement the physics that simulates the response of this 
collision. Finally, put together the game so that there is an interaction between all six 
balls once the cue ball is hit. 
