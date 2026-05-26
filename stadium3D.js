// Aki-Cricket 3D Stadium & Batsman Renderer
// Powered by Three.js

class Stadium3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Meshes & Groups
    this.batsmanGroup = null;
    this.torso = null;
    this.head = null;
    this.leftArmPivot = null;
    this.rightArmPivot = null;
    this.batGroup = null;
    this.leftLeg = null;
    this.rightLeg = null;

    this.pitch = null;
    this.stumpsGroup = null;
    this.stadiumRing = null;
    this.neonRing1 = null;
    this.neonRing2 = null;

    // Lights
    this.ambientLight = null;
    this.spotLights = [];
    this.pointLight = null;

    // Ball Simulation
    this.cricketBall = null;
    this.ballVelocity = null;
    this.isBallActive = false;

    // Particle Systems
    this.dustParticles = null;
    this.fireworks = [];

    // Colors
    this.primaryColor = new THREE.Color("#00f5ff");
    this.secondaryColor = new THREE.Color("#ffffff");
    this.targetPrimaryColor = new THREE.Color("#00f5ff");
    this.targetSecondaryColor = new THREE.Color("#ffffff");

    // Animation States
    this.activeTrigger = "IDLE_TAP_BAT";
    this.animationTime = 0;
    this.swingPhase = 0; // For massive six celebration

    this.init();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#08090d");
    this.scene.fog = new THREE.FogExp2("#08090d", 0.08);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(2.4, 2.0, 3.2); // Slanted side-on viewing angle
    this.camera.lookAt(0, 0.9, -0.6);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting
    this.ambientLight = new THREE.AmbientLight("#0a0d1a", 0.6);
    this.scene.add(this.ambientLight);

    // Dynamic Stadium Floodlights
    const lightPositions = [
      [-4, 5, 2],
      [4, 5, 2],
      [-3, 5, -4],
      [3, 5, -4]
    ];

    lightPositions.forEach(([x, y, z], idx) => {
      const spot = new THREE.SpotLight("#ffffff", 1.8, 18, Math.PI / 4, 0.4, 1.2);
      spot.position.set(x, y, z);
      spot.castShadow = true;
      spot.shadow.mapSize.width = 512;
      spot.shadow.mapSize.height = 512;
      this.scene.add(spot);
      this.spotLights.push(spot);
    });

    this.pointLight = new THREE.PointLight("#00f5ff", 1.2, 8);
    this.pointLight.position.set(0, 1.5, -1);
    this.scene.add(this.pointLight);

    // 4. Environment & Pitch
    this.createEnvironment();

    // 5. Batsman Model
    this.createBatsman();

    // 6. Particle Systems
    this.createDustParticles();

    // Handle Resize
    window.addEventListener("resize", () => this.onResize());

    // Start Render Loop
    this.animate();
  }

  createEnvironment() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: "#0c0d14",
      roughness: 0.95,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Pitch Slab
    const pitchGeo = new THREE.BoxGeometry(1.6, 0.04, 12);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: "#181a24",
      roughness: 0.9,
      metalness: 0.15
    });
    this.pitch = new THREE.Mesh(pitchGeo, pitchMat);
    this.pitch.position.set(0, 0.02, 0);
    this.pitch.receiveShadow = true;
    this.scene.add(this.pitch);

    // Stumps (Wickets)
    this.stumpsGroup = new THREE.Group();
    this.stumpsGroup.position.set(0, 0.04, -2.4); // At batting end crease
    
    const stumpMat = new THREE.MeshStandardMaterial({
      color: "#08090d",
      roughness: 0.1,
      metalness: 0.8,
      emissive: this.primaryColor,
      emissiveIntensity: 0.8
    });

    // 3 stumps
    const stumpGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.72, 8);
    for (let i = -1; i <= 1; i++) {
      const stump = new THREE.Mesh(stumpGeo, stumpMat);
      stump.position.set(i * 0.07, 0.36, 0);
      stump.castShadow = true;
      this.stumpsGroup.add(stump);
    }

    // Bail
    const bailGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6);
    const bail = new THREE.Mesh(bailGeo, stumpMat);
    bail.position.set(0, 0.73, 0);
    this.stumpsGroup.add(bail);
    this.scene.add(this.stumpsGroup);

    // Cyber Stadium Neon Rings (Stands)
    this.stadiumRing = new THREE.Group();
    
    const neonGeo1 = new THREE.TorusGeometry(12, 0.06, 8, 48);
    const neonMat1 = new THREE.MeshBasicMaterial({ color: this.primaryColor });
    this.neonRing1 = new THREE.Mesh(neonGeo1, neonMat1);
    this.neonRing1.rotation.x = Math.PI / 2;
    this.neonRing1.position.y = 0.1;
    this.stadiumRing.add(this.neonRing1);

    const neonGeo2 = new THREE.TorusGeometry(13.5, 0.08, 8, 48);
    const neonMat2 = new THREE.MeshBasicMaterial({ color: this.secondaryColor });
    this.neonRing2 = new THREE.Mesh(neonGeo2, neonMat2);
    this.neonRing2.rotation.x = Math.PI / 2;
    this.neonRing2.position.y = 2.4;
    this.stadiumRing.add(this.neonRing2);

    this.scene.add(this.stadiumRing);
  }

  createBatsman() {
    this.batsmanGroup = new THREE.Group();
    this.batsmanGroup.position.set(0, 0.72, -1.2); // Positioned at crease
    this.batsmanGroup.rotation.y = -Math.PI / 4; // Slanted batting stance

    // Shared Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: "#f0b489", roughness: 0.6 });
    const kitMat = new THREE.MeshStandardMaterial({ color: "#141724", roughness: 0.5, metalness: 0.2 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: "#22253b", roughness: 0.3 });
    const padMat = new THREE.MeshStandardMaterial({ color: "#e1e4f0", roughness: 0.6 });
    
    const batMat = new THREE.MeshStandardMaterial({ color: "#d2a679", roughness: 0.8 });
    const handleMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5 });

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.6, 8);
    this.torso = new THREE.Mesh(torsoGeo, kitMat);
    this.torso.castShadow = true;
    this.batsmanGroup.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.42;
    this.head.castShadow = true;
    this.batsmanGroup.add(this.head);

    // Helmet (Cylinder cap)
    const helmetGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.08, 8);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.11;
    this.head.add(helmet);

    // Helmet Visor (goggles style)
    const visorGeo = new THREE.BoxGeometry(0.16, 0.04, 0.06);
    const visorMat = new THREE.MeshBasicMaterial({ color: "#000000" });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, 0.1);
    this.head.add(visor);

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.22, 0.22, 0);
    const leftArmGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.5, 6);
    const leftArm = new THREE.Mesh(leftArmGeo, kitMat);
    leftArm.position.y = -0.2;
    leftArm.castShadow = true;
    this.leftArmPivot.add(leftArm);
    this.batsmanGroup.add(this.leftArmPivot);

    // Right Arm Pivot
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.22, 0.22, 0);
    const rightArmGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.5, 6);
    const rightArm = new THREE.Mesh(rightArmGeo, kitMat);
    rightArm.position.y = -0.2;
    rightArm.castShadow = true;
    this.rightArmPivot.add(rightArm);
    this.batsmanGroup.add(this.rightArmPivot);

    // Bat Group (attached to Right Arm hand)
    this.batGroup = new THREE.Group();
    this.batGroup.position.set(0, -0.42, 0);

    const handleGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.3, 6);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 0.15;
    this.batGroup.add(handle);

    const bladeGeo = new THREE.BoxGeometry(0.09, 0.65, 0.035);
    const blade = new THREE.Mesh(bladeGeo, batMat);
    blade.position.y = -0.25;
    blade.castShadow = true;
    this.batGroup.add(blade);

    this.rightArmPivot.add(this.batGroup);

    // Left Leg / Pad
    const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.7, 6);
    this.leftLeg = new THREE.Mesh(legGeo, padMat);
    this.leftLeg.position.set(-0.1, -0.58, 0.02);
    this.leftLeg.castShadow = true;
    this.batsmanGroup.add(this.leftLeg);

    // Right Leg / Pad
    this.rightLeg = new THREE.Mesh(legGeo, padMat);
    this.rightLeg.position.set(0.1, -0.58, -0.02);
    this.rightLeg.castShadow = true;
    this.batsmanGroup.add(this.rightLeg);

    this.scene.add(this.batsmanGroup);
  }

  createDustParticles() {
    const pCount = 50;
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < pCount; i++) {
      // Near batsman's feet
      positions.push(
        Math.random() * 0.8 - 0.4,
        0.05 + Math.random() * 0.2,
        -1.2 + Math.random() * 0.8 - 0.4
      );
      velocities.push(
        (Math.random() - 0.5) * 0.02,
        Math.random() * 0.02 + 0.01,
        (Math.random() - 0.5) * 0.02
      );
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    
    const mat = new THREE.PointsMaterial({
      color: "#8e9bb0",
      size: 0.06,
      transparent: true,
      opacity: 0.0
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.dustParticles.userData = { velocities };
    this.scene.add(this.dustParticles);
  }

  // Spawn dynamic 3D ball hit simulation
  hitBall() {
    if (this.isBallActive && this.cricketBall) {
      this.scene.remove(this.cricketBall);
    }

    const ballGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const ballMat = new THREE.MeshStandardMaterial({
      color: "#ff1744",
      emissive: "#ff1744",
      emissiveIntensity: 0.6
    });

    this.cricketBall = new THREE.Mesh(ballGeo, ballMat);
    
    // Spawn at batsman hand/bat contact point
    this.cricketBall.position.set(0.3, 0.6, -1.0);
    this.scene.add(this.cricketBall);

    // Velocity vectors: launching high and towards camera/stands
    this.ballVelocity = new THREE.Vector3(
      (Math.random() - 0.3) * 0.1,
      0.18 + Math.random() * 0.06,
      0.18 + Math.random() * 0.06
    );

    this.isBallActive = true;
  }

  // Spawn firework bursts in stands
  spawnFirework() {
    const x = Math.random() * 16 - 8;
    const y = 3 + Math.random() * 3;
    const z = -6 - Math.random() * 4;
    const color = new THREE.Color().setHSL(Math.random(), 0.9, 0.6);

    const pCount = 60;
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < pCount; i++) {
      positions.push(x, y, z);
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 0.05 + Math.random() * 0.07;
      
      velocities.push(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );
    }

    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    
    const mat = new THREE.PointsMaterial({
      color: color,
      size: 0.1,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const firework = new THREE.Points(geom, mat);
    firework.userData = { velocities, age: 0, maxAge: 50 + Math.random() * 30 };
    this.scene.add(firework);
    this.fireworks.push(firework);
  }

  // Apply new state updates
  updateState(uiState) {
    if (!uiState) return;

    this.activeTrigger = uiState.batsmanAnimationTrigger || uiState.batsmanAnimation || "IDLE_TAP_BAT";
    
    const theme = uiState.stadiumTheme || uiState.stadiumColorPalette;
    if (theme) {
      if (theme.primaryNeon) this.targetPrimaryColor.set(theme.primaryNeon);
      if (theme.secondaryGlow) this.targetSecondaryColor.set(theme.secondaryGlow);
    }

    // Set particle visibility
    if (this.dustParticles) {
      this.dustParticles.material.opacity = (uiState.particleEffect === "DUST_KICKUP") ? 0.6 : 0.0;
    }
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  // Animation and Lerping Loops
  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;
    this.animationTime = time;

    // 1. Color Lerping for Stadium lights and neon bands
    this.primaryColor.lerp(this.targetPrimaryColor, 0.05);
    this.secondaryColor.lerp(this.targetSecondaryColor, 0.05);

    // Update emitters and lighting colors
    if (this.pointLight) this.pointLight.color.copy(this.primaryColor);
    if (this.neonRing1) this.neonRing1.material.color.copy(this.primaryColor);
    if (this.neonRing2) this.neonRing2.material.color.copy(this.secondaryColor);

    // Update stumps glow
    if (this.stumpsGroup) {
      this.stumpsGroup.children.forEach(s => {
        if (s.material) {
          s.material.emissive.copy(this.primaryColor);
          s.material.emissiveIntensity = 0.5 + Math.sin(time * 5) * 0.3;
        }
      });
    }

    // Rotate Stadium stands slowly
    if (this.stadiumRing) {
      this.stadiumRing.rotation.y = time * 0.03;
    }

    // 2. Procedural Batsman Joint Rotations
    this.updateBatsmanPose(time);

    // 3. Ball Physics update
    this.updateBallPhysics();

    // 4. Update Emitter Particle Systems
    this.updateParticles();

    // Render Scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  updateBatsmanPose(time) {
    if (!this.batsmanGroup) return;

    // Default target pivots
    let torsoY = 0.72;
    let torsoX = 0;
    let torsoZ = -1.2;
    let torsoRotY = -Math.PI / 4;
    let torsoRotZ = 0;
    let torsoRotX = 0;

    let headX = 0.42;
    let headRotX = 0;
    let headRotY = 0;

    let lArmRotX = -0.8;
    let lArmRotZ = 0.3;
    let rArmRotX = -1.1;
    let rArmRotZ = -0.3;

    let batRotX = 0.3;
    let batRotY = 0;
    let batRotZ = 0;

    // Apply values based on state trigger
    switch (this.activeTrigger) {
      case "CONFIDENT_BAT_RAISE":
        torsoY = 0.76;
        torsoRotY = -Math.PI / 4;
        rArmRotX = -3.0;
        rArmRotZ = 0.1;
        lArmRotX = -0.5;
        lArmRotZ = 0.25;
        batRotX = -0.2;
        headRotX = 0;
        break;

      case "CELEBRATORY_PUNCH_AIR":
        torsoY = 0.74 + Math.abs(Math.sin(time * 6)) * 0.12;
        torsoRotY = -Math.PI / 5;
        rArmRotX = -2.5 + Math.sin(time * 12) * 0.4;
        rArmRotZ = 0.3;
        lArmRotX = -0.4;
        lArmRotZ = 0.2;
        batRotX = 0.6;
        if (Math.random() < 0.03) {
          this.spawnFirework();
        }
        break;

      case "IDLE_TAP_BAT":
        torsoY = 0.72 + Math.cos(time * 4) * 0.015;
        rArmRotX = -1.2 + Math.cos(time * 4.5) * 0.15;
        lArmRotX = -0.9 + Math.cos(time * 4.5) * 0.1;
        batRotX = 0.4 + Math.sin(time * 4.5) * 0.15;
        break;

      case "BACKFOOT_DEFENSE":
        torsoZ = -1.5; // stepped back
        torsoY = 0.70;
        lArmRotX = -0.5;
        rArmRotX = -0.55;
        lArmRotZ = 0.15;
        rArmRotZ = -0.15;
        batRotX = 0.45;
        break;

      case "SHUFFLE_CREASE":
        torsoX = Math.sin(time * 7) * 0.25;
        torsoRotY = -Math.PI / 4 + Math.sin(time * 7) * 0.08;
        rArmRotX = -1.1 + Math.sin(time * 7) * 0.1;
        batRotZ = Math.cos(time * 7) * 0.15;
        break;

      case "NERVOUS_SWEAT":
        torsoX = Math.sin(time * 45) * 0.008; // jitter
        rArmRotX = -2.25 + Math.sin(time * 12) * 0.08; // wiping visor
        rArmRotZ = -0.4;
        lArmRotX = -0.5;
        batRotX = 0.1;
        break;

      case "LOOKING_AT_SKY":
        headRotX = -0.5; // looking up
        torsoY = 0.75; // standing tall
        rArmRotX = -0.7;
        lArmRotX = -0.7;
        batRotX = -0.1;
        break;

      case "MASSIVE_SIX_CELEBRATION":
        // 4-second animation sequence loop
        const cycle = (time * 1.6) % (Math.PI * 2);
        
        if (cycle < 1.4) {
          // 1. Backswing
          torsoZ = -1.4;
          torsoRotY = -Math.PI / 3;
          rArmRotX = -2.2;
          lArmRotX = -1.8;
          batRotX = -0.8;
        } else if (cycle < 2.2) {
          // 2. Swing (launch shot)
          torsoZ = -0.9;
          torsoRotY = -Math.PI / 8;
          rArmRotX = 0.6;
          lArmRotX = 0.45;
          batRotX = 1.2;
          
          // Trigger physics ball launch at start of swing
          if (cycle < 1.55 && !this.isBallActive) {
            this.hitBall();
          }
        } else {
          // 3. Bat-Raise Celebration
          torsoZ = -1.1;
          torsoRotY = -Math.PI / 4;
          rArmRotX = -3.0; // Hand straight up holding bat
          rArmRotZ = 0.1;
          lArmRotX = -0.3; // left arm hanging casual
          lArmRotZ = 0.2;
          batRotX = -0.2; // Bat vertical
          headRotX = -0.2;

          // Auto-reset ball trigger
          if (this.isBallActive && cycle > 2.8) {
            this.isBallActive = false;
            if (this.cricketBall) this.scene.remove(this.cricketBall);
          }

          // Launch fireworks randomly in this stage
          if (Math.random() < 0.05) {
            this.spawnFirework();
          }
        }
        break;
    }

    // Smoothly Lerp current pivots to targets
    this.batsmanGroup.position.x = THREE.MathUtils.lerp(this.batsmanGroup.position.x, torsoX, 0.1);
    this.batsmanGroup.position.y = THREE.MathUtils.lerp(this.batsmanGroup.position.y, torsoY, 0.1);
    this.batsmanGroup.position.z = THREE.MathUtils.lerp(this.batsmanGroup.position.z, torsoZ, 0.1);
    this.batsmanGroup.rotation.y = THREE.MathUtils.lerp(this.batsmanGroup.rotation.y, torsoRotY, 0.1);

    this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, headRotX, 0.1);
    this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, lArmRotX, 0.1);
    this.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.leftArmPivot.rotation.z, lArmRotZ, 0.1);
    this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, rArmRotX, 0.1);
    this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, rArmRotZ, 0.1);

    this.batGroup.rotation.x = THREE.MathUtils.lerp(this.batGroup.rotation.x, batRotX, 0.15);
    this.batGroup.rotation.z = THREE.MathUtils.lerp(this.batGroup.rotation.z, batRotZ, 0.15);
  }

  updateBallPhysics() {
    if (!this.isBallActive || !this.cricketBall) return;

    // Apply speed and gravity
    this.cricketBall.position.add(this.ballVelocity);
    this.ballVelocity.y -= 0.005; // gravity pull

    // Spin ball
    this.cricketBall.rotation.x += 0.2;
    this.cricketBall.rotation.y += 0.1;

    // Reset when out of boundary box
    if (this.cricketBall.position.y < 0 || this.cricketBall.position.z > 15) {
      this.isBallActive = false;
      this.scene.remove(this.cricketBall);
    }
  }

  updateParticles() {
    // 1. Dust Particles
    if (this.dustParticles && this.dustParticles.material.opacity > 0) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      const vels = this.dustParticles.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        const vIdx = i / 3;
        positions[i] += vels[vIdx * 3];
        positions[i + 1] += vels[vIdx * 3 + 1];
        positions[i + 2] += vels[vIdx * 3 + 2];

        // Reset if floating too high
        if (positions[i + 1] > 0.8) {
          positions[i] = Math.random() * 0.8 - 0.4;
          positions[i + 1] = 0.05;
          positions[i + 2] = -1.2 + Math.random() * 0.8 - 0.4;
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Fireworks Particles
    for (let fIdx = this.fireworks.length - 1; fIdx >= 0; fIdx--) {
      const f = this.fireworks[fIdx];
      const positions = f.geometry.attributes.position.array;
      const vels = f.userData.velocities;

      f.userData.age++;

      for (let i = 0; i < positions.length; i += 3) {
        const vIdx = i / 3;
        positions[i] += vels[vIdx * 3];
        positions[i + 1] += vels[vIdx * 3 + 1];
        positions[i + 2] += vels[vIdx * 3 + 2];

        // gravity
        vels[vIdx * 3 + 1] -= 0.001;
      }
      f.geometry.attributes.position.needsUpdate = true;

      // fade out opacity
      f.material.opacity = 1.0 - (f.userData.age / f.userData.maxAge);

      if (f.userData.age >= f.userData.maxAge) {
        this.scene.remove(f);
        this.fireworks.splice(fIdx, 1);
      }
    }
  }

  // Clear fireworks and ball
  cleanup() {
    this.fireworks.forEach(f => this.scene.remove(f));
    this.fireworks = [];
    
    if (this.cricketBall) {
      this.scene.remove(this.cricketBall);
      this.isBallActive = false;
    }
  }
}

// Export global variable
window.AkiStadium3D = Stadium3D;
