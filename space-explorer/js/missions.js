// Mission system with story elements

class MissionSystem {
    constructor() {
        this.missions = [];
        this.activeMissions = [];
        this.completedMissions = [];
        this.storyProgress = 0;
    }

    // Generate story missions
    generateStoryMissions() {
        const story = [
            {
                id: 'story_1',
                title: 'First Contact',
                description: 'Investigate a mysterious signal coming from the nearby asteroid field.',
                type: 'exploration',
                objectives: [
                    { type: 'visit', target: 'asteroid_field', description: 'Visit the asteroid field', completed: false },
                    { type: 'scan', count: 3, current: 0, description: 'Scan 3 asteroids', completed: false }
                ],
                reward: { credits: 500, reputation: 10 },
                unlocks: 'story_2',
                dialogue: {
                    start: 'Commander, we\'re detecting an unusual signal from the asteroid field. It doesn\'t match any known patterns.',
                    progress: 'Keep scanning, Commander. We need more data.',
                    complete: 'Fascinating! This technology is definitely not of human origin. We need to investigate further.'
                }
            },
            {
                id: 'story_2',
                title: 'Ancient Technology',
                description: 'Meet with the Explorers to discuss the alien technology.',
                type: 'dialogue',
                objectives: [
                    { type: 'meet', target: 'explorer_ship', description: 'Meet with Explorer ship', completed: false }
                ],
                reward: { credits: 300, item: 'ancient_scanner' },
                unlocks: 'story_3',
                requiredMission: 'story_1',
                dialogue: {
                    start: 'The Explorers have agreed to meet with us. They may have information about this technology.',
                    complete: 'The Explorers confirm our suspicions - this is Guardian technology. They\'ve given us a scanner to help locate more artifacts.'
                }
            },
            {
                id: 'story_3',
                title: 'Guardian Artifacts',
                description: 'Locate and collect 3 Guardian artifacts using the ancient scanner.',
                type: 'collection',
                objectives: [
                    { type: 'collect', item: 'guardian_artifact', count: 3, current: 0, description: 'Collect Guardian artifacts', completed: false }
                ],
                reward: { credits: 1000, reputation: 25 },
                unlocks: 'story_4',
                requiredMission: 'story_2',
                dialogue: {
                    start: 'Use the scanner to locate Guardian artifacts. Be careful - the Guardians may not appreciate us taking their technology.',
                    progress: 'Good work, Commander. Keep searching.',
                    complete: 'Excellent! These artifacts will help us understand the Guardians better. But I fear we may have attracted their attention...'
                }
            },
            {
                id: 'story_4',
                title: 'The Guardian Challenge',
                description: 'Prove yourself to the Guardians by completing their challenge.',
                type: 'combat',
                objectives: [
                    { type: 'survive', duration: 180000, description: 'Survive Guardian trial (3 minutes)', completed: false },
                    { type: 'defeat', target: 'guardian', count: 2, current: 0, description: 'Defeat 2 Guardian ships', completed: false }
                ],
                reward: { credits: 2000, reputation: 50, item: 'guardian_wormhole_key' },
                unlocks: 'story_5',
                requiredMission: 'story_3',
                dialogue: {
                    start: 'The Guardians have issued a challenge. If we succeed, they\'ll grant us access to their wormhole network.',
                    progress: 'Stay focused, Commander!',
                    complete: 'Impressive, Commander! The Guardians have accepted us. We now have access to their ancient wormhole network!'
                }
            }
        ];

        return story;
    }

    // Generate random missions
    generateRandomMission(station, seed) {
        const rng = (offset) => Utils.seededRandom(seed + offset);

        const templates = [
            {
                type: 'delivery',
                titles: ['Cargo Delivery', 'Supply Run', 'Emergency Supplies'],
                generate: () => ({
                    objectives: [
                        {
                            type: 'deliver',
                            item: ['medical_supplies', 'food', 'equipment'][Math.floor(rng(1) * 3)],
                            amount: Math.floor(rng(2) * 50) + 20,
                            destination: 'random_station',
                            description: 'Deliver cargo to destination',
                            completed: false
                        }
                    ],
                    reward: { credits: Math.floor(rng(3) * 300) + 200 }
                })
            },
            {
                type: 'mining',
                titles: ['Resource Collection', 'Mining Operation', 'Mineral Extraction'],
                generate: () => {
                    const resources = ['iron', 'copper', 'titanium', 'crystals'];
                    const resource = resources[Math.floor(rng(4) * resources.length)];
                    return {
                        objectives: [
                            {
                                type: 'mine',
                                resource: resource,
                                amount: Math.floor(rng(5) * 100) + 50,
                                current: 0,
                                description: `Mine ${resource}`,
                                completed: false
                            }
                        ],
                        reward: { credits: Math.floor(rng(6) * 400) + 300 }
                    };
                }
            },
            {
                type: 'combat',
                titles: ['Pirate Threat', 'Clear the Sector', 'Bounty Hunt'],
                generate: () => ({
                    objectives: [
                        {
                            type: 'defeat',
                            target: 'pirate',
                            count: Math.floor(rng(7) * 3) + 2,
                            current: 0,
                            description: 'Eliminate pirate ships',
                            completed: false
                        }
                    ],
                    reward: { credits: Math.floor(rng(8) * 600) + 500 }
                })
            },
            {
                type: 'exploration',
                titles: ['System Survey', 'Exploration Mission', 'Mapping Operation'],
                generate: () => ({
                    objectives: [
                        {
                            type: 'scan',
                            count: Math.floor(rng(9) * 5) + 3,
                            current: 0,
                            description: 'Scan celestial objects',
                            completed: false
                        },
                        {
                            type: 'travel',
                            distance: Math.floor(rng(10) * 5000) + 3000,
                            current: 0,
                            description: 'Travel distance',
                            completed: false
                        }
                    ],
                    reward: { credits: Math.floor(rng(11) * 500) + 400 }
                })
            },
            {
                type: 'rescue',
                titles: ['Rescue Mission', 'Distress Call', 'Emergency Response'],
                generate: () => ({
                    objectives: [
                        {
                            type: 'rescue',
                            target: 'stranded_ship',
                            location: 'random',
                            timelimit: 600000, // 10 minutes
                            description: 'Rescue stranded crew',
                            completed: false
                        }
                    ],
                    reward: { credits: Math.floor(rng(12) * 700) + 600, reputation: 15 }
                })
            }
        ];

        const template = templates[Math.floor(rng(13) * templates.length)];
        const generated = template.generate();

        return {
            id: Utils.generateId(),
            type: template.type,
            title: template.titles[Math.floor(rng(14) * template.titles.length)],
            description: this.generateMissionDescription(template.type, generated.objectives),
            station: station,
            objectives: generated.objectives,
            reward: generated.reward,
            active: false,
            completed: false,
            startTime: null
        };
    }

