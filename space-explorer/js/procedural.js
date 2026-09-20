// Procedural generation for universe content

class ProceduralGenerator {
    constructor(scene) {
        this.scene = scene;
        this.sectors = new Map();
        this.starSystems = [];
    }

    // Generate a star system
    generateStarSystem(sectorX, sectorZ, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);

        const system = {
            id: `system_${sectorX}_${sectorZ}`,
            position: new THREE.Vector3(
                sectorX * 10000 + rng(1) * 5000 - 2500,
                rng(2) * 2000 - 1000,
                sectorZ * 10000 + rng(3) * 5000 - 2500
            ),
            star: null,
            planets: [],
            asteroids: [],
            stations: [],
            wormholes: [],
            aliens: []
        };

        // Create star
        const starTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
        const starType = starTypes[Math.floor(rng(4) * starTypes.length)];
        const starSize = rng(5) * 500 + 500;

        system.star = this.createStar(system.position, starType, starSize);

        // Create planets (2-8 planets per system)
        const planetCount = Math.floor(rng(6) * 7) + 2;

        for (let i = 0; i < planetCount; i++) {
            const orbitRadius = (i + 1) * (rng(7 + i) * 500 + 1000);
            const planet = this.createPlanet(
                system.position,
                orbitRadius,
                seed + 100 + i
            );
            system.planets.push(planet);
        }

        // Create asteroid belt (50% chance)
        if (rng(8) > 0.5) {
            const beltRadius = (planetCount + 1) * 1200;
            const asteroids = this.createAsteroidBelt(
                system.position,
                beltRadius,
                seed + 200
            );
            system.asteroids = asteroids;
        }

        // Create space station (30% chance)
        if (rng(9) > 0.7) {
            const stationPlanet = system.planets[Math.floor(rng(10) * system.planets.length)];
            const station = this.createStation(stationPlanet, seed + 300);
            system.stations.push(station);
        }

        // Create wormhole (10% chance)
        if (rng(11) > 0.9) {
            const wormhole = this.createWormhole(
                system.position,
                (planetCount + 2) * 1500,
                seed + 400
            );
            system.wormholes.push(wormhole);
        }

