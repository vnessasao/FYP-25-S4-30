// ============================================
// CONTROLLER LAYER - Business Logic
// ============================================

class MapController {
    constructor() {
        this.map = null;
        this.heatmapLayer = null;
        this.routeLayer = null;
        this.incidentMarkers = [];
        this.userMarker = null;
        this.currentRoute = null;
    }

    initializeMap(center = [40.7128, -74.0060], zoom = 13) {
        this.map = L.map('map', {
            center: center,
            zoom: zoom,
            zoomControl: false,
            attributionControl: false,
            fadeAnimation: true,
            zoomAnimation: true
        });

        // Add dark map tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Add zoom control
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        return this.map;
    }

    createHeatmap(heatmapData, config = {}) {
        const defaultConfig = {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            minOpacity: 0.3,
            gradient: {
                0.2: 'rgba(0, 243, 255, 0.2)',
                0.5: 'rgba(0, 243, 255, 0.5)',
                0.7: 'rgba(255, 179, 77, 0.6)',
                1.0: 'rgba(255, 55, 95, 0.8)'
            }
        };

        this.heatmapLayer = L.heatLayer(heatmapData, {
            ...defaultConfig,
            ...config
        }).addTo(this.map);

        return this.heatmapLayer;
    }

    updateHeatmap(data) {
        if (this.heatmapLayer) {
            this.heatmapLayer.setLatLngs(data);
        }
    }

    addIncidentMarker(incident) {
        const icon = L.divIcon({
            html: `
                <div style="
                    width: 24px;
                    height: 24px;
                    background: ${incident.getSeverityColor()};
                    border-radius: 50%;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    <i class="fas ${incident.getIconClass()}"></i>
                </div>
            `,
            className: 'incident-marker-icon',
            iconSize: [24, 24]
        });

        const marker = L.marker([incident.latitude, incident.longitude], { icon })
            .addTo(this.map);

        marker.bindPopup(`
            <div style="
                background: var(--dark-card);
                border-radius: 8px;
                padding: 12px;
                color: var(--light-text);
                border: 1px solid rgba(0, 243, 255, 0.2);
                min-width: 200px;
            ">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="
                        width: 24px;
                        height: 24px;
                        background: ${incident.getSeverityColor()};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 12px;
                    ">
                        <i class="fas ${incident.getIconClass()}"></i>
                    </div>
                    <div style="font-weight: 600; font-size: 14px;">${incident.description}</div>
                </div>
                <div style="font-size: 12px; color: var(--medium-text);">
                    Severity: <span style="color: ${incident.getSeverityColor()}">${incident.severity}</span>
                </div>
                <div style="font-size: 12px; color: var(--medium-text); margin-top: 4px;">
                    Reported ${this.formatTimeAgo(incident.reportedAt)} • Expected clearance: ${incident.expectedClearance} min
                </div>
            </div>
        `);

        this.incidentMarkers.push(marker);
        return marker;
    }

    clearIncidentMarkers() {
        this.incidentMarkers.forEach(marker => this.map.removeLayer(marker));
        this.incidentMarkers = [];
    }

    drawRoute(route) {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        const coordinates = route.toLineString();
        
        // Main route line
        const routeLine = L.polyline(coordinates, {
            color: 'var(--primary)',
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 8',
            lineCap: 'round'
        });

        // Glow effect
        const glowLine = L.polyline(coordinates, {
            color: 'var(--primary)',
            weight: 10,
            opacity: 0.2,
            lineCap: 'round'
        });

        this.routeLayer = L.layerGroup([glowLine, routeLine]).addTo(this.map);
        this.currentRoute = route;

        // Add start and end markers
        this.addRouteMarker(route.start, 'Start');
        this.addRouteMarker(route.end, 'Destination');

        // Fit bounds to route
        this.map.fitBounds(routeLine.getBounds());

        return this.routeLayer;
    }

    addRouteMarker(position, label) {
        const isStart = label === 'Start';
        const icon = L.divIcon({
            html: `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: ${isStart ? 'var(--primary)' : 'var(--secondary)'};
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 10px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                ">
                    ${isStart ? 'S' : 'E'}
                </div>
            `,
            className: 'route-marker',
            iconSize: [20, 20]
        });

        return L.marker([position.latitude, position.longitude], { icon })
            .addTo(this.map)
            .bindPopup(label);
    }