    generateMissionDescription(type, objectives) {
        const descriptions = {
            'delivery': `Deliver cargo safely to the destination station.`,
            'mining': `Mine the specified resources and return them.`,
            'combat': `Eliminate hostile targets in the sector.`,
            'exploration': `Explore and scan the designated area.`,
            'rescue': `Respond to distress call and rescue stranded crew.`
        };

        return descriptions[type] || 'Complete the mission objectives.';
    }

    // Accept mission
    acceptMission(mission) {
        if (mission.requiredMission && !this.isCompleted(mission.requiredMission)) {
            return {
                success: false,
                message: 'Required mission not completed'
            };
        }

        mission.active = true;
        mission.startTime = Date.now();
        this.activeMissions.push(mission);

        return {
            success: true,
            message: `Mission accepted: ${mission.title}`,
            dialogue: mission.dialogue ? mission.dialogue.start : null
        };
    }

    // Update mission progress
    updateMissionProgress(type, data) {
        this.activeMissions.forEach(mission => {
            mission.objectives.forEach(objective => {
                if (objective.completed) return;

                switch (objective.type) {
                    case 'mine':
                        if (type === 'mine' && data.resource === objective.resource) {
                            objective.current = (objective.current || 0) + data.amount;
                            if (objective.current >= objective.amount) {
                                objective.completed = true;
                            }
                        }
                        break;

                    case 'defeat':
                        if (type === 'defeat' && data.target === objective.target) {
                            objective.current = (objective.current || 0) + 1;
                            if (objective.current >= objective.count) {
                                objective.completed = true;
                            }
                        }
                        break;

                    case 'scan':
                        if (type === 'scan') {
                            objective.current = (objective.current || 0) + 1;
                            if (objective.current >= objective.count) {
                                objective.completed = true;
                            }
                        }
                        break;

                    case 'collect':
                        if (type === 'collect' && data.item === objective.item) {
                            objective.current = (objective.current || 0) + data.amount;
                            if (objective.current >= objective.count) {
                                objective.completed = true;
                            }
                        }
                        break;

                    case 'travel':
                        if (type === 'travel') {
                            objective.current = (objective.current || 0) + data.distance;
                            if (objective.current >= objective.distance) {
                                objective.completed = true;
                            }
                        }
                        break;

                    case 'visit':
                        if (type === 'visit' && data.location === objective.target) {
                            objective.completed = true;
                        }
                        break;

                    case 'deliver':
                        if (type === 'deliver' && data.location === objective.destination) {
                            objective.completed = true;
                        }
                        break;
                }
            });

            // Check if mission complete
            if (this.isMissionComplete(mission)) {
                this.completeMission(mission);
            }
        });
    }

    // Check if mission is complete
    isMissionComplete(mission) {
        return mission.objectives.every(obj => obj.completed);
    }

    // Complete mission
    completeMission(mission) {
        mission.active = false;
        mission.completed = true;

        // Remove from active
        const index = this.activeMissions.indexOf(mission);
        if (index > -1) {
            this.activeMissions.splice(index, 1);
        }

        this.completedMissions.push(mission);

        // Update story progress if story mission
        if (mission.id && mission.id.startsWith('story_')) {
            this.storyProgress = Math.max(
                this.storyProgress,
                parseInt(mission.id.split('_')[1])
            );
        }

        return {
            mission: mission,
            reward: mission.reward,
            dialogue: mission.dialogue ? mission.dialogue.complete : null,
            unlocks: mission.unlocks
        };
    }

    // Check if mission is completed
    isCompleted(missionId) {
        return this.completedMissions.some(m => m.id === missionId);
    }

    // Get available missions at station
    getStationMissions(station) {
        return this.missions.filter(m =>
            m.station === station &&
            !m.active &&
            !m.completed &&
            (!m.requiredMission || this.isCompleted(m.requiredMission))
        );
    }

    // Get mission progress text
    getMissionProgressText(mission) {
        const progress = mission.objectives.map(obj => {
            if (obj.completed) return `✓ ${obj.description}`;

            switch (obj.type) {
                case 'mine':
                case 'collect':
                case 'defeat':
                case 'scan':
                    return `${obj.description} (${obj.current || 0}/${obj.count || obj.amount})`;
                case 'travel':
                    return `${obj.description} (${Math.floor(obj.current || 0)}/${obj.distance})`;
                default:
                    return obj.description;
            }
        }).join('\n');

        return progress;
    }
}
