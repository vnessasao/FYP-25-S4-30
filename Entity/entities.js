// ============================================
// ENTITY LAYER - Data Models and Structures
// ============================================

/**
 * Traffic Incident Entity
 */
class TrafficIncident {
    constructor(data) {
        this.id = data.id || Date.now().toString();
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.type = data.type; // 'accident', 'construction', 'congestion', 'hazard'
        this.severity = data.severity; // 'low', 'medium', 'high'
        this.description = data.description;
        this.reportedAt = data.reportedAt || new Date();
        this.expectedClearance = data.expectedClearance; // in minutes
        this.confidence = data.confidence || 1.0;
    }

    getSeverityColor() {
        const colors = {
            'high': 'var(--danger)',
            'medium': 'var(--warning)',
            'low': 'var(--primary)'
        };
        return colors[this.severity] || 'var(--primary)';
    }

    getIconClass() {
        const icons = {
            'accident': 'fa-car-crash',
            'construction': 'fa-cone',
            'hazard': 'fa-exclamation-triangle',
            'congestion': 'fa-traffic-light'
        };
        return icons[this.type] || 'fa-info-circle';
    }

    toHeatmapPoint() {
        const intensity = {
            'high': 0.9,
            'medium': 0.6,
            'low': 0.3
        }[this.severity] || 0.5;
        
        return [this.latitude, this.longitude, intensity];
    }
}

/**
 * Route Entity
 */
class Route {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.start = data.start; // { latitude, longitude }
        this.end = data.end; // { latitude, longitude }
        this.waypoints = data.waypoints || [];
        this.distance = data.distance; // in miles
        this.estimatedTime = data.estimatedTime; // in minutes
        this.trafficImpact = data.trafficImpact; // in minutes
        this.efficiency = data.efficiency; // percentage
        this.congestionLevels = data.congestionLevels || [];
        this.alternatives = data.alternatives || [];
        this.createdAt = new Date();
    }

    calculateTotalTime() {
        return this.estimatedTime + this.trafficImpact;
    }

    getEfficiencyGrade() {
        if (this.efficiency >= 90) return 'A+';
        if (this.efficiency >= 80) return 'A';
        if (this.efficiency >= 70) return 'B';
        if (this.efficiency >= 60) return 'C';
        return 'D';
    }

    toLineString() {
        const coordinates = [
            [this.start.latitude, this.start.longitude],
            ...this.waypoints.map(wp => [wp.latitude, wp.longitude]),
            [this.end.latitude, this.end.longitude]
        ];
        return coordinates;
    }
}

/**
 * Traffic Heatmap Entity
 */
class TrafficHeatmap {
    constructor() {
        this.points = [];
        this.heatmapLayer = null;
        this.config = {
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
    }

    addPoint(latitude, longitude, intensity) {
        this.points.push([latitude, longitude, intensity]);
    }

    generateFromIncidents(incidents) {
        this.points = incidents.map(incident => incident.toHeatmapPoint());
        return this.points;
    }

    generateRandomData(center, count = 200) {
        this.points = [];
        for (let i = 0; i < count; i++) {
            const lat = center[0] + (Math.random() - 0.5) * 0.05;
            const lng = center[1] + (Math.random() - 0.5) * 0.05;
            const intensity = Math.random() * 0.8 + 0.2;
            this.points.push([lat, lng, intensity]);
        }
        return this.points;
    }

    updatePoint(index, intensity) {
        if (this.points[index]) {
            this.points[index][2] = intensity;
        }
    }
}

/**
 * User Preferences Entity
 */
class UserPreferences {
    constructor() {
        this.avoidTolls = false;
        this.avoidHighways = false;
        this.preferredRouteType = 'fastest'; // 'fastest', 'shortest', 'eco'
        this.showHeatmap = true;
        this.showIncidents = true;
        this.showTraffic = true;
        this.autoRecalculate = true;
        this.notifications = {
            trafficUpdates: true,
            routeChanges: true,
            incidentAlerts: true
        };
    }

    togglePreference(key) {
        if (key in this) {
            this[key] = !this[key];
        }
        return this[key];
    }

    toJSON() {
        return JSON.stringify({
            avoidTolls: this.avoidTolls,
            avoidHighways: this.avoidHighways,
            preferredRouteType: this.preferredRouteType,
            showHeatmap: this.showHeatmap,
            showIncidents: this.showIncidents,
            showTraffic: this.showTraffic,
            autoRecalculate: this.autoRecalculate,
            notifications: this.notifications
        });
    }
}

/**
 * AI Prediction Entity
 */
class AIPrediction {
    constructor(data) {
        this.id = data.id;
        this.type = data.type; // 'peak_traffic', 'accident_clearance', 'eco_score', 'route_suggestion'
        this.title = data.title;
        this.description = data.description;
        this.value = data.value;
        this.unit = data.unit;
        this.confidence = data.confidence || 0.85;
        this.expiresAt = data.expiresAt;
        this.icon = data.icon || this.getDefaultIcon();
    }

    getDefaultIcon() {
        const icons = {
            'peak_traffic': 'fa-clock',
            'accident_clearance': 'fa-car-crash',
            'eco_score': 'fa-leaf',
            'route_suggestion': 'fa-route'
        };
        return icons[this.type] || 'fa-brain';
    }

    isExpired() {
        return this.expiresAt && new Date() > new Date(this.expiresAt);
    }
}

// Export entities for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TrafficIncident,
        Route,
        TrafficHeatmap,
        UserPreferences,
        AIPrediction
    };
}