/**
 * Geodesy and panorama projection maths.
 *
 * The free-roam hotspots are the reason this file exists: to make a label float
 * on the torch rather than sit on the horizon, we have to project a real-world
 * point into the panorama's current view ourselves. Google's Marker class can
 * place a pin on a StreetViewPanorama, but only at ground level and with no
 * control over the markup, so we do the projection and render our own HTML.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Metres per degree of latitude — close enough to constant at city scale. */
const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LNG_EQUATOR = 111_320;

/** Assumed eye height of a Street View camera above the ground, in metres. */
export const CAMERA_EYE_HEIGHT_M = 2.5;

export interface LatLngLike {
  lat: number;
  lng: number;
}

/** True initial bearing from `from` to `to`, in degrees clockwise from north. */
export function bearing(from: LatLngLike, to: LatLngLike): number {
  const lat1 = from.lat * DEG;
  const lat2 = to.lat * DEG;
  const dLng = (to.lng - from.lng) * DEG;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * RAD + 360) % 360;
}

/** Ground distance in metres. Equirectangular — exact enough over one island. */
export function distanceMeters(from: LatLngLike, to: LatLngLike): number {
  const meanLat = ((from.lat + to.lat) / 2) * DEG;
  const dx = (to.lng - from.lng) * M_PER_DEG_LNG_EQUATOR * Math.cos(meanLat);
  const dy = (to.lat - from.lat) * M_PER_DEG_LAT;
  return Math.hypot(dx, dy);
}

/** Signed smallest difference between two headings, in (-180, 180]. */
export function headingDelta(from: number, to: number): number {
  let delta = ((to - from) % 360 + 540) % 360 - 180;
  if (delta === -180) delta = 180;
  return delta;
}

/** Interpolate a heading the short way round the compass. */
export function lerpHeading(from: number, to: number, t: number): number {
  return (from + headingDelta(from, to) * t + 360) % 360;
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Smooth ease-in-out — used for every camera move so nothing snaps. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Horizontal field of view of a StreetViewPanorama at a given zoom level.
 * Street View shows 180° across at zoom 0 and halves for every zoom step.
 */
export function horizontalFov(zoom: number): number {
  return 180 / Math.pow(2, clamp(zoom, 0, 5));
}

export interface ProjectedPoint {
  /** Fraction of container width, 0 = left edge, 1 = right edge. */
  x: number;
  /** Fraction of container height, 0 = top edge, 1 = bottom edge. */
  y: number;
  /** True when the point is in front of the camera and inside the viewport. */
  visible: boolean;
  /** Metres from the camera, for depth-ordering and distance labels. */
  distance: number;
}

export interface ProjectionView {
  /** Camera position. */
  origin: LatLngLike;
  /** Current point of view. */
  heading: number;
  pitch: number;
  zoom: number;
  /** Container size in CSS pixels. */
  width: number;
  height: number;
}

/**
 * Project a world point (with height above ground) into panorama screen space.
 *
 * Works in a local east/north/up frame: build the target's unit direction, build
 * the camera's right/up/forward basis from the current point of view, then do a
 * standard perspective divide. Doing it as a full basis rotation rather than
 * treating heading and pitch independently matters here — the tour looks 46° up
 * at the torch, and the naive decoupled formula drifts badly at that angle.
 */
export function projectToScreen(
  target: LatLngLike & { height_m: number },
  view: ProjectionView,
): ProjectedPoint {
  const groundDistance = distanceMeters(view.origin, target);
  const bearingToTarget = bearing(view.origin, target) * DEG;
  const rise = target.height_m - CAMERA_EYE_HEIGHT_M;
  const elevation = Math.atan2(rise, Math.max(groundDistance, 0.001));
  const slantDistance = Math.hypot(groundDistance, rise);

  // Target direction in east/north/up.
  const cosEl = Math.cos(elevation);
  const dE = Math.sin(bearingToTarget) * cosEl;
  const dN = Math.cos(bearingToTarget) * cosEl;
  const dU = Math.sin(elevation);

  // Camera basis in the same frame.
  const h = view.heading * DEG;
  const p = view.pitch * DEG;
  const sinH = Math.sin(h);
  const cosH = Math.cos(h);
  const sinP = Math.sin(p);
  const cosP = Math.cos(p);

  const fE = sinH * cosP;
  const fN = cosH * cosP;
  const fU = sinP;

  const rE = cosH;
  const rN = -sinH;
  const rU = 0;

  const uE = -sinH * sinP;
  const uN = -cosH * sinP;
  const uU = cosP;

  const forward = dE * fE + dN * fN + dU * fU;
  if (forward <= 0.02) {
    return { x: 0.5, y: 0.5, visible: false, distance: slantDistance };
  }

  const right = dE * rE + dN * rN + dU * rU;
  const up = dE * uE + dN * uN + dU * uU;

  const hFov = horizontalFov(view.zoom) * DEG;
  const aspect = view.width > 0 && view.height > 0 ? view.height / view.width : 0.6;
  const tanHalfH = Math.tan(hFov / 2);
  const tanHalfV = tanHalfH * aspect;

  const ndcX = right / forward / tanHalfH;
  const ndcY = up / forward / tanHalfV;

  const x = 0.5 + ndcX / 2;
  const y = 0.5 - ndcY / 2;

  // A small margin keeps a hotspot from being clipped in half at the edge.
  const visible = x > -0.04 && x < 1.04 && y > -0.04 && y < 1.04;

  return { x, y, visible, distance: slantDistance };
}

/** Pitch needed to centre something `height_m` tall seen from `distance` away. */
export function pitchToLookAt(distance: number, heightM: number): number {
  return Math.atan2(heightM - CAMERA_EYE_HEIGHT_M, Math.max(distance, 0.001)) * RAD;
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
