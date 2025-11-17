// Alien species with behaviors and interactions

class AlienSystem {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.aliens = [];
        this.species = this.defineSpecies();
    }

    // Define alien species with unique characteristics
    defineSpecies() {
        return {
            'trader': {
                name: 'Traders',
                behavior: 'peaceful',
                aggression: 0.1,
                intelligence: 0.8,
                speed: 80,
                color: 0x00FF00,
                description: 'Peaceful merchants traveling between systems',
                dialogue: [
                    'Greetings, traveler! Care to trade?',
                    'Safe travels, friend.',
                    'May your cargo hold be full!'
                ]
            },
            'explorer': {
                name: 'Explorers',
                behavior: 'curious',
                aggression: 0.2,
                intelligence: 0.9,
                speed: 100,
                color: 0x0088FF,
                description: 'Scientific explorers seeking knowledge',
                dialogue: [
                    'Fascinating! A new species.',
                    'Our sensors detect interesting anomalies.',
                    'Knowledge is the greatest treasure.'
                ]
            },
            'pirate': {
                name: 'Pirates',
                behavior: 'hostile',
                aggression: 0.9,
                intelligence: 0.5,
                speed: 120,
                color: 0xFF0000,
                description: 'Dangerous raiders attacking passing ships',
                dialogue: [
                    'Your cargo belongs to us!',
                    'Surrender or be destroyed!',
                    'This sector is ours!'
                ]
            },
            'guardian': {
                name: 'Guardians',
                behavior: 'territorial',
                aggression: 0.6,
                intelligence: 0.7,
                speed: 90,
                color: 0xFFAA00,
                description: 'Ancient protectors of sacred systems',
                dialogue: [
                    'This system is protected.',
                    'State your intentions.',
                    'Turn back, outsider!'
                ]
            },
            'mysterious': {
                name: 'Enigmatic Ones',
                behavior: 'unpredictable',
                aggression: 0.5,
                intelligence: 1.0,
                speed: 150,
                color: 0xFF00FF,
                description: 'Mysterious beings with unknown motives',
                dialogue: [
                    '...curious...',
                    'Time flows differently here.',
                    'You are not ready to understand.'
                ]
            }
        };
    }

    // Spawn alien ship
    spawnAlien(position, speciesType, seed) {
        const species = this.species[speciesType];
        if (!species) return null;

        const rng = (offset) => Utils.seededRandom(seed + offset);

        // Create ship mesh
        const geometry = new THREE.ConeGeometry(3, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: species.color,
            emissive: species.color,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.rotation.x = -Math.PI / 2;

        // Add glow
        const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: species.color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);

        this.scene.add(mesh);

        // Create alien entity
        const alien = {
            id: Utils.generateId(),
            mesh: mesh,
            species: speciesType,
            speciesData: species,
            position: position.clone(),
            health: 100,
            maxHealth: 100,
            state: 'idle', // idle, patrol, chase, flee, attack, trade
            target: null,
            homePosition: position.clone(),
            patrolRadius: rng(1) * 1000 + 500,
            detectionRange: 300,
            attackRange: 100,
            mood: rng(2), // 0-1, affects dialogue and behavior
            hasInteracted: false,
            inventory: this.generateAlienInventory(speciesType, seed)
        };

        // Add physics
        mesh.mass = 500;
        mesh.drag = 0.97;
        mesh.angularDrag = 0.9;
        this.physics.addObject(mesh);

        this.aliens.push(alien);
        return alien;
    }

    // Generate alien inventory for trading
    generateAlienInventory(speciesType, seed) {
        if (speciesType !== 'trader') return [];

        const rng = (offset) => Utils.seededRandom(seed + offset);
        const inventory = [];

        const resources = ['iron', 'copper', 'titanium', 'water', 'organic', 'crystals'];

        resources.forEach((resource, i) => {
            if (rng(i) > 0.3) {
                inventory.push({
                    type: resource,
                    amount: Math.floor(rng(i + 10) * 50) + 20,
                    price: Math.floor(rng(i + 20) * 30) + 10
                });
            }
        });

        return inventory;
    }

    // Update alien AI
    updateAlien(alien, deltaTime, player) {
        if (!alien.mesh) return;

        const distanceToPlayer = Utils.distance(alien.mesh, player.mesh);

        // State machine
        switch (alien.state) {
            case 'idle':
                this.handleIdleState(alien, distanceToPlayer, player);
                break;
            case 'patrol':
                this.handlePatrolState(alien, deltaTime);
                break;
            case 'chase':
                this.handleChaseState(alien, player, distanceToPlayer);
                break;
            case 'flee':
                this.handleFleeState(alien, player);
                break;
            case 'attack':
                this.handleAttackState(alien, player, distanceToPlayer);
                break;
            case 'trade':
                this.handleTradeState(alien, distanceToPlayer);
                break;
        }

        // Update position
        alien.position.copy(alien.mesh.position);

        // Face direction of movement
        if (alien.mesh.physics.velocity.length() > 0.1) {
            const direction = alien.mesh.physics.velocity.clone().normalize();
            const angle = Math.atan2(direction.x, direction.z);
            alien.mesh.rotation.y = angle;
        }
    }

    handleIdleState(alien, distanceToPlayer, player) {
        // Check if player detected
        if (distanceToPlayer < alien.detectionRange) {
            const species = alien.speciesData;

            if (species.behavior === 'hostile') {
                alien.state = 'chase';
                alien.target = player;
            } else if (species.behavior === 'peaceful') {
                if (distanceToPlayer < 100 && !alien.hasInteracted) {
                    alien.state = 'trade';
                }
            } else if (species.behavior === 'curious') {
                alien.state = 'chase'; // Approach to investigate
                alien.target = player;
            } else if (species.behavior === 'territorial') {
                if (distanceToPlayer < alien.patrolRadius) {
                    if (Math.random() < species.aggression) {
                        alien.state = 'chase';
                    } else {
                        alien.state = 'patrol'; // Warning patrol
                    }
                }
            }
        } else {
            // Random chance to start patrolling
            if (Math.random() < 0.01) {
                alien.state = 'patrol';
            }
        }
    }

    handlePatrolState(alien, deltaTime) {
        // Patrol around home position
        const targetPos = new THREE.Vector3(
            alien.homePosition.x + Math.cos(Date.now() * 0.0001) * alien.patrolRadius,
            alien.homePosition.y,
            alien.homePosition.z + Math.sin(Date.now() * 0.0001) * alien.patrolRadius
        );

        this.moveTowards(alien, targetPos, alien.speciesData.speed * 0.5);

        // Random chance to return to idle
        if (Math.random() < 0.005) {
            alien.state = 'idle';
        }
    }

    handleChaseState(alien, player, distance) {
        if (!alien.target) {
            alien.state = 'idle';
            return;
        }

        // If close enough and hostile, attack
        if (distance < alien.attackRange && alien.speciesData.behavior === 'hostile') {
            alien.state = 'attack';
            return;
        }

        // If curious and close enough, initiate trade/dialogue
        if (alien.speciesData.behavior === 'curious' && distance < 100) {
            alien.state = 'trade';
            return;
        }

        // Chase target
        this.moveTowards(alien, player.mesh.position, alien.speciesData.speed);

        // If too far, give up
        if (distance > alien.detectionRange * 2) {
            alien.state = 'idle';
            alien.target = null;
        }
    }

    handleFleeState(alien, player) {
        // Flee away from player
        const fleeDirection = new THREE.Vector3()
            .subVectors(alien.mesh.position, player.mesh.position)
            .normalize();

        const fleeTarget = alien.mesh.position.clone()
            .add(fleeDirection.multiplyScalar(500));

        this.moveTowards(alien, fleeTarget, alien.speciesData.speed * 1.2);

        // If far enough, return to idle
        const distance = Utils.distance(alien.mesh, player.mesh);
        if (distance > alien.detectionRange * 2) {
            alien.state = 'idle';
        }
    }

    handleAttackState(alien, player, distance) {
        if (distance > alien.attackRange * 1.5) {
            alien.state = 'chase';
            return;
        }

        // Attack player
        if (Math.random() < 0.02) { // Attack chance per frame
            this.alienAttack(alien, player);
        }

        // If health low, flee
        if (alien.health < alien.maxHealth * 0.3) {
            alien.state = 'flee';
        }

        // Orbit around player while attacking
        const orbitAngle = Date.now() * 0.001;
        const orbitRadius = alien.attackRange * 0.8;
        const orbitTarget = new THREE.Vector3(
            player.mesh.position.x + Math.cos(orbitAngle) * orbitRadius,
            player.mesh.position.y,
            player.mesh.position.z + Math.sin(orbitAngle) * orbitRadius
        );

        this.moveTowards(alien, orbitTarget, alien.speciesData.speed * 0.7);
    }

    handleTradeState(alien, distance) {
        // Hover in place
        alien.mesh.physics.velocity.multiplyScalar(0.9);

        // If player moves away, return to idle
        if (distance > 200) {
            alien.state = 'idle';
            alien.hasInteracted = true;
        }
    }

    moveTowards(alien, targetPos, speed) {
        const direction = new THREE.Vector3()
            .subVectors(targetPos, alien.mesh.position)
            .normalize();

        const thrust = direction.multiplyScalar(speed);
        this.physics.applyForce(alien.mesh, thrust);
    }

    alienAttack(alien, player) {
        // Create projectile
        const projectileGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({
            color: alien.speciesData.color,
            emissive: alien.speciesData.color
        });

        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(alien.mesh.position);

        const direction = new THREE.Vector3()
            .subVectors(player.mesh.position, alien.mesh.position)
            .normalize();

        projectile.userData = {
            velocity: direction.multiplyScalar(300),
            damage: 5 + alien.speciesData.aggression * 10,
            lifetime: 3000,
            createdAt: Date.now(),
            owner: alien
        };

        this.scene.add(projectile);

        if (!alien.projectiles) alien.projectiles = [];
        alien.projectiles.push(projectile);
    }

    // Update all aliens
    updateAll(deltaTime, player) {
        this.aliens.forEach(alien => {
            this.updateAlien(alien, deltaTime, player);

            // Update alien projectiles
            if (alien.projectiles) {
                this.updateAlienProjectiles(alien, deltaTime, player);
            }
        });
    }

    updateAlienProjectiles(alien, deltaTime, player) {
        const now = Date.now();

        alien.projectiles = alien.projectiles.filter(projectile => {
            // Update position
            const movement = projectile.userData.velocity.clone().multiplyScalar(deltaTime / 1000);
            projectile.position.add(movement);

            // Check collision with player
            const distance = projectile.position.distanceTo(player.mesh.position);
            if (distance < 5) {
                player.takeDamage(projectile.userData.damage);
                this.scene.remove(projectile);
                return false;
            }

            // Check lifetime
            if (now - projectile.userData.createdAt > projectile.userData.lifetime) {
                this.scene.remove(projectile);
                return false;
            }

            return true;
        });
    }

    // Get dialogue from alien
    getDialogue(alien) {
        const dialogues = alien.speciesData.dialogue;
        const index = Math.floor(alien.mood * dialogues.length);
        return dialogues[Math.min(index, dialogues.length - 1)];
    }

    // Interaction with alien
    interact(alien, player) {
        const result = {
            species: alien.speciesData.name,
            dialogue: this.getDialogue(alien),
            canTrade: alien.speciesData.behavior === 'peaceful' || alien.speciesData.behavior === 'curious',
            inventory: alien.inventory,
            mood: alien.mood
        };

        alien.hasInteracted = true;
        return result;
    }

    // Damage alien
    damageAlien(alien, amount) {
        alien.health -= amount;

        if (alien.health <= 0) {
            this.destroyAlien(alien);
            return true; // Alien destroyed
        }

        // Damaged aliens become hostile or flee
        if (alien.speciesData.behavior !== 'hostile') {
            if (alien.health < alien.maxHealth * 0.5) {
                alien.state = 'flee';
            }
        }

        return false;
    }

    destroyAlien(alien) {
        // Remove from scene
        if (alien.mesh) {
            this.scene.remove(alien.mesh);
            this.physics.removeObject(alien.mesh);
        }

        // Remove from aliens array
        const index = this.aliens.indexOf(alien);
        if (index > -1) {
            this.aliens.splice(index, 1);
        }

        // Drop loot
        return {
            credits: Math.floor(Math.random() * 100) + 50,
            items: alien.inventory
        };
    }
}
