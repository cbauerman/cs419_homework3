
var scene;
var camera;
var renderer;
var geometry;
var sceneObjects = [];

var mouse = [.5, .5];

function render() {

	animate();

	requestAnimationFrame(render);
	renderer.render(scene, camera);
}


function animate(){



}


function getJson(func, address) {

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
			}
		}
	}

	httpRequest.open('GET', address, true);
	httpRequest.send(null);

}

function loadScene(objects) {



	for (var i = 0; i < objects.length; ++i) {
		switch(objects[i].type){
			case "light":
				if (objects[i].lightType === "point") {
					var pointLight = new THREE.PointLight(objects[i].color);

					pointLight.position.x = objects[i].position.x;
					pointLight.position.y = objects[i].position.y;
					pointLight.position.z = objects[i].position.z;

					scene.add(pointLight);
				}
			break;
			case "plane":
				var geometry = new THREE.PlaneGeometry(objects[i].width, objects[i].height);
				var material;
				if(objects[i].material === "texture"){
					material = new THREE.MeshPhongMaterial({
						map : THREE.ImageUtils.loadTexture(objects[i].texture)
						});
				}
				var plane = new THREE.Mesh(geometry, material);
				plane.position.set(
					objects[i].position.x,
					objects[i].position.y,
					objects[i].position.z
				);
				
				scene.add(plane);
			
			break;
			default:
		
		
		}
	
	

	}
	
	
	//update all objects in case of 
	for(var i = 0; i < sceneObjects.length; ++i){
		sceneObjects[i].material.needsUpdate = true;
	
	}
	

}

function loadBalls(balls) {

	for (var i = 0; i < balls.length; ++i) {
		var material = new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture("textures/" + balls[i].texture)
			});
		var sphere = new THREE.Mesh(geometry, material);
		sphere.position.set(balls[i].x, balls[i].y, 0);
		sphere.rotation.y = 230;
		sceneObjects.push(sphere);
		scene.add(sphere);
	}
}

function init() {

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75,
			window.innerWidth / window.innerHeight, 0.1, 1000);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);

	geometry = new THREE.SphereGeometry(1, 32, 32);


	var pointLight = new THREE.PointLight(0xffffffff);

	pointLight.position.x = 10;
	pointLight.position.y = 30;
	pointLight.position.z = 150;

	scene.add(pointLight);

	camera.position.z = 5;
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	getJson(loadScene, "scene.js");
	getJson(loadBalls, "balls.js");

	
	window.addEventListener( 'mousemove', onMouseMove, false );
	
	render();
}


function onMouseMove(ev) {
	mouse[0] = ev.clientX / window.innerWidth;
	mouse[1] = ev.clientY / window.innerHeight;
}



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
