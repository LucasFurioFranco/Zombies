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

//Debug flags
var visions_on = false;

var keyStatus = [];
var isMousePressed = false;
var map;
var players = new Array();
var zombies = new Array();

if(isSuported){
	init();
}

//Gera uma matriz de transformação e muda a base de coordenadas da global {(1,0),(0,1)} para uma
//base referente à um objeto, jogador ou zumbi
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

function create_transform_matrix(tx, ty, angle){
	var A = Math.cos(-angle);
	var B = Math.sin(-angle);
	var TX = -tx;
	var TY = -ty;
	return [
			[A,    -B,    TX*A-TY*B],
			[B,     A,    TY*A+TX*B],
			[0,     0,        1    ]];
}

function mult_matrix_vector(M, p){
	return [(M[0][0]*p[0] + M[0][1]*p[1] + M[0][2]), (M[1][0]*p[0] + M[1][1]*p[1] + M[1][2])];
}

function init(){
	map = new Map([1000, 1000]);
	players.push(new Player("banheiro", [50, 150]));
	zombies.push(new Zombie("zombie_00", 100, 2.0, [350.0, 350.0]));

	var obj;
	obj = ( new Object("CopCar", 0, [175.0, 125.0], 0.785, [186, 96]) );
	obj.boundingBoxes[0] = [[-98, -48],[98, 48]];

	map.objects[0] = obj;

	obj = ( new Object("SpecialAgentCar", 0, [230.0, 260.0], -0.785, [186, 90]) );
	obj.boundingBoxes[0] = [[-98, -45],[98, 45]];
	map.objects[1] = obj;

	obj = ( new Object("Ambulance", 0, [700.0, 500.0], Math.PI/9, [285, 96]) );
	obj.boundingBoxes[0] = [[-285/2, -96/2],[285/2, 96/2]];
	map.objects[2] = obj;

	obj =  new Object("Cemitery1", 0, [1000.0, 1000.0], 0, [500, 500]);
	map.nonInteragibleObjects[0] = obj;

	//Adicionando boundBoxes:
	var i;
	for(i=0;i<256;i++){
		keyStatus[i]=0;
	}
	setInterval(draw, 30);
	setInterval(moveHandler, 30);
	setInterval(moveZombies, 30);
	setInterval(draw_GUI, 30);
	setInterval(refreshBullets, 30);
	setInterval(populate_zombies, 1000);
}

//function Zombie(type, life, speed, position)
function populate_zombies(){
	if(zombies.length<=100){
		var x = Math.random()*600 - 250 + 1000;
		var y = Math.random()*600 - 250 + 1000;
		var a = Math.random() + 1;
		var b = Math.random();
		var angle = Math.random()*Math.PI*2;
		zombies.push(new Zombie("zombie_00", 100*a, 1.5+b, [x, y], angle));
	}
}

function refreshBullets(){
	var i;
	for(i=map.bullets.length-1;i>=0;i--){
		map.refreshBullet(map.bullets[i], i);
	}
}

