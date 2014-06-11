
var scene;
var camera;
var renderer;
var geometry;
var sceneObjects = [];

var lastMouseVec;

var cameraLoc;

var loading = [];

var clock;
var delta;

var table;

var table_length;
var table_width;

var gravity = 9.80;
var co_friction = 0.2;
var co_roll_friction = 0.01;
var co_ball_friction = 0.1;
var co_rest_ball = .95;
var co_rest_wall = .5;
var cueball;
var cueStart;
var cueEnd;

var buttonHeld = false;
var aim = true;

var projector;

function render() {

	cameraUpdate();

	delta = clock.getDelta();
	animate();
	clock.getDelta();
	requestAnimationFrame(render);
	renderer.render(scene, camera);
	
	if(cueball.velocity.length() < 0.1){
		for(var i = 0; i < sceneObjects.length; ++i){
			sceneObjects[i].ang_vel = new THREE.Vector3(0, 0, 0);
		
		}
	
	
	}

}
function animate() {
	
	for(var i = 0; i < sceneObjects.length; ++i){
		sceneObjects[i].delta = delta;
	}
	for(var i = 0; i < sceneObjects.length; ++i){
		var ball = sceneObjects[i]
		for(var j = 0; j < table.length; ++j){
			var t1 = (table[j].e.x * (table[j].o.z - ball.position.z)
				 + table[j].e.z * (ball.position.x - table[j].o.x)) 
				/ (ball.velocity.z * table[j].e.x - ball.velocity.x * table[j].e.z);
			var t2 = (ball.velocity.x * (table[j].o.z - ball.position.z) 
				+ ball.velocity.z * (ball.position.x - table[j].o.x)) 
				/ (ball.velocity.z * table[j].e.x - ball.velocity.x * table[j].e.z);
			if( t1 < ball.delta && t1 > 0 && t2 > 0 ){
				
				//update ball pos
				move(ball, t1);
				//reflect ball velocity
				var walln = new THREE.Vector3(0, 1, 0).cross(table[j].e);
				var vel_reflect = ball.velocity.dot(walln);
				ball.velocity.sub(walln.multiplyScalar( 2 * vel_reflect));
				ball.velocity.multiplyScalar(co_rest_wall);

				//fix angular velocity
				var r = walln.clone().negate();
				var vp = new THREE.Vector3().crossVectors(r, ball.ang_vel);
				var vn = walln.clone().multiplyScalar(walln.dot(ball.velocity));
				var vt = ball.velocity.clone().sub(vn); 
				
				var del_w = vp.clone();
				del_w.normalize();
				del_w.multiplyScalar(ball.mass * gravity * -co_friction );
				del_w.crossVectors(r, del_w).multiplyScalar((t1 * 5)/(ball.radius * ball.radius * ball.mass * 2));
				ball.ang_vel.add(del_w);
				ball.ang_vel.multiplyScalar(co_rest_wall);

			}
		}
		//ball-on-ball collisions
		//detections
		for(var j= 0; j < sceneObjects.length; ++j){
			if( i != j){
				var oball = sceneObjects[j];
				var vel_diff = new THREE.Vector3();
				vel_diff.subVectors(ball.velocity, oball.velocity);
				var pos_diff = new THREE.Vector3();
				pos_diff.subVectors(ball.position, oball.position);
//TODO account for a possibly being zero
				var a = vel_diff.dot(vel_diff);
				var b = 2 * pos_diff.dot(vel_diff);
				var c = pos_diff.dot(pos_diff);
				var t1 = (-b + Math.sqrt(b * b - 4 * a * (c - (4 * ball.radius * oball.radius)))) / (2 * a);
				var t2 = (-b - Math.sqrt(b * b - 4 * a * (c - (4 * ball.radius * oball.radius)))) / (2 * a);

				var ct = 0;
//TODO our solution does not account for two possible correct times
				//Failsafe in case balls are within each other
				if(c - (4 * ball.radius * oball.radius) <= 0){
					if(t1 > 0 && t1 < ball.delta){
						move(ball, t1);
						continue;
					} else if (t2 > 0 && t2 < ball.delta){
						move(ball, t2);
						continue;
					}	
				}
				if(t1 < ball.delta && t1 < oball.delta && t1 > 0){
					ct = t1;
				} else if (t2 < delta && t2 < oball.delta && t2 > 0){
					ct = t2;
				} else {
					continue;
				}

				//Move balls to area of collision
				move(ball, ct);
				move(oball, ct);	
				//calculate change to linear velocity
				//calcualte collision normal
				var n = ball.position.clone();
				n.sub(oball.position);
				n.normalize();
				//n.negate();
				//find the normal component of each ball's linear velocity
				var oball_vn = n.clone();
				oball_vn.multiplyScalar(oball_vn.dot(oball.velocity));
				//n.negate();
				var ball_vn = n.clone();
				ball_vn.multiplyScalar(ball_vn.dot(ball.velocity));
				//and the tangential component
				var ball_vt =  ball.velocity.clone().sub(ball_vn); 
				var oball_vt = oball.velocity.clone().sub(oball_vn);
				//switch the velocites and everyone is happy
				ball.velocity.addVectors(ball_vt, oball_vn);
				oball.velocity.addVectors(oball_vt, ball_vn);
				//calculate change to angular velocity
				//calculate the radius vec for both balls
				var ball_r = new THREE.Vector3().subVectors(oball.position, ball.position).multiplyScalar(.5);
				var oball_r = new THREE.Vector3().subVectors(ball.position, oball.position).multiplyScalar(.5);

				var ball_vp = new THREE.Vector3().crossVectors(ball_r, ball.ang_vel);
				var oball_vp = new THREE.Vector3().crossVectors(oball_r, oball.ang_vel);

				var ball_del_w = new THREE.Vector3().subVectors(ball_vp,  oball_vp);
				var oball_del_w = new THREE.Vector3().subVectors(oball_vp, ball_vp);

				oball_del_w.add(oball_vt).normalize();
				oball_del_w.multiplyScalar(oball.mass * ball_vn.length() * -co_friction / ct);
				oball_del_w.crossVectors(oball_r, oball_del_w).multiplyScalar((ct * 5)/(oball.radius * oball.radius * oball.mass * 2));
				oball.ang_vel.add(oball_del_w);
				ball_del_w.add(ball_vt).normalize();
				ball_del_w.multiplyScalar(ball.mass * oball_vn.length() * -co_friction / ct);
				ball_del_w.crossVectors(ball_r, ball_del_w).multiplyScalar((ct * 5)/(ball.radius * ball.radius * ball.mass * 2));
				ball.ang_vel.add(ball_del_w);


			}
	
		}
		move(ball, ball.delta);
	}

}

