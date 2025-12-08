import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 1. CONFIG DATA ---
const contentData = {
    'Haldi': { title: "✨ Haldi Ceremony ✨", text: "Date: Dec 10th\nTime: 10:00 AM", color: 0xFFFF00 },
    'Wedding': { title: "💍 The Wedding 💍", text: "Date: Dec 12th\nTime: 7:00 PM", color: 0xFF0000 },
    'Reception': { title: "🎉 Reception Party 🎉", text: "Date: Dec 13th\nTime: 8:00 PM", color: 0x0000FF }
};

// --- 2. SETUP SCENE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.FogExp2(0x87CEEB, 0.015); // Fog to blend the floor horizon

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); 
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace; 
document.body.appendChild(renderer.domElement);

// --- 3. LIGHTS ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 4. ASSET LOADERS ---
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

function loadModel(path, scale, position, rotationY, parentGroup) {
  gltfLoader.load(
      path,
      (gltf) => {
          const model = gltf.scene;
          model.scale.set(scale, scale, scale);
          model.position.copy(position);
          model.rotation.y = rotationY;
          model.castShadow = true;
          model.traverse((node) => { if (node.isMesh) node.castShadow = true; });
          parentGroup.add(model);
      },
      undefined,
      (error) => { console.error('Error loading:', path, error); }
  );
}

// --- 5. THE STAGE (FLAT & HUGE) ---

// A. The Floor 
const floorTexture = textureLoader.load('./models/floor_texture.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(12, 12);
floorTexture.colorSpace = THREE.SRGBColorSpace;

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80), // Widen floor to match backdrop
    new THREE.MeshStandardMaterial({ 
        map: floorTexture, 
        roughness: 0.8 
    })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);

// B. The Backdrop (FLAT, HUGE, MOVED UP)
const backdropTexture = textureLoader.load('./models/temple_backdrop.jpg');
backdropTexture.colorSpace = THREE.SRGBColorSpace;

// 1. Geometry: Made it 100 wide x 50 high (Huge Billboard)
const backdropGeo = new THREE.PlaneGeometry(100, 50); 
const backdropMat = new THREE.MeshBasicMaterial({ 
    map: backdropTexture, 
    side: THREE.DoubleSide 
});

const backdrop = new THREE.Mesh(backdropGeo, backdropMat);

// 2. Position: 
// x=0 (Centered)
// y=10 (Moved UP so we see more sky/temple top)
// z=-25 (Pushed BACK so it doesn't dwarf the doors)
backdrop.position.set(0, 10, -20); 

scene.add(backdrop);


// --- 6. THE DOORS ---
const doors = []; 

function createDoor(x, keyName) {
    const hinge = new THREE.Group();
    hinge.position.set(x - 1.25, 1.5, -5); 
    scene.add(hinge);

    // Placeholder Door
    const geometry = new THREE.BoxGeometry(2.5, 5, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.6 }); 
    const doorMesh = new THREE.Mesh(geometry, material);
    doorMesh.position.set(1.25, 0, 0); 
    hinge.add(doorMesh);

    doors.push({ hinge: hinge, keyName: keyName, isOpen: false });
}

createDoor(-5, 'Haldi');
createDoor(0, 'Wedding');
createDoor(5, 'Reception');

// --- 7. THE ACTORS ---
const coupleGroup = new THREE.Group();
scene.add(coupleGroup);
coupleGroup.position.set(0, 0, 4); 

// GROOM
loadModel('./models/lego_groom.glb', 0.5, new THREE.Vector3(-0.6, -1, 0), 0, coupleGroup);

// BRIDE
loadModel('./models/lego_bride.glb', 0.5, new THREE.Vector3(0.6, 0, 0), THREE.MathUtils.degToRad(150), coupleGroup);

const hitbox = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial({visible: false}));
coupleGroup.add(hitbox);

// --- 8. LOGIC ---
let targetPosition = new THREE.Vector3(0, 0, 4); 
let isMoving = false;
let currentEventKey = "";

function moveTo(x, z, keyName) {
    targetPosition.set(x, 0, z);
    isMoving = true;
    currentEventKey = keyName;
    doors.forEach(d => d.isOpen = false);
    document.getElementById('overlay').style.display = 'none';
}

document.getElementById('btn-haldi').addEventListener('click', () => moveTo(-5, -3, 'Haldi'));
document.getElementById('btn-wedding').addEventListener('click', () => moveTo(0, -3, 'Wedding'));
document.getElementById('btn-reception').addEventListener('click', () => moveTo(5, -3, 'Reception'));

function animate() {
    requestAnimationFrame(animate);
    coupleGroup.position.lerp(targetPosition, 0.05);

    if (coupleGroup.position.distanceTo(targetPosition) < 0.1 && isMoving) {
        isMoving = false; 
        const activeDoor = doors.find(d => d.keyName === currentEventKey);
        if (activeDoor) {
            activeDoor.isOpen = true;
            setTimeout(() => showContent(currentEventKey), 800);
        }
    }

    doors.forEach(door => {
        const targetRotation = door.isOpen ? -Math.PI / 2 : 0; 
        door.hinge.rotation.y += (targetRotation - door.hinge.rotation.y) * 0.05;
    });

    renderer.render(scene, camera);
}
animate();

function showContent(key) {
    const data = contentData[key];
    if(!data) return;
    document.getElementById('event-title').innerText = data.title;
    document.getElementById('event-details').innerText = data.text;
    document.getElementById('overlay').style.display = 'flex';
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});