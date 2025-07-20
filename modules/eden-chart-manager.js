// Eden Bounty Planning System - Chart Management Module
// This module handles all chart visualizations using Chart.js

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.ChartManager = {
    state: null,
    charts: {
        faction: null,
        timeline: null,
        structure: null,
        guild: null
    },

    init(state) {
        this.state = state;
        this.initializeCharts();
    },

    // Initialize all charts
    initializeCharts() {
        try {
            this.initializeFactionChart();
            this.initializeTimelineChart();
            this.initializeStructureChart();
            this.initializeGuildChart();
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    },

    // Initialize faction pie chart
    initializeFactionChart() {
        const ctx = document.getElementById('factionChart');
        if (!ctx) return;
        
        this.charts.faction = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['North', 'South'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        window.EdenBounty.Config.COLORS.north,
                        window.EdenBounty.Config.COLORS.south
                    ],
                    borderColor: '#1a1a2e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} points (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Initialize timeline chart
    initializeTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        
        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Planned Occupations',
                    data: [],
                    borderColor: window.EdenBounty.Config.COLORS.secondary,
                    backgroundColor: 'rgba(102, 187, 106, 0.2)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Initialize structure type chart
    initializeStructureChart() {
        const ctx = document.getElementById('structureChart');
        if (!ctx) return;
        
        this.charts.structure = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#f44336', '#e91e63', '#9c27b0', '#673ab7',
                        '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
                        '#009688', '#4caf50', '#8bc34a', '#cddc39'
                    ],
                    borderColor: '#1a1a2e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    },

    // Initialize guild performance chart
    initializeGuildChart() {
        const ctx = document.getElementById('guildChart');
        if (!ctx) return;
        
        this.charts.guild = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Faction Points', 'Guild Points', 'Structures', 'Lobbies', 'Chaos Production'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    r: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#fff',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            color: '#fff',
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    },

    // Update all charts
    updateCharts() {
        const stats = this.calculateStatistics();
        
        this.updateFactionChart(stats.factionStats);
        this.updateTimelineChart();
        this.updateStructureChart();
        this.updateGuildChart(stats.guildStats);
        this.updateEfficiencyMetrics(stats);
        this.updateTrendAnalysis(stats);
    },

    // Update faction chart
    updateFactionChart(factionStats) {
        if (!this.charts.faction) return;
        
        this.charts.faction.data.datasets[0].data = [
            factionStats.North.totalPoints,
            factionStats.South.totalPoints
        ];
        
        this.charts.faction.update();
    },

    // Update timeline chart
    updateTimelineChart() {
        if (!this.charts.timeline) return;
        
        const timelineData = this.calculateTimelineData();
        this.charts.timeline.data.labels = timelineData.labels;
        this.charts.timeline.data.datasets[0].data = timelineData.data;
        this.charts.timeline.update();
    },

    // Update structure chart
    updateStructureChart() {
        if (!this.charts.structure) return;
        
        const structureData = this.calculateStructureData();
        this.charts.structure.data.labels = structureData.labels;
        this.charts.structure.data.datasets[0].data = structureData.data;
        this.charts.structure.update();
    },

    // Update guild chart
    updateGuildChart(guildStats) {
        if (!this.charts.guild) return;
        
        const guildData = this.calculateGuildChartData(guildStats);
        this.charts.guild.data.datasets = guildData.datasets;
        this.charts.guild.update();
    },

    // Calculate statistics
    calculateStatistics() {
        const guildStats = this.calculateGuildStats();
        const factionStats = this.calculateFactionStats();
        const totalStats = this.calculateTotalStats();
        
        return { guildStats, factionStats, totalStats };
    },

    // Calculate guild statistics
    calculateGuildStats() {
        const guildStats = {};
        
        Object.entries(this.state.data.plannings).forEach(([index, planning]) => {
            const structure = this.state.data.edenData[index];
            const guild = planning.guild;
            
            if (!guildStats[guild]) {
                guildStats[guild] = {
                    factionPoints: 0,
                    guildPoints: 0,
                    chaosBase: 0,
                    chaosPercent: 0,
                    lobbies: [],
                    structures: [],
                    guildFaction: planning.guildFaction || 'North'
                };
            }
            
            if (!window.EdenBounty.Utils.isLobby(structure.Occupation)) {
                guildStats[guild].factionPoints += parseInt(structure['Faction value'] || 0);
                guildStats[guild].guildPoints += parseInt(structure['Occupation value'] || 0);
                
                const bonus = window.EdenBounty.Utils.getStructureBonus(structure.Occupation);
                if (bonus) {
                    guildStats[guild].chaosBase += bonus.base;
                    guildStats[guild].chaosPercent += bonus.percent;
                }
            } else {
                guildStats[guild].lobbies.push({
                    name: structure.Occupation,
                    coordinates: `${structure.X}:${structure.Y}`
                });
            }
            
            guildStats[guild].structures.push({
                type: structure.Occupation,
                coordinates: `${structure.X}:${structure.Y}`,
                priority: planning.priority,
                faction: structure.Faction,
                isLobby: window.EdenBounty.Utils.isLobby(structure.Occupation)
            });
        });
        
        Object.values(guildStats).forEach(stats => {
            stats.lobbyBonuses = window.EdenBounty.Utils.calculateLobbyBonuses(stats.lobbies);
        });
        
        return guildStats;
    },

    // Calculate faction statistics
    calculateFactionStats() {
        const factionStats = {
            North: {
                totalPoints: 0,
                structuresPlanned: 0,
                guildsInvolved: new Set(),
                availableToday: 0
            },
            South: {
                totalPoints: 0,
                structuresPlanned: 0,
                guildsInvolved: new Set(),
                availableToday: 0
            }
        };
        
        Object.entries(this.state.data.plannings).forEach(([index, planning]) => {
            const structure = this.state.data.edenData[index];
            const guildFaction = planning.guildFaction || 'North';
            
            if (guildFaction === 'North' || guildFaction === 'South') {
                if (!window.EdenBounty.Utils.isLobby(structure.Occupation)) {
                    factionStats[guildFaction].totalPoints += parseInt(structure['Faction value'] || 0);
                }
                
                factionStats[guildFaction].structuresPlanned++;
                factionStats[guildFaction].guildsInvolved.add(planning.guild);
                
                const status = window.EdenBounty.Utils.getStructureStatus(structure, index);
                if (status.status === 'occupation') {
                    factionStats[guildFaction].availableToday++;
                }
            }
        });
        
        return factionStats;
    },

    // Calculate total statistics
    calculateTotalStats() {
        let totalFactionPoints = 0;
        let totalGuildPoints = 0;
        let totalChaosBase = 0;
        let totalChaosPercent = 0;
        let plannedCount = 0;
        let availableToday = 0;
        
        Object.entries(this.state.data.plannings).forEach(([index, planning]) => {
            const structure = this.state.data.edenData[index];
            
            if (!window.EdenBounty.Utils.isLobby(structure.Occupation)) {
                totalFactionPoints += parseInt(structure['Faction value'] || 0);
                totalGuildPoints += parseInt(structure['Occupation value'] || 0);
                
                const bonus = window.EdenBounty.Utils.getStructureBonus(structure.Occupation);
                if (bonus) {
                    totalChaosBase += bonus.base;
                    totalChaosPercent += bonus.percent;
                }
            }
            
            plannedCount++;
            
            const status = window.EdenBounty.Utils.getStructureStatus(structure, index);
            if (status.status === 'occupation') {
                availableToday++;
            }
        });
        
        return {
            totalFactionPoints,
            totalGuildPoints,
            totalChaosBase,
            totalChaosPercent,
            plannedCount,
            availableToday,
            guildsCount: new Set(Object.values(this.state.data.plannings).map(p => p.guild)).size
        };
    },

    // Calculate timeline data
    calculateTimelineData() {
        const labels = [];
        const data = [];
        
        for (let week = 1; week <= 6; week++) {
            labels.push(`Week ${week}`);
            
            const count = Object.keys(this.state.data.plannings).filter(index => {
                const structure = this.state.data.edenData[index];
                const day = parseInt(structure.Day);
                return day >= (week - 1) * 7 + 1 && day <= week * 7;
            }).length;
            
            data.push(count);
        }
        
        return { labels, data };
    },

    // Calculate structure type data
    calculateStructureData() {
        const typeCounts = {};
        
        Object.keys(this.state.data.plannings).forEach(index => {
            const structure = this.state.data.edenData[index];
            const type = structure.Occupation.split(' ')[0]; // Simplify names
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        return {
            labels: Object.keys(typeCounts),
            data: Object.values(typeCounts)
        };
    },

    // Calculate guild chart data
    calculateGuildChartData(guildStats) {
        const datasets = [];
        const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'];
        
        Object.entries(guildStats).slice(0, 5).forEach(([guild, stats], index) => {
            datasets.push({
                label: guild,
                data: [
                    stats.factionPoints,
                    stats.guildPoints,
                    stats.structures.length * 100,
                    stats.lobbies.length * 200,
                    stats.chaosBase
                ],
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '33', // Add transparency
                borderWidth: 2
            });
        });
        
        return { datasets };
    },

    // Update efficiency metrics
    updateEfficiencyMetrics(stats) {
        const metricsDiv = document.getElementById('efficiencyMetrics');
        if (!metricsDiv) return;
        
        const efficiency = this.calculateEfficiency(stats);
        
        metricsDiv.innerHTML = `
            <div class="stat-card">
                <h4>Points per Structure</h4>
                <div class="stat-value">${efficiency.avgPointsPerStructure.toFixed(1)}</div>
                <div class="stat-change ${efficiency.efficiencyTrend}">
                    ${efficiency.efficiencyTrend === 'positive' ? '↑' : '↓'} ${efficiency.efficiencyChange}%
                </div>
            </div>
            <div class="stat-card">
                <h4>Guild Coordination</h4>
                <div class="stat-value">${efficiency.coordinationScore}/10</div>
                <div class="stat-change">
                    ${efficiency.conflictCount} conflicts detected
                </div>
            </div>
        `;
    },

    // Update trend analysis
    updateTrendAnalysis(stats) {
        const analysisDiv = document.getElementById('trendAnalysis');
        if (!analysisDiv) return;
        
        const trends = this.analyzeTrends(stats);
        
        analysisDiv.innerHTML = `
            <div class="stat-card">
                <h4>Weekly Growth</h4>
                <div class="stat-value">+${trends.weeklyGrowth}%</div>
                <div class="stat-change positive">
                    Target: ${trends.targetStructures} structures
                </div>
            </div>
            <div class="stat-card">
                <h4>Faction Balance</h4>
                <div class="stat-value">${trends.balance}</div>
                <div class="stat-change">
                    ${trends.recommendation}
                </div>
            </div>
        `;
    },

    // Calculate efficiency metrics
    calculateEfficiency(stats) {
        const totalStructures = Object.keys(this.state.data.plannings).length;
        const totalPoints = stats.totalStats.totalFactionPoints + stats.totalStats.totalGuildPoints;
        
        return {
            avgPointsPerStructure: totalStructures > 0 ? totalPoints / totalStructures : 0,
            efficiencyTrend: 'positive',
            efficiencyChange: 15,
            coordinationScore: Math.max(0, 10 - Object.keys(this.state.data.conflicts).length),
            conflictCount: Object.keys(this.state.data.conflicts).length
        };
    },

    // Analyze trends
    analyzeTrends(stats) {
        const northPoints = stats.factionStats.North.totalPoints;
        const southPoints = stats.factionStats.South.totalPoints;
        
        const balance = northPoints > southPoints ? 'North Leading' : 
                       southPoints > northPoints ? 'South Leading' : 'Balanced';
        
        return {
            weeklyGrowth: 23,
            targetStructures: 50,
            balance: balance,
            recommendation: 'Focus on high-value targets'
        };
    },

    // Export chart as image
    exportChartAsImage(chartName) {
        const chart = this.charts[chartName];
        if (!chart) return;
        
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = `eden-${chartName}-chart.png`;
        link.href = url;
        link.click();
    },

    // Destroy all charts (cleanup)
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {
            faction: null,
            timeline: null,
            structure: null,
            guild: null
        };
    }
};