//roll/dont roll the ball for a move in the given amount of time. 
function move(ball, time) {

	//linear velocity
	var vel = ball.velocity.clone();
	ball.position.add(vel.multiplyScalar(time));

	//anguler velocity
	var w = ball.ang_vel.clone();
	var mag = w.length();
	ball.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(w.normalize(), mag * (Math.PI / 180)));

	//sliding vs rolling bal
	w = ball.ang_vel.clone();	
	var r = new THREE.Vector3(0, -1, 0).multiplyScalar(ball.radius);	
	var vp = new THREE.Vector3().crossVectors(w, r).add(ball.velocity);
	var friction = 0;
	if(vp.length() < ball.radius * mag){
		friction = co_friction;
	} else {
		friction = co_roll_friction;
	}

	//effect of friction on linear velocity	
	var d_vel = vel.add(vp).normalize().multiplyScalar(-friction * gravity * time);
	ball.velocity.add(d_vel);

	//effect of friction on angular velocity
	//sliding ball
	
	vp.normalize().multiplyScalar(-friction * ball.mass * gravity * ball.radius);
	var del_w = new THREE.Vector3().crossVectors(r, vp)
	del_w.multiplyScalar((5 * time) / (2 * ball.mass * ball.radius * ball.radius));

	ball.ang_vel.add(del_w);

	ball.delta -= time;
}


function getJson(func, address) {

	loading.push(true);

	var httpRequest;
	if (window.XMLHttpRequest) { // Mozilla, Safari, ...
		httpRequest = new XMLHttpRequest();
	} else if (window.ActiveXObject) { // IE 8 and older
		httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	}

	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === 4) {
			if (httpRequest.status === 200) {
				func(JSON.parse(httpRequest.responseText));
				loading.pop();
			}
		}
	}

	httpRequest.open('GET', address);
	httpRequest.send(null);

}

