/**
 * Checks if two bounding rectangles overlap.
 * Rects should have { x, y, width, height }
 * Note: x, y are usually the top-left corner, but adapt based on how rendering is done.
 */
export function checkRectCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Checks if two circles overlap.
 * Circles should have { x, y, radius }
 * Note: x, y is the center point.
 */
export function checkCircleCollision(c1, c2) {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < c1.radius + c2.radius;
}
