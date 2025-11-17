// Utility functions for the game

const Utils = {
    // Random number generation
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    // Seeded random for procedural generation
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    },

    // Hash string to number for seeds
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    // Distance calculation
    distance(obj1, obj2) {
        const dx = obj1.position.x - obj2.position.x;
        const dy = obj1.position.y - obj2.position.y;
        const dz = obj1.position.z - obj2.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Linear interpolation
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    // Format numbers
    formatNumber(num) {
        return Math.floor(num).toLocaleString();
    },

    // Generate random color
    randomColor() {
        return new THREE.Color(
            this.random(0, 1),
            this.random(0, 1),
            this.random(0, 1)
        );
    },

    // Generate planet-appropriate color
    planetColor(type) {
        const colors = {
            'rocky': [0x8B7355, 0xA0826D, 0x8B4513],
            'ice': [0xE0FFFF, 0xB0E0E6, 0xAFEEEE],
            'desert': [0xEDC9AF, 0xD2B48C, 0xF4A460],
            'ocean': [0x006994, 0x0077BE, 0x4682B4],
            'lava': [0xFF4500, 0xFF6347, 0xDC143C],
            'gas': [0xFFDAB9, 0xF4A460, 0xDEB887],
            'terran': [0x2E8B57, 0x3CB371, 0x228B22]
        };
        const colorSet = colors[type] || colors['rocky'];
        return colorSet[this.randomInt(0, colorSet.length - 1)];
    },

    // Generate star color based on type
    starColor(type) {
        const colors = {
            'O': 0x9BB0FF,
            'B': 0xAABFFF,
            'A': 0xCAD7FF,
            'F': 0xF8F7FF,
            'G': 0xFFF4EA,
            'K': 0xFFD2A1,
            'M': 0xFFBD6F
        };
        return colors[type] || colors['G'];
    },

    // Create a simple spaceship geometry
    createShipGeometry() {
        const geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array([
            // Front point
            0, 0, 2,
            // Main body
            -0.5, 0, -1,
            0.5, 0, -1,
            0, 0.3, -1,
            0, -0.3, -1,
            // Wings
            -2, 0, 0,
            2, 0, 0,
        ]);

        const indices = [
            // Top
            0, 2, 3,
            0, 3, 1,
            // Bottom
            0, 1, 4,
            0, 4, 2,
            // Sides
            0, 2, 6,
            0, 1, 5,
            // Wings
            5, 1, 4,
            6, 2, 4,
            // Back
            1, 3, 4,
            2, 4, 3
        ];

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    },

    // Create particle system
    createParticleSystem(count, color, size) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            positions[i] = this.random(-1, 1);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Points(geometry, material);
    },

    // Generate unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    // Check if point is in sphere
    pointInSphere(point, center, radius) {
        return this.distance(point, center) <= radius;
    }
};
