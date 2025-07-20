// Eden Bounty Planning System - Data Management Module
// This module handles data loading, parsing, import/export

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.DataManager = {
    state: null,

    init(state) {
        this.state = state;
    },

    // Load Eden data from Google Sheets
    async loadEdenData() {
        const cacheKey = 'edenData';
        const cached = this.state.getCache(cacheKey);
        
        // Check cache
        if (cached) {
            console.log('Using cached Eden data');
            this.state.data.edenData = cached;
            this.updateSyncStatus('connected');
            return cached;
        }
        
        try {
            this.updateSyncStatus('syncing');
            console.log('Fetching Eden data from Google Sheets...');
            
            const response = await fetch(window.EdenBounty.Config.CSV_URL, {
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            
            console.log(`Loaded ${data.length} structures`);
            
            if (data.length === 0) {
                throw new Error('No data loaded from CSV');
            }
            
            // Cache data
            const cacheDuration = this.state.data.settings.cacheDuration * 60 * 1000;
            this.state.setCache(cacheKey, data, cacheDuration);
            
            this.state.data.edenData = data;
            this.updateSyncStatus('connected');
            
            return data;
        } catch (error) {
            console.error('Error loading Eden data:', error);
            this.loadExampleData();
            this.updateSyncStatus('error');
            throw error;
        }
    },

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = [];
                let current = '';
                let inQuotes = false;
                
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());
                
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return data;
    },

    // Load example data for offline mode
    loadExampleData() {
        const exampleData = [
            {
                'Occupation': 'Stronghold',
                'X': '150',
                'Y': '200',
                'Faction': 'North',
                'Sector': '1',
                'Zone': '1',
                'Day': '1',
                'Faction value': '100',
                'Occupation value': '50',
                'Durability': '1000',
                'Loyalty': '500',
                'Production': '200'
            },
            {
                'Occupation': 'Capitol Lv5',
                'X': '1402',
                'Y': '1263',
                'Faction': 'South',
                'Sector': '2',
                'Zone': '2',
                'Day': '7',
                'Faction value': '100',
                'Occupation value': '300',
                'Durability': '2000',
                'Loyalty': '1000',
                'Production': '400'
            },
            // Add more example structures as needed
        ];
        
        this.state.data.edenData = exampleData;
        console.log('Loaded example data for offline mode');
    },

    // Update sync status
    updateSyncStatus(status) {
        this.state.data.syncStatus = status;
        
        // Trigger UI update through event
        if (window.EdenBounty.UIManager) {
            window.EdenBounty.UIManager.updateSyncStatus(status);
        }
    },

    // Export to Excel
    async exportToExcel() {
        const plannedData = [];
        const allData = [];
        
        this.state.data.edenData.forEach((structure, index) => {
            const planning = this.state.data.plannings[index];
            const baseData = {
                'Type': structure.Occupation,
                'Coordinates': `${structure.X}:${structure.Y}`,
                'Faction': structure.Faction,
                'Sector': structure.Sector,
                'Zone': structure.Zone,
                'Opening Day': structure.Day,
                'Faction Points': structure['Faction value'],
                'Guild Points': structure['Occupation value'],
                'Durability': structure.Durability,
                'Loyalty': structure.Loyalty,
                'Production': structure.Production
            };
            
            if (planning) {
                plannedData.push({
                    ...baseData,
                    'Guild': planning.guild,
                    'Guild Faction': planning.guildFaction,
                    'Planned Date': planning.date,
                    'Planned Time': planning.time,
                    'Banner Player': planning.banner || '',
                    'Priority': planning.priority,
                    'Notes': planning.notes || ''
                });
            }
            
            allData.push(baseData);
        });
        
        // Check if XLSX is available
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library not loaded');
        }
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Add sheets
        if (plannedData.length > 0) {
            const ws1 = XLSX.utils.json_to_sheet(plannedData);
            XLSX.utils.book_append_sheet(wb, ws1, "Planned Occupations");
        }
        
        const ws2 = XLSX.utils.json_to_sheet(allData);
        XLSX.utils.book_append_sheet(wb, ws2, "All Structures");
        
        // Export file
        const fileName = `eden_planning_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    },

    // Import from file
    async importFromFile(file) {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const data = e.target.result;
                    
                    if (file.name.endsWith('.csv')) {
                        const jsonData = this.parseCSV(data);
                        this.importFromJSON(jsonData);
                        resolve(jsonData.length);
                    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        const workbook = XLSX.read(data, { type: 'binary' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                        this.importFromJSON(jsonData);
                        resolve(jsonData.length);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsText(file);
            }
        });
    },

    // Import from JSON data
    importFromJSON(data) {
        let importCount = 0;
        let errorCount = 0;
        
        data.forEach(row => {
            if (row.Guild && row.Type && row.Coordinates) {
                const coords = row.Coordinates.split(':');
                const x = coords[0]?.trim();
                const y = coords[1]?.trim();
                
                const structureIndex = this.state.data.edenData.findIndex(structure => 
                    structure.X === x && structure.Y === y && structure.Occupation === row.Type
                );
                
                if (structureIndex !== -1) {
                    this.state.data.plannings[structureIndex] = {
                        guild: row.Guild,
                        guildFaction: row['Guild Faction'] || 'North',
                        date: row['Planned Date'] || '',
                        time: row['Planned Time'] || '00:00',
                        banner: row['Banner Player'] || '',
                        priority: row.Priority || 'Medium',
                        notes: row.Notes || ''
                    };
                    importCount++;
                } else {
                    errorCount++;
                }
            }
        });
        
        this.state.savePlannings();
        
        return { importCount, errorCount };
    },

    // Generate share link
    generateShareLink() {
        const shareData = {
            plannings: this.state.data.plannings,
            edenStartDate: this.state.data.edenStartDate,
            userFaction: this.state.data.userFaction,
            timestamp: Date.now(),
            version: window.EdenBounty.Config.VERSION
        };
        
        const encoded = btoa(JSON.stringify(shareData));
        return `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    },

    // Import from share link
    importFromShareLink(encoded) {
        try {
            const decoded = JSON.parse(atob(encoded));
            
            // Validate version compatibility
            if (decoded.version && decoded.version !== window.EdenBounty.Config.VERSION) {
                console.warn('Different version detected:', decoded.version);
            }
            
            this.state.importState(decoded);
            return true;
        } catch (error) {
            console.error('Failed to import shared data:', error);
            return false;
        }
    },

    // Load all data on startup
    async loadAllData() {
        // Load saved data from localStorage
        this.state.loadPlannings();
        this.state.loadFavorites();
        this.state.loadEdenConfig();
        
        // Check URL for shared data
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');
        
        if (sharedData) {
            if (confirm('Import shared planning data?')) {
                if (this.importFromShareLink(sharedData)) {
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        }
        
        // Load Eden data
        try {
            await this.loadEdenData();
        } catch (error) {
            console.error('Failed to load Eden data:', error);
        }
    },

    // Save all data
    saveAllData() {
        this.state.savePlannings();
        this.state.saveFavorites();
        this.state.saveEdenConfig();
        this.state.saveSettings();
    },

    // Refresh data from source
    async refreshData() {
        this.state.clearCache();
        await this.loadEdenData();
    }
};