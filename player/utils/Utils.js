export function isHotspotVisible(hotspot, time) {
    if (hotspot.alwaysShow) return true;
    const {startTime, duration} = hotspot;
    const endTime = startTime + duration;
    if (time < startTime || time > endTime) {
        return false;
    } else {
        return true;
    }
}

export function subtractLatLonObjects(obj1, obj2) {
    return {lat: obj1.lat - obj2.lat, lon: obj1.lon - obj2.lon};
}

export function absLatLonObject(obj1) {
    return {lat: Math.abs(obj1.lat), lon: Math.abs(obj1.lon)};
}

export function addLatLonObjects(obj1, obj2) {
    return {lat: obj1.lat + obj2.lat, lon: obj1.lon + obj2.lon};
}
