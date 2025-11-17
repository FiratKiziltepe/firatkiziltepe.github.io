// Combat system with weapon effects

class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.explosions = [];
    }

    // Check projectile collisions
    checkProjectileCollisions(ship, aliens) {
        const hits = [];

        // Check ship projectiles vs aliens
        ship.weapons.projectiles.forEach((projectile, pIndex) => {
            aliens.forEach((alien, aIndex) => {
                if (!alien.mesh) return;

                const distance = projectile.position.distanceTo(alien.mesh.position);

                if (distance < 10) {
                    // Hit!
                    hits.push({
                        type: 'ship_hit_alien',
                        projectile: projectile,
                        projectileIndex: pIndex,
                        target: alien,
                        targetIndex: aIndex,
                        position: projectile.position.clone()
                    });
                }
            });
        });

        // Process hits
        hits.forEach(hit => {
            this.createExplosion(hit.position, 5, 0xFF6600);

            // Remove projectile
            this.scene.remove(hit.projectile);
            ship.weapons.projectiles.splice(hit.projectileIndex, 1);

            // Damage alien
            const destroyed = this.damageTarget(hit.target, hit.projectile.userData.damage);

            if (destroyed) {
                this.createExplosion(hit.target.mesh.position, 15, hit.target.speciesData.color);
                // Drop loot handled by alien system
            }
        });

        return hits;
    }

    // Damage a target
    damageTarget(target, amount) {
        if (target.health !== undefined) {
            target.health -= amount;

            // Visual feedback
            if (target.mesh && target.mesh.material) {
                const originalColor = target.mesh.material.color.clone();
                target.mesh.material.color.set(0xFF0000);

                setTimeout(() => {
                    if (target.mesh && target.mesh.material) {
                        target.mesh.material.color.copy(originalColor);
                    }
                }, 100);
            }

            return target.health <= 0;
        }

        return false;
    }

    // Create explosion effect
    createExplosion(position, size, color) {
        // Flash sphere
        const flashGeometry = new THREE.SphereGeometry(size, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });

        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);

        // Expanding ring
        const ringGeometry = new THREE.RingGeometry(size * 0.5, size * 0.7, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.lookAt(position.clone().add(new THREE.Vector3(0, 1, 0)));
        this.scene.add(ring);

        // Particles
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = position.x;
            particlePositions[i * 3 + 1] = position.y;
            particlePositions[i * 3 + 2] = position.z;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * size * 2,
                (Math.random() - 0.5) * size * 2,
                (Math.random() - 0.5) * size * 2
            );
            particleVelocities.push(velocity);
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: size * 0.3,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);

        // Light
        const light = new THREE.PointLight(color, 3, size * 10);
        light.position.copy(position);
        this.scene.add(light);

        const explosion = {
            flash: flash,
            ring: ring,
            particles: particles,
            light: light,
            velocities: particleVelocities,
            createdAt: Date.now(),
            lifetime: 1000,
            size: size
        };

        this.explosions.push(explosion);
    }

    // Update explosions
    updateExplosions(deltaTime) {
        const now = Date.now();

        this.explosions = this.explosions.filter(explosion => {
            const age = now - explosion.createdAt;
            const progress = age / explosion.lifetime;

            if (progress >= 1) {
                // Remove explosion
                this.scene.remove(explosion.flash);
                this.scene.remove(explosion.ring);
                this.scene.remove(explosion.particles);
                this.scene.remove(explosion.light);
                return false;
            }

            // Animate flash
            explosion.flash.scale.setScalar(1 + progress * 2);
            explosion.flash.material.opacity = 1 - progress;

            // Animate ring
            explosion.ring.scale.setScalar(1 + progress * 3);
            explosion.ring.material.opacity = 0.8 * (1 - progress);

            // Animate particles
            const positions = explosion.particles.geometry.attributes.position.array;
            explosion.velocities.forEach((velocity, i) => {
                positions[i * 3] += velocity.x * deltaTime / 1000;
                positions[i * 3 + 1] += velocity.y * deltaTime / 1000;
                positions[i * 3 + 2] += velocity.z * deltaTime / 1000;
            });
            explosion.particles.geometry.attributes.position.needsUpdate = true;
            explosion.particles.material.opacity = 1 - progress;

            // Fade light
            explosion.light.intensity = 3 * (1 - progress);

            return true;
        });
    }

    // Create shield hit effect
    createShieldHit(position, normal, color = 0x00FFFF) {
        const geometry = new THREE.RingGeometry(3, 5, 16);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.lookAt(position.clone().add(normal));
        this.scene.add(ring);

        // Animate and remove
        const startTime = Date.now();
        const duration = 300;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                ring.scale.setScalar(1 + progress * 2);
                ring.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
            }
        };

        animate();
    }

    // Create laser beam effect
    createLaserBeam(start, end, color = 0x00FF00, duration = 100) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const distance = direction.length();
        direction.normalize();

        const geometry = new THREE.CylinderGeometry(0.3, 0.3, distance, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            emissive: color,
            emissiveIntensity: 1
        });

        const beam = new THREE.Mesh(geometry, material);
        beam.position.copy(start).add(direction.clone().multiplyScalar(distance / 2));
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        this.scene.add(beam);

        // Remove after duration
        setTimeout(() => {
            this.scene.remove(beam);
        }, duration);

        return beam;
    }

    // Create missile trail effect
    createMissileTrail(position, color = 0xFF6600) {
        const geometry = new THREE.SphereGeometry(1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const trail = new THREE.Mesh(geometry, material);
        trail.position.copy(position);
        this.scene.add(trail);

        // Fade out
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                trail.material.opacity = 0.6 * (1 - progress);
                trail.scale.setScalar(1 + progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(trail);
            }
        };

        animate();
    }

    // Apply area damage
    applyAreaDamage(center, radius, damage, targets) {
        const affected = [];

        targets.forEach(target => {
            if (!target.mesh) return;

            const distance = target.mesh.position.distanceTo(center);

            if (distance < radius) {
                const damageRatio = 1 - (distance / radius);
                const actualDamage = damage * damageRatio;

                const destroyed = this.damageTarget(target, actualDamage);

                affected.push({
                    target: target,
                    damage: actualDamage,
                    destroyed: destroyed
                });

                if (destroyed) {
                    this.createExplosion(target.mesh.position, 10, 0xFF3300);
                }
            }
        });

        return affected;
    }

    // Lock on target
    lockTarget(ship, targets) {
        if (targets.length === 0) return null;

        let closest = null;
        let closestDist = Infinity;

        targets.forEach(target => {
            if (!target.mesh) return;

            const distance = Utils.distance(ship.mesh, target.mesh);

            // Check if in front of ship
            const toTarget = new THREE.Vector3()
                .subVectors(target.mesh.position, ship.mesh.position)
                .normalize();

            const shipDirection = ship.getDirection();
            const angle = toTarget.dot(shipDirection);

            if (angle > 0.7 && distance < closestDist) { // Within ~45 degree cone
                closestDist = distance;
                closest = target;
            }
        });

        return closest;
    }

    // Create target lock indicator
    createTargetLockIndicator(target) {
        const size = 8;

        const geometry = new THREE.RingGeometry(size * 0.8, size, 4, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        const indicator = new THREE.Mesh(geometry, material);
        indicator.rotation.x = Math.PI / 2;

        target.mesh.add(indicator);

        // Animate rotation
        const animate = () => {
            if (indicator.parent) {
                indicator.rotation.z += 0.05;
                requestAnimationFrame(animate);
            }
        };

        animate();

        return indicator;
    }
}
