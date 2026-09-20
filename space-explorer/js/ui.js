// UI system for HUD, menus, and interactions

class UISystem {
    constructor(game) {
        this.game = game;
        this.messageTimeout = null;
        this.radarBlips = [];
    }

    // Update HUD
    updateHUD() {
        const ship = this.game.ship;

        // Ship status
        this.updateBar('hull-bar', ship.stats.hull, ship.stats.maxHull);
        this.updateBar('shield-bar', ship.stats.shield, ship.stats.maxShield);
        this.updateBar('energy-bar', ship.stats.energy, ship.stats.maxEnergy);
        this.updateBar('fuel-bar', ship.stats.fuel, ship.stats.maxFuel);

        document.getElementById('hull-value').textContent = Math.floor(ship.stats.hull) + '%';
        document.getElementById('shield-value').textContent = Math.floor(ship.stats.shield) + '%';
        document.getElementById('energy-value').textContent = Math.floor(ship.stats.energy) + '%';
        document.getElementById('fuel-value').textContent = Math.floor(ship.stats.fuel) + '%';

        // Navigation
        document.getElementById('speed').textContent = Utils.formatNumber(ship.getSpeed());

        // Get closest planet for altitude
        const closestPlanet = this.getClosestPlanet();
        if (closestPlanet && Utils.distance(ship.mesh, closestPlanet.mesh) < closestPlanet.size * 5) {
            const altitude = this.game.planetarySystem.getAltitude(closestPlanet, ship.getPosition());
            document.getElementById('altitude').textContent = Utils.formatNumber(altitude) + 'm';
        } else {
            document.getElementById('altitude').textContent = 'N/A';
        }

        // Sector
        const sector = this.getCurrentSector(ship.getPosition());
        document.getElementById('sector').textContent = sector;

        // Target
        if (ship.target) {
            document.getElementById('target').textContent = ship.target.speciesData ?
                ship.target.speciesData.name : 'Object';
        } else {
            document.getElementById('target').textContent = 'None';
        }

        // Cargo
        document.getElementById('cargo-current').textContent = ship.getTotalCargo();
        document.getElementById('cargo-max').textContent = ship.equipment.cargoHold;

        // Update cargo list
        this.updateCargoList();

        // Credits
        document.getElementById('credits').textContent = Utils.formatNumber(ship.credits);

        // Update radar
        this.updateRadar();
    }

    updateBar(id, current, max) {
        const percentage = (current / max) * 100;
        const bar = document.getElementById(id);
        if (bar) {
            bar.style.width = percentage + '%';
        }
    }

    updateCargoList() {
        const cargoList = document.getElementById('cargo-list');
        cargoList.innerHTML = '';

        this.game.ship.cargo.forEach((amount, type) => {
            if (amount > 0) {
                const item = document.createElement('div');
                item.className = 'cargo-item';
                item.innerHTML = `
                    <span>${type}</span>
                    <span>${Utils.formatNumber(amount)}</span>
                `;
                cargoList.appendChild(item);
            }
        });
    }

    updateRadar() {
        const radar = document.getElementById('radar');
        const shipPos = this.game.ship.getPosition();
        const radarRange = 500;

        // Clear old blips
        this.radarBlips.forEach(blip => blip.remove());
        this.radarBlips = [];

        // Add alien blips
        this.game.alienSystem.aliens.forEach(alien => {
            if (!alien.mesh) return;

            const distance = Utils.distance(alien.mesh, this.game.ship.mesh);
            if (distance < radarRange) {
                this.addRadarBlip(shipPos, alien.mesh.position, alien.speciesData.behavior, radarRange);
            }
        });

        // Add station blips
        this.game.generator.starSystems.forEach(system => {
            system.stations.forEach(station => {
                const distance = shipPos.distanceTo(station.position);
                if (distance < radarRange) {
                    this.addRadarBlip(shipPos, station.position, 'neutral', radarRange);
                }
            });
        });
    }

    addRadarBlip(shipPos, targetPos, type, range) {
        const radar = document.getElementById('radar');

        const relative = new THREE.Vector3().subVectors(targetPos, shipPos);
        const distance = relative.length();

        if (distance > range) return;

        // Project to 2D radar
        const x = (relative.x / range) * 75 + 75; // 75 is half radar size
        const y = (relative.z / range) * 75 + 75;

        const blip = document.createElement('div');
        blip.className = 'radar-blip';

        if (type === 'hostile') {
            blip.classList.add('enemy');
        } else if (type === 'peaceful' || type === 'curious') {
            blip.classList.add('friendly');
        } else {
            blip.classList.add('neutral');
        }

        blip.style.left = x + 'px';
        blip.style.top = y + 'px';

        radar.appendChild(blip);
        this.radarBlips.push(blip);
    }

    getClosestPlanet() {
        let closest = null;
        let closestDist = Infinity;

        this.game.generator.starSystems.forEach(system => {
            system.planets.forEach(planet => {
                const dist = Utils.distance(this.game.ship.mesh, planet.mesh);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = planet;
                }
            });
        });