function loadScene(objects) {

	for (var i = 0; i < objects.length; ++i) {
		switch (objects[i].type) {
		case "light":
			if (objects[i].lightType === "point") {
				var pointLight = new THREE.PointLight(parseInt(objects[i].color, 16));

				pointLight.position.x = objects[i].position.x;
				pointLight.position.y = objects[i].position.y;
				pointLight.position.z = objects[i].position.z;

				scene.add(pointLight);
			}
			break;
		case "plane":
			var geometry = new THREE.PlaneGeometry(objects[i].width, objects[i].length);
			var material;
			if (objects[i].material === "texture") {
				var texture = THREE.ImageUtils.loadTexture(objects[i].texture);
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				var maxSide = Math.max(objects[i].width, objects[i].length)/4;
				texture.repeat.set(objects[i].width/maxSide, objects[i].length/maxSide);
				material = new THREE.MeshLambertMaterial({
						map : texture 
					});
			}
			var plane = new THREE.Mesh(geometry, material);
			plane.position.set(
				objects[i].position.x,
				objects[i].position.y,
				objects[i].position.z);

			plane.rotation.set(
				objects[i].rotation.x * (Math.PI / 180),
				objects[i].rotation.y * (Math.PI / 180),
				objects[i].rotation.z * (Math.PI / 180),
				"XYZ");

			scene.add(plane);

			break;
		case "cube":
			var geometry = new THREE.BoxGeometry(objects[i].width, objects[i].length, objects[i].depth);
			var material;
			if (objects[i].material === "texture") {
				var texture = THREE.ImageUtils.loadTexture(objects[i].texture);
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				var maxSide = Math.max(objects[i].width, objects[i].length)/4;
				texture.repeat.set(objects[i].width/maxSide, objects[i].length/maxSide);
				material = new THREE.MeshLambertMaterial({
						map : texture 
					});
			}
			var cube = new THREE.Mesh(geometry, material);
			cube.position.set(
				objects[i].position.x,
				objects[i].position.y,
				objects[i].position.z);

			cube.rotation.set(
				objects[i].rotation.x * (Math.PI / 180),
				objects[i].rotation.y * (Math.PI / 180),
				objects[i].rotation.z * (Math.PI / 180),
				"XYZ");

			scene.add(cube)
			break;
		default:

		}
	}

	render();
}

function loadBalls(balls) {

	for (var i = 0; i < balls.length; ++i) {
		var material = new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture("textures/" + balls[i].texture)
			});
		var geometry = new THREE.SphereGeometry(balls[i].radius, 32, 32);
		var sphere = new THREE.Mesh(geometry, material);
		sphere.position.set(balls[i].position.x, balls[i].position.y, balls[i].position.z);
		sphere.position.x += 75;
		//sphere.velocity = new THREE.Vector3((Math.random() * 2 - 1) * 15, 0, (Math.random()* 2 - 1)* 15);
		sphere.velocity = new THREE.Vector3(0, 0, 0);
		sphere.ang_vel  = new THREE.Vector3(0, 0, 0);
		sphere.mass = balls[i].mass;
		sphere.radius = balls[i].radius; 
		sphere.ball = balls[i].ball;
		sceneObjects.push(sphere);
		scene.add(sphere);
		if(sphere.ball == "cue"){
			cueball = sphere;
		}
	}
	getJson(loadScene, "scene.js");
}

function randomNormal(){
	var vec = new THREE.Vector3((Math.random() * 2 - 1), (Math.random() * 2 - 1), (Math.random() * 2 - 1));
	vec.normalize();
	return vec;
}