function Object(type, state, position, lookAt, size){
	this.type = type;
	this.state = state;
	this.position = position;
	this.lookAt = lookAt;
	this.size = size;
	this.maxRadius = dist_pontos(size, [0, 0])/2 + 4;
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

	if(visions_on){
		//Desenha o maxRadius do objeto
		ctx.beginPath();
		ctx.moveTo(this.position[0], this.position[1]);
		ctx.fillStyle = "rgba(0, 0, 255, 0.3)";	
		ctx.arc(this.position[0], this.position[1], this.maxRadius, 0, 2*Math.PI, true);
		ctx.fill();
		ctx.closePath();
	}

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

function Zombie(type, life, speed, position, angle){
//alert(type + " " + life + " " + speed + " pos: (" + position[0] + "," + position[1] + ")");
	this.type = type;
	this.life = life;
	this.speed = speed;
	this.position = position;
	this.lookAt = angle;

	this.sightLenth = 300;
	this.sightAngle = Math.PI/1.75;
	this.listenRadius = 300;
	this.perceptionRadius = 50;

	this.sprites = new Image();
	this.sprites.src = "sprites/"+ this.type +"/spt.png";
	this.animation = 0;

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
	
	if(visions_on){
		//Desenha o campo de percepção do zumbi
		ctx.beginPath();
		ctx.moveTo(this.position[0], this.position[1]);
		ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
		ctx.arc(this.position[0], this.position[1], this.perceptionRadius, 0, 2*Math.PI, true);
		ctx.fill();
		ctx.closePath();

		//Desenha o campo de visão do zumbi
		ctx.beginPath();
		ctx.moveTo(this.position[0], this.position[1]);
		ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
		ctx.arc(this.position[0], this.position[1], this.sightLenth, this.sightAngle/2, -this.sightAngle/2, true);
		ctx.fill();
		ctx.closePath();

		//Desenha o alcance da aldição do zumbi
		ctx.beginPath();
		ctx.moveTo(this.position[0], this.position[1]);
		ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
		ctx.arc(this.position[0], this.position[1], this.listenRadius, 0, 2*Math.PI, true);
		ctx.fill();
		ctx.closePath();
	}
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
			var dx = Math.cos(this.lookAt)*this.speed;
			var dy = Math.sin(this.lookAt)*this.speed;
			if(!map.willColideObject( [this.position[0]+dx, this.position[1]] )){
				this.position[0] += dx;
			}
			if(!map.willColideObject( [this.position[0], this.position[1]+dy] )){
				this.position[1] += dy;
			}
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

function Bullet(pos, ang, power, dist_rest, source_player){
	this.position = pos;
	this.lookAt = ang;
	this.power = power;
	this.dist_rest = dist_rest;
	this.source_player = source_player;
}
Bullet.prototype.draw = function(){
	ctx.save();
	ctx.translate(this.position[0], this.position[1]);
	ctx.rotate(this.lookAt);
	ctx.translate(-this.position[0], -this.position[1]);

	ctx.beginPath();
	ctx.fillStyle = "#FF0000";
	ctx.moveTo(this.position[0], this.position[1]);
	ctx.lineTo(this.position[0], this.position[1]-3);
	ctx.lineWidth = 15;
	ctx.stroke();
	ctx.closePath();

	ctx.restore();
}

function Map(size){
	this.size = size;
	this.objects = new Array();
	this.nonInteragibleObjects = new Array();
	this.bullets = new Array();
}


Map.prototype.addBullet = function(bullet){
	this.bullets.push(bullet);
}
Map.prototype.refreshBullet = function(bullet, idx){
	var i;
	var dist;
	if(bullet.dist_rest<=0){
		map.bullets.splice(idx, 1);
	}
	else{
		bullet.position[0] += 8*Math.cos(bullet.lookAt);
		bullet.position[1] += 8*Math.sin(bullet.lookAt);
		bullet.dist_rest-=8;
		for(i=zombies.length-1;i>=0;i--){
			dist = dist_pontos(bullet.position, zombies[i].position);
			if(dist <= 20){
				if(zombies[i].target_player==null){
					zombies[i].target_player = bullet.source_player;
					zombies[i].interest_point = [bullet.position[0], bullet.position[1]];
				}
				if(dist <= 1.5){

					zombies.splice(i, 1);	//Head shot: o zumbi morreu!

					bullet.power/=3;
				}
				else{
					zombies[i].life -= bullet.power*(20-dist)/20;
					if(zombies[i].life <= 0){
						zombies.splice(i, 1);	//o zumbi morreu!
					}
					bullet.power/=1.3;
				}
				if(bullet.power<=2){
					map.bullets.splice(idx, 1);
					break;
				}
			}
		}

	}
}







Map.prototype.addObjects = function(obj){
	this.objects[this.objects.length] = obj;
}
Map.prototype.draw = function(){
	ctx.fillStyle = "#555";
	ctx.fillRect(0, 0, c.width, c.height);

	ctx.translate(-players[0].position[0]+c.width/2, -players[0].position[1]+c.height/2);	

	var i;
	for(i=0;i<this.nonInteragibleObjects.length;i++){
		this.nonInteragibleObjects[i].draw();
	}

	for(i=0;i<this.objects.length;i++){
		this.objects[i].draw();
	}

	for(i=0;i<this.bullets.length;i++){
		this.bullets[i].draw();
	}
}
Map.prototype.willColideObject = function(pos){	//Dada uma posição, retorna se haverá conflito entre esta posição com os objetos
	var i, j;
	var P;
	var M;	//Matriz de mudança de coordenadas
	for(i=0;i<this.objects.length;i++){

		
		if(dist_pontos(this.objects[i].position, pos) <= this.objects[i].maxRadius){	//Pode haver um conflito (pos está dentro do maxRadius do objeto)
			if(this.objects[i].boundingBoxes.length>0){
				
				//M = create_transform_matrix(this.objects[i].position[0], this.objects[i].position[1], this.objects[i].lookAt);
				P = transform_base(this.objects[i].position[0], this.objects[i].position[1], this.objects[i].lookAt, pos);
				for(j=0;j<this.objects[i].boundingBoxes.length;j++){
					if(is_inside_boundingBox(this.objects[i].boundingBoxes[j], P)){
						return true;
					}
				}

			}
		}

	}
	return false;
}

function moveHandler(){
	if(keyStatus[65]==1){
		if(!map.willColideObject([players[0].position[0]-5, players[0].position[1]])){
			players[0].position[0]-=5;
		}
	}
	if(keyStatus[68]==1){
		if(!map.willColideObject([players[0].position[0]+5, players[0].position[1]])){
			players[0].position[0]+=5;
		}
	}
	if(keyStatus[87]==1){
		if(!map.willColideObject([players[0].position[0], players[0].position[1]-5])){
			players[0].position[1]-=5;
		}
	}
	if(keyStatus[83]==1){
		if(!map.willColideObject([players[0].position[0], players[0].position[1]+5])){
			players[0].position[1]+=5;
		}
	}
}




function is_inside_boundingBox(BB, P){
	var min, max;
	min = Math.min(BB[0][0]);
	max = Math.min(BB[1][0]);

	if(P[0]>min && P[0]<max){
		min = Math.min(BB[0][1]);
		max = Math.min(BB[1][1]);
		if(P[1]>min && P[1]<max){
			return true;
		}
	}
	return false;
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
	players[0].lookAt = Math.atan2((y - c.width/2),(x - c.height/2));
}

document.onmousedown = function(e){
	isMousePressed = true;
	var x, y;
	var rect = canvasRunAway1.getBoundingClientRect();
	x = e.clientX - rect.left;
	y = e.clientY - rect.top;
	players[0].lookAt = Math.atan2((y - c.width/2),(x - c.height/2));
	//p1.shoot();
	//function Bullet(pos, ang, power, dist_rest, source_player)
	map.addBullet(new Bullet([players[0].position[0], players[0].position[1]], players[0].lookAt, 15, 600, players[0]));
}

document.onmouseup = function(e){
	isMousePressed = false;
}










function draw(){
	ctx.save();

	map.draw();
	var i;
	for(i=0;i<players.length;i++){
		players[i].draw();
	}
	for(i=0;i<zombies.length;i++){
		zombies[i].draw();
	}

	ctx.restore();
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