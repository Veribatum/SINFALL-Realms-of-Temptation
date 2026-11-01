// The renderer and damage checks use this same committed attack footprint.
export const CHAIN_WINDOW = 1.45;
export const PARRY_WINDOW = .24;
export const EXPOSE_TIME = 2.4;

export function attackPattern(actor, target, intent) {
  const yaw = Math.atan2(target.x - actor.x, target.z - actor.z);
  return intent === 'hex'
    ? {shape: 'circle', x: target.x, z: target.z, yaw: 0, reach: 1.85, arc: Math.PI * 2}
    : {shape: 'cone', x: actor.x, z: actor.z, yaw,
        reach: intent === 'heavy' ? 3.4 : 2.7,
        arc: intent === 'heavy' ? Math.PI * .95 : Math.PI * .72};
}

export function validPattern(p) {
  return !!p && ['circle', 'cone'].includes(p.shape)
    && ['x', 'z', 'yaw', 'reach', 'arc'].every(k => Number.isFinite(p[k]))
    && p.reach > 0 && p.reach <= 12 && p.arc > 0 && p.arc <= Math.PI * 2;
}

export function insidePattern(p, point) {
  if (!validPattern(p)) return false;
  const dx = point.x - p.x, dz = point.z - p.z, d = Math.hypot(dx, dz);
  if (d > p.reach) return false;
  if (p.shape === 'circle' || d < .15) return true;
  const delta = Math.atan2(Math.sin(Math.atan2(dx, dz) - p.yaw), Math.cos(Math.atan2(dx, dz) - p.yaw));
  return Math.abs(delta) <= p.arc / 2;
}

export function nextChain(chain) {
  return chain?.remaining > 0 && chain.index < 3 ? chain.index + 1 : 1;
}

// Joystick and keyboard dodges use the same camera-relative axes as walking.
export function dodgeDirection(yaw, forward = 0, strafe = 0) {
  const x = Math.sin(yaw) * forward - Math.cos(yaw) * strafe;
  const z = Math.cos(yaw) * forward + Math.sin(yaw) * strafe;
  const length = Math.hypot(x, z);
  return length > .08 ? {x: x / length, z: z / length} : null;
}
