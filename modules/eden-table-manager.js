// Eden Bounty Planning System - Table Management Module
// This module handles table rendering, filtering, and pagination

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.TableManager = {
    state: null,
    virtualScroller: null,
    currentFilters: {},

    init(state) {
        this.state = state;
        this.setupFilterListeners();
    },

    // Setup filter event listeners
    setupFilterListeners() {
        const filterIds = ['filterType', 'filterFaction', 'filterSector', 'filterZone', 
                         'filterDay', 'filterStatus', 'filterPriority', 'filterFavorites'];
        
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.state.debounce('filter', () => {
                        this.state.data.currentPage = 1;
                        this.applyFilters();
                    });
                });
            }
        });

        // Hierarchical filtering
        const factionFilter = document.getElementById('filterFaction');
        const sectorFilter = document.getElementById('filterSector');
        
        if (factionFilter) {
            factionFilter.addEventListener('change', () => this.updateSectorFilter());
        }
        if (sectorFilter) {
            sectorFilter.addEventListener('change', () => this.updateZoneFilter());
        }
    },

    // Initialize filters
    initializeFilters() {
        if (!this.state.data.edenData || this.state.data.edenData.length === 0) {
            console.log('No data to initialize filters');
            return;
        }
        
        const data = this.state.data.edenData;
        
        const types = [...new Set(data.map(item => item.Occupation))].sort();
        const factions = [...new Set(data.map(item => item.Faction))].sort();
        const sectors = [...new Set(data.map(item => item.Sector))].sort();
        const zones = [...new Set(data.map(item => item.Zone))].sort();
        const days = [...new Set(data.map(item => item.Day))].sort((a, b) => a - b);
        
        this.populateSelect('filterType', types);
        this.populateSelect('filterFaction', factions);
        this.populateSelect('filterSector', sectors);
        this.populateSelect('filterZone', zones);
        this.populateSelect('filterDay', days);
    },

    // Populate select element
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        
        // Keep first option (usually "All")
        const firstOption = select.options[0];
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        select.value = currentValue;
    },

    // Update sector filter based on faction
    updateSectorFilter() {
        const selectedFaction = document.getElementById('filterFaction').value;
        const sectors = selectedFaction 
            ? [...new Set(this.state.data.edenData.filter(item => item.Faction === selectedFaction).map(item => item.Sector))].sort()
            : [...new Set(this.state.data.edenData.map(item => item.Sector))].sort();
        
        this.populateSelect('filterSector', sectors);
        this.updateZoneFilter();
    },

    // Update zone filter based on sector
    updateZoneFilter() {
        const selectedFaction = document.getElementById('filterFaction').value;
        const selectedSector = document.getElementById('filterSector').value;
        
        let filteredData = this.state.data.edenData;
        if (selectedFaction) filteredData = filteredData.filter(item => item.Faction === selectedFaction);
        if (selectedSector) filteredData = filteredData.filter(item => item.Sector === selectedSector);
        
        const zones = [...new Set(filteredData.map(item => item.Zone))].sort();
        this.populateSelect('filterZone', zones);
    },

    // Get filtered data
    getFilteredData() {
        if (!this.state.data.edenData || this.state.data.edenData.length === 0) {
            return [];
        }
        
        let filtered = [...this.state.data.edenData];
        
        const filters = {
            type: document.getElementById('filterType')?.value || '',
            faction: document.getElementById('filterFaction')?.value || '',
            sector: document.getElementById('filterSector')?.value || '',
            zone: document.getElementById('filterZone')?.value || '',
            day: document.getElementById('filterDay')?.value || '',
            status: document.getElementById('filterStatus')?.value || '',
            priority: document.getElementById('filterPriority')?.value || '',
            favorites: document.getElementById('filterFavorites')?.value || ''
        };
        
        if (filters.type) filtered = filtered.filter(item => item.Occupation === filters.type);
        if (filters.faction) filtered = filtered.filter(item => item.Faction === filters.faction);
        if (filters.sector) filtered = filtered.filter(item => item.Sector === filters.sector);
        if (filters.zone) filtered = filtered.filter(item => item.Zone === filters.zone);
        if (filters.day) filtered = filtered.filter(item => item.Day === filters.day);
        
        if (filters.status) {
            filtered = filtered.filter(item => {
                const index = this.state.data.edenData.indexOf(item);
                const status = window.EdenBounty.Utils.getStructureStatus(item, index);
                return status.status === filters.status;
            });
        }
        
        if (filters.priority) {
            filtered = filtered.filter(item => {
                const index = this.state.data.edenData.indexOf(item);
                const planning = this.state.data.plannings[index];
                return planning && planning.priority === filters.priority;
            });
        }
        
        if (filters.favorites === 'favorites') {
            filtered = filtered.filter(item => {
                const index = this.state.data.edenData.indexOf(item);
                return this.state.data.favorites.has(index);
            });
        }
        
        // Week range filter
        if (this.state.data.filters && this.state.data.filters.weekRange) {
            const [start, end] = this.state.data.filters.weekRange;
            filtered = filtered.filter(item => {
                const day = parseInt(item.Day);
                return day >= start && day <= end;
            });
        }
        
        return filtered;
    },

    // Apply filters
    applyFilters() {
        this.renderTable();
        
        // Update statistics
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.updateStatistics();
        }
    },

    // Clear all filters
    clearAllFilters() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterFaction').value = '';
        document.getElementById('filterSector').value = '';
        document.getElementById('filterZone').value = '';
        document.getElementById('filterDay').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterPriority').value = '';
        document.getElementById('filterFavorites').value = '';
        
        // Clear week range filter
        delete this.state.data.filters.weekRange;
        this.state.data.selectedWeek = null;
        
        // Reset to page 1
        this.state.data.currentPage = 1;
        
        // Apply filters
        this.applyFilters();
    },

    // Render table
    renderTable() {
        const tbody = document.getElementById('structureTableBody');
        if (!tbody) return;
        
        const filteredData = this.getFilteredData();
        
        if (!this.state.data.edenData || this.state.data.edenData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align: center;">No data available - Loading...</td></tr>';
            return;
        }
        
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" style="text-align: center;">No structures match the current filters</td></tr>';
            return;
        }
        
        if (this.state.data.settings.virtualScroll && filteredData.length > 100) {
            this.renderWithVirtualScroll(filteredData);
        } else {
            this.renderWithPagination(filteredData);
        }
    },

    // Render with pagination
    renderWithPagination(data) {
        const tbody = document.getElementById('structureTableBody');
        const itemsPerPage = this.state.data.itemsPerPage;
        const currentPage = this.state.data.currentPage;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = data.slice(startIndex, endIndex);
        
        tbody.innerHTML = pageData.map(item => this.renderTableRow(item)).join('');
        
        this.renderPagination(data.length);
    },

    // Render with virtual scrolling
    renderWithVirtualScroll(data) {
        // Implementation would go here for virtual scrolling
        // For now, fallback to pagination
        this.renderWithPagination(data);
    },

    // Render single table row
    renderTableRow(structure) {
        const originalIndex = this.state.data.edenData.findIndex(item => 
            item.X === structure.X && item.Y === structure.Y && item.Occupation === structure.Occupation
        );
        
        const status = window.EdenBounty.Utils.getStructureStatus(structure, originalIndex);
        const planning = this.state.data.plannings[originalIndex];
        const isFavorite = this.state.data.favorites.has(originalIndex);
        const hasConflict = this.state.data.conflicts[originalIndex] && this.state.data.conflicts[originalIndex].length > 1;
        
        const factionIcon = window.EdenBounty.Utils.getFactionIcon(structure.Faction);
        const factionClass = window.EdenBounty.Utils.getFactionClass(structure.Faction);
        
        return `
            <tr class="${hasConflict ? 'has-conflict' : ''}">
                <td>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="window.EdenBounty.TableManager.toggleFavorite(${originalIndex})">⭐</button>
                </td>
                <td>
                    <span class="${factionClass}">${factionIcon}</span> ${structure.Occupation}
                    ${hasConflict ? '<span class="conflict-badge">!</span>' : ''}
                </td>
                <td>
                    <span style="cursor: pointer;" onclick="window.EdenBounty.TableManager.copyCoordinates('${structure.X}:${structure.Y}')">
                        ${structure.X}:${structure.Y} 📋
                    </span>
                </td>
                <td class="${factionClass}">${structure.Faction}</td>
                <td>${structure.Sector}</td>
                <td style="color: white;">Day ${structure.Day}</td>
                <td>${window.EdenBounty.Utils.getTimeRemaining(structure)}</td>
                <td>${planning ? planning.guild : '-'}</td>
                <td>${planning ? window.EdenBounty.Utils.formatDateTime(planning.date, planning.time) : '-'}</td>
                <td>${planning ? planning.banner || '-' : '-'}</td>
                <td>F: ${structure['Faction value']} | G: ${structure['Occupation value']}</td>
                <td class="${status.class}">${status.icon} ${status.status}</td>
                <td>
                    <button class="btn btn-small" onclick="window.EdenBounty.PlanningManager.openPlanningModal(${originalIndex})">
                        ${planning ? 'Edit' : 'Plan'}
                    </button>
                    ${planning ? `<button class="btn btn-danger btn-small" onclick="window.EdenBounty.TableManager.quickDelete(${originalIndex})">×</button>` : ''}
                </td>
            </tr>
        `;
    },

    // Render pagination controls
    renderPagination(totalItems) {
        const pagination = document.getElementById('tablePagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(totalItems / this.state.data.itemsPerPage);
        const currentPage = this.state.data.currentPage;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = `<span>Showing ${Math.min((currentPage - 1) * this.state.data.itemsPerPage + 1, totalItems)} - ${Math.min(currentPage * this.state.data.itemsPerPage, totalItems)} of ${totalItems}</span>`;
        
        html += '<div style="display: flex; gap: 5px;">';
        
        // Previous button
        html += `<button onclick="window.EdenBounty.TableManager.changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>←</button>`;
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button onclick="window.EdenBounty.TableManager.changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
        }
        
        // Next button
        html += `<button onclick="window.EdenBounty.TableManager.changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>→</button>`;
        
        html += '</div>';
        
        pagination.innerHTML = html;
    },

    // Change page
    changePage(page) {
        this.state.data.currentPage = page;
        this.renderTable();
        
        // Scroll to top of table
        const tableScroll = document.getElementById('tableScroll');
        if (tableScroll) {
            tableScroll.scrollTop = 0;
        }
    },

    // Toggle favorite
    toggleFavorite(index) {
        if (this.state.data.favorites.has(index)) {
            this.state.data.favorites.delete(index);
        } else {
            this.state.data.favorites.add(index);
        }
        
        this.state.saveFavorites();
        this.renderTable();
    },

    // Quick delete planning
    quickDelete(index) {
        if (confirm('Delete this planning?')) {
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
            window.EdenBounty.Utils.detectConflicts();
            
            if (window.EdenBounty.UIManager) {
                window.EdenBounty.UIManager.updateUI();
                window.EdenBounty.UIManager.showNotification('Planning deleted!', 'success');
            }
            
            this.renderTable();
        }
    },

    // Copy coordinates
    async copyCoordinates(coords) {
        const success = await window.EdenBounty.Utils.copyToClipboard(coords);
        if (success && window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.showNotification(`Copied: ${coords}`, 'success');
        }
    },

    // Filter by week
    filterByWeek(week) {
        const startDay = (week - 1) * 7 + 1;
        const endDay = week * 7;
        
        document.getElementById('filterDay').value = '';
        this.state.data.filters.weekRange = [startDay, endDay];
        this.state.data.selectedWeek = week;
        
        this.applyFilters();
    },

    // Refresh table
    refreshTable() {
        this.renderTable();
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.updateStatistics();
            window.EdenBounty.UIManager.showNotification('Table refreshed', 'success');
        }
    }
};