    locateUser() {
        if (navigator.geolocation) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        this.map.setView([latitude, longitude], 15);
                        
                        // Add user marker
                        if (this.userMarker) {
                            this.map.removeLayer(this.userMarker);
                        }
                        
                        this.userMarker = L.marker([latitude, longitude], {
                            icon: L.divIcon({
                                html: `
                                    <div style="
                                        width: 32px;
                                        height: 32px;
                                        background: var(--primary);
                                        border-radius: 50%;
                                        border: 3px solid white;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: var(--dark-bg);
                                        font-size: 14px;
                                        box-shadow: 0 0 20px var(--primary);
                                        animation: pulse 2s infinite;
                                    ">
                                        <i class="fas fa-location-arrow"></i>
                                    </div>
                                    <style>
                                        @keyframes pulse {
                                            0% { box-shadow: 0 0 0 0 rgba(0, 243, 255, 0.7); }
                                            70% { box-shadow: 0 0 0 10px rgba(0, 243, 255, 0); }
                                            100% { box-shadow: 0 0 0 0 rgba(0, 243, 255, 0); }
                                        }
                                    </style>
                                `,
                                className: 'user-location-marker',
                                iconSize: [32, 32]
                            })
                        }).addTo(this.map);
                        
                        resolve({ latitude, longitude });
                    },
                    error => {
                        reject(error);
                    }
                );
            });
        } else {
            return Promise.reject("Geolocation is not supported by this browser.");
        }
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        
        return Math.floor(seconds) + " seconds ago";
    }

    toggleLayer(layer, buttonId) {
        const button = document.getElementById(buttonId);
        if (this.map.hasLayer(layer)) {
            this.map.removeLayer(layer);
            button.classList.remove('active');
        } else {
            this.map.addLayer(layer);
            button.classList.add('active');
        }
    }
}

class UIController {
    constructor() {
        this.elements = {};
        this.bindElements();
    }

    bindElements() {
        // Header elements
        this.elements.savedRoutesBtn = document.getElementById('saved-routes-btn');
        this.elements.settingsBtn = document.getElementById('settings-btn');
        this.elements.userAvatar = document.getElementById('user-avatar');
        
        // Sidebar elements
        this.elements.searchInput = document.getElementById('search-input');
        this.elements.estimatedTime = document.getElementById('estimated-time');
        this.elements.distance = document.getElementById('distance');
        this.elements.trafficImpact = document.getElementById('traffic-impact');
        this.elements.efficiency = document.getElementById('efficiency');
        this.elements.recalculateBtn = document.getElementById('recalculate-btn');
        this.elements.startNavigationBtn = document.getElementById('start-navigation-btn');
        this.elements.aiPredictionsList = document.getElementById('ai-predictions-list');
        this.elements.trafficLegend = document.getElementById('traffic-legend');
        
        // Map control elements
        this.elements.heatmapToggle = document.getElementById('heatmap-toggle');
        this.elements.trafficToggle = document.getElementById('traffic-toggle');
        this.elements.incidentsToggle = document.getElementById('incidents-toggle');
        this.elements.locateMeBtn = document.getElementById('locate-me-btn');
        this.elements.layersToggle = document.getElementById('layers-toggle');
        
        // Overlay elements
        this.elements.currentSpeed = document.getElementById('current-speed');
        this.elements.avgTrafficSpeed = document.getElementById('avg-traffic-speed');
        this.elements.roadCapacity = document.getElementById('road-capacity');
        this.elements.incidentAlert = document.getElementById('incident-alert');
        this.elements.aiInsight = document.getElementById('ai-insight');
    }

    updateRouteStats(route) {
        if (!route) return;
        
        this.elements.estimatedTime.innerHTML = `${route.estimatedTime}<span class="stat-unit">min</span>`;
        this.elements.distance.innerHTML = `${route.distance}<span class="stat-unit">mi</span>`;
        this.elements.trafficImpact.innerHTML = `+${route.trafficImpact}<span class="stat-unit">min</span>`;
        this.elements.efficiency.innerHTML = `${route.efficiency}<span class="stat-unit">%</span>`;
    }

    updateSpeedStats(currentSpeed, avgSpeed, capacity) {
        this.elements.currentSpeed.innerHTML = `${currentSpeed} <span style="font-size: 14px; color: var(--medium-text);">mph</span>`;
        this.elements.avgTrafficSpeed.innerHTML = `${avgSpeed} <span style="font-size: 14px; color: var(--medium-text);">mph</span>`;
        this.elements.roadCapacity.innerHTML = `${capacity}<span style="font-size: 14px; color: var(--medium-text);">%</span>`;
    }

    showAIPredictions(predictions) {
        this.elements.aiPredictionsList.innerHTML = '';
        
        predictions.forEach(prediction => {
            const predictionElement = this.createPredictionElement(prediction);
            this.elements.aiPredictionsList.appendChild(predictionElement);
        });
    }

    createPredictionElement(prediction) {
        const div = document.createElement('div');
        div.className = 'prediction-item';
        div.innerHTML = `
            <div class="prediction-label">
                <div class="prediction-icon">
                    <i class="fas ${prediction.icon}"></i>
                </div>
                <div>
                    <div style="font-size: 14px;">${prediction.title}</div>
                    <div style="font-size: 12px; color: var(--medium-text);">${prediction.description}</div>
                </div>
            </div>
            <div class="prediction-value">${prediction.value}${prediction.unit || ''}</div>
        `;
        return div;
    }

