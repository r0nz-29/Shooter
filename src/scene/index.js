import * as THREE from "three";
import * as CANNON from "cannon-es";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import Stats from "three/examples/jsm/libs/stats.module";
// import floor from "../images/woodenFloor.jpg";
// import crate from "../images/crate.jpg";
// import football from "../images/moon.jpg";

// const woodTex = new THREE.TextureLoader().load(floor);
// const boxTex = new THREE.TextureLoader().load(crate);
// const ballTex = new THREE.TextureLoader().load(football);
// ballTex.wrapS = THREE.RepeatWrapping;
// ballTex.wrapT = THREE.RepeatWrapping;

let scene,
  // origin = new THREE.Vector3(0, 0, 0),
  camera,
  renderer,
  controls,
  alight,
  dlight,
  clock,
  objects = [],
  moveForward = false,
  moveRight = false,
  moveBack = false,
  moveLeft = false,
  movementVelocity = 0.5,
  stats;
let groundMaterial = new CANNON.Material("ground");

export const makeScene = (blocker, instructions) => {
  init(blocker, instructions);

  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
  });

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      // map: woodTex,
    })
  );
  ground.rotation.x = Math.PI / 2;
  ground.receiveShadow = true;
  ground.physicsObj = new CANNON.Body({
    mass: 0,
    material: groundMaterial,
    shape: new CANNON.Plane(),
  });
  ground.physicsObj.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(ground.physicsObj);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      for (let k = 0; k < 2; k++) {
        let box = createBox(2, 2, 2, -8 + i * 2, 1 + j * 2, k * 2, 5);
        // box.name = `box-${i}${j}${k}`;
        objects.push(box);
      }
    }
  }

  const ground_ground = new CANNON.ContactMaterial(
    groundMaterial,
    groundMaterial,
    {
      friction: 0.6,
      restitution: 0.3,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
      frictionEquationStiffness: 1e8,
      frictionEquationRegularizationTime: 3,
    }
  );
  world.addContactMaterial(ground_ground);

  scene.add(dlight, ground);
  objects.forEach((mesh) => {
    world.addBody(mesh.physicsObj);
    scene.add(mesh);
  });

  const timeStep = 1 / 60; // seconds
  let lastCallTime;

  const animate = function () {
    requestAnimationFrame(animate);
    if (moveForward) {
      controls.moveForward(movementVelocity);
    } else if (moveBack) {
      controls.moveForward(-movementVelocity);
    } else if (moveRight) {
      controls.moveRight(-movementVelocity);
    } else if (moveLeft) {
      controls.moveRight(movementVelocity);
    }
    // world.step(timeStep);
    const time = performance.now() / 1000; // seconds
    if (!lastCallTime) {
      world.step(timeStep);
    } else {
      const dt = time - lastCallTime;
      world.step(timeStep, dt);
    }
    lastCallTime = time;
    update(objects);
    stats.update();
    renderer.render(scene, camera);
  };

  window.addEventListener("click", (e) => {
    let shootDirection = getShootDirection();
    let ball = createBall(
      1,
      camera.position.x,
      camera.position.y,
      camera.position.z + 5,
      5
    );
    ball.physicsObj.velocity = new CANNON.Vec3(
      shootDirection.x * 70,
      shootDirection.y * 70,
      shootDirection.z * 70
    );
    ball.name = "ball";
    world.addBody(ball.physicsObj);
    scene.add(ball);
    objects.push(ball);
  });

  window.addEventListener("keydown", (e) => {
    switch (e.code) {
      case "KeyW":
        moveForward = true;
        break;
      case "KeyA":
        moveRight = true;
        break;
      case "KeyS":
        moveBack = true;
        break;
      case "KeyD":
        moveLeft = true;
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.code) {
      case "KeyW":
        moveForward = false;
        break;
      case "KeyA":
        moveRight = false;
        break;
      case "KeyS":
        moveBack = false;
        break;
      case "KeyD":
        moveLeft = false;
        break;
    }
  });

  function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 20);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);
    controls = new PointerLockControls(camera, renderer.domElement);
    stats = new Stats();
    document.body.appendChild(stats.dom);
    dlight = new THREE.SpotLight("white");
    dlight.position.set(0, 50, 30);
    dlight.castShadow = true;
    // alight = new THREE.AmbientLight("grey");
    clock = new THREE.Clock();
    instructions.addEventListener("click", (e) => {
      controls.lock();
    });
    controls.addEventListener("lock", function () {
      instructions.style.display = "none";
      blocker.style.display = "none";
    });
    controls.addEventListener("unlock", function () {
      blocker.style.display = "block";
      instructions.style.display = "";
    });
  }

  function createBox(length, width, height, x, y, z, mass) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(length, width, height),
      new THREE.MeshPhongMaterial()
    );
    box.position.set(x, y, z);
    box.castShadow = true;
    box.physicsObj = new CANNON.Body({
      mass: mass,
      material: groundMaterial,
      shape: new CANNON.Box(new CANNON.Vec3(length / 2, width / 2, height / 2)),
    });
    box.physicsObj.position.set(box.position.x, box.position.y, box.position.z);
    return box;
  }

  function createBall(rad, x, y, z, mass) {
    const ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(rad, 10),
      new THREE.MeshPhongMaterial()
    );
    ball.position.set(x, y, z);
    ball.castShadow = true;
    ball.physicsObj = new CANNON.Body({
      mass: mass,
      material: groundMaterial,
      shape: new CANNON.Sphere(rad),
    });
    ball.physicsObj.position.set(
      ball.position.x,
      ball.position.y,
      ball.position.z
    );
    return ball;
  }

  // Returns a vector pointing the the diretion the camera is at
  function getShootDirection() {
    const vector = new THREE.Vector3(0, 0, 1);
    vector.unproject(camera);
    const ray = new THREE.Ray(
      camera.position,
      vector.sub(camera.position).normalize()
    );
    return ray.direction;
  }

  function update(meshes) {
    meshes.forEach((mesh) => {
      if (
        mesh.position.x > 50 ||
        mesh.position.x < -50 ||
        mesh.position.z > 50 ||
        mesh.position.z < -50
      ) {
        mesh.geometry.dispose();
        mesh.material.dispose();
        scene.remove(mesh);
      }
      mesh.position.copy(mesh.physicsObj.position);
      mesh.quaternion.copy(mesh.physicsObj.quaternion);
    });
  }

  animate();
};
