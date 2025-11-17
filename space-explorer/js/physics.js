// Newtonian physics engine for spacecraft

class PhysicsEngine {
    constructor() {
        this.gravity = 9.81;
        this.objects = [];
    }

    // Add object to physics simulation
    addObject(obj) {
        if (!obj.physics) {
            obj.physics = {
                velocity: new THREE.Vector3(0, 0, 0),
                acceleration: new THREE.Vector3(0, 0, 0),
                angularVelocity: new THREE.Vector3(0, 0, 0),
                mass: obj.mass || 1,
                drag: obj.drag || 0.99,
                angularDrag: obj.angularDrag || 0.95
            };
        }
        this.objects.push(obj);
    }

    // Remove object from simulation
    removeObject(obj) {
        const index = this.objects.indexOf(obj);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    // Apply force to object
    applyForce(obj, force) {
        if (!obj.physics) return;

        const acceleration = force.clone().divideScalar(obj.physics.mass);
        obj.physics.acceleration.add(acceleration);
    }

    // Apply impulse (instant velocity change)
    applyImpulse(obj, impulse) {
        if (!obj.physics) return;

        const velocityChange = impulse.clone().divideScalar(obj.physics.mass);
        obj.physics.velocity.add(velocityChange);
    }

    // Apply torque for rotation
    applyTorque(obj, torque) {
        if (!obj.physics) return;

        obj.physics.angularVelocity.add(torque);
    }

    // Calculate gravitational force between two objects
    calculateGravity(obj1, obj2) {
        const G = 0.0001; // Gravitational constant (scaled for game)
        const distance = Utils.distance(obj1, obj2);

        if (distance < 0.1) return new THREE.Vector3(0, 0, 0);

        const forceMagnitude = (G * obj1.physics.mass * obj2.physics.mass) / (distance * distance);

        const direction = new THREE.Vector3()
            .subVectors(obj2.position, obj1.position)
            .normalize();

        return direction.multiplyScalar(forceMagnitude);
    }

    // Update physics for all objects
    update(deltaTime) {
        // Convert deltaTime from ms to seconds and cap it
        const dt = Math.min(deltaTime / 1000, 0.1);

        this.objects.forEach(obj => {
            if (!obj.physics) return;

            const p = obj.physics;

            // Apply drag
            p.velocity.multiplyScalar(p.drag);
            p.angularVelocity.multiplyScalar(p.angularDrag);

            // Update velocity from acceleration
            p.velocity.add(p.acceleration.clone().multiplyScalar(dt));

            // Update position from velocity
            obj.position.add(p.velocity.clone().multiplyScalar(dt));

            // Update rotation from angular velocity
            obj.rotation.x += p.angularVelocity.x * dt;
            obj.rotation.y += p.angularVelocity.y * dt;
            obj.rotation.z += p.angularVelocity.z * dt;

            // Reset acceleration
            p.acceleration.set(0, 0, 0);
        });
    }

    // Check collision between sphere objects
    checkSphereCollision(obj1, radius1, obj2, radius2) {
        const distance = Utils.distance(obj1, obj2);
        return distance < (radius1 + radius2);
    }

    // Resolve collision between two objects
    resolveCollision(obj1, obj2, restitution = 0.5) {
        if (!obj1.physics || !obj2.physics) return;

        const normal = new THREE.Vector3()
            .subVectors(obj2.position, obj1.position)
            .normalize();

        const relativeVelocity = new THREE.Vector3()
            .subVectors(obj1.physics.velocity, obj2.physics.velocity);

        const velocityAlongNormal = relativeVelocity.dot(normal);

        // Don't resolve if objects are separating
        if (velocityAlongNormal > 0) return;

        // Calculate impulse scalar
        const impulseMagnitude = -(1 + restitution) * velocityAlongNormal /
            (1 / obj1.physics.mass + 1 / obj2.physics.mass);

        const impulse = normal.multiplyScalar(impulseMagnitude);

        // Apply impulse
        obj1.physics.velocity.add(impulse.clone().divideScalar(obj1.physics.mass));
        obj2.physics.velocity.sub(impulse.clone().divideScalar(obj2.physics.mass));
    }

    // Calculate orbital velocity for circular orbit
    getOrbitalVelocity(objectMass, orbitRadius) {
        const G = 0.0001;
        return Math.sqrt((G * objectMass) / orbitRadius);
    }

    // Get velocity needed to escape gravity well
    getEscapeVelocity(objectMass, distance) {
        const G = 0.0001;
        return Math.sqrt((2 * G * objectMass) / distance);
    }
}