    showTrafficLegend() {
        const legendItems = [
            { color: 'rgba(0, 243, 255, 0.2)', label: 'Light Traffic', value: '0-20%' },
            { color: 'rgba(0, 243, 255, 0.5)', label: 'Moderate', value: '20-50%' },
            { color: 'rgba(255, 179, 77, 0.6)', label: 'Heavy', value: '50-80%' },
            { color: 'rgba(255, 55, 95, 0.8)', label: 'Gridlock', value: '80-100%' }
        ];

        this.elements.trafficLegend.innerHTML = '';
        
        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color" style="background: ${item.color};"></div>
                <span class="legend-label">${item.label}</span>
                <span class="legend-value">${item.value}</span>
            `;
            this.elements.trafficLegend.appendChild(legendItem);
        });
    }

    showIncidentAlert(incident) {
        this.elements.incidentAlert.style.display = 'flex';
        this.elements.incidentAlert.innerHTML = `
            <i class="fas ${incident.getIconClass()} incident-icon"></i>
            <div>
                <div style="font-weight: 600; font-size: 14px;">${incident.description}</div>
                <div style="font-size: 12px; color: var(--medium-text);">Clearing in ~${incident.expectedClearance} min</div>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideIncidentAlert();
        }, 5000);
    }

    hideIncidentAlert() {
        this.elements.incidentAlert.style.display = 'none';
    }

    showAIInsight(message) {
        this.elements.aiInsight.style.display = 'flex';
        this.elements.aiInsight.innerHTML = `
            <i class="fas fa-brain ai-icon"></i>
            <div>
                <div style="font-weight: 600; font-size: 14px;">AI Insight</div>
                <div style="font-size: 12px; color: var(--light-text);">${message}</div>
            </div>
        `;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideAIInsight();
        }, 3000);
    }

    hideAIInsight() {
        this.elements.aiInsight.style.display = 'none';
    }

    toggleMapButton(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
}

class TrafficDataController {
    constructor() {
        this.incidents = [];
        this.trafficUpdates = [];
        this.heatmapData = [];
        this.updateInterval = null;
    }

    generateMockIncidents() {
        return [
            new TrafficIncident({
                latitude: 40.7128,
                longitude: -74.0060,
                type: 'accident',
                severity: 'high',
                description: 'Multi-vehicle collision',
                expectedClearance: 30
            }),
            new TrafficIncident({
                latitude: 40.7214,
                longitude: -74.01,
                type: 'construction',
                severity: 'medium',
                description: 'Road work',
                expectedClearance: 45
            }),
            new TrafficIncident({
                latitude: 40.705,
                longitude: -74.015,
                type: 'congestion',
                severity: 'high',
                description: 'Heavy traffic',
                expectedClearance: 20
            }),
            new TrafficIncident({
                latitude: 40.715,
                longitude: -74.02,
                type: 'hazard',
                severity: 'low',
                description: 'Debris on road',
                expectedClearance: 15
            })
        ];
    }

    generateMockRoute() {
        return new Route({
            id: 'route-1',
            name: 'Main Route',
            start: { latitude: 40.705, longitude: -74.015 },
            end: { latitude: 40.725, longitude: -73.995 },
            waypoints: [
                { latitude: 40.71, longitude: -74.01 },
                { latitude: 40.715, longitude: -74.005 },
                { latitude: 40.72, longitude: -74.00 }
            ],
            distance: 8.2,
            estimatedTime: 22,
            trafficImpact: 12,
            efficiency: 94
        });
    }

    generateAIPredictions() {
        return [
            new AIPrediction({
                id: 'pred-1',
                type: 'peak_traffic',
                title: 'Peak Traffic Starts',
                description: 'In 45 minutes',
                value: '17:30',
                unit: ''
            }),
            new AIPrediction({
                id: 'pred-2',
                type: 'accident_clearance',
                title: 'Accident Clearance',
                description: 'Estimated time',
                value: '22',
                unit: 'min'
            }),
            new AIPrediction({
                id: 'pred-3',
                type: 'eco_score',
                title: 'Eco Score',
                description: 'Better than 85%',
                value: 'A+',
                unit: ''
            })
        ];
    }

    generateHeatmapData(center = [40.7128, -74.0060]) {
        const heatmap = new TrafficHeatmap();
        return heatmap.generateRandomData(center, 200);
    }

    simulateTrafficUpdate() {
        // Randomly update traffic conditions
        const updates = {
            speed: Math.floor(Math.random() * 20) + 25, // 25-45 mph
            capacity: Math.floor(Math.random() * 40) + 50, // 50-90%
            incidents: Math.floor(Math.random() * 5)
        };
        
        this.trafficUpdates.push({
            timestamp: new Date(),
            ...updates
        });
        
        return updates;
    }

    startLiveUpdates(callback, interval = 10000) {
        this.updateInterval = setInterval(() => {
            const updates = this.simulateTrafficUpdate();
            if (callback) callback(updates);
        }, interval);
    }

    stopLiveUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Export controllers for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MapController,
        UIController,
        TrafficDataController
    };
}