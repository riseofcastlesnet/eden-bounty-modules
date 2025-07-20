// Eden Bounty Planning System - Map Management Module
// This module handles the interactive map visualization

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.MapManager = {
    state: null,
    mapZoomLevel: 1,
    mapOffset: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    isIsometric: false,
    tiledMapData: null,

    init(state) {
        this.state = state;
        this.setupMapControls();
    },

    // Setup map event listeners
    setupMapControls() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;
        
        const mapViewport = document.getElementById('mapViewport');
        
        // Mouse events
        mapContainer.addEventListener('mousedown', (e) => this.startMapDrag(e));
        mapContainer.addEventListener('mousemove', (e) => this.dragMap(e));
        mapContainer.addEventListener('mouseup', () => this.endMapDrag());
        mapContainer.addEventListener('mouseleave', () => this.endMapDrag());
        mapContainer.addEventListener('wheel', (e) => this.handleMapZoom(e), { passive: false });
        
        // Touch events for mobile
        mapContainer.addEventListener('touchstart', (e) => this.startMapDrag(e));
        mapContainer.addEventListener('touchmove', (e) => this.dragMap(e));
        mapContainer.addEventListener('touchend', () => this.endMapDrag());
        
        // Map filter listeners
        const filterIds = ['mapFactionFilter', 'mapViewFilter', 'mapTypeFilter'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateMap());
            }
        });
        
        // Draw initial sector divisions
        this.drawSectorDivisions();
    },

    // Load isometric map data
    async loadTiledMap() {
        try {
            console.log('Loading Tiled map from GitHub...');
            const response = await fetch(window.EdenBounty.Config.TILED_MAP_URL);
            
            if (!response.ok) {
                throw new Error(`Failed to load map: ${response.status}`);
            }
            
            this.tiledMapData = await response.json();
            console.log('Tiled map loaded successfully');
            
            // Render map if we're on the map tab
            if (!document.getElementById('mapTab').classList.contains('hidden')) {
                this.renderTiledMap();
            }
        } catch (error) {
            console.error('Error loading Tiled map:', error);
            if (window.EdenBounty.UIManager) {
                window.EdenBounty.UIManager.showNotification('Failed to load isometric map', 'warning');
            }
        }
    },

    // Render isometric map
    renderTiledMap() {
        if (!this.tiledMapData) return;
        
        const canvas = document.getElementById('mapCanvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('mapContainer');
        
        // Set canvas size
        canvas.width = container.clientWidth * 2; // Higher resolution
        canvas.height = container.clientHeight * 2;
        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render map background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw isometric grid
        this.drawIsometricGrid(ctx, canvas.width, canvas.height);
    },

    // Draw isometric grid
    drawIsometricGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const tileWidth = 64;
        const tileHeight = 32;
        const mapWidth = 50;
        const mapHeight = 50;
        
        const offsetX = width / 2;
        const offsetY = 200;
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const screenX = offsetX + (x - y) * (tileWidth / 2);
                const screenY = offsetY + (x + y) * (tileHeight / 2);
                
                // Draw isometric tile
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + tileWidth / 2, screenY + tileHeight / 2);
                ctx.lineTo(screenX, screenY + tileHeight);
                ctx.lineTo(screenX - tileWidth / 2, screenY + tileHeight / 2);
                ctx.closePath();
                ctx.stroke();
            }
        }
    },

    // Toggle isometric view
    toggleIsometric() {
        this.isIsometric = !this.isIsometric;
        const viewport = document.getElementById('mapViewport');
        const canvas = document.getElementById('mapCanvas');
        
        if (this.isIsometric) {
            viewport.classList.add('isometric');
            canvas.style.display = 'block';
            if (!this.tiledMapData) {
                this.loadTiledMap();
            } else {
                this.renderTiledMap();
            }
        } else {
            viewport.classList.remove('isometric');
            canvas.style.display = 'none';
        }
        
        this.updateMap();
        this.updateMapTransform();
        
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.showNotification(
                this.isIsometric ? 'Isometric view enabled' : 'Normal view enabled', 
                'info'
            );
        }
    },

    // Draw sector divisions
    drawSectorDivisions() {
        const sectorsDiv = document.getElementById('mapSectors');
        if (!sectorsDiv) return;
        
        sectorsDiv.innerHTML = '';
        
        // Don't draw divisions in isometric view
        if (this.isIsometric) {
            sectorsDiv.style.display = 'none';
            return;
        }
        
        sectorsDiv.style.display = 'block';
        
        // Main horizontal line (North/South division)
        const mainHorizontal = document.createElement('div');
        mainHorizontal.className = 'sector-line horizontal';
        mainHorizontal.style.top = '50%';
        mainHorizontal.style.borderBottom = '2px solid rgba(255, 255, 255, 0.4)';
        sectorsDiv.appendChild(mainHorizontal);
        
        // Vertical lines for sectors
        const verticalPositions = [25, 50, 75]; // 4 sectors = 3 lines
        verticalPositions.forEach(pos => {
            const line = document.createElement('div');
            line.className = 'sector-line vertical';
            line.style.left = `${pos}%`;
            line.style.borderRight = '1px solid rgba(255, 255, 255, 0.3)';
            sectorsDiv.appendChild(line);
        });
        
        // Neutral sectors
        const neutralTop = document.createElement('div');
        neutralTop.className = 'sector-line horizontal';
        neutralTop.style.top = '40%';
        neutralTop.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
        sectorsDiv.appendChild(neutralTop);
        
        const neutralBottom = document.createElement('div');
        neutralBottom.className = 'sector-line horizontal';
        neutralBottom.style.top = '60%';
        neutralBottom.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
        sectorsDiv.appendChild(neutralBottom);
        
        // Add sector labels
        this.addSectorLabels(sectorsDiv);
        
        // Draw zone divisions
        this.drawZoneDivisions(sectorsDiv);
    },

    // Add sector labels
    addSectorLabels(container) {
        const sectors = [
            { name: 'North 1', x: 12.5, y: 20 },
            { name: 'North 2', x: 37.5, y: 20 },
            { name: 'North 3', x: 62.5, y: 20 },
            { name: 'North 4', x: 87.5, y: 20 },
            { name: 'South 1', x: 12.5, y: 80 },
            { name: 'South 2', x: 37.5, y: 80 },
            { name: 'South 3', x: 62.5, y: 80 },
            { name: 'South 4', x: 87.5, y: 80 },
            { name: 'W Sector', x: 10, y: 50 },
            { name: 'W Central', x: 30, y: 50 },
            { name: 'Central', x: 50, y: 50 },
            { name: 'E Central', x: 70, y: 50 },
            { name: 'E Sector', x: 90, y: 50 }
        ];
        
        sectors.forEach(sector => {
            const label = document.createElement('div');
            label.className = 'sector-label';
            label.textContent = sector.name;
            label.style.left = `${sector.x}%`;
            label.style.top = `${sector.y}%`;
            label.style.transform = 'translate(-50%, -50%)';
            container.appendChild(label);
        });
    },

    // Draw zone divisions
    drawZoneDivisions(container) {
        // North/South zones
        for (let i = 1; i < 6; i++) {
            // North zones
            const northZone = document.createElement('div');
            northZone.className = 'zone-line horizontal';
            northZone.style.top = `${(i * (40/6))}%`;
            northZone.style.height = '1px';
            container.appendChild(northZone);
            
            // South zones
            const southZone = document.createElement('div');
            southZone.className = 'zone-line horizontal';
            southZone.style.top = `${60 + (i * (40/6))}%`;
            southZone.style.height = '1px';
            container.appendChild(southZone);
        }
    },

    // Update map with structures
    updateMap() {
        const mapStructures = document.getElementById('mapStructures');
        if (!mapStructures) return;
        
        mapStructures.innerHTML = '';
        
        // Redraw divisions when changing view
        this.drawSectorDivisions();
        
        const data = this.getFilteredMapData();
        const containerRect = document.getElementById('mapContainer').getBoundingClientRect();
        const scale = Math.min(containerRect.width, containerRect.height) / window.EdenBounty.Config.MAP_SIZE;
        
        data.forEach((structure, index) => {
            const marker = this.createMapMarker(structure, index, scale);
            if (marker) {
                mapStructures.appendChild(marker);
            }
        });
        
        // Setup tooltips
        this.setupMapTooltips();
    },

    // Create map marker
    createMapMarker(structure, index, scale) {
        const x = parseInt(structure.X);
        const y = parseInt(structure.Y);
        const mapSize = window.EdenBounty.Config.MAP_SIZE;
        
        // Validate coordinates
        if (isNaN(x) || isNaN(y) || x < 0 || x > mapSize || y < 0 || y > mapSize) {
            console.warn(`Invalid coordinates for structure: ${structure.Occupation} (${structure.X}:${structure.Y})`);
            return null;
        }
        
        const marker = document.createElement('div');
        marker.className = 'map-structure';
        
        if (this.isIsometric) {
            // Convert to isometric coordinates
            const iso = window.EdenBounty.Utils.cartesianToIsometric(x, y);
            
            // Adjust for map center and scale
            const centerX = 50; // Center percentage
            const centerY = 25; // Adjusted for isometric
            
            // Calculate isometric position as percentage
            const xPercent = centerX + (iso.x / mapSize) * 100;
            const yPercent = centerY + (iso.y / mapSize) * 50;
            
            marker.style.left = `${xPercent}%`;
            marker.style.top = `${yPercent}%`;
        } else {
            // Normal view (cartesian)
            const xPercent = (x / mapSize) * 100;
            const yPercent = (y / mapSize) * 100;
            
            marker.style.left = `${xPercent}%`;
            marker.style.top = `${yPercent}%`;
        }
        
        // Add faction class
        const faction = structure.Faction.toLowerCase();
        if (faction.includes('north')) {
            marker.classList.add('north');
        } else if (faction.includes('south')) {
            marker.classList.add('south');
        } else {
            marker.classList.add('neutral');
        }
        
        // Find original index
        const originalIndex = this.state.data.edenData.findIndex(item => 
            item.X === structure.X && item.Y === structure.Y && item.Occupation === structure.Occupation
        );
        
        if (this.state.data.plannings[originalIndex]) {
            marker.classList.add('planned');
        }
        
        // Add structure type class
        if (structure.Occupation.includes('Stronghold')) {
            marker.classList.add('stronghold');
        } else if (structure.Occupation.includes('Capitol')) {
            marker.classList.add('capitol');
        } else if (structure.Occupation.includes('World Center')) {
            marker.classList.add('world-center');
        }
        
        // Set data attributes
        marker.dataset.structure = structure.Occupation;
        marker.dataset.coords = `${structure.X}:${structure.Y}`;
        marker.dataset.faction = structure.Faction;
        marker.dataset.index = originalIndex;
        
        // Click handler
        marker.addEventListener('click', () => {
            if (window.EdenBounty.PlanningManager) {
                window.EdenBounty.PlanningManager.openPlanningModal(originalIndex);
            }
        });
        
        return marker;
    },

    // Setup map tooltips
    setupMapTooltips() {
        const tooltip = document.getElementById('mapTooltip');
        const markers = document.querySelectorAll('.map-structure');
        
        markers.forEach(marker => {
            marker.addEventListener('mouseenter', (e) => {
                const structure = marker.dataset.structure;
                const coords = marker.dataset.coords;
                const faction = marker.dataset.faction;
                const index = parseInt(marker.dataset.index);
                const planning = this.state.data.plannings[index];
                
                let content = `<strong>${structure}</strong><br>`;
                content += `Coords: ${coords}<br>`;
                content += `Faction: ${faction}`;
                
                if (planning) {
                    content += `<br><span style="color: #66bb6a;">Planned by: ${planning.guild}</span>`;
                }
                
                tooltip.innerHTML = content;
                tooltip.style.display = 'block';
            });
            
            marker.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY - 30) + 'px';
            });
            
            marker.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    },

    // Get filtered map data
    getFilteredMapData() {
        let data = [...this.state.data.edenData];
        
        const factionFilter = document.getElementById('mapFactionFilter')?.value;
        const viewFilter = document.getElementById('mapViewFilter')?.value;
        const typeFilter = document.getElementById('mapTypeFilter')?.value;
        
        if (factionFilter) {
            if (factionFilter === 'Neutral') {
                data = data.filter(s => 
                    !s.Faction.toLowerCase().includes('north') && 
                    !s.Faction.toLowerCase().includes('south')
                );
            } else {
                data = data.filter(s => s.Faction.includes(factionFilter));
            }
        }
        
        if (typeFilter) {
            data = data.filter(s => s.Occupation.includes(typeFilter));
        }
        
        if (viewFilter === 'planned') {
            data = data.filter((s) => {
                const index = this.state.data.edenData.findIndex(item => 
                    item.X === s.X && item.Y === s.Y && item.Occupation === s.Occupation
                );
                return this.state.data.plannings[index];
            });
        } else if (viewFilter === 'available') {
            data = data.filter((s) => {
                const index = this.state.data.edenData.findIndex(item => 
                    item.X === s.X && item.Y === s.Y && item.Occupation === s.Occupation
                );
                const status = window.EdenBounty.Utils.getStructureStatus(s, index);
                return status.status === 'available' || status.status === 'occupation';
            });
        }
        
        return data;
    },

    // Map drag controls
    startMapDrag(e) {
        if (e.target.classList.contains('map-structure') || 
            e.target.closest('.map-controls') || 
            e.target.closest('.map-legend')) {
            return;
        }
        
        this.isDragging = true;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        this.dragStart = {
            x: clientX - this.mapOffset.x,
            y: clientY - this.mapOffset.y
        };
        
        document.getElementById('mapContainer').style.cursor = 'grabbing';
        e.preventDefault();
    },

    dragMap(e) {
        if (!this.isDragging) return;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        this.mapOffset.x = clientX - this.dragStart.x;
        this.mapOffset.y = clientY - this.dragStart.y;
        
        this.updateMapTransform();
        e.preventDefault();
    },

    endMapDrag() {
        this.isDragging = false;
        document.getElementById('mapContainer').style.cursor = 'grab';
    },

    // Map zoom controls
    handleMapZoom(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.mapZoom(delta);
    },

    mapZoom(factor) {
        const newZoom = this.mapZoomLevel * factor;
        
        // Limit zoom range
        if (newZoom < 0.5 || newZoom > 5) return;
        
        // Calculate zoom center
        const container = document.getElementById('mapContainer');
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Adjust offset to zoom towards center
        const scaleDiff = newZoom - this.mapZoomLevel;
        this.mapOffset.x -= (centerX - this.mapOffset.x) * scaleDiff / this.mapZoomLevel;
        this.mapOffset.y -= (centerY - this.mapOffset.y) * scaleDiff / this.mapZoomLevel;
        
        this.mapZoomLevel = newZoom;
        this.updateMapTransform();
    },

    mapReset() {
        this.mapZoomLevel = 1;
        this.mapOffset = { x: 0, y: 0 };
        this.updateMapTransform();
        
        // Redraw map if in isometric mode
        if (this.isIsometric && this.tiledMapData) {
            this.renderTiledMap();
        }
    },

    mapCenter() {
        this.mapOffset = { x: 0, y: 0 };
        this.updateMapTransform();
    },

    // Update map transform
    updateMapTransform() {
        const viewport = document.getElementById('mapViewport');
        if (!viewport) return;
        
        if (this.isIsometric) {
            viewport.style.transform = `translate(${this.mapOffset.x}px, ${this.mapOffset.y}px) scale(${this.mapZoomLevel}) rotateX(30deg) rotateZ(45deg)`;
        } else {
            viewport.style.transform = `translate(${this.mapOffset.x}px, ${this.mapOffset.y}px) scale(${this.mapZoomLevel})`;
        }
    }
};