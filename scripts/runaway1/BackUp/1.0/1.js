var isSuported = true;
// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
}
else{
	isSuported = false;
  	alert('The File APIs are not fully supported in this browser.');
}
var c = document.getElementById('canvasRunAway1');	//Armazena as informações do canvas, como largura e altura
var cGUI = document.getElementById('canvasRunAway1GUI');
var ctx = c.getContext("2d");
var ctxGUI = cGUI.getContext("2d");

ctx.font="12px Georgia";

var keyStatus = [];
var isMousePressed = false;
var players = [];
var zombies = [];
var objects = [];
var map;

if(isSuported){
	init();
}

function init(){
	players[0] = new Player("banheiro", [100, 150]);

	zombies[0] = new Zombie("zombie_00", 100, 2.0, [300.0, 300.0]);
	zombies[1] = new Zombie("zombie_00", 100, 1.5, [400.0, 200.0]);
	zombies[2] = new Zombie("zombie_00", 100, 3.0, [350.0, 250.0]);
//alert(zombies[0].type + " " + zombies[0].life + " pos: (" + zombies[0].position[0] + " " + zombies[0].position[1] + ")");
	objects[0] = new Object("CopCar", 0, [175.0, 125.0], 0.785, [186, 96]);
	objects[1] = new Object("SpecialAgentCar", 0, [230.0, 260.0], -0.785, [186, 90]);

	map = new Map([1000, 1000]);
	var i;
	for(i=0;i<256;i++){
		keyStatus[i]=0;
	}
	setInterval(draw, 30);
	setInterval(moveHandler, 30);
	setInterval(moveZombies, 30);
	setInterval(draw_GUI, 30);
}

function Animation(){

}
Animation.prototype.animate = function(){

}
Animation.prototype.draw = function(){

}

function Object(type, state, position, lookAt, size){
	this.type = type;
	this.state = state;
	this.position = position;
	this.lookAt = lookAt;
	this.size = size;
	this.animation = 0;

	this.boundingBoxes = [];
	this.sprites = new Image();
	this.sprites.src = "sprites/objects/"+ this.type +".png";
}
Object.prototype.addBoundingBox = function(pt1, pt2){
	
}
Object.prototype.draw = function(){
	ctx.save();
	ctx.translate(this.position[0], this.position[1]);
	ctx.rotate(this.lookAt);
	ctx.translate(-this.position[0], -this.position[1]);
	ctx.drawImage(this.sprites, 0, 0, this.size[0], this.size[1], this.position[0]-(this.size[0]/2), this.position[1]-(this.size[1]/2), this.size[0], this.size[1]);	
	ctx.restore();
}


function moveZombies(){
	var i;
	for(i=0;i<zombies.length;i++){
		zombies[i].move();
	}
}

function Player(name, position){
	this.name = name;
	this.life = 100;
	this.position = position;
	this.sprites = new Image();
	this.sprites.src = "sprites/player_00/p0.png";
	this.lookAt = 0;	//Ângulo - para onde o jogador está olhando - ângulo comn 
}
Player.prototype.draw = function(){
	ctx.save();
	ctx.translate(this.position[0], this.position[1]);
	ctx.rotate(this.lookAt);
	ctx.translate(-this.position[0], -this.position[1]);

	ctx.drawImage(this.sprites, this.position[0]-50, this.position[1]-50);
	ctx.restore();
}

