// ============================================
// MAIN APPLICATION - Initialization and Orchestration
// ============================================

class TrafficNavigationApp {
    constructor() {
        // Initialize controllers
        this.mapController = new MapController();
        this.uiController = new UIController();
        this.dataController = new TrafficDataController();
        
        // Application state
        this.state = {
            currentRoute: null,
            userLocation: null,
            preferences: new UserPreferences(),
            isNavigating: false,
            heatmapVisible: true,
            incidentsVisible: true
        };
        
        // Initialize application
        this.init();
    }

    init() {
        // Initialize map
        this.mapController.initializeMap();
        
        // Generate and display initial data
        this.loadInitialData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show traffic legend
        this.uiController.showTrafficLegend();
        
        // Start live updates
        this.dataController.startLiveUpdates(this.handleTrafficUpdate.bind(this));
        
        console.log('A* Navigation App initialized');
    }

    loadInitialData() {
        // Load incidents
        const incidents = this.dataController.generateMockIncidents();
        incidents.forEach(incident => {
            this.mapController.addIncidentMarker(incident);
        });
        
        // Load route
        const route = this.dataController.generateMockRoute();
        this.state.currentRoute = route;
        this.mapController.drawRoute(route);
        this.uiController.updateRouteStats(route);
        
        // Load AI predictions
        const predictions = this.dataController.generateAIPredictions();
        this.uiController.showAIPredictions(predictions);
        
        // Load heatmap
        const heatmapData = this.dataController.generateHeatmapData();
        this.mapController.createHeatmap(heatmapData);
        
        // Update speed stats
        this.uiController.updateSpeedStats(42, 28, 68);
    }

