// Spacecraft controller with systems

class Spacecraft {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;

        // Ship stats
        this.stats = {
            hull: 100,
            maxHull: 100,
            shield: 100,
            maxShield: 100,
            energy: 100,
            maxEnergy: 100,
            fuel: 100,
            maxFuel: 100,
            thrustPower: 50,
            turnSpeed: 1.5,
            maxSpeed: 300,
            shieldRegenRate: 2,
            energyRegenRate: 5
        };

        // Ship equipment
        this.equipment = {
            weapons: ['laser_cannon'],
            miningLaser: true,
            cargoHold: 100,
            engines: 'basic',
            shields: 'basic',
            sensors: 'basic'
        };

        // Cargo
        this.cargo = new Map();
        this.credits = 1000;

        // Ship controls
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            rollLeft: false,
            rollRight: false,
            fire: false,
            mining: false
        };

        // Weapon system
        this.weapons = {
            cooldown: 0,
            maxCooldown: 200,
            damage: 10,
            projectiles: []
        };

        // Mining system
        this.mining = {
            active: false,
            target: null,
            range: 200,
            rate: 1
        };

        // Create ship mesh
        this.createMesh();

        // Add to physics
        this.mesh.mass = 1000;
        this.mesh.drag = 0.98;
        this.mesh.angularDrag = 0.9;
        this.physics.addObject(this.mesh);

        // Target lock
        this.target = null;

        // Setup controls
        this.setupControls();
    }

    createMesh() {
        const geometry = Utils.createShipGeometry();
        const material = new THREE.MeshStandardMaterial({
            color: 0x4A90E2,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x2A5A82,
            emissiveIntensity: 0.3
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 0);

        // Add engine glow
        const engineGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const engineMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8
        });

        this.engines = [];
        const enginePositions = [
            [-0.5, 0, -1],
            [0.5, 0, -1]
        ];

        enginePositions.forEach(pos => {
            const engine = new THREE.Mesh(engineGeometry, engineMaterial.clone());
            engine.position.set(...pos);
            this.mesh.add(engine);
            this.engines.push(engine);
        });

        // Add point light for ship
        const light = new THREE.PointLight(0x00FFFF, 0.5, 50);
        this.mesh.add(light);

        this.scene.add(this.mesh);
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.controls.forward = true; break;
                case 's': this.controls.backward = true; break;
                case 'a': this.controls.left = true; break;
                case 'd': this.controls.right = true; break;
                case 'q': this.controls.rollLeft = true; break;
                case 'e': this.controls.rollRight = true; break;
                case 'arrowup': this.controls.up = true; break;
                case 'arrowdown': this.controls.down = true; break;
                case ' ':
                    e.preventDefault();
                    this.controls.fire = true;
                    break;
                case 'f': this.controls.mining = true; break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.controls.forward = false; break;
                case 's': this.controls.backward = false; break;
                case 'a': this.controls.left = false; break;
                case 'd': this.controls.right = false; break;
                case 'q': this.controls.rollLeft = false; break;
                case 'e': this.controls.rollRight = false; break;
                case 'arrowup': this.controls.up = false; break;
                case 'arrowdown': this.controls.down = false; break;
                case ' ': this.controls.fire = false; break;
                case 'f': this.controls.mining = false; break;
            }
        });
    }

    update(deltaTime) {
        // Apply thrust
        if (this.controls.forward && this.stats.fuel > 0) {
            const thrust = new THREE.Vector3(0, 0, this.stats.thrustPower);
            thrust.applyQuaternion(this.mesh.quaternion);
            this.physics.applyForce(this.mesh, thrust);
            this.stats.fuel = Math.max(0, this.stats.fuel - 0.01);
            this.updateEngineGlow(1);
        } else if (this.controls.backward && this.stats.fuel > 0) {
            const thrust = new THREE.Vector3(0, 0, -this.stats.thrustPower * 0.5);
            thrust.applyQuaternion(this.mesh.quaternion);
            this.physics.applyForce(this.mesh, thrust);
            this.stats.fuel = Math.max(0, this.stats.fuel - 0.005);
            this.updateEngineGlow(0.5);
        } else {
            this.updateEngineGlow(0);
        }

        // Apply rotation
        const torque = new THREE.Vector3(0, 0, 0);

        if (this.controls.left) {
            torque.y = this.stats.turnSpeed * 0.001;
        }
        if (this.controls.right) {
            torque.y = -this.stats.turnSpeed * 0.001;
        }
        if (this.controls.up) {
            torque.x = this.stats.turnSpeed * 0.001;
        }
        if (this.controls.down) {
            torque.x = -this.stats.turnSpeed * 0.001;
        }
        if (this.controls.rollLeft) {
            torque.z = this.stats.turnSpeed * 0.001;
        }
        if (this.controls.rollRight) {
            torque.z = -this.stats.turnSpeed * 0.001;
        }

        if (torque.length() > 0) {
            this.physics.applyTorque(this.mesh, torque);
        }

        // Limit speed
        const currentSpeed = this.mesh.physics.velocity.length();
        if (currentSpeed > this.stats.maxSpeed) {
            this.mesh.physics.velocity.normalize().multiplyScalar(this.stats.maxSpeed);
        }

        // Regenerate shields and energy
        this.stats.shield = Math.min(
            this.stats.maxShield,
            this.stats.shield + this.stats.shieldRegenRate * deltaTime / 1000
        );
        this.stats.energy = Math.min(
            this.stats.maxEnergy,
            this.stats.energy + this.stats.energyRegenRate * deltaTime / 1000
        );

        // Update weapons
        if (this.weapons.cooldown > 0) {
            this.weapons.cooldown -= deltaTime;
        }

        if (this.controls.fire && this.weapons.cooldown <= 0) {
            this.fireWeapon();
        }

        // Update projectiles
        this.updateProjectiles(deltaTime);

        // Mining laser
        if (this.controls.mining) {
            this.updateMining();
        }
    }

    updateEngineGlow(intensity) {
        this.engines.forEach(engine => {
            engine.material.opacity = 0.3 + intensity * 0.5;
            engine.scale.setScalar(0.8 + intensity * 0.4);
        });
    }

    fireWeapon() {
        if (this.stats.energy < 10) return;

        this.stats.energy -= 10;
        this.weapons.cooldown = this.weapons.maxCooldown;

        // Create projectile
        const projectileGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,
            emissive: 0x00FF00
        });

        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(this.mesh.position);

        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(this.mesh.quaternion);

        projectile.userData = {
            velocity: direction.multiplyScalar(500),
            damage: this.weapons.damage,
            lifetime: 5000,
            createdAt: Date.now()
        };

        // Add glow
        const glowGeometry = new THREE.SphereGeometry(1, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.add(glow);

        this.scene.add(projectile);
        this.weapons.projectiles.push(projectile);
    }

    updateProjectiles(deltaTime) {
        const now = Date.now();

        this.weapons.projectiles = this.weapons.projectiles.filter(projectile => {
            // Update position
            const movement = projectile.userData.velocity.clone().multiplyScalar(deltaTime / 1000);
            projectile.position.add(movement);

            // Check lifetime
            if (now - projectile.userData.createdAt > projectile.userData.lifetime) {
                this.scene.remove(projectile);
                return false;
            }

            return true;
        });
    }

    updateMining() {
        // Mining will be handled by the resources module
        this.mining.active = true;
    }

    takeDamage(amount) {
        if (this.stats.shield > 0) {
            this.stats.shield = Math.max(0, this.stats.shield - amount);
        } else {
            this.stats.hull = Math.max(0, this.stats.hull - amount);
        }
    }

    repair(amount) {
        this.stats.hull = Math.min(this.stats.maxHull, this.stats.hull + amount);
    }

    refuel(amount) {
        this.stats.fuel = Math.min(this.stats.maxFuel, this.stats.fuel + amount);
    }

    addCargo(resourceType, amount) {
        const current = this.cargo.get(resourceType) || 0;
        const totalCargo = Array.from(this.cargo.values()).reduce((a, b) => a + b, 0);

        if (totalCargo + amount <= this.equipment.cargoHold) {
            this.cargo.set(resourceType, current + amount);
            return true;
        }
        return false;
    }

    removeCargo(resourceType, amount) {
        const current = this.cargo.get(resourceType) || 0;
        if (current >= amount) {
            this.cargo.set(resourceType, current - amount);
            return true;
        }
        return false;
    }

    getTotalCargo() {
        return Array.from(this.cargo.values()).reduce((a, b) => a + b, 0);
    }

    getSpeed() {
        return this.mesh.physics.velocity.length();
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    getDirection() {
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(this.mesh.quaternion);
        return direction;
    }
}