function Zombie(type, life, speed, position){
//alert(type + " " + life + " " + speed + " pos: (" + position[0] + "," + position[1] + ")");
	this.type = type;
	this.life = life;
	this.speed = speed;
	this.position = position;

	this.sprites = new Image();
	this.sprites.src = "sprites/"+ this.type +"/spt.png";
	this.animation = 0;
	this.lookAt = 0;	//Ângulo - para onde o jogador está olhando - ângulo comn 
}
Zombie.prototype.draw = function(){
	ctx.save();
	ctx.translate(this.position[0], this.position[1]);
	ctx.rotate(this.lookAt);
	ctx.translate(-this.position[0], -this.position[1]);

	ctx.drawImage(this.sprites, Math.floor(this.animation)*100, 0, 100, 100, this.position[0]-50, this.position[1]-50, 100, 100);
/*
	context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
	img 	Source image object 	Sprite sheet
	sx 	Source x 	Frame index times frame width	
	sy 	Source y 	0
	sw 	Source width 	Frame width
	sh 	Source height 	Frame height
	dx 	Destination x 	0
	dy 	Destination y 	0
	dw 	Destination width 	Frame width
	dh 	Destination height 	Frame height
*/
	ctx.restore();
}
Zombie.prototype.move = function(){
	this.animation+=0.2;
	if(this.animation >=4){
		this.animation = 0;
	}
	this.lookAt = Math.atan2((players[0].position[1] - this.position[1]),(players[0].position[0] - this.position[0]));

	this.position[0] += Math.cos(this.lookAt)*this.speed;
	this.position[1] += Math.sin(this.lookAt)*this.speed;
}

function Map(size){
	this.size = size;
}
Map.prototype.draw = function(){
	ctx.fillStyle = "#555";
	ctx.fillRect(0, 0, this.size[0], this.size[1]);
}


function draw(){
	map.draw();
	var i;
	for(i=0;i<objects.length;i++){
		objects[i].draw();
	}
	for(i=0;i<players.length;i++){
		players[i].draw();
	}
	for(i=0;i<zombies.length;i++){
		zombies[i].draw();
	}
}


function moveHandler(){
	if(keyStatus[65]==1){
		players[0].position[0]-=5;
	}
	if(keyStatus[68]==1){
		players[0].position[0]+=5;
	}
	if(keyStatus[87]==1){
		players[0].position[1]-=5;
	}
	if(keyStatus[83]==1){
		players[0].position[1]+=5;
	}
}




document.onkeyup = function(e){
	keyStatus[e.keyCode] = 0;
}

document.onkeydown = function(e){
	keyStatus[e.keyCode] = 1;
}

document.onmousemove = function(e){
	var x, y;
	var rect = canvasRunAway1.getBoundingClientRect();
	x = e.clientX - rect.left;
	y = e.clientY - rect.top;
	players[0].lookAt = Math.atan2((y - players[0].position[1]),(x - players[0].position[0]));
}

document.onmousedown = function(e){
	isMousePressed = true;
	var x, y;
	var rect = canvasRunAway1.getBoundingClientRect();
	x = e.clientX - rect.left;
	y = e.clientY - rect.top;
	players[0].lookAt = Math.atan2((y - players[0].position[1]),(x - players[0].position[0]));
	//p1.shoot();
}

document.onmouseup = function(e){
	isMousePressed = false;
}














function draw_GUI(){
	ctxGUI.fillStyle="#888888";
	ctxGUI.fillRect(0, 0, cGUI.width, cGUI.height);

	//Nome
	ctxGUI.fillStyle="#000000";
	ctxGUI.font="30px Georgia";
	ctxGUI.fillText(players[0].name, 20, 30);

	//Vida
	ctxGUI.font="20px Georgia";
	ctxGUI.fillText("life: " + players[0].life, 20, 60);

	//Posição
	ctxGUI.font="20px Georgia";
	ctxGUI.fillText("position: (" + players[0].position[0] + ", " + players[0].position[1] + ")", 20, 90);

	//Ângulo
	ctxGUI.font="20px Georgia";
	ctxGUI.fillText("lookAt:" + players[0].lookAt, 20, 120);


	//Nome
	ctxGUI.fillStyle="#000000";
	ctxGUI.font="15px Georgia";
	ctxGUI.fillText(zombies[0].type + " " + zombies[0].life + " pos: (" + zombies[0].position[0] + " " + zombies[0].position[1] + ")", 20, 200);
}
