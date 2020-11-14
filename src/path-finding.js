/**
* PathFinding.
* Module for path finding function
*/
export const PathFinding = {
  /**
  * aStar.
  * A* Path Finding
  */
  aStar({graph, start, finish}) {
    const nextPlaces = [];
    let place = start;
    while (place && (place.x !== finish.x || place.y !== finish.y)) {
      const maxNumberOfNeighbors = 9;
      // eslint-disable-nextPlaces-line no-plusplus
      for (let i = 0; i < maxNumberOfNeighbors; i++) {
        const offsetX = 1 - (i % 3);// -1,  0,  1, -1, 0, 1, -1, 0, 1
        const offsetY = 1 - Math.floor(i / 3);// -1, -1, -1,  0, 0, 0,  1, 1, 1
        const newX = place.x + offsetX;
        const newY = place.y + offsetY;
        // Don't stay in the same place
        if (offsetX === 0 && offsetY === 0) continue;
        // Bounds of the graph could not be going through
        if (newX < 0 || newY < 0) continue;

        if (newY >= graph.length || newX >= graph[newY].length) continue;
        // Don't go in a cycle/loop
        if (nextPlaces.some((place) => place.x === newX && place.y === newY)) continue;

        if (graph[newY][newX] > 0) continue;

        const newPlace = {
          x: newX,
          y: newY,
          from: place,
        };
        newPlace.cost = (place.cost || 0)
          + PathFinding.distanceCost(place, newPlace);
          + PathFinding.distanceCost(newPlace, finish);

        nextPlaces.push(newPlace);
      }
      // Sort ascending order
      nextPlaces.sort((place1, place2) => place1.cost - place2.cost);
      // Remove the first element of array
      place = nextPlaces.shift();
    }
    // "place" is now the destination (and it has a "from" property), or undefined
    let lastDirection = undefined;
    const path = [];
    // Go backwards through the path using the "from"s that setup before:
    while (place && place.from) {
      const newDirection = PathFinding.getDirection(place, place.from);
      if (lastDirection !== newDirection) {
        lastDirection = newDirection;
        path.push({x: place.x, y: place.y});
      }
      place = place.from;
    }
    // reverse the path before returning it
    path.reverse();
    return path;
  },

  /**
  * getDirection.
  * A* Path Finding
  * @returns {string} something like: '0:0', '-1:0', '1:1', 'origin'
  */
  getDirection: function (start, finish) {
    if (finish) {
      return `${Math.sign(start.x - finish.x)}:${Math.sign(start.y - finish.y)}`;
    } else {
      return 'origin';
    }
  },

  /**
   * distanceCost.
   * @param start
   * @param finish
   * @returns {number} - distance between start a finish
   */
  distanceCost(start, finish) {
    return Math.abs(start.x - finish.x)
      + Math.abs(start.y - finish.y);
  }
};