        return closest;
    }

    getCurrentSector(position) {
        const sectorSize = 10000;
        const x = Math.floor(position.x / sectorSize);
        const z = Math.floor(position.z / sectorSize);
        return `${x},${z}`;
    }

    // Show message
    showMessage(text, type = 'info', duration = 3000) {
        const messageLog = document.getElementById('message-log');

        const message = document.createElement('div');
        message.className = 'message';
        if (type === 'warning') message.classList.add('warning');
        if (type === 'danger') message.classList.add('danger');
        message.textContent = text;

        messageLog.appendChild(message);

        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, duration);
    }

    // Inventory menu
    openInventory() {
        document.getElementById('inventory-menu').classList.remove('hidden');
        this.updateInventoryMenu();
    }

    closeInventory() {
        document.getElementById('inventory-menu').classList.add('hidden');
    }

    updateInventoryMenu() {
        const equipmentList = document.getElementById('equipment-list');
        const cargoList = document.getElementById('inventory-cargo-list');

        // Equipment
        equipmentList.innerHTML = '<h4>Installed Equipment</h4>';
        Object.entries(this.game.ship.equipment).forEach(([slot, item]) => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-header">
                    <span>${slot}</span>
                    <span>${item}</span>
                </div>
            `;
            equipmentList.appendChild(div);
        });

        // Cargo
        cargoList.innerHTML = '<h4>Cargo Hold</h4>';
        this.game.ship.cargo.forEach((amount, type) => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <div class="item-header">
                    <span>${type}</span>
                    <span>${Utils.formatNumber(amount)} units</span>
                </div>
            `;
            cargoList.appendChild(div);
        });
    }

    // Mission menu
    openMissions() {
        document.getElementById('mission-menu').classList.remove('hidden');
        this.updateMissionsMenu();
    }

    closeMissions() {
        document.getElementById('mission-menu').classList.add('hidden');
    }

    updateMissionsMenu() {
        const missionList = document.getElementById('mission-list');
        missionList.innerHTML = '';

        // Active missions
        if (this.game.missionSystem.activeMissions.length > 0) {
            const header = document.createElement('h3');
            header.textContent = 'Active Missions';
            missionList.appendChild(header);

            this.game.missionSystem.activeMissions.forEach(mission => {
                const div = document.createElement('div');
                div.className = 'mission-item active';
                div.innerHTML = `
                    <div class="item-header">
                        <strong>${mission.title}</strong>
                    </div>
                    <div class="item-description">${mission.description}</div>
                    <div style="margin-top: 10px; white-space: pre-line;">
                        ${this.game.missionSystem.getMissionProgressText(mission)}
                    </div>
                    <div class="mission-reward">
                        Reward: ${mission.reward.credits} credits
                        ${mission.reward.reputation ? ' + ' + mission.reward.reputation + ' rep' : ''}
                    </div>
                `;
                missionList.appendChild(div);
            });
        }

        // Completed missions
        if (this.game.missionSystem.completedMissions.length > 0) {
            const header = document.createElement('h3');
            header.textContent = 'Completed Missions';
            missionList.appendChild(header);

            this.game.missionSystem.completedMissions.forEach(mission => {
                const div = document.createElement('div');
                div.className = 'mission-item completed';
                div.innerHTML = `
                    <div class="item-header">
                        <strong>${mission.title}</strong>
                        <span>✓</span>
                    </div>
                `;
                missionList.appendChild(div);
            });
        }
    }

    // Upgrades menu
    openUpgrades() {
        document.getElementById('upgrade-menu').classList.remove('hidden');
        this.updateUpgradesMenu();
    }

    closeUpgrades() {
        document.getElementById('upgrade-menu').classList.add('hidden');
    }

    updateUpgradesMenu() {
        const upgradeList = document.getElementById('upgrade-list');
        upgradeList.innerHTML = '';

        const upgrades = [
            { name: 'Hull Reinforcement', cost: 500, stat: 'maxHull', value: 150, desc: 'Increase max hull to 150' },
            { name: 'Shield Upgrade', cost: 800, stat: 'maxShield', value: 150, desc: 'Increase max shield to 150' },
            { name: 'Engine Boost', cost: 1000, stat: 'thrustPower', value: 75, desc: 'Increase thrust power' },
            { name: 'Cargo Expansion', cost: 600, stat: 'cargoHold', value: 200, desc: 'Increase cargo capacity' },
            { name: 'Weapon Upgrade', cost: 1200, stat: 'weaponDamage', value: 20, desc: 'Increase weapon damage' },
            { name: 'Mining Laser Mk2', cost: 700, stat: 'miningRate', value: 2, desc: 'Faster mining' }
        ];

        upgrades.forEach(upgrade => {
            const div = document.createElement('div');
            div.className = 'upgrade-item';

            const canAfford = this.game.ship.credits >= upgrade.cost;
            if (!canAfford) div.classList.add('locked');

            div.innerHTML = `
                <strong>${upgrade.name}</strong>
                <div class="item-description">${upgrade.desc}</div>
                <div class="upgrade-cost">${upgrade.cost} credits</div>
            `;

            if (canAfford) {
                div.onclick = () => {
                    this.purchaseUpgrade(upgrade);
                };
            }

            upgradeList.appendChild(div);
        });
    }

    purchaseUpgrade(upgrade) {
        if (this.game.ship.credits < upgrade.cost) {
            this.showMessage('Insufficient credits', 'warning');
            return;
        }

        this.game.ship.credits -= upgrade.cost;

        if (upgrade.stat === 'cargoHold') {
            this.game.ship.equipment.cargoHold = upgrade.value;
        } else if (upgrade.stat === 'miningRate') {
            this.game.ship.mining.rate = upgrade.value;
        } else if (upgrade.stat === 'weaponDamage') {
            this.game.ship.weapons.damage = upgrade.value;
        } else {
            this.game.ship.stats[upgrade.stat] = upgrade.value;
        }

        this.showMessage(`Purchased: ${upgrade.name}`, 'info');
        this.updateUpgradesMenu();
    }

    // Station menu
    openStation(station) {
        document.getElementById('station-menu').classList.remove('hidden');
        document.getElementById('station-name').textContent = station.name;
        this.currentStation = station;
        this.showStationTab('trade');
    }

    closeStation() {
        document.getElementById('station-menu').classList.add('hidden');
        this.currentStation = null;
    }

    showStationTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event?.target.classList.add('active');

        const content = document.getElementById('station-content');

        switch (tab) {
            case 'trade':
                this.showTradeTab(content);
                break;
            case 'missions':
                this.showMissionsTab(content);
                break;
            case 'repair':
                this.showRepairTab(content);
                break;
        }
    }

    showTradeTab(content) {
        const inventory = this.game.stationSystem.generateTradeInventory(
            this.currentStation,
            Utils.hashString(this.currentStation.name)
        );

        content.innerHTML = '<h3>Trade Goods</h3><div class="trade-grid" id="trade-grid"></div>';
        const grid = content.querySelector('#trade-grid');

        inventory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'trade-item';
            div.innerHTML = `
                <strong>${item.type || item.name}</strong>
                ${item.stock ? `<p>Stock: ${item.stock}</p>` : ''}
                <p>Buy: ${item.buyPrice || item.price} cr</p>
                ${item.sellPrice ? `<p>Sell: ${item.sellPrice} cr</p>` : ''}
            `;
            grid.appendChild(div);
        });
    }

    showMissionsTab(content) {
        const missions = this.game.stationSystem.generateMissions(
            this.currentStation,
            Utils.hashString(this.currentStation.name + '_missions')
        );

        content.innerHTML = '<h3>Available Missions</h3>';

        missions.forEach(mission => {
            const div = document.createElement('div');
            div.className = 'mission-item';
            div.innerHTML = `
                <div class="item-header"><strong>${mission.title}</strong></div>
                <div class="item-description">${mission.description}</div>
                <div class="mission-reward">Reward: ${mission.reward} credits</div>
            `;
            div.onclick = () => {
                const result = this.game.missionSystem.acceptMission(mission);
                this.showMessage(result.message, result.success ? 'info' : 'warning');
            };
            content.appendChild(div);
        });
    }

    showRepairTab(content) {
        content.innerHTML = `
            <h3>Repair & Refuel</h3>
            <div style="margin: 20px 0;">
                <button class="interaction-option" onclick="game.ui.repairShip()">
                    Repair Hull (Full) - ${Math.floor((this.game.ship.stats.maxHull - this.game.ship.stats.hull) * 5)} cr
                </button>
                <button class="interaction-option" onclick="game.ui.refuelShip()">
                    Refuel (Full) - ${Math.floor((this.game.ship.stats.maxFuel - this.game.ship.stats.fuel) * 2)} cr
                </button>
            </div>
        `;
    }

    repairShip() {
        const result = this.game.stationSystem.repairShip(
            this.game.ship,
            this.game.ship.stats.maxHull - this.game.ship.stats.hull
        );
        this.showMessage(result.message, result.success ? 'info' : 'warning');
    }

    refuelShip() {
        const result = this.game.stationSystem.refuelShip(
            this.game.ship,
            this.game.ship.stats.maxFuel - this.game.ship.stats.fuel
        );
        this.showMessage(result.message, result.success ? 'info' : 'warning');
    }

    // Interaction menu
    showInteraction(title, text, options) {
        const menu = document.getElementById('interaction-menu');
        menu.classList.remove('hidden');

        document.getElementById('interaction-title').textContent = title;
        document.getElementById('interaction-text').textContent = text;

        const optionsDiv = document.getElementById('interaction-options');
        optionsDiv.innerHTML = '';

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'interaction-option';
            button.textContent = option.text;
            button.onclick = () => {
                option.action();
                this.closeInteraction();
            };
            optionsDiv.appendChild(button);
        });
    }

    closeInteraction() {
        document.getElementById('interaction-menu').classList.add('hidden');
    }
}
