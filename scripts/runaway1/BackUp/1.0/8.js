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
	//init();
	alert(transform_base(3, 2, Math.PI/4, [2, 1]));
}

//Gera uma matriz de transformação e muda a base de coordenadas da global {(1,0),(0,1)} para uma
//base referente à um objeto, jogador ou zumbi
//Obs debug 1: apenas transladação funciona perfeitamente!
//Obs debug 2: 
function transform_base(tx, ty, angle, coord){	//tx e ty: coeficientes de translação; angle: ângulo de rotação
	var A = Math.cos(-angle);
	var B = Math.sin(-angle);
	var TX = -tx;
	var TY = -ty;
	var x = coord[0];
	var y = coord[1];

	var p1 = x*A - y*B + TX*A - TY*B;
	var p2 = x*B + y*A + TY*A + TX*B;
	return [p1, p2];
}


function init(){
	players[0] = new Player("banheiro", [100, 150]);

	zombies[0] = new Zombie("zombie_00", 100, 2.0, [300.0, 300.0]);

	objects[0] = new Object("CopCar", 0, [175.0, 125.0], 0.785, [186, 96]);
	objects[1] = new Object("SpecialAgentCar", 0, [230.0, 260.0], -0.785, [186, 90]);

	//Adicionando boundBoxes:
	//objects[0].addBoundingBox(-48.0, -98.0, 48.0, 98.0);

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
Object.prototype.addBoundingBox = function(x0, y0, x1, y1){
	
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

	this.sightLenth = 300;
	this.sightAngle = Math.PI/1.75;
	this.listenRadius = 300;
	this.perceptionRadius = 50;

	this.sprites = new Image();
	this.sprites.src = "sprites/"+ this.type +"/spt.png";
	this.animation = 0;
	this.lookAt = Math.PI/2;	//Ângulo - para onde o jogador está olhando - ângulo comn 

	this.target_player = null;
	this.interest_point = [position[0], position[1]];
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
	
	//Desenha o campo de percepção do zumbi
	ctx.beginPath();
	ctx.moveTo(this.position[0], this.position[1]);
	ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
	ctx.arc(this.position[0], this.position[1], this.perceptionRadius, 0, 2*Math.PI, true);
	ctx.fill();

	//Desenha o campo de visão do zumbi
	ctx.beginPath();
	ctx.moveTo(this.position[0], this.position[1]);
	ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
	ctx.arc(this.position[0], this.position[1], this.sightLenth, this.sightAngle/2, -this.sightAngle/2, true);
	ctx.fill();

	//Desenha o alcance da aldição do zumbi
	ctx.beginPath();
	ctx.moveTo(this.position[0], this.position[1]);
	ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
	ctx.arc(this.position[0], this.position[1], this.listenRadius, 0, 2*Math.PI, true);
	ctx.fill();

	ctx.restore();
}

Zombie.prototype.move = function(){
	var i;
	//Atribui um ponto de interesse ao zumbi dependendo de que jogador ele vê ou se ele não vê nenhum jogador
	if(this.target_player==null){	//Se o zumbi não estiver perseguindo nenhum player, checa se ele não vê algum player
		for(i=0;i<players.length;i++){
			if(this.seesPlayer(players[i])){	//Se vê um dos players:
				this.target_player = players[i];
				i=players.length+1;	//Sai do for
			}
		}
	}
	else{	//Se o zumbi já está perseguindo um player:
		//Checa se ainda pode ver o player:
		if(this.seesPlayer(this.target_player)){
			//O zumbi continuará perseguindo o player avistado
			this.interest_point[0] = this.target_player.position[0];
			this.interest_point[1] = this.target_player.position[1];
		}
		else{
			this.target_player = null;	//O zumbi não vê mais nenhum jogador
		}
	}

	if(this.interest_point != null){	//Se o zumbi tem algum ponto de interesse
		if(dist_pontos(this.position, this.interest_point) > this.speed+1){	//Se o zumbi está perto o suficiente de seu ponto de interesse, ele deixa de ter interesse neste ponto
			this.animation+=0.2;
			if(this.animation >=4){
				this.animation = 0;
			}
			this.lookAt = Math.atan2(	(this.interest_point[1] - this.position[1]),(this.interest_point[0] - this.position[0])	);
			this.position[0] += Math.cos(this.lookAt)*this.speed;
			this.position[1] += Math.sin(this.lookAt)*this.speed;
		}
		else{
			this.animation = 4;
			// (IPORTANTE) criar função random para fazer o zumbi andar por aí que nem um idiota (pq é o que zumbis ociosos fazem)
		}
	}
}
Zombie.prototype.seesPlayer = function(player){
	if(player == null){
		return false;
	}
	else{
		if(dist_pontos(this.position, player.position) <= this.perceptionRadius){	//Solução para o problema de quando o player passa pelo zumbi o zumbi para de persegui-lo
			return true;
		}
		else if(	dist_pontos(this.position, player.position) <= this.sightLenth	){

			//IMPLEMENTAR
			var relative_angle = Math.asin(	dist_pontos(player.position, [player.position[0], this.position[1]])	/	dist_pontos(player.position, this.position));
			//Angulo entre a posição do zumbi e a posição do player em relação ao eixo x

			//Deste trecho do código até o fim desta função vc só aceita... sério... ela já funciona... porque mexer?
			if(player.position[0] - this.position[0] < 0){
				relative_angle = Math.PI - relative_angle;
			}
			if(player.position[1] - this.position[1] <= 0){
				relative_angle *= -1;
			}

			var dif_angle = Math.abs(relative_angle - this.lookAt);
			
			//Principalmente esta parte! não altere NUNCA! Esta parte resolve o problema de o ângulo (Pi/3) ser igual ao ângulo (2*Pi + Pi/3)
			//Para este trecho, foram utilizados lógica, trigonometria e dados experimentais proveniente de tentativas e erros (força bruta.. muita... e perseverança... tbm muita!)
			if(dif_angle>=Math.PI){
				dif_angle = Math.abs(dif_angle -  2*Math.PI);
			}

			if(dif_angle <= this.sightAngle/2){
				return true;
			}
			else{
				return false;
			}
		}
		else{
			return false;
		}
	}
}

function dist_pontos(pt1, pt2){
	return (Math.sqrt(	Math.pow((pt1[0]-pt2[0]), 2)	+	Math.pow((pt1[1]-pt2[1]), 2)	));
}



function Map(size){
	this.size = size;
}
Map.prototype.draw = function(){
	ctx.fillStyle = "#555";
	ctx.fillRect(0, 0, this.size[0], this.size[1]);
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


	//Zombie's info
	ctxGUI.fillStyle="#000000";
	ctxGUI.font="15px Georgia";
	ctxGUI.fillText(zombies[0].type + " " + zombies[0].life + " pos: (" + zombies[0].position[0] + " " + zombies[0].position[1] + ")", 20, 200);
	ctxGUI.fillText("lookAt: " + zombies[0].lookAt, 20, 220);
	if(zombies[0].seesPlayer(players[0]) == false){
		ctxGUI.font="15px Georgia";
		ctxGUI.fillText("vendo o player: nao", 20, 240);
	}
	else{
		ctxGUI.font="15px Georgia";
		ctxGUI.fillText("vendo o player: sim", 20, 240);
	}
}
