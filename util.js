export class Util {
  // Distance between a and b assuming a: { x, y, width, height } and b: { x, y, width, height }
  static dist(a, b) {
      const ax = a.x+(a.width || 0)/2; // Get the centers
      const ay = a.y+(a.height || 0)/2;
      const bx = b.x+(b.width || 0)/2;
      const by = b.y+(b.height || 0)/2;
      return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
  }

  // Determine if two actors are equal
  static eq(a, b) {
      return a.x === b.x && a.y === b.y && a.size === b.size && a.speed === b.speed;
  }
}
