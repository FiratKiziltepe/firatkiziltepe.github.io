// Wormhole travel system with visual effects

class WormholeSystem {
    constructor(scene) {
        this.scene = scene;
        this.wormholes = [];
        this.travelEffect = null;
        this.isTraveling = false;
    }

    // Create wormhole mesh with effects
    createWormholeMesh(wormhole) {
        const group = new THREE.Group();

        // Main ring
        const ringGeometry = new THREE.TorusGeometry(30, 5, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x9933FF,
            emissive: 0x9933FF,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        group.add(ring);

        // Inner vortex
        const vortexGeometry = new THREE.CylinderGeometry(25, 25, 5, 32, 1, true);
        const vortexMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x9933FF) },
                color2: { value: new THREE.Color(0x3333FF) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    float angle = atan(vPosition.x, vPosition.z);
                    float radius = length(vPosition.xz);

                    float spiral = sin(angle * 5.0 + time * 2.0 - radius * 0.5) * 0.5 + 0.5;
                    float pulse = sin(time * 3.0) * 0.3 + 0.7;

                    vec3 color = mix(color1, color2, spiral);
                    float alpha = (1.0 - radius / 25.0) * pulse;

                    gl_FragColor = vec4(color, alpha * 0.6);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortex.rotation.x = Math.PI / 2;
        group.add(vortex);

        // Particle system
        const particleCount = 500;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 30;
            const height = (Math.random() - 0.5) * 10;

            particlePositions[i * 3] = Math.cos(angle) * radius;
            particlePositions[i * 3 + 1] = height;
            particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

            particleVelocities.push({
                angle: angle,
                radius: radius,
                speed: Math.random() * 0.02 + 0.01
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x9933FF,
            size: 2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData.velocities = particleVelocities;
        group.add(particles);

        // Outer glow rings
        for (let i = 0; i < 3; i++) {
            const glowGeometry = new THREE.TorusGeometry(35 + i * 5, 2, 16, 100);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x9933FF,
                transparent: true,
                opacity: 0.2 - i * 0.05,
                blending: THREE.AdditiveBlending
            });

            const glowRing = new THREE.Mesh(glowGeometry, glowMaterial);
            group.add(glowRing);
        }

        // Point light
        const light = new THREE.PointLight(0x9933FF, 2, 200);
        group.add(light);

        group.position.copy(wormhole.position);
        group.userData.wormhole = wormhole;
        group.userData.rotationSpeed = 0.001;

        this.scene.add(group);
        wormhole.mesh = group;

        return group;
    }

    // Update wormhole animations
    updateWormhole(wormhole, deltaTime) {
        if (!wormhole.mesh) return;

        const time = Date.now() * 0.001;

        // Rotate main ring
        wormhole.mesh.rotation.y += wormhole.mesh.userData.rotationSpeed * deltaTime;

        // Update vortex shader
        const vortex = wormhole.mesh.children[1];
        if (vortex && vortex.material.uniforms) {
            vortex.material.uniforms.time.value = time;
        }

        // Animate particles
        const particles = wormhole.mesh.children[2];
        if (particles && particles.userData.velocities) {
            const positions = particles.geometry.attributes.position.array;
            const velocities = particles.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                velocities[i].angle += velocities[i].speed;

                positions[i * 3] = Math.cos(velocities[i].angle) * velocities[i].radius;
                positions[i * 3 + 2] = Math.sin(velocities[i].angle) * velocities[i].radius;
            }

            particles.geometry.attributes.position.needsUpdate = true;
        }

