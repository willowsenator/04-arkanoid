/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * @param {{x: number, y: number, radius: number}} circle
 * @param {{x: number, y: number, width: number, height: number}} rect
 * @returns {{hit: boolean, side: string | null}}
 */
export function circleRectCollision(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared > circle.radius * circle.radius) {
    return { hit: false, side: null };
  }

  const overlapLeft = (circle.x + circle.radius) - rect.x;
  const overlapRight = (rect.x + rect.width) - (circle.x - circle.radius);
  const overlapTop = (circle.y + circle.radius) - rect.y;
  const overlapBottom = (rect.y + rect.height) - (circle.y - circle.radius);
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  let side;
  if (minOverlap === overlapTop) side = 'top';
  else if (minOverlap === overlapBottom) side = 'bottom';
  else if (minOverlap === overlapLeft) side = 'left';
  else side = 'right';

  return { hit: true, side: side };
}

/**
 * @param {number} vx
 * @param {number} vy
 * @param {string} side
 * @returns {{vx: number, vy: number}}
 */
export function reflect(vx, vy, side) {
  if (side === 'top' || side === 'bottom') {
    return { vx: vx, vy: -vy };
  }
  return { vx: -vx, vy: vy };
}

/**
 * @param {number} hitX
 * @param {number} paddleX
 * @param {number} paddleWidth
 * @param {number} speed
 * @returns {{vx: number, vy: number}}
 */
export function paddleBounceVelocity(hitX, paddleX, paddleWidth, speed) {
  const paddleCenter = paddleX + paddleWidth / 2;
  const rawOffset = (hitX - paddleCenter) / (paddleWidth / 2);
  const offset = clamp(rawOffset, -1, 1);
  const maxHorizontalFraction = 0.75;
  const vx = offset * speed * maxHorizontalFraction;
  const vy = -Math.sqrt(Math.max(0, speed * speed - vx * vx));
  return { vx: vx, vy: vy };
}
