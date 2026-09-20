// Planet terrain generation and atmospheric effects

class PlanetarySystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.activePlanet = null;
        this.surfaceDetails = new Map();
    }

    // Generate detailed terrain when player approaches
    generateDetailedTerrain(planet, seed) {
        if (this.surfaceDetails.has(planet)) {
            return this.surfaceDetails.get(planet);
        }

        const details = {
            landingSites: this.generateLandingSites(planet, seed),
            resources: this.generateSurfaceResources(planet, seed),
            features: this.generateSurfaceFeatures(planet, seed),
            biomes: this.generateBiomes(planet, seed)
        };

        this.surfaceDetails.set(planet, details);
        return details;
    }

    generateLandingSites(planet, seed) {
        const sites = [];
        const count = Utils.randomInt(3, 8);

        for (let i = 0; i < count; i++) {
            const rng = (offset) => Utils.seededRandom(seed + i * 10 + offset);

            const theta = rng(1) * Math.PI * 2;
            const phi = rng(2) * Math.PI;

            sites.push({
                position: new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta),
                    Math.sin(phi) * Math.sin(theta),
                    Math.cos(phi)
                ).multiplyScalar(planet.size),
                name: `Landing Site ${String.fromCharCode(65 + i)}`,
                safe: rng(3) > 0.3,
                terrain: ['flat', 'rough', 'crater', 'valley'][Math.floor(rng(4) * 4)]
            });
        }

        return sites;
    }

    generateSurfaceResources(planet, seed) {
        const resources = [];
        const resourceTypes = Object.keys(planet.resources);

        resourceTypes.forEach((type, i) => {
            const count = Utils.randomInt(5, 15);

            for (let j = 0; j < count; j++) {
                const rng = (offset) => Utils.seededRandom(seed + i * 100 + j * 10 + offset);

                const theta = rng(1) * Math.PI * 2;
                const phi = rng(2) * Math.PI;

                resources.push({
                    type: type,
                    position: new THREE.Vector3(
                        Math.sin(phi) * Math.cos(theta),
                        Math.sin(phi) * Math.sin(theta),
                        Math.cos(phi)
                    ).multiplyScalar(planet.size),
                    amount: Math.floor(rng(3) * 100) + 50,
                    quality: rng(4)
                });
            }
        });

        return resources;
    }

    generateSurfaceFeatures(planet, seed) {
        const features = [];
        const featureTypes = {
            'rocky': ['crater', 'mountain', 'canyon', 'plateau'],
            'ice': ['glacier', 'ice_cave', 'frozen_lake', 'ice_spike'],
            'desert': ['dune', 'rock_formation', 'canyon', 'mesa'],
            'ocean': ['island', 'reef', 'trench', 'atoll'],
            'lava': ['volcano', 'lava_flow', 'magma_chamber', 'crater'],
            'gas': [],
            'terran': ['forest', 'mountain', 'lake', 'valley']
        };

        const types = featureTypes[planet.type] || featureTypes['rocky'];
        if (types.length === 0) return features;

        const count = Utils.randomInt(5, 12);

        for (let i = 0; i < count; i++) {
            const rng = (offset) => Utils.seededRandom(seed + 500 + i * 10 + offset);

            const theta = rng(1) * Math.PI * 2;
            const phi = rng(2) * Math.PI;

            features.push({
                type: types[Math.floor(rng(3) * types.length)],
                position: new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta),
                    Math.sin(phi) * Math.sin(theta),
                    Math.cos(phi)
                ).multiplyScalar(planet.size),
                size: rng(4) * 50 + 20,
                name: this.generateFeatureName(types[Math.floor(rng(5) * types.length)], rng(6))
            });
        }

        return features;
    }

    generateBiomes(planet, seed) {
        if (!['terran', 'ocean'].includes(planet.type)) {
            return [];
        }

        const biomeTypes = {
            'terran': ['forest', 'grassland', 'tundra', 'jungle', 'savanna'],
            'ocean': ['shallow', 'deep', 'coral', 'kelp', 'abyssal']
        };

        const types = biomeTypes[planet.type];
        const biomes = [];

        types.forEach((type, i) => {
            const rng = (offset) => Utils.seededRandom(seed + 1000 + i * 10 + offset);

            biomes.push({
                type: type,
                coverage: rng(1) * 0.3 + 0.1,
                biodiversity: rng(2),
                hasLife: rng(3) > 0.3
            });
        });

        return biomes;
    }

    generateFeatureName(type, seed) {
        const prefixes = ['Northern', 'Southern', 'Eastern', 'Western', 'Central', 'Great', 'Grand'];
        const suffixes = ['Prime', 'Major', 'Minor', 'Alpha', 'Beta'];

        const rng = (offset) => Utils.seededRandom(seed + offset);

        const prefix = prefixes[Math.floor(rng(1) * prefixes.length)];
        const suffix = suffixes[Math.floor(rng(2) * suffixes.length)];

        const typeName = type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        return `${prefix} ${typeName} ${suffix}`;
    }

    // Enhanced atmosphere rendering
    createAtmosphereEffect(planet) {
        if (!planet.hasAtmosphere) return null;

        const atmosphereGroup = new THREE.Group();

        // Outer atmosphere glow
        const glowGeometry = new THREE.SphereGeometry(planet.size * 1.15, 64, 64);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { value: 0.3 },
                p: { value: 3.5 },
                glowColor: { value: new THREE.Color(0x87CEEB) },
                viewVector: { value: new THREE.Vector3() }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.7 - dot(vNormal, vNormel), 3.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, 0.8);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const atmosphereGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        atmosphereGroup.add(atmosphereGlow);

        // Cloud layer for terran/ocean planets
        if (['terran', 'ocean'].includes(planet.type)) {
            const cloudGeometry = new THREE.SphereGeometry(planet.size * 1.05, 64, 64);
            const cloudMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.4,
                roughness: 1
            });

            const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            clouds.userData.rotationSpeed = 0.0001;
            atmosphereGroup.add(clouds);
        }

        planet.mesh.add(atmosphereGroup);
        return atmosphereGroup;
    }

    // Update atmospheric effects based on camera position
    updateAtmosphereEffects(camera, planets) {
        planets.forEach(planet => {
            if (!planet.hasAtmosphere || !planet.mesh.children.length) return;

            const atmosphereGroup = planet.mesh.children.find(child => child.type === 'Group');
            if (!atmosphereGroup) return;

            // Update view vector for shader
            const glowMesh = atmosphereGroup.children[0];
            if (glowMesh && glowMesh.material.uniforms) {
                const viewVector = new THREE.Vector3()
                    .subVectors(camera.position, planet.mesh.position)
                    .normalize();
                glowMesh.material.uniforms.viewVector.value = viewVector;
            }

            // Rotate clouds
            const cloudMesh = atmosphereGroup.children[1];
            if (cloudMesh) {
                cloudMesh.rotation.y += cloudMesh.userData.rotationSpeed || 0;
            }
        });
    }

    // Check if player can land on planet
    canLand(planet, shipPosition) {
        const distance = Utils.distance(planet.mesh, { position: shipPosition });
        const landingDistance = planet.size * 1.5;

        return distance <= landingDistance;
    }

    // Get closest landing site
    getClosestLandingSite(planet, position) {
        const details = this.surfaceDetails.get(planet);
        if (!details || !details.landingSites.length) return null;

        let closest = null;
        let closestDist = Infinity;

        details.landingSites.forEach(site => {
            const siteWorldPos = site.position.clone().add(planet.mesh.position);
            const dist = position.distanceTo(siteWorldPos);

            if (dist < closestDist) {
                closestDist = dist;
                closest = site;
            }
        });

        return closest;
    }

    // Calculate altitude above planet surface
    getAltitude(planet, position) {
        const distance = Utils.distance(planet.mesh, { position: position });
        return distance - planet.size;
    }

    // Apply atmospheric drag
    applyAtmosphericDrag(ship, planet) {
        const altitude = this.getAltitude(planet, ship.getPosition());
        const atmosphereHeight = planet.size * 0.2;

        if (altitude < atmosphereHeight && planet.hasAtmosphere) {
            const dragFactor = 1 - (altitude / atmosphereHeight) * 0.1;
            ship.mesh.physics.velocity.multiplyScalar(dragFactor);

            // Heat damage if moving too fast in atmosphere
            const speed = ship.getSpeed();
            if (speed > 100 && altitude < atmosphereHeight * 0.5) {
                ship.takeDamage(0.1);
            }
        }
    }
}