        // Pulse glow rings
        for (let i = 3; i < 6; i++) {
            const ring = wormhole.mesh.children[i];
            if (ring) {
                ring.rotation.y = time * (0.5 + i * 0.1);
                ring.material.opacity = 0.2 + Math.sin(time * 2 + i) * 0.1;
            }
        }
    }

    // Check if ship is near wormhole
    canEnter(wormhole, shipPosition) {
        const distance = wormhole.position.distanceTo(shipPosition);
        return distance < 50 && wormhole.active;
    }

    // Initiate wormhole travel
    async travel(wormhole, ship, camera) {
        if (!wormhole.destination || this.isTraveling) return false;

        this.isTraveling = true;

        // Create travel effect
        await this.playTravelEffect(ship, camera, wormhole);

        // Teleport ship to destination
        ship.mesh.position.copy(wormhole.destination);
        ship.mesh.physics.velocity.multiplyScalar(0.3); // Reduce velocity

        this.isTraveling = false;

        return true;
    }

    // Play wormhole travel effect
    async playTravelEffect(ship, camera, wormhole) {
        return new Promise((resolve) => {
            const duration = 3000; // 3 seconds
            const startTime = Date.now();

            // Create tunnel effect
            const tunnelGeometry = new THREE.CylinderGeometry(20, 20, 100, 32, 1, true);
            const tunnelMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    progress: { value: 0 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float progress;
                    varying vec2 vUv;

                    void main() {
                        float stripe = sin(vUv.y * 20.0 - time * 10.0) * 0.5 + 0.5;
                        vec3 color1 = vec3(0.6, 0.2, 1.0);
                        vec3 color2 = vec3(0.2, 0.2, 1.0);

                        vec3 color = mix(color1, color2, stripe);
                        float alpha = (1.0 - abs(vUv.y - 0.5) * 2.0) * (1.0 - progress * 0.5);

                        gl_FragColor = vec4(color, alpha * 0.6);
                    }
                `,
                transparent: true,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });

            const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
            tunnel.rotation.x = Math.PI / 2;
            ship.mesh.add(tunnel);

            // Add particle stream
            const streamGeometry = new THREE.BufferGeometry();
            const streamPositions = new Float32Array(200 * 3);

            for (let i = 0; i < 200; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 15;

                streamPositions[i * 3] = Math.cos(angle) * radius;
                streamPositions[i * 3 + 1] = Math.random() * 50 - 25;
                streamPositions[i * 3 + 2] = Math.sin(angle) * radius;
            }

            streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));

            const streamMaterial = new THREE.PointsMaterial({
                color: 0x9933FF,
                size: 3,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });

            const stream = new THREE.Points(streamGeometry, streamMaterial);
            ship.mesh.add(stream);

            // Animation loop
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                if (tunnel && tunnel.material.uniforms) {
                    tunnel.material.uniforms.time.value = elapsed * 0.001;
                    tunnel.material.uniforms.progress.value = progress;
                }

                // Rotate tunnel
                if (tunnel) {
                    tunnel.rotation.z += 0.05;
                }

                // Move stream particles
                if (stream) {
                    const positions = stream.geometry.attributes.position.array;
                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i + 1] -= 2;
                        if (positions[i + 1] < -25) {
                            positions[i + 1] = 25;
                        }
                    }
                    stream.geometry.attributes.position.needsUpdate = true;
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Clean up
                    ship.mesh.remove(tunnel);
                    ship.mesh.remove(stream);
                    resolve();
                }
            };

            animate();
        });
    }

    // Link two wormholes together
    linkWormholes(wormhole1, wormhole2) {
        wormhole1.destination = wormhole2.position.clone();
        wormhole2.destination = wormhole1.position.clone();
    }

    // Generate wormhole network for star systems
    generateNetwork(starSystems) {
        const wormholes = [];

        starSystems.forEach((system, index) => {
            system.wormholes.forEach(wormholeData => {
                // Create wormhole mesh
                this.createWormholeMesh(wormholeData);
                wormholes.push(wormholeData);
            });
        });

        // Link wormholes randomly
        wormholes.forEach((wormhole, index) => {
            if (!wormhole.destination && index < wormholes.length - 1) {
                // Link to next system's wormhole
                const targetIndex = (index + 1 + Math.floor(Math.random() * 3)) % wormholes.length;
                if (targetIndex !== index && wormholes[targetIndex]) {
                    this.linkWormholes(wormhole, wormholes[targetIndex]);
                }
            }
        });

        return wormholes;
    }

    // Update all wormholes
    updateAll(deltaTime) {
        this.wormholes.forEach(wormhole => {
            this.updateWormhole(wormhole, deltaTime);
        });
    }
}
