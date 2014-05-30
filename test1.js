
var scene;
var camera;
var renderer;
var geometry;
var sceneObjects = [];

var lastMouseVec;

var cameraLoc;

var loading = [];

function render() {

	animate();

	requestAnimationFrame(render);
	renderer.render(scene, camera);

}

function animate() {}

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
			var geometry = new THREE.PlaneGeometry(objects[i].width, objects[i].height);
			var material;
			if (objects[i].material === "texture") {
				material = new THREE.MeshPhongMaterial({
						map : THREE.ImageUtils.loadTexture(objects[i].texture)
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

	geometry = new THREE.SphereGeometry(2.25, 32, 32);

	// var pointLight = new THREE.PointLight(0xffffffff);

	// pointLight.position.x = 0;
	// pointLight.position.y = 50;
	// pointLight.position.z = 0;

	// scene.add(pointLight);

	cameraLoc = new THREE.Vector3(0, 0, 5);
	
	camera.position = cameraLoc;
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	sceneLoading = false;
	ballLoading = false;
	
	lastMouseVec = new THREE.Vector3(0, 0, 1);
	
	window.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('wheel', onMouseWheel, false);


	getJson(loadBalls, "balls.js");
	getJson(loadScene, "scene.js");

}

function onMouseMove(ev) {

	var newMouseVec = new THREE.Vector3(0, 0, 0);
	
	newMouseVec.x = (ev.clientX * 2 - window.innerWidth) / window.innerWidth;
	//newMouseVec.y = (window.innerHeight - 2 * ev.clientY) / window.innerHeight;
	newMouseVec.y = (2 * ev.clientY - window.innerHeight) / window.innerHeight;

	var length = Math.sqrt(newMouseVec.x * newMouseVec.x + newMouseVec.y * newMouseVec.y);
	length = (length < 1.0) ? length : 1.0;
	
	newMouseVec.set(newMouseVec.x, newMouseVec.y, Math.sqrt(1.001 - length * length));
	newMouseVec.normalize();
	
	var n = new THREE.Vector3(0, 0, 0);
	n.crossVectors(lastMouseVec, newMouseVec);
	
	var mag = n.length()
	
	n.normalize();
	
	
	cameraLoc.applyAxisAngle(n, -2 * mag);
	
	camera.position = cameraLoc;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	
	lastMouseVec = newMouseVec;
}

function onMouseWheel(ev) {


	cameraLoc.z += .05 * ev.deltaY;

	camera.position = cameraLoc;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	
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
