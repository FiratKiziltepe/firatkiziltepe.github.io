// Main game controller

class SpaceExplorerGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.physics = null;
        this.generator = null;
        this.ship = null;
        this.planetarySystem = null;
        this.stationSystem = null;
        this.alienSystem = null;
        this.wormholeSystem = null;
        this.resourceSystem = null;
        this.combatSystem = null;
        this.missionSystem = null;
        this.ui = null;

        this.controls = {
            keys: {}
        };

        this.isLoading = true;
        this.loadingProgress = 0;
    }

    async init() {
        this.updateLoading('Initializing quantum drive', 10);

        // Setup Three.js scene
        this.setupScene();

        this.updateLoading('Creating universe', 20);

        // Initialize systems
        this.physics = new PhysicsEngine();
        this.generator = new ProceduralGenerator(this.scene);
        this.planetarySystem = new PlanetarySystem(this.scene);
        this.stationSystem = new StationSystem(this.scene);
        this.alienSystem = new AlienSystem(this.scene, this.physics);
        this.wormholeSystem = new WormholeSystem(this.scene);
        this.resourceSystem = new ResourceSystem(this.scene);
        this.combatSystem = new CombatSystem(this.scene);
        this.missionSystem = new MissionSystem();
        this.ui = new UISystem(this);

        this.updateLoading('Generating star systems', 40);

        // Generate universe
        await this.generateUniverse();

        this.updateLoading('Initializing spacecraft', 60);

        // Create player ship
        this.ship = new Spacecraft(this.scene, this.physics);

        this.updateLoading('Loading missions', 70);

        // Setup missions
        const storyMissions = this.missionSystem.generateStoryMissions();
        this.missionSystem.missions = storyMissions;

        this.updateLoading('Setting up controls', 80);

        // Setup controls
        this.setupControls();

        this.updateLoading('Finalizing systems', 90);

        // Setup camera to follow ship
        this.setupCamera();

        this.updateLoading('Ready for launch', 100);

        // Start game loop
        setTimeout(() => {
            this.isLoading = false;
            document.getElementById('loading-screen').classList.add('hidden');
            this.animate();
        }, 500);
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.00005);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100000
        );
        this.camera.position.set(0, 10, -30);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        directionalLight.position.set(5000, 1000, 5000);
        this.scene.add(directionalLight);

        // Window resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    async generateUniverse() {
        // Generate starfield background
        this.generator.generateStarfield(20000);

        // Generate nebulae
        for (let i = 0; i < 5; i++) {
            const position = new THREE.Vector3(
                Utils.random(-20000, 20000),
                Utils.random(-5000, 5000),
                Utils.random(-20000, 20000)
            );
            const color = Utils.randomColor();
            this.generator.generateNebula(position, color, 3);
        }

        // Generate star systems (3x3 grid)
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const seed = Utils.hashString(`system_${x}_${z}`);
                const system = this.generator.generateStarSystem(x, z, seed);

                // Create station meshes
                system.stations.forEach(station => {
                    this.stationSystem.createStationMesh(station);
                    this.stationSystem.stations.push(station);
                });

                // Spawn aliens
                this.spawnAliensInSystem(system);

                // Generate surface details for planets
                system.planets.forEach(planet => {
                    this.planetarySystem.generateDetailedTerrain(planet, seed);
                    this.planetarySystem.createAtmosphereEffect(planet);
                });

                this.generator.starSystems.push(system);
            }
        }

        // Link wormholes
        this.wormholeSystem.wormholes = this.wormholeSystem.generateNetwork(this.generator.starSystems);

        // Generate resource fields in asteroid belts
        this.generator.starSystems.forEach(system => {
            if (system.asteroids.length > 0) {
                const center = system.asteroids[0].mesh.position.clone();
                this.resourceSystem.generateResourceField(
                    center,
                    500,
                    20,
                    ['iron', 'copper', 'minerals', 'crystals']
                );
            }
        });
    }

    spawnAliensInSystem(system) {
        // Spawn 2-5 aliens per system
        const count = Utils.randomInt(2, 5);
        const speciesTypes = ['trader', 'explorer', 'pirate', 'guardian', 'mysterious'];

        for (let i = 0; i < count; i++) {
            const seed = Utils.hashString(`alien_${system.id}_${i}`);
            const rng = (offset) => Utils.seededRandom(seed + offset);

            // Random position in system
            const radius = rng(1) * 3000 + 1000;
            const angle = rng(2) * Math.PI * 2;
            const position = new THREE.Vector3(
                system.position.x + Math.cos(angle) * radius,
                system.position.y + (rng(3) * 500 - 250),
                system.position.z + Math.sin(angle) * radius
            );

            // Choose species
            let species = speciesTypes[Math.floor(rng(4) * speciesTypes.length)];

            // More pirates near asteroid fields
            if (system.asteroids.length > 0 && rng(5) > 0.6) {
                species = 'pirate';
            }

            this.alienSystem.spawnAlien(position, species, seed);
        }
    }

    setupCamera() {
        // Third-person camera following ship
        this.cameraOffset = new THREE.Vector3(0, 8, -25);
        this.cameraLookOffset = new THREE.Vector3(0, 0, 10);
    }

    updateCamera() {
        if (!this.ship) return;

        // Calculate camera position relative to ship
        const offset = this.cameraOffset.clone();
        offset.applyQuaternion(this.ship.mesh.quaternion);

        const targetPosition = this.ship.mesh.position.clone().add(offset);

        // Smooth camera movement
        this.camera.position.lerp(targetPosition, 0.1);

        // Look ahead of ship
        const lookOffset = this.cameraLookOffset.clone();
        lookOffset.applyQuaternion(this.ship.mesh.quaternion);
        const lookTarget = this.ship.mesh.position.clone().add(lookOffset);

        this.camera.lookAt(lookTarget);
    }

    setupControls() {
        // Menu controls
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'i':
                    this.ui.openInventory();
                    break;
                case 'm':
                    this.ui.openMissions();
                    break;
                case 'u':
                    this.ui.openUpgrades();
                    break;
                case 't':
                    this.targetLock();
                    break;
                case 'escape':
                    this.closeAllMenus();
                    break;
            }
        });
    }

    closeAllMenus() {
        this.ui.closeInventory();
        this.ui.closeMissions();
        this.ui.closeUpgrades();
        this.ui.closeStation();
        this.ui.closeInteraction();
    }

    targetLock() {
        const target = this.combatSystem.lockTarget(this.ship, this.alienSystem.aliens);

        if (target) {
            this.ship.target = target;
            this.ui.showMessage(`Target locked: ${target.speciesData.name}`, 'info');
        } else {
            this.ship.target = null;
            this.ui.showMessage('No target in range', 'warning');
        }
    }

    update(deltaTime) {
        // Update physics
        this.physics.update(deltaTime);

        // Update ship
        this.ship.update(deltaTime);

        // Update camera
        this.updateCamera();

        // Update procedural systems
        this.generator.updateOrbits(deltaTime);

        // Update stations
        this.stationSystem.stations.forEach(station => {
            this.stationSystem.updateStation(station, deltaTime);
        });

        // Update aliens
        this.alienSystem.updateAll(deltaTime, this.ship);

        // Update wormholes
        this.wormholeSystem.updateAll(deltaTime);

        // Update resources
        this.resourceSystem.updateResources();

        // Update mining
        if (this.ship.mining.active) {
            if (this.ship.controls.mining) {
                // Find nearest resource
                let target = this.ship.mining.target;

                if (!target || target.amount <= 0) {
                    target = this.resourceSystem.findNearestResource(
                        this.ship.getPosition(),
                        this.ship.mining.range
                    );
                    this.ship.mining.target = target;
                }

                if (target) {
                    this.resourceSystem.startMining(this.ship, target);
                    const result = this.resourceSystem.mineResource(this.ship, target, deltaTime);

                    if (result.depleted) {
                        this.ui.showMessage(result.message, 'info');
                        this.missionSystem.updateMissionProgress('mine', {
                            resource: target.type,
                            amount: result.amount || 0
                        });
                    }

                    this.resourceSystem.updateMiningBeam();
                } else {
                    this.resourceSystem.stopMining(this.ship);
                    this.ship.mining.active = false;
                }
            } else {
                this.resourceSystem.stopMining(this.ship);
                this.ship.mining.active = false;
            }
        }

        // Update combat
        this.combatSystem.checkProjectileCollisions(this.ship, this.alienSystem.aliens);
        this.combatSystem.updateExplosions(deltaTime);

        // Update planetary atmospheres
        this.planetarySystem.updateAtmosphereEffects(this.camera, this.getAllPlanets());

        // Apply atmospheric drag if near planet
        const nearestPlanet = this.ui.getClosestPlanet();
        if (nearestPlanet) {
            const distance = Utils.distance(this.ship.mesh, nearestPlanet.mesh);
            if (distance < nearestPlanet.size * 3) {
                this.planetarySystem.applyAtmosphericDrag(this.ship, nearestPlanet);
            }
        }

        // Check for station docking
        this.checkStationInteraction();

        // Check for wormhole entry
        this.checkWormholeInteraction();

        // Check for alien interaction
        this.checkAlienInteraction();

        // Update UI
        this.ui.updateHUD();
    }

    getAllPlanets() {
        const planets = [];
        this.generator.starSystems.forEach(system => {
            planets.push(...system.planets);
        });
        return planets;
    }

    checkStationInteraction() {
        this.stationSystem.stations.forEach(station => {
            if (this.stationSystem.canDock(station, this.ship.getPosition())) {
                // Show docking prompt (only once)
                if (!this.dockingPromptShown) {
                    this.dockingPromptShown = station.name;
                    this.ui.showMessage(`Press [ENTER] to dock with ${station.name}`, 'info', 5000);

                    const dockHandler = (e) => {
                        if (e.key === 'Enter' && this.dockingPromptShown) {
                            this.ui.openStation(station);
                            window.removeEventListener('keydown', dockHandler);
                            this.dockingPromptShown = null;
                        }
                    };

                    window.addEventListener('keydown', dockHandler);

                    setTimeout(() => {
                        window.removeEventListener('keydown', dockHandler);
                        this.dockingPromptShown = null;
                    }, 5000);
                }
            }
        });
    }

    checkWormholeInteraction() {
        this.wormholeSystem.wormholes.forEach(wormhole => {
            if (this.wormholeSystem.canEnter(wormhole, this.ship.getPosition())) {
                if (!this.wormholePromptShown) {
                    this.wormholePromptShown = true;
                    this.ui.showMessage('Press [ENTER] to enter wormhole', 'info', 3000);

                    const wormholeHandler = (e) => {
                        if (e.key === 'Enter') {
                            this.wormholeSystem.travel(wormhole, this.ship, this.camera);
                            this.ui.showMessage('Wormhole traversed!', 'info');
                            window.removeEventListener('keydown', wormholeHandler);
                            this.wormholePromptShown = false;
                        }
                    };

                    window.addEventListener('keydown', wormholeHandler);

                    setTimeout(() => {
                        window.removeEventListener('keydown', wormholeHandler);
                        this.wormholePromptShown = false;
                    }, 3000);
                }
            }
        });
    }

    checkAlienInteraction() {
        this.alienSystem.aliens.forEach(alien => {
            if (alien.state === 'trade' && !alien.hasInteracted) {
                const distance = Utils.distance(this.ship.mesh, alien.mesh);

                if (distance < 100 && !this.alienInteractionShown) {
                    this.alienInteractionShown = true;

                    const interaction = this.alienSystem.interact(alien, this.ship);

                    const options = [
                        {
                            text: 'Greetings',
                            action: () => {
                                this.ui.showMessage(interaction.dialogue, 'info');
                            }
                        }
                    ];

                    if (interaction.canTrade && interaction.inventory.length > 0) {
                        options.push({
                            text: 'Trade',
                            action: () => {
                                this.ui.showMessage('Trading system coming soon!', 'info');
                            }
                        });
                    }

                    options.push({
                        text: 'Leave',
                        action: () => {}
                    });

                    this.ui.showInteraction(interaction.species, interaction.dialogue, options);

                    setTimeout(() => {
                        this.alienInteractionShown = false;
                    }, 1000);
                }
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta() * 1000; // Convert to milliseconds

        if (!this.isLoading) {
            this.update(deltaTime);
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateLoading(text, progress) {
        this.loadingProgress = progress;
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-progress').style.width = progress + '%';
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new SpaceExplorerGame();
    game.init();
});