function init() {

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75,
			window.innerWidth / window.innerHeight, 0.1, 1000);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	projector = new THREE.Projector();

	document.body.appendChild(renderer.domElement);

	cameraLoc = new THREE.Vector3(0, 0, 5);

	table_length = 127;
	table_width = 254;

	//Create table
	table = [ { "o" : new THREE.Vector3(table_width/2, 0, -table_length/2), "e" : new THREE.Vector3(0, 0, 1)},
	          { "o" : new THREE.Vector3(table_width/2, 0, table_length/2),  "e" : new THREE.Vector3(-1, 0, 0)},
	          { "o" : new THREE.Vector3(-table_width/2, 0, table_length/2),  "e" : new THREE.Vector3(0, 0, -1)},
	          { "o" : new THREE.Vector3(-table_width/2, 0, -table_length/2),  "e" : new THREE.Vector3(1, 0, 0)}];

	lastMouseVec = new THREE.Vector3(0, 0, 1);
	
	window.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('wheel', onMouseWheel, true);
	window.addEventListener('mouseup', onMouseUp, true);
	window.addEventListener('mousedown', onMouseDown, true);
	window.addEventListener('contextmenu', function(ev){return false;}, true);
	window.addEventListener('onmousedown', function(ev){return false;}, true);

	clock = new THREE.Clock();

	getJson(loadBalls, "balls.js");

}

function cameraUpdate(){

	camera.position = cameraLoc;

	if(aim){
		camera.lookAt(cueball.position);
	} else {
		camera.lookAt(new THREE.Vector3(0, 0, 0));
	}
}

function onMouseMove(ev) {

	var newMouseVec = new THREE.Vector3(0, 0, 0);
	newMouseVec.x = (ev.clientX * 2 - window.innerWidth) / window.innerWidth;
	newMouseVec.y = (window.innerHeight - 2 * ev.clientY) / window.innerHeight;
	//newMouseVec.y = (2 * ev.clientY - window.innerHeight) / window.innerHeight;
	
	var length = Math.sqrt(newMouseVec.x * newMouseVec.x + newMouseVec.y * newMouseVec.y);
	length = (length < 1.0) ? length : 1.0;

	//console.log("X: " + newMouseVec.x + " Y: " + newMouseVec.y);

	newMouseVec.set(newMouseVec.x, newMouseVec.y, Math.sqrt(1.001 - length * length));
	newMouseVec.normalize();

	if(buttonHeld){
	
		var n = new THREE.Vector3().crossVectors(lastMouseVec, newMouseVec);
	
		var mag = n.length()

		n.normalize();

		if(aim){
			var temp = cameraLoc.clone().sub(cueball.position);
			temp.applyAxisAngle(n, 2 * mag);
		}
		cameraLoc = temp.add(cueball.position);
	
	}

	lastMouseVec = newMouseVec;

}

function onMouseDown(ev){

	ev.stopPropagation();
	ev.preventDefault();
	
	if(ev.button == 2){
		buttonHeld = true; 
	} else if(ev.button == 0){
		cueStart = new THREE.Vector3((ev.clientX * 2 - window.innerWidth) / window.innerWidth,
					     (window.innerHeight - 2 * ev.clientY) / window.innerHeight,
					     0);
	}

	return false;
}

function onMouseUp(ev){

	ev.stopPropagation();
	ev.preventDefault();

	if(ev.button == 2){
		buttonHeld = false; 
	} else if(ev.button == 0){
		cueEnd = new THREE.Vector3((ev.clientX * 2 - window.innerWidth) / window.innerWidth,
					     (window.innerHeight - 2 * ev.clientY) / window.innerHeight,
					     0.5);

		var fmag = cueStart.sub(cueEnd).length() * 200;
		projector.unprojectVector(cueEnd, camera);
		var raycaster = new THREE.Raycaster( camera.position, cueEnd.sub(camera.position).normalize());
		var intersects = raycaster.intersectObject(cueball, false);
	
		if(intersects.length > 0){
			var new_vel = intersects[0].point.clone().sub(cueball.position);
			new_vel.y = 0;
			new_vel.normalize().negate().multiplyScalar(fmag);
			cueball.velocity = new_vel;
		}

	}
	return false;
}

function onMouseWheel(ev) {

	ev.stopPropagation();
	ev.preventDefault();

	cameraLoc.add(cameraLoc.clone().multiplyScalar(.002 *  ev.deltaY));

}

// On window load run init

if (window.attachEvent) {
	window.attachEvent('onload', init);
} else {
	if (window.onload) {
		var curronload = window.onload;
		var newonload = function () {
			curronload();
			init();
		};
		window.onload = newonload;
	} else {
		window.onload = init;
	}
}
