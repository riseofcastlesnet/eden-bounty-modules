// Eden Bounty Planning System - Planning Management Module
// This module handles planning modal, CRUD operations, and conflict detection

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.PlanningManager = {
    state: null,
    currentStructureIndex: null,

    init(state) {
        this.state = state;
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        // Planning form submission
        const planningForm = document.getElementById('planningForm');
        if (planningForm) {
            planningForm.addEventListener('submit', (e) => this.savePlanning(e));
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.modal .close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    },

    // Open planning modal
    openPlanningModal(index) {
        const modal = document.getElementById('planningModal');
        const structure = this.state.data.edenData[index];
        const planning = this.state.data.plannings[index];
        
        this.currentStructureIndex = index;
        
        document.getElementById('structureIndex').value = index;
        document.getElementById('modalTitle').textContent = 
            `Plan: ${structure.Occupation} (${structure.X}:${structure.Y})`;
        
        // Populate autocomplete datalists
        this.updateAutocompleteData();
        
        if (planning) {
            document.getElementById('guildName').value = planning.guild || '';
            document.getElementById('guildFaction').value = planning.guildFaction || this.state.data.userFaction;
            document.getElementById('plannedDate').value = planning.date || '';
            document.getElementById('plannedTime').value = planning.time || '00:00';
            document.getElementById('bannerPlayer').value = planning.banner || '';
            document.getElementById('priority').value = planning.priority || 'Medium';
            document.getElementById('notes').value = planning.notes || '';
            document.getElementById('removePlanningBtn').style.display = 'inline-block';
        } else {
            document.getElementById('planningForm').reset();
            document.getElementById('structureIndex').value = index;
            document.getElementById('guildFaction').value = this.state.data.userFaction;
            document.getElementById('plannedTime').value = '00:00';
            document.getElementById('removePlanningBtn').style.display = 'none';
        }
        
        // Check for conflicts
        this.checkPlanningConflicts(index);
        
        modal.style.display = 'block';
    },

    // Close planning modal
    closePlanningModal() {
        document.getElementById('planningModal').style.display = 'none';
        this.currentStructureIndex = null;
    },

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.currentStructureIndex = null;
    },

    // Update autocomplete data
    updateAutocompleteData() {
        // Guild names
        const guilds = new Set();
        Object.values(this.state.data.plannings).forEach(p => guilds.add(p.guild));
        
        const guildList = document.getElementById('guildList');
        if (guildList) {
            guildList.innerHTML = '';
            guilds.forEach(guild => {
                const option = document.createElement('option');
                option.value = guild;
                guildList.appendChild(option);
            });
        }
        
        // Player names
        const players = new Set();
        Object.values(this.state.data.plannings).forEach(p => {
            if (p.banner) players.add(p.banner);
        });
        
        const playerList = document.getElementById('playerList');
        if (playerList) {
            playerList.innerHTML = '';
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player;
                playerList.appendChild(option);
            });
        }
    },

    // Check for planning conflicts
    checkPlanningConflicts(structureIndex) {
        const conflicts = this.state.data.conflicts[structureIndex];
        const warningDiv = document.getElementById('conflictWarning');
        const detailsDiv = document.getElementById('conflictDetails');
        
        if (conflicts && conflicts.length > 0) {
            warningDiv.classList.remove('hidden');
            detailsDiv.textContent = `Other guilds planning this structure: ${conflicts.join(', ')}`;
        } else {
            warningDiv.classList.add('hidden');
        }
    },

    // Save planning
    savePlanning(event) {
        event.preventDefault();
        
        const index = document.getElementById('structureIndex').value;
        const guild = document.getElementById('guildName').value;
        const guildFaction = document.getElementById('guildFaction').value;
        const date = document.getElementById('plannedDate').value;
        const time = document.getElementById('plannedTime').value;
        const banner = document.getElementById('bannerPlayer').value;
        const priority = document.getElementById('priority').value;
        const notes = document.getElementById('notes').value;
        
        // Validate occupation day
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        
        if (![0, 2, 4].includes(dayOfWeek)) {
            const occupationDays = [0, 2, 4];
            let nearestDay = occupationDays.reduce((prev, curr) => {
                return (Math.abs(curr - dayOfWeek) < Math.abs(prev - dayOfWeek) ? curr : prev);
            });
            
            selectedDate.setDate(selectedDate.getDate() + (nearestDay - dayOfWeek));
            document.getElementById('plannedDate').value = selectedDate.toISOString().split('T')[0];
            
            if (window.EdenBounty.UIManager) {
                window.EdenBounty.UIManager.showNotification('Date adjusted to nearest occupation day (Sun/Tue/Thu)', 'warning');
            }
        }
        
        const planning = {
            guild,
            guildFaction,
            date: document.getElementById('plannedDate').value,
            time,
            banner,
            priority,
            notes
        };
        
        // Add to history for undo
        this.state.addToHistory({
            type: 'planning',
            action: this.state.data.plannings[index] ? 'edit' : 'add',
            index,
            oldValue: this.state.data.plannings[index],
            newValue: planning
        });
        
        this.state.data.plannings[index] = planning;
        this.state.savePlannings();
        
        this.closePlanningModal();
        window.EdenBounty.Utils.detectConflicts();
        
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.updateUI();
            window.EdenBounty.UIManager.showNotification(
                `Planning ${this.state.data.plannings[index] ? 'updated' : 'saved'} successfully!`, 
                'success'
            );
        }
        
        if (window.EdenBounty.TableManager) {
            window.EdenBounty.TableManager.renderTable();
        }
    },

    // Remove planning
    removePlanning() {
        const index = document.getElementById('structureIndex').value;
        
        if (confirm('Are you sure you want to remove this planning?')) {
            // Add to history
            this.state.addToHistory({
                type: 'planning',
                action: 'remove',
                index,
                oldValue: this.state.data.plannings[index],
                newValue: null
            });
            
            delete this.state.data.plannings[index];
            this.state.savePlannings();
            
            this.closePlanningModal();
            window.EdenBounty.Utils.detectConflicts();
            
            if (window.EdenBounty.UIManager) {
                window.EdenBounty.UIManager.updateUI();
                window.EdenBounty.UIManager.showNotification('Planning removed successfully!', 'success');
            }
            
            if (window.EdenBounty.TableManager) {
                window.EdenBounty.TableManager.renderTable();
            }
        }
    },

    // Batch planning operations
    batchAddPlannings(plannings) {
        let addedCount = 0;
        
        plannings.forEach(({ structureIndex, planning }) => {
            if (!this.state.data.plannings[structureIndex]) {
                this.state.data.plannings[structureIndex] = planning;
                addedCount++;
            }
        });
        
        this.state.savePlannings();
        window.EdenBounty.Utils.detectConflicts();
        
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.updateUI();
            window.EdenBounty.UIManager.showNotification(`Added ${addedCount} plannings`, 'success');
        }
        
        if (window.EdenBounty.TableManager) {
            window.EdenBounty.TableManager.renderTable();
        }
        
        return addedCount;
    },

    // Clear plannings by guild
    clearPlanningsByGuild(guildName) {
        let removedCount = 0;
        
        Object.entries(this.state.data.plannings).forEach(([index, planning]) => {
            if (planning.guild === guildName) {
                delete this.state.data.plannings[index];
                removedCount++;
            }
        });
        
        if (removedCount > 0) {
            this.state.savePlannings();
            window.EdenBounty.Utils.detectConflicts();
            
            if (window.EdenBounty.UIManager) {
                window.EdenBounty.UIManager.updateUI();
                window.EdenBounty.UIManager.showNotification(`Removed ${removedCount} plannings for ${guildName}`, 'success');
            }
            
            if (window.EdenBounty.TableManager) {
                window.EdenBounty.TableManager.renderTable();
            }
        }
        
        return removedCount;
    },

    // Clear plannings by date range
    clearPlanningsByDateRange(startDate, endDate) {
        let removedCount = 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        Object.entries(this.state.data.plannings).forEach(([index, planning]) => {
            const planningDate = new Date(planning.date);
            if (planningDate >= start && planningDate <= end) {
                delete this.state.data.plannings[index];
                removedCount++;
            }
        });
        
        if (removedCount > 0) {
            this.state.savePlannings();
            window.EdenBounty.Utils.detectConflicts();
            
            if (window.EdenBounty.UIManager) {
                window.EdenBounty.UIManager.updateUI();
                window.EdenBounty.UIManager.showNotification(`Removed ${removedCount} plannings in date range`, 'success');
            }
            
            if (window.EdenBounty.TableManager) {
                window.EdenBounty.TableManager.renderTable();
            }
        }
        
        return removedCount;
    },

    // Validate planning data
    validatePlanning(planning) {
        const errors = [];
        
        if (!planning.guild || planning.guild.trim() === '') {
            errors.push('Guild name is required');
        }
        
        if (!planning.date) {
            errors.push('Planning date is required');
        } else {
            const date = new Date(planning.date);
            const dayOfWeek = date.getDay();
            if (![0, 2, 4].includes(dayOfWeek)) {
                errors.push('Planning date must be Sunday, Tuesday, or Thursday');
            }
        }
        
        if (!planning.time) {
            errors.push('Planning time is required');
        }
        
        if (!['High', 'Medium', 'Low'].includes(planning.priority)) {
            errors.push('Invalid priority level');
        }
        
        return errors;
    },

    // Export plannings by guild
    exportPlanningsByGuild(guildName) {
        const guildPlannings = [];
        
        Object.entries(this.state.data.plannings).forEach(([index, planning]) => {
            if (planning.guild === guildName) {
                const structure = this.state.data.edenData[index];
                guildPlannings.push({
                    structure: structure.Occupation,
                    coordinates: `${structure.X}:${structure.Y}`,
                    faction: structure.Faction,
                    ...planning
                });
            }
        });
        
        return guildPlannings;
    },

    // Import planning template
    createPlanningTemplate() {
        const template = [];
        
        this.state.data.edenData.forEach((structure, index) => {
            template.push({
                index,
                type: structure.Occupation,
                coordinates: `${structure.X}:${structure.Y}`,
                faction: structure.Faction,
                sector: structure.Sector,
                zone: structure.Zone,
                openingDay: structure.Day,
                factionPoints: structure['Faction value'],
                guildPoints: structure['Occupation value'],
                // Planning fields (to be filled)
                guild: '',
                guildFaction: '',
                plannedDate: '',
                plannedTime: '00:00',
                bannerPlayer: '',
                priority: 'Medium',
                notes: ''
            });
        });
        
        return template;
    }
};