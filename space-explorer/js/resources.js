// Resource collection and mining system

class ResourceSystem {
    constructor(scene) {
        this.scene = scene;
        this.resources = [];
        this.miningBeam = null;
    }

    // Create mineable resource in space
    createSpaceResource(position, type, amount) {
        const size = Math.sqrt(amount) * 0.5;

        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshStandardMaterial({
            color: this.getResourceColor(type),
            roughness: 0.8,
            metalness: 0.6,
            emissive: this.getResourceColor(type),
            emissiveIntensity: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        // Random rotation
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        this.scene.add(mesh);

        const resource = {
            mesh: mesh,
            type: type,
            amount: amount,
            position: position.clone(),
            rotationSpeed: new THREE.Vector3(
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01
            )
        };

        this.resources.push(resource);
        return resource;
    }

    getResourceColor(type) {
        const colors = {
            'iron': 0x8B7355,
            'copper': 0xB87333,
            'titanium': 0xC0C0C0,
            'water': 0x4A90E2,
            'hydrogen': 0xE0FFFF,
            'helium': 0xFFE4E1,
            'organic': 0x228B22,
            'biomass': 0x556B2F,
            'silicon': 0x8B8B83,
            'aluminum': 0xA8A9AD,
            'uranium': 0x00FF00,
            'plutonium': 0xFF4500,
            'crystals': 0x9933FF,
            'rare_metals': 0xFFD700,
            'deuterium': 0x87CEEB,
            'minerals': 0x696969
        };
        return colors[type] || 0x808080;
    }

    // Update resources
    updateResources() {
        this.resources.forEach(resource => {
            if (resource.mesh) {
                resource.mesh.rotation.x += resource.rotationSpeed.x;
                resource.mesh.rotation.y += resource.rotationSpeed.y;
                resource.mesh.rotation.z += resource.rotationSpeed.z;
            }
        });
    }

    // Mining operation
    startMining(ship, target) {
        if (!target || !ship.equipment.miningLaser) {
            return { success: false, message: 'No mining laser equipped' };
        }

        // Create mining beam visual
        this.createMiningBeam(ship, target);

        return { success: true, target: target };
    }

    createMiningBeam(ship, target) {
        if (this.miningBeam) {
            ship.mesh.remove(this.miningBeam);
        }

        const distance = ship.getPosition().distanceTo(target.position);

        const geometry = new THREE.CylinderGeometry(0.5, 0.5, distance, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.6,
            emissive: 0x00FFFF,
            emissiveIntensity: 1
        });

        const beam = new THREE.Mesh(geometry, material);
        beam.position.set(0, 0, distance / 2);
        beam.rotation.x = Math.PI / 2;

        // Add particles
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(50 * 3);

        for (let i = 0; i < 50; i++) {
            particlePositions[i * 3] = (Math.random() - 0.5) * 2;
            particlePositions[i * 3 + 1] = Math.random() * distance;
            particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00FFFF,
            size: 2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        beam.add(particles);

        ship.mesh.add(beam);
        this.miningBeam = beam;
        this.miningBeam.userData.particles = particles;
    }

    updateMiningBeam() {
        if (this.miningBeam && this.miningBeam.userData.particles) {
            const positions = this.miningBeam.userData.particles.geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] = (Math.random() - 0.5) * 2;
                positions[i + 2] = (Math.random() - 0.5) * 2;
            }

            this.miningBeam.userData.particles.geometry.attributes.position.needsUpdate = true;
        }
    }

    stopMining(ship) {
        if (this.miningBeam) {
            ship.mesh.remove(this.miningBeam);
            this.miningBeam = null;
        }
    }

    // Mine resource
    mineResource(ship, resource, deltaTime) {
        if (!resource || resource.amount <= 0) {
            this.stopMining(ship);
            return { success: false, message: 'Resource depleted' };
        }

        // Check distance
        const distance = ship.getPosition().distanceTo(resource.position);
        if (distance > ship.mining.range) {
            this.stopMining(ship);
            return { success: false, message: 'Out of range' };
        }

        // Check energy
        if (ship.stats.energy < 1) {
            this.stopMining(ship);
            return { success: false, message: 'Insufficient energy' };
        }

        // Mine
        const miningRate = ship.mining.rate * (deltaTime / 1000);
        const mined = Math.min(miningRate, resource.amount);

        resource.amount -= mined;
        ship.stats.energy -= 0.5;

        // Try to add to cargo
        if (ship.addCargo(resource.type, mined)) {
            // Update resource visual
            if (resource.amount <= 0) {
                this.removeResource(resource);
                this.stopMining(ship);
                return {
                    success: true,
                    message: `Resource depleted. Collected ${mined.toFixed(1)} ${resource.type}`,
                    depleted: true
                };
            }

            // Shrink resource mesh
            const scale = Math.sqrt(resource.amount) / 10;
            resource.mesh.scale.set(scale, scale, scale);

            return {
                success: true,
                amount: mined,
                remaining: resource.amount
            };
        } else {
            this.stopMining(ship);
            return { success: false, message: 'Cargo hold full' };
        }
    }

    removeResource(resource) {
        if (resource.mesh) {
            this.scene.remove(resource.mesh);
        }

        const index = this.resources.indexOf(resource);
        if (index > -1) {
            this.resources.splice(index, 1);
        }
    }

    // Find nearest resource to position
    findNearestResource(position, maxDistance = 500) {
        let nearest = null;
        let nearestDist = maxDistance;

        this.resources.forEach(resource => {
            const dist = position.distanceTo(resource.position);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = resource;
            }
        });

        return nearest;
    }

    // Scan for resources in range
    scanForResources(position, range) {
        const found = [];

        this.resources.forEach(resource => {
            const dist = position.distanceTo(resource.position);
            if (dist <= range) {
                found.push({
                    resource: resource,
                    distance: dist,
                    type: resource.type,
                    amount: resource.amount
                });
            }
        });

        return found.sort((a, b) => a.distance - b.distance);
    }

    // Generate random resources in an area
    generateResourceField(center, radius, count, resourceTypes) {
        const resources = [];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            const height = (Math.random() - 0.5) * radius * 0.2;

            const position = new THREE.Vector3(
                center.x + Math.cos(angle) * dist,
                center.y + height,
                center.z + Math.sin(angle) * dist
            );

            const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const amount = Math.random() * 100 + 50;

            const resource = this.createSpaceResource(position, type, amount);
            resources.push(resource);
        }

        return resources;
    }
}
