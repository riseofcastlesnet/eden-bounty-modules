// Eden Bounty Planning System - Simulator Module
// This module handles battle simulations and strategy optimization

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.Simulator = {
    state: null,
    currentSimulation: null,

    init(state) {
        this.state = state;
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        const runButton = document.getElementById('runSimulationBtn');
        if (runButton) {
            runButton.addEventListener('click', () => this.runSimulation());
        }

        // Save simulation settings on change
        const simType = document.getElementById('simType');
        if (simType) {
            simType.addEventListener('change', (e) => {
                localStorage.setItem('simType', e.target.value);
            });
        }
    },

    // Initialize simulator
    initializeSimulator() {
        // Load previous simulation settings
        const simType = localStorage.getItem('simType') || 'points';
        const simTypeElement = document.getElementById('simType');
        if (simTypeElement) {
            simTypeElement.value = simType;
        }
    },

    // Run simulation
    async runSimulation() {
        const simType = document.getElementById('simType').value;
        const simWeek = parseInt(document.getElementById('simWeek').value);
        const simGuilds = parseInt(document.getElementById('simGuilds').value);
        
        const resultsDiv = document.getElementById('simulationResults');
        resultsDiv.innerHTML = '<div class="skeleton" style="height: 200px;"></div>';
        
        // Show loading state
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.showNotification('Running simulation...', 'info');
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let results = '';
        
        switch (simType) {
            case 'points':
                results = this.simulatePointsOptimization(simWeek, simGuilds);
                break;
            case 'route':
                results = this.simulateRoutePlanning(simWeek, simGuilds);
                break;
            case 'conflict':
                results = this.simulateConflictResolution();
                break;
            case 'whatif':
                results = this.simulateWhatIf(simWeek, simGuilds);
                break;
        }
        
        resultsDiv.innerHTML = results;
        this.updateAIRecommendations(simType, simWeek, simGuilds);
        
        // Store current simulation
        this.currentSimulation = { simType, simWeek, simGuilds, results };
    },

    // Points optimization simulation
    simulatePointsOptimization(week, guilds) {
        const availableStructures = this.state.data.edenData.filter(s => 
            parseInt(s.Day) <= week * 7 && 
            !this.state.data.plannings[this.state.data.edenData.indexOf(s)]
        );
        
        // Calculate point values
        const structuresWithPoints = availableStructures.map(s => ({
            structure: s,
            totalPoints: parseInt(s['Faction value']) + parseInt(s['Occupation value']),
            factionPoints: parseInt(s['Faction value']),
            guildPoints: parseInt(s['Occupation value']),
            efficiency: (parseInt(s['Faction value']) + parseInt(s['Occupation value'])) / parseInt(s.Day)
        }));
        
        // Sort by efficiency then total points
        structuresWithPoints.sort((a, b) => {
            if (Math.abs(b.efficiency - a.efficiency) > 0.1) {
                return b.efficiency - a.efficiency;
            }
            return b.totalPoints - a.totalPoints;
        });
        
        const recommendations = structuresWithPoints.slice(0, guilds * 3);
        
        let html = '<h4>🎯 Optimal Targets for Points</h4>';
        html += '<div class="simulation-results">';
        
        // Group by priority
        const high = recommendations.slice(0, guilds);
        const medium = recommendations.slice(guilds, guilds * 2);
        const low = recommendations.slice(guilds * 2);
        
        if (high.length > 0) {
            html += '<h5>High Priority (Assign Immediately)</h5>';
            html += '<ul>';
            high.forEach(item => {
                html += `<li>
                    <strong>${item.structure.Occupation}</strong> (${item.structure.X}:${item.structure.Y})
                    <br>Total: ${item.totalPoints} points | Efficiency: ${item.efficiency.toFixed(2)} pts/day
                    <br>Opens: Day ${item.structure.Day} | Sector: ${item.structure.Sector}
                </li>`;
            });
            html += '</ul>';
        }
        
        if (medium.length > 0) {
            html += '<h5>Medium Priority</h5>';
            html += '<ul>';
            medium.forEach(item => {
                html += `<li>${item.structure.Occupation} (${item.structure.X}:${item.structure.Y}) - ${item.totalPoints} points</li>`;
            });
            html += '</ul>';
        }
        
        if (low.length > 0) {
            html += '<h5>Low Priority / Backup Options</h5>';
            html += '<ul>';
            low.forEach(item => {
                html += `<li>${item.structure.Occupation} (${item.structure.X}:${item.structure.Y}) - ${item.totalPoints} points</li>`;
            });
            html += '</ul>';
        }
        
        // Summary
        const totalPotentialPoints = recommendations.reduce((sum, item) => sum + item.totalPoints, 0);
        html += `<div class="simulation-summary">
            <h5>Summary</h5>
            <p><strong>Total Potential Points:</strong> ${totalPotentialPoints}</p>
            <p><strong>Average Points per Structure:</strong> ${Math.round(totalPotentialPoints / recommendations.length)}</p>
            <p><strong>Recommended Strategy:</strong> Focus on structures with highest efficiency (points/day)</p>
        </div>`;
        
        html += '</div>';
        
        return html;
    },

    // Route planning simulation
    simulateRoutePlanning(week, guilds) {
        const structures = this.state.data.edenData.filter(s => 
            parseInt(s.Day) <= week * 7
        );
        
        // Group structures by proximity
        const clusters = this.clusterStructuresByProximity(structures);
        
        let html = '<h4>🗺️ Optimal Route Planning</h4>';
        html += '<p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 15px;">';
        html += 'Routes are optimized based on proximity and travel efficiency. Assign guilds to specific routes to minimize movement.</p>';
        html += '<div class="simulation-results">';
        
        // Show top routes
        clusters.slice(0, guilds).forEach((cluster, i) => {
            const totalPoints = cluster.reduce((sum, s) => 
                sum + parseInt(s['Faction value']) + parseInt(s['Occupation value']), 0
            );
            
            html += `<div class="route-card">`;
            html += `<h5>Route ${i + 1} (${cluster.length} structures)</h5>`;
            html += `<p><strong>Total Points:</strong> ${totalPoints}</p>`;
            html += `<p><strong>Center Point:</strong> ${this.getClusterCenter(cluster)}</p>`;
            html += '<ul>';
            
            // Sort by opening day
            cluster.sort((a, b) => parseInt(a.Day) - parseInt(b.Day));
            
            cluster.slice(0, 5).forEach(s => {
                html += `<li>Day ${s.Day}: ${s.Occupation} (${s.X}:${s.Y})</li>`;
            });
            
            if (cluster.length > 5) {
                html += `<li>... and ${cluster.length - 5} more structures</li>`;
            }
            
            html += '</ul>';
            html += '</div>';
        });
        
        // Route optimization tips
        html += `<div class="simulation-summary">
            <h5>Route Optimization Tips</h5>
            <ul>
                <li>Assign each guild to a specific route/sector</li>
                <li>Establish rally points at route centers</li>
                <li>Consider Check Points as strategic waypoints</li>
                <li>Time movements for occupation windows (Sun/Tue/Thu)</li>
                <li>Coordinate with adjacent routes for support</li>
            </ul>
        </div>`;
        
        html += '</div>';
        
        return html;
    },

    // Conflict resolution simulation
    simulateConflictResolution() {
        const conflicts = window.EdenBounty.Utils.detectConflicts();
        
        let html = '<h4>⚠️ Conflict Resolution Analysis</h4>';
        html += '<div class="simulation-results">';
        
        if (Object.keys(conflicts).length === 0) {
            html += '<div class="success-message">';
            html += '<p>✅ <strong>No conflicts detected!</strong></p>';
            html += '<p>Your current planning is optimal with no overlapping assignments.</p>';
            html += '</div>';
            return html;
        }
        
        // Analyze each conflict
        Object.entries(conflicts).forEach(([structureIndex, conflictingGuilds]) => {
            const structure = this.state.data.edenData[structureIndex];
            const points = parseInt(structure['Faction value']) + parseInt(structure['Occupation value']);
            
            html += '<div class="conflict-card">';
            html += `<h5>${structure.Occupation} (${structure.X}:${structure.Y})</h5>`;
            html += `<p><strong>Value:</strong> ${points} points | <strong>Opens:</strong> Day ${structure.Day}</p>`;
            html += '<p><strong>Conflicting Guilds:</strong></p>';
            html += '<ul>';
            
            conflictingGuilds.forEach(guild => {
                const guildStats = this.getGuildPlanningStats(guild);
                html += `<li>${guild} - ${guildStats.totalStructures} total structures planned</li>`;
            });
            
            html += '</ul>';
            
            // Resolution recommendations
            html += '<p><strong>Resolution Options:</strong></p>';
            html += '<ol>';
            html += '<li>Assign to guild with fewer total structures</li>';
            html += '<li>Assign based on proximity to other guild targets</li>';
            html += '<li>Rotate assignments by occupation day</li>';
            html += '<li>Create alliance agreement for shared benefits</li>';
            html += '</ol>';
            html += '</div>';
        });
        
        // General conflict resolution strategy
        html += `<div class="simulation-summary">
            <h5>Conflict Resolution Strategy</h5>
            <p>Total Conflicts: ${Object.keys(conflicts).length}</p>
            <p>Recommended Actions:</p>
            <ul>
                <li>Host coordination meeting with involved guilds</li>
                <li>Establish clear priority system (contribution-based)</li>
                <li>Document agreements to prevent future conflicts</li>
                <li>Consider backup targets for each guild</li>
            </ul>
        </div>`;
        
        html += '</div>';
        
        return html;
    },

    // What-if analysis simulation
    simulateWhatIf(week, guilds) {
        const currentStats = window.EdenBounty.ChartManager.calculateStatistics();
        
        // Get unplanned structures that could be captured
        const availableStructures = this.state.data.edenData.filter(s => 
            parseInt(s.Day) <= week * 7 && 
            !this.state.data.plannings[this.state.data.edenData.indexOf(s)]
        );
        
        // Sort by faction value
        const topStructures = availableStructures
            .sort((a, b) => parseInt(b['Faction value']) - parseInt(a['Faction value']))
            .slice(0, guilds * 2);
        
        // Calculate projections
        let projectedNorth = currentStats.factionStats.North.totalPoints;
        let projectedSouth = currentStats.factionStats.South.totalPoints;
        let additionalNorth = 0;
        let additionalSouth = 0;
        
        topStructures.forEach(s => {
            if (this.state.data.userFaction === 'North') {
                projectedNorth += parseInt(s['Faction value']);
                additionalNorth += parseInt(s['Faction value']);
            } else {
                projectedSouth += parseInt(s['Faction value']);
                additionalSouth += parseInt(s['Faction value']);
            }
        });
        
        let html = '<h4>📊 What-If Analysis</h4>';
        html += '<div class="simulation-results">';
        
        // Current state
        html += '<div class="analysis-section">';
        html += '<h5>Current State</h5>';
        html += `<p><strong>North:</strong> ${currentStats.factionStats.North.totalPoints} points</p>`;
        html += `<p><strong>South:</strong> ${currentStats.factionStats.South.totalPoints} points</p>`;
        html += `<p><strong>Current Lead:</strong> ${this.calculateLead(currentStats.factionStats)}</p>`;
        html += '</div>';
        
        // Projected state
        html += '<div class="analysis-section">';
        html += '<h5>Projected State (Best Case)</h5>';
        html += `<p><strong>North:</strong> ${projectedNorth} points (+${additionalNorth})</p>`;
        html += `<p><strong>South:</strong> ${projectedSouth} points (+${additionalSouth})</p>`;
        html += `<p><strong>Projected Lead:</strong> ${Math.abs(projectedNorth - projectedSouth)} points`;
        if (projectedNorth > projectedSouth) {
            html += ' (North leads)</p>';
        } else if (projectedSouth > projectedNorth) {
            html += ' (South leads)</p>';
        } else {
            html += ' (Tied)</p>';
        }
        html += '</div>';
        
        // Scenario analysis
        html += '<div class="analysis-section">';
        html += '<h5>Alternative Scenarios</h5>';
        
        // Worst case
        const worstCase = this.calculateWorstCase(currentStats, week);
        html += `<p><strong>Worst Case:</strong> Enemy captures all high-value targets</p>`;
        html += `<p>Result: ${worstCase}</p>`;
        
        // Realistic case
        html += `<p><strong>Realistic Case:</strong> 60% success rate on planned targets</p>`;
        const realisticNorth = Math.round(projectedNorth * 0.6 + currentStats.factionStats.North.totalPoints * 0.4);
        const realisticSouth = Math.round(projectedSouth * 0.6 + currentStats.factionStats.South.totalPoints * 0.4);
        html += `<p>Result: North ${realisticNorth} vs South ${realisticSouth}</p>`;
        
        html += '</div>';
        
        // Strategic recommendations
        html += `<div class="simulation-summary">
            <h5>Strategic Recommendations</h5>`;
        
        if (this.state.data.userFaction === 'North' && projectedNorth < projectedSouth) {
            html += '<p class="warning">⚠️ Risk of falling behind!</p>';
        } else if (this.state.data.userFaction === 'South' && projectedSouth < projectedNorth) {
            html += '<p class="warning">⚠️ Risk of falling behind!</p>';
        }
        
        html += '<ul>';
        html += '<li>Focus on structures worth 100+ faction points</li>';
        html += '<li>Secure at least ' + Math.ceil(guilds * 1.5) + ' structures this week</li>';
        html += '<li>Consider defensive strategies for key positions</li>';
        html += '<li>Coordinate multi-guild operations for high-value targets</li>';
        html += '</ul>';
        html += '</div>';
        
        html += '</div>';
        
        return html;
    },

    // Update AI recommendations
    updateAIRecommendations(simType, week, guilds) {
        const aiDiv = document.getElementById('aiRecommendations');
        if (!aiDiv) return;
        
        // Simulate AI processing
        setTimeout(() => {
            let recommendations = '<div class="ai-recommendations">';
            
            switch (simType) {
                case 'points':
                    recommendations += this.getPointsAIRecommendations(week, guilds);
                    break;
                case 'route':
                    recommendations += this.getRouteAIRecommendations(week, guilds);
                    break;
                case 'conflict':
                    recommendations += this.getConflictAIRecommendations();
                    break;
                case 'whatif':
                    recommendations += this.getWhatIfAIRecommendations(week, guilds);
                    break;
            }
            
            recommendations += '</div>';
            aiDiv.innerHTML = recommendations;
        }, 1000);
    },

    // AI Recommendations for points optimization
    getPointsAIRecommendations(week, guilds) {
        return `
            <div class="stat-card">
                <h4>🤖 AI Strategic Recommendations - Points Focus</h4>
                <div class="ai-insights">
                    <h5>Priority Targets</h5>
                    <ul>
                        <li><strong>Week ${week} Focus:</strong> ${this.getWeekFocus(week)}</li>
                        <li><strong>Structure Priority:</strong> World Center > Capitol Lv5+ > Large Towns</li>
                        <li><strong>Efficiency Target:</strong> Minimum 50 points/day efficiency</li>
                    </ul>
                    
                    <h5>Guild Coordination</h5>
                    <ul>
                        <li>Assign ${Math.ceil(guilds/3)} guilds to high-value targets</li>
                        <li>Use ${Math.floor(guilds/3)} guilds for medium targets</li>
                        <li>Keep ${Math.floor(guilds/3)} guilds flexible for opportunities</li>
                    </ul>
                    
                    <h5>Timing Strategy</h5>
                    <ul>
                        <li>Prioritize structures opening in next 3 days</li>
                        <li>Pre-position for Sunday occupation window</li>
                        <li>Avoid over-commitment on single occupation day</li>
                    </ul>
                </div>
            </div>
        `;
    },

    // AI Recommendations for route planning
    getRouteAIRecommendations(week, guilds) {
        return `
            <div class="stat-card">
                <h4>🤖 AI Strategic Recommendations - Route Optimization</h4>
                <div class="ai-insights">
                    <h5>Movement Efficiency</h5>
                    <ul>
                        <li>Establish ${Math.ceil(guilds/2)} primary rally points</li>
                        <li>Maximum travel distance: 200 coordinates per day</li>
                        <li>Use Check Points as rest/regroup locations</li>
                    </ul>
                    
                    <h5>Sector Assignment</h5>
                    <ul>
                        <li>North guilds: Focus on sectors 1-2</li>
                        <li>South guilds: Focus on sectors 3-4</li>
                        <li>Reserve force: Central sectors for quick response</li>
                    </ul>
                    
                    <h5>Communication Protocol</h5>
                    <ul>
                        <li>Establish sector commanders for each route</li>
                        <li>Coordinate movements 2 hours before occupation</li>
                        <li>Maintain backup routes for each primary path</li>
                    </ul>
                </div>
            </div>
        `;
    },

    // AI Recommendations for conflict resolution
    getConflictAIRecommendations() {
        const conflictCount = Object.keys(this.state.data.conflicts).length;
        
        return `
            <div class="stat-card">
                <h4>🤖 AI Strategic Recommendations - Conflict Resolution</h4>
                <div class="ai-insights">
                    <h5>Immediate Actions</h5>
                    <ul>
                        <li>${conflictCount > 0 ? 'Schedule emergency coordination meeting' : 'Maintain current coordination'}</li>
                        <li>Establish clear chain of command for decisions</li>
                        <li>Document all agreements in shared spreadsheet</li>
                    </ul>
                    
                    <h5>Resolution Framework</h5>
                    <ul>
                        <li><strong>Priority 1:</strong> Guild size and contribution history</li>
                        <li><strong>Priority 2:</strong> Proximity to other guild targets</li>
                        <li><strong>Priority 3:</strong> Specialization (PvP vs PvE guilds)</li>
                    </ul>
                    
                    <h5>Prevention Strategy</h5>
                    <ul>
                        <li>Pre-assign sectors to avoid overlap</li>
                        <li>Create "no-conflict zones" between guilds</li>
                        <li>Implement 48-hour planning lock system</li>
                    </ul>
                </div>
            </div>
        `;
    },

    // AI Recommendations for what-if analysis
    getWhatIfAIRecommendations(week, guilds) {
        return `
            <div class="stat-card">
                <h4>🤖 AI Strategic Recommendations - Scenario Planning</h4>
                <div class="ai-insights">
                    <h5>Risk Mitigation</h5>
                    <ul>
                        <li>Maintain 20% reserve force for emergencies</li>
                        <li>Identify 3 backup targets for each primary</li>
                        <li>Plan for 70% success rate, not 100%</li>
                    </ul>
                    
                    <h5>Opportunity Windows</h5>
                    <ul>
                        <li><strong>Week ${week}:</strong> ${this.getWeekOpportunity(week)}</li>
                        <li>Monitor enemy movements for overextension</li>
                        <li>Capitalize on occupation day timing</li>
                    </ul>
                    
                    <h5>Contingency Plans</h5>
                    <ul>
                        <li><strong>Plan A:</strong> Full offensive - all guilds attack</li>
                        <li><strong>Plan B:</strong> Balanced - 70% offense, 30% defense</li>
                        <li><strong>Plan C:</strong> Defensive - secure current holdings</li>
                    </ul>
                </div>
            </div>
        `;
    },

    // Helper functions
    clusterStructuresByProximity(structures, maxDistance = 200) {
        const clusters = [];
        const used = new Set();
        
        structures.forEach(s => {
            if (used.has(s)) return;
            
            const cluster = [s];
            used.add(s);
            
            // Find nearby structures
            structures.forEach(other => {
                if (used.has(other)) return;
                
                const distance = this.calculateDistance(s, other);
                if (distance <= maxDistance) {
                    cluster.push(other);
                    used.add(other);
                }
            });
            
            clusters.push(cluster);
        });
        
        // Sort clusters by size
        clusters.sort((a, b) => b.length - a.length);
        
        return clusters;
    },

    calculateDistance(s1, s2) {
        const x1 = parseInt(s1.X);
        const y1 = parseInt(s1.Y);
        const x2 = parseInt(s2.X);
        const y2 = parseInt(s2.Y);
        
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    getClusterCenter(cluster) {
        const avgX = cluster.reduce((sum, s) => sum + parseInt(s.X), 0) / cluster.length;
        const avgY = cluster.reduce((sum, s) => sum + parseInt(s.Y), 0) / cluster.length;
        
        return `${Math.round(avgX)}:${Math.round(avgY)}`;
    },

    getGuildPlanningStats(guildName) {
        let totalStructures = 0;
        let totalPoints = 0;
        
        Object.entries(this.state.data.plannings).forEach(([index, planning]) => {
            if (planning.guild === guildName) {
                totalStructures++;
                const structure = this.state.data.edenData[index];
                totalPoints += parseInt(structure['Faction value']) + parseInt(structure['Occupation value']);
            }
        });
        
        return { totalStructures, totalPoints };
    },

    calculateLead(factionStats) {
        const northPoints = factionStats.North.totalPoints;
        const southPoints = factionStats.South.totalPoints;
        
        if (northPoints > southPoints) {
            return `North leads by ${northPoints - southPoints} points`;
        } else if (southPoints > northPoints) {
            return `South leads by ${southPoints - northPoints} points`;
        } else {
            return 'Tied';
        }
    },

    calculateWorstCase(currentStats, week) {
        // Simplified worst case calculation
        const enemyFaction = this.state.data.userFaction === 'North' ? 'South' : 'North';
        const potentialEnemyGain = week * 500; // Rough estimate
        
        return `${enemyFaction} gains ${potentialEnemyGain} additional points`;
    },

    getWeekFocus(week) {
        const focuses = {
            1: 'Secure initial strongholds and towns',
            2: 'Expand territory, focus on Lv2 towns',
            3: 'Target E/W sectors and Lv4 structures',
            4: 'Push for Central sectors and Lv5+ Capitols',
            5: 'Secure Lv6 gates and prepare for endgame',
            6: 'Final push for World Center control'
        };
        
        return focuses[week] || 'Maintain momentum';
    },

    getWeekOpportunity(week) {
        const opportunities = {
            1: 'Enemy guilds still organizing - strike fast',
            2: 'Border zones vulnerable - expand quickly',
            3: 'High-value targets opening - coordinate attacks',
            4: 'Central sector battles - decisive week',
            5: 'Temple control critical - all-in strategies',
            6: 'Final victory conditions - no holding back'
        };
        
        return opportunities[week] || 'Adapt to battlefield conditions';
    },

    // Export simulation results
    exportSimulationResults() {
        if (!this.currentSimulation) {
            if (window.EdenBounty.UIManager) {
                window.EdenBounty.UIManager.showNotification('No simulation results to export', 'warning');
            }
            return;
        }
        
        const { simType, simWeek, simGuilds, results } = this.currentSimulation;
        
        const exportData = {
            timestamp: new Date().toISOString(),
            simulationType: simType,
            parameters: {
                week: simWeek,
                guilds: simGuilds
            },
            results: results,
            currentStats: window.EdenBounty.ChartManager.calculateStatistics()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eden-simulation-${simType}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.showNotification('Simulation results exported', 'success');
        }
    }
};