        return system;
    }

    // Create a star
    createStar(position, type, size) {
        const color = Utils.starColor(type);

        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1
        });

        const star = new THREE.Mesh(geometry, material);
        star.position.copy(position);

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(size * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        star.add(glow);

        // Add light
        const light = new THREE.PointLight(color, 2, size * 10);
        star.add(light);

        // Add corona particles
        const coronaParticles = Utils.createParticleSystem(500, color, size * 0.05);
        coronaParticles.geometry.attributes.position.array.forEach((v, i) => {
            coronaParticles.geometry.attributes.position.array[i] *= size * 1.5;
        });
        star.add(coronaParticles);

        this.scene.add(star);

        return {
            mesh: star,
            type: type,
            size: size,
            light: light,
            position: position.clone()
        };
    }

    // Create a planet
    createPlanet(systemPos, orbitRadius, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);

        const types = ['rocky', 'ice', 'desert', 'ocean', 'lava', 'gas', 'terran'];
        const planetType = types[Math.floor(rng(1) * types.length)];
        const size = rng(2) * 200 + 100;

        // Initial position in orbit
        const angle = rng(3) * Math.PI * 2;
        const position = new THREE.Vector3(
            systemPos.x + Math.cos(angle) * orbitRadius,
            systemPos.y + (rng(4) * 200 - 100),
            systemPos.z + Math.sin(angle) * orbitRadius
        );

        // Create planet mesh
        const geometry = new THREE.SphereGeometry(size, 64, 64);

        // Add procedural texture with noise
        const planetColor = Utils.planetColor(planetType);
        const material = new THREE.MeshStandardMaterial({
            color: planetColor,
            roughness: planetType === 'ice' ? 0.2 : 0.8,
            metalness: planetType === 'lava' ? 0.3 : 0.1
        });

        const planet = new THREE.Mesh(geometry, material);
        planet.position.copy(position);

        // Rotation speed
        planet.userData.rotationSpeed = rng(5) * 0.001 + 0.0005;

        // Add atmosphere (for some planet types)
        if (['ocean', 'terran', 'gas'].includes(planetType)) {
            const atmosGeometry = new THREE.SphereGeometry(size * 1.1, 32, 32);
            const atmosMaterial = new THREE.MeshBasicMaterial({
                color: planetType === 'gas' ? 0xFFE4B5 : 0x87CEEB,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
            planet.add(atmosphere);
        }

        // Add rings (10% chance for gas giants)
        if (planetType === 'gas' && rng(6) > 0.9) {
            const ringGeometry = new THREE.RingGeometry(size * 1.3, size * 2, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xCCCCCC,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI / 2 + rng(7) * 0.5;
            planet.add(rings);
        }

        this.scene.add(planet);

        return {
            mesh: planet,
            type: planetType,
            size: size,
            orbitRadius: orbitRadius,
            orbitSpeed: rng(8) * 0.0001 + 0.00005,
            orbitAngle: angle,
            systemPosition: systemPos.clone(),
            position: position.clone(),
            hasAtmosphere: ['ocean', 'terran', 'gas'].includes(planetType),
            resources: this.generatePlanetResources(planetType, seed)
        };
    }

    // Generate resources for a planet
    generatePlanetResources(planetType, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);
        const resources = {};

        const resourceTypes = {
            'rocky': ['iron', 'copper', 'titanium'],
            'ice': ['water', 'hydrogen', 'helium'],
            'desert': ['silicon', 'aluminum', 'uranium'],
            'ocean': ['water', 'organic', 'hydrogen'],
            'lava': ['rare_metals', 'plutonium', 'crystals'],
            'gas': ['hydrogen', 'helium', 'deuterium'],
            'terran': ['organic', 'water', 'biomass']
        };

        const types = resourceTypes[planetType] || resourceTypes['rocky'];

        types.forEach((type, i) => {
            resources[type] = Math.floor(rng(i + 10) * 1000) + 500;
        });

        return resources;
    }

    // Create asteroid belt
    createAsteroidBelt(systemPos, radius, seed) {
        const asteroids = [];
        const count = 100;

        for (let i = 0; i < count; i++) {
            const rng = (offset) => Utils.seededRandom(seed + i * 10 + offset);

            const angle = rng(1) * Math.PI * 2;
            const dist = radius + rng(2) * 500 - 250;
            const size = rng(3) * 20 + 5;

            const geometry = new THREE.DodecahedronGeometry(size, 0);
            const material = new THREE.MeshStandardMaterial({
                color: 0x808080,
                roughness: 0.9
            });

            const asteroid = new THREE.Mesh(geometry, material);
            asteroid.position.set(
                systemPos.x + Math.cos(angle) * dist,
                systemPos.y + (rng(4) * 100 - 50),
                systemPos.z + Math.sin(angle) * dist
            );

            asteroid.rotation.set(rng(5) * Math.PI, rng(6) * Math.PI, rng(7) * Math.PI);
            asteroid.userData.rotationSpeed = new THREE.Vector3(
                rng(8) * 0.01,
                rng(9) * 0.01,
                rng(10) * 0.01
            );

            this.scene.add(asteroid);

            asteroids.push({
                mesh: asteroid,
                size: size,
                resources: {
                    iron: Math.floor(rng(11) * 100) + 50,
                    minerals: Math.floor(rng(12) * 50) + 25
                }
            });
        }

        return asteroids;
    }

    // Create station (placeholder for now)
    createStation(planet, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);

        const orbitHeight = planet.size * 2;
        const angle = rng(1) * Math.PI * 2;

        const position = new THREE.Vector3(
            planet.position.x + Math.cos(angle) * orbitHeight,
            planet.position.y,
            planet.position.z + Math.sin(angle) * orbitHeight
        );

        return {
            position: position.clone(),
            planet: planet,
            orbitAngle: angle,
            orbitSpeed: 0.0002,
            name: this.generateStationName(seed),
            services: ['trade', 'repair', 'missions']
        };
    }

    // Create wormhole (placeholder)
    createWormhole(systemPos, distance, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);

        const angle = rng(1) * Math.PI * 2;
        const position = new THREE.Vector3(
            systemPos.x + Math.cos(angle) * distance,
            systemPos.y,
            systemPos.z + Math.sin(angle) * distance
        );

        return {
            position: position.clone(),
            destination: null, // Will be linked to another system
            active: true
        };
    }

    // Generate background starfield
    generateStarfield(count = 10000) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Random position in a large sphere
            const radius = Utils.random(5000, 50000);
            const theta = Utils.random(0, Math.PI * 2);
            const phi = Utils.random(0, Math.PI);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Random color (white to blue-white)
            const color = new THREE.Color();
            color.setHSL(Utils.random(0.5, 0.7), Utils.random(0, 0.3), Utils.random(0.8, 1));
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });

        const starfield = new THREE.Points(geometry, material);
        this.scene.add(starfield);

        return starfield;
    }

    // Generate nebula
    generateNebula(position, color, size) {
        const particles = Utils.createParticleSystem(2000, color, size);

        particles.geometry.attributes.position.array.forEach((v, i) => {
            particles.geometry.attributes.position.array[i] *= Utils.random(500, 1500);
        });

        particles.position.copy(position);
        this.scene.add(particles);

        return particles;
    }

    // Generate station name
    generateStationName(seed) {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Outpost', 'Station', 'Haven', 'Nexus'];
        const suffixes = ['Prime', 'One', 'Seven', 'Nine', 'Terminus', 'Gateway', 'Hub'];

        const rng = (offset) => Utils.seededRandom(seed + offset);
        const prefix = prefixes[Math.floor(rng(1) * prefixes.length)];
        const suffix = suffixes[Math.floor(rng(2) * suffixes.length)];

        return `${prefix} ${suffix}`;
    }

    // Update orbital mechanics
    updateOrbits(deltaTime) {
        this.starSystems.forEach(system => {
            system.planets.forEach(planet => {
                planet.orbitAngle += planet.orbitSpeed * deltaTime;

                planet.mesh.position.x = system.position.x +
                    Math.cos(planet.orbitAngle) * planet.orbitRadius;
                planet.mesh.position.z = system.position.z +
                    Math.sin(planet.orbitAngle) * planet.orbitRadius;

                planet.mesh.rotation.y += planet.mesh.userData.rotationSpeed * deltaTime;

                planet.position.copy(planet.mesh.position);
            });

            system.asteroids.forEach(asteroid => {
                asteroid.mesh.rotation.x += asteroid.mesh.userData.rotationSpeed.x;
                asteroid.mesh.rotation.y += asteroid.mesh.userData.rotationSpeed.y;
                asteroid.mesh.rotation.z += asteroid.mesh.userData.rotationSpeed.z;
            });
        });
    }
}
