// Space stations and outposts system

class StationSystem {
    constructor(scene) {
        this.scene = scene;
        this.stations = [];
        this.activeStation = null;
    }

    // Create physical station mesh
    createStationMesh(station) {
        const group = new THREE.Group();

        // Main hub (torus)
        const torusGeometry = new THREE.TorusGeometry(50, 15, 16, 32);
        const torusMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            metalness: 0.8,
            roughness: 0.2
        });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        group.add(torus);

        // Central sphere
        const sphereGeometry = new THREE.SphereGeometry(25, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0A0A0,
            metalness: 0.7,
            roughness: 0.3
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphere);

        // Docking arms
        const armGeometry = new THREE.CylinderGeometry(5, 5, 40, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x606060,
            metalness: 0.9,
            roughness: 0.1
        });

        for (let i = 0; i < 4; i++) {
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            const angle = (i / 4) * Math.PI * 2;
            arm.position.set(
                Math.cos(angle) * 50,
                0,
                Math.sin(angle) * 50
            );
            arm.rotation.z = Math.PI / 2;
            arm.rotation.y = angle;
            group.add(arm);

            // Docking port at end
            const portGeometry = new THREE.CylinderGeometry(8, 8, 5, 8);
            const portMaterial = new THREE.MeshStandardMaterial({
                color: 0x00FF00,
                emissive: 0x00FF00,
                emissiveIntensity: 0.5
            });
            const port = new THREE.Mesh(portGeometry, portMaterial);
            port.position.set(
                Math.cos(angle) * 70,
                0,
                Math.sin(angle) * 70
            );
            port.rotation.z = Math.PI / 2;
            group.add(port);
        }

        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(60, 20, 2);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x000080,
            metalness: 0.5,
            roughness: 0.5
        });

        for (let i = 0; i < 2; i++) {
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.y = i === 0 ? 40 : -40;
            group.add(panel);
        }

        // Lights
        const lightPositions = [
            [0, 35, 0],
            [0, -35, 0],
            [60, 0, 0],
            [-60, 0, 0]
        ];

        lightPositions.forEach(pos => {
            const light = new THREE.PointLight(0xFFFFFF, 1, 200);
            light.position.set(...pos);
            group.add(light);
        });

        // Rotating warning lights
        const warningGeometry = new THREE.SphereGeometry(2, 8, 8);
        const warningMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000
        });

        for (let i = 0; i < 8; i++) {
            const warning = new THREE.Mesh(warningGeometry, warningMaterial);
            const angle = (i / 8) * Math.PI * 2;
            warning.position.set(
                Math.cos(angle) * 55,
                15,
                Math.sin(angle) * 55
            );
            group.add(warning);
        }

        group.position.copy(station.position);
        group.userData.rotationSpeed = 0.0005;

        this.scene.add(group);
        station.mesh = group;

        return group;
    }

    // Update station (rotation, etc.)
    updateStation(station, deltaTime) {
        if (station.mesh) {
            station.mesh.rotation.y += station.mesh.userData.rotationSpeed * deltaTime;
        }

        // Update orbital position if orbiting planet
        if (station.planet) {
            station.orbitAngle += station.orbitSpeed * deltaTime;

            station.position.x = station.planet.position.x +
                Math.cos(station.orbitAngle) * station.planet.size * 2;
            station.position.z = station.planet.position.z +
                Math.sin(station.orbitAngle) * station.planet.size * 2;

            if (station.mesh) {
                station.mesh.position.copy(station.position);
            }
        }
    }

    // Check if ship is in docking range
    canDock(station, shipPosition) {
        const distance = station.position.distanceTo(shipPosition);
        return distance < 100;
    }

    // Dock with station
    dock(station, ship) {
        this.activeStation = station;
        return {
            success: true,
            message: `Docked at ${station.name}`
        };
    }

    // Undock from station
    undock() {
        const station = this.activeStation;
        this.activeStation = null;
        return {
            success: true,
            message: `Undocked from ${station.name}`
        };
    }

    // Generate trade inventory for station
    generateTradeInventory(station, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);

        const items = [];
        const resources = [
            { type: 'iron', basePrice: 10 },
            { type: 'copper', basePrice: 15 },
            { type: 'titanium', basePrice: 50 },
            { type: 'water', basePrice: 5 },
            { type: 'hydrogen', basePrice: 8 },
            { type: 'helium', basePrice: 12 },
            { type: 'organic', basePrice: 20 },
            { type: 'uranium', basePrice: 100 },
            { type: 'crystals', basePrice: 200 }
        ];

        resources.forEach((resource, i) => {
            const priceVariation = rng(i) * 0.4 - 0.2; // -20% to +20%
            const price = Math.floor(resource.basePrice * (1 + priceVariation));
            const stock = Math.floor(rng(i + 10) * 100) + 50;

            items.push({
                type: resource.type,
                buyPrice: price,
                sellPrice: Math.floor(price * 0.7),
                stock: stock
            });
        });

        // Add equipment
        const equipment = [
            { name: 'Mining Laser Mk2', type: 'mining', price: 500, upgrade: { miningRate: 2 } },
            { name: 'Shield Booster', type: 'shields', price: 800, upgrade: { maxShield: 150 } },
            { name: 'Cargo Expansion', type: 'cargo', price: 600, upgrade: { cargoHold: 150 } },
            { name: 'Engine Upgrade', type: 'engines', price: 1000, upgrade: { thrustPower: 75 } },
            { name: 'Plasma Cannon', type: 'weapons', price: 1200, upgrade: { damage: 20 } }
        ];

        equipment.forEach((item, i) => {
            if (rng(i + 20) > 0.3) {
                items.push(item);
            }
        });

        return items;
    }

    // Generate station missions
    generateMissions(station, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);
        const missions = [];

        const missionTypes = [
            {
                type: 'delivery',
                title: 'Cargo Delivery',
                description: 'Deliver cargo to another station',
                reward: 500
            },
            {
                type: 'mining',
                title: 'Resource Collection',
                description: 'Mine and deliver specific resources',
                reward: 300
            },
            {
                type: 'exploration',
                title: 'System Exploration',
                description: 'Explore and scan nearby planets',
                reward: 400
            },
            {
                type: 'combat',
                title: 'Pirate Elimination',
                description: 'Eliminate hostile ships in the sector',
                reward: 800
            },
            {
                type: 'rescue',
                title: 'Rescue Mission',
                description: 'Rescue stranded ship crew',
                reward: 600
            }
        ];

        const count = Math.floor(rng(1) * 3) + 2;

        for (let i = 0; i < count; i++) {
            const template = missionTypes[Math.floor(rng(i + 2) * missionTypes.length)];
            const rewardMultiplier = rng(i + 10) * 0.5 + 0.75; // 75% to 125%

            missions.push({
                id: Utils.generateId(),
                type: template.type,
                title: template.title,
                description: template.description,
                reward: Math.floor(template.reward * rewardMultiplier),
                station: station,
                active: false,
                completed: false,
                progress: 0,
                target: null
            });
        }

        return missions;
    }

    // Trade resources
    buyResource(station, ship, resourceType, amount, inventory) {
        const item = inventory.find(i => i.type === resourceType);
        if (!item) return { success: false, message: 'Resource not available' };

        const cost = item.buyPrice * amount;

        if (ship.credits < cost) {
            return { success: false, message: 'Insufficient credits' };
        }

        if (item.stock < amount) {
            return { success: false, message: 'Insufficient stock' };
        }

        if (!ship.addCargo(resourceType, amount)) {
            return { success: false, message: 'Insufficient cargo space' };
        }

        ship.credits -= cost;
        item.stock -= amount;

        return {
            success: true,
            message: `Purchased ${amount} ${resourceType} for ${cost} credits`
        };
    }

    sellResource(station, ship, resourceType, amount, inventory) {
        const item = inventory.find(i => i.type === resourceType);
        if (!item) return { success: false, message: 'Station not buying this resource' };

        if (!ship.removeCargo(resourceType, amount)) {
            return { success: false, message: 'Insufficient cargo' };
        }

        const income = item.sellPrice * amount;
        ship.credits += income;
        item.stock += amount;

        return {
            success: true,
            message: `Sold ${amount} ${resourceType} for ${income} credits`
        };
    }

    // Repair ship
    repairShip(ship, amount) {
        const repairCost = 5; // credits per hull point
        const maxRepair = ship.stats.maxHull - ship.stats.hull;
        const actualRepair = Math.min(amount, maxRepair);
        const cost = actualRepair * repairCost;

        if (ship.credits < cost) {
            return { success: false, message: 'Insufficient credits for repair' };
        }

        ship.credits -= cost;
        ship.repair(actualRepair);

        return {
            success: true,
            message: `Repaired ${actualRepair} hull points for ${cost} credits`
        };
    }

    // Refuel ship
    refuelShip(ship, amount) {
        const fuelCost = 2; // credits per fuel unit
        const maxRefuel = ship.stats.maxFuel - ship.stats.fuel;
        const actualRefuel = Math.min(amount, maxRefuel);
        const cost = actualRefuel * fuelCost;

        if (ship.credits < cost) {
            return { success: false, message: 'Insufficient credits for fuel' };
        }

        ship.credits -= cost;
        ship.refuel(actualRefuel);

        return {
            success: true,
            message: `Refueled ${actualRefuel} units for ${cost} credits`
        };
    }
}