    setupEventListeners() {
        // Search functionality
        this.uiController.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.uiController.elements.searchInput.value.trim()) {
                this.handleSearch(this.uiController.elements.searchInput.value);
            }
        });

        // Map controls
        this.uiController.elements.heatmapToggle.addEventListener('click', () => {
            this.toggleHeatmap();
        });

        this.uiController.elements.trafficToggle.addEventListener('click', () => {
            this.toggleIncidents();
        });

        this.uiController.elements.locateMeBtn.addEventListener('click', () => {
            this.locateUser();
        });

        // Route actions
        this.uiController.elements.recalculateBtn.addEventListener('click', () => {
            this.recalculateRoute();
        });

        this.uiController.elements.startNavigationBtn.addEventListener('click', () => {
            this.startNavigation();
        });

        // Header buttons
        this.uiController.elements.savedRoutesBtn.addEventListener('click', () => {
            this.showSavedRoutes();
        });

        this.uiController.elements.settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });

        this.uiController.elements.userAvatar.addEventListener('click', () => {
            this.showUserProfile();
        });
    }

    handleSearch(query) {
        this.uiController.showAIInsight(`Searching for optimal route to "${query}"...`);
        
        // Simulate search delay
        setTimeout(() => {
            // Generate new route based on search
            const newRoute = new Route({
                id: 'route-' + Date.now(),
                name: 'To ' + query,
                start: this.state.userLocation || { latitude: 40.705, longitude: -74.015 },
                end: { 
                    latitude: 40.725 + (Math.random() - 0.5) * 0.01,
                    longitude: -73.995 + (Math.random() - 0.5) * 0.01
                },
                distance: (Math.random() * 5 + 5).toFixed(1),
                estimatedTime: Math.floor(Math.random() * 20 + 15),
                trafficImpact: Math.floor(Math.random() * 10 + 5),
                efficiency: Math.floor(Math.random() * 20 + 80)
            });
            
            this.state.currentRoute = newRoute;
            this.mapController.drawRoute(newRoute);
            this.uiController.updateRouteStats(newRoute);
            
            this.uiController.showAIInsight(`Found route that saves ${Math.floor(Math.random() * 10 + 5)} minutes vs standard route`);
        }, 1500);
    }

    toggleHeatmap() {
        this.state.heatmapVisible = !this.state.heatmapVisible;
        this.mapController.toggleLayer(
            this.mapController.heatmapLayer,
            'heatmap-toggle'
        );
    }

    toggleIncidents() {
        this.state.incidentsVisible = !this.state.incidentsVisible;
        // In a real app, this would toggle the incident markers layer
        this.uiController.toggleMapButton('traffic-toggle', this.state.incidentsVisible);
    }

    locateUser() {
        this.mapController.locateUser()
            .then(location => {
                this.state.userLocation = location;
                this.uiController.showAIInsight('Location found! Updating route from your position...');
            })
            .catch(error => {
                this.uiController.showAIInsight('Unable to get location. Please check permissions.');
                console.error('Geolocation error:', error);
            });
    }

    recalculateRoute() {
        if (!this.state.currentRoute) return;
        
        this.uiController.showAIInsight('Recalculating route based on current traffic...');
        
        // Simulate recalculation
        setTimeout(() => {
            const updatedRoute = new Route({
                ...this.state.currentRoute,
                estimatedTime: Math.max(15, this.state.currentRoute.estimatedTime + (Math.random() * 4 - 2)),
                trafficImpact: Math.max(5, this.state.currentRoute.trafficImpact + (Math.random() * 3 - 1.5)),
                efficiency: Math.min(99, Math.max(70, this.state.currentRoute.efficiency + (Math.random() * 10 - 5)))
            });
            
            this.state.currentRoute = updatedRoute;
            this.uiController.updateRouteStats(updatedRoute);
            this.uiController.showAIInsight('Route updated! Saved ' + Math.floor(Math.random() * 5 + 1) + ' minutes.');
        }, 1000);
    }

    startNavigation() {
        this.state.isNavigating = !this.state.isNavigating;
        
        if (this.state.isNavigating) {
            this.uiController.elements.startNavigationBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Navigation';
            this.uiController.showAIInsight('Navigation started! Turn-by-turn guidance activated.');
            
            // In a real app, this would start actual navigation
            this.startNavigationSimulation();
        } else {
            this.uiController.elements.startNavigationBtn.innerHTML = '<i class="fas fa-play"></i> Start Navigation';
            this.uiController.showAIInsight('Navigation stopped.');
            
            // Stop navigation simulation
            this.stopNavigationSimulation();
        }
    }

    startNavigationSimulation() {
        // In a real app, this would handle actual navigation
        console.log('Navigation simulation started');
    }

    stopNavigationSimulation() {
        console.log('Navigation simulation stopped');
    }

    handleTrafficUpdate(updates) {
        // Update speed stats
        this.uiController.updateSpeedStats(
            updates.speed,
            updates.speed - Math.floor(Math.random() * 10),
            updates.capacity
        );
        
        // Occasionally show incident alerts
        if (updates.incidents > 0 && Math.random() > 0.7) {
            const incident = new TrafficIncident({
                latitude: 40.7128 + (Math.random() - 0.5) * 0.02,
                longitude: -74.0060 + (Math.random() - 0.5) * 0.02,
                type: ['accident', 'congestion', 'hazard'][Math.floor(Math.random() * 3)],
                severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                description: ['New incident reported', 'Traffic building up', 'Road hazard detected'][Math.floor(Math.random() * 3)],
                expectedClearance: Math.floor(Math.random() * 30 + 10)
            });
            
            this.uiController.showIncidentAlert(incident);
            this.mapController.addIncidentMarker(incident);
        }
        
        // Update heatmap
        const newHeatmapData = this.dataController.generateHeatmapData();
        this.mapController.updateHeatmap(newHeatmapData);
    }

    showSavedRoutes() {
        this.uiController.showAIInsight('Saved routes feature coming soon!');
    }

    showSettings() {
        this.uiController.showAIInsight('Settings panel coming soon!');
    }

    showUserProfile() {
        this.uiController.showAIInsight('User profile coming soon!');
    }

    // Cleanup method
    destroy() {
        this.dataController.stopLiveUpdates();
        if (this.mapController.map) {
            this.mapController.map.remove();
        }
        console.log('App destroyed');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TrafficNavigationApp();
});

// Export app for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficNavigationApp;
}