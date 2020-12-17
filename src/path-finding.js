/**
 * PathFinding.
 * Module for path finding function
 */
export const PathFinding = {
  /**
   * aStar.
   * A* Path Finding
   */
  aStar({ graph, start, finish }) {
    let startPlace = graph.find((t) => PathFinding.inArea(t, start))
    if (startPlace == null) {
      startPlace = graph.map((t) => ({
        node: t,
        cost: Math.min(
          PathFinding.distanceCost(t, start),
          PathFinding.distanceCost({ x: t.x + t.width, y: t.y + t.height }, start),
        ),
      })).sort((a, b) => a.cost - b.cost)[0].node;
    }
    const finishPlace = graph.find((t) => PathFinding.inArea(t, finish));
    // Can't find a destination -> no route possible
    if (!finishPlace) { return []; }
    // No route necessary
    if (startPlace === finishPlace) { return [finish]; }

    const nextPlaces = [];
    const key = (t) => `${t.x}:${t.y}`;
    const been = { };
    let place = { ...startPlace, x: start.x, y: start.y, cost: 0 };
    while (place && (place.x !== finishPlace.x || place.y !== finishPlace.y)) {
      // Don't go in a cycle/loop
      const { points } = place;
      if (points == null) {
        console.log('Place', place);
        debugger;
      }
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (been[key(point)]) { continue; }
        const newPlace = { ...point.neighbor, from: { ...point, from: place.from } };
        newPlace.runningCost = (place.runningCost || 0)
          + PathFinding.moveCost(place.from || place, point);
        newPlace.cost = newPlace.runningCost;
          + PathFinding.distanceCost(point, finish);

        nextPlaces.push(newPlace);
        been[key(point)] = true;
      }
      // Sort ascending order
      nextPlaces.sort((place1, place2) => place1.cost - place2.cost);
      // Remove the first element of array
      place = nextPlaces.shift();
    }
    // "place" is now the destination (and it has a "from" property), or undefined
    let lastDirection;
    const path = [];
    if (place && (place.x !== finish.x || place.y !== finish.y)) {
      path.push(finish);
    }
    // Go backwards through the path using the "from"s that setup before:
    while (place && place.from) {
      const newDirection = PathFinding.getDirection(place, place.from);
      if (lastDirection !== newDirection) {
        lastDirection = newDirection;
        path.push({ x: place.from.x, y: place.from.y });
      }
      place = place.from;
    }
    // reverse the path before returning it
    path.reverse();
    return path;
  },

  getGatewayPoint(to, from, actorSize) {
    if (to.width === 1 || to.height === 1) { return { x: to.x, y: to.y }; }

    // They have the same x
    const margin = Math.floor(actorSize / 2);
    const toXEnd = to.x + to.width;
    const fromXEnd = from.x + from.width;
    const toYEnd = to.y + to.height;
    if (toXEnd === from.x || to.x === fromXEnd) {
      const lastStart = Math.max(to.y, from.y);
      const firstEnd = Math.min(toYEnd, from.y + from.height);
      const sameLine = toXEnd === from.x
        ? toXEnd - margin
        : to.x + margin;

      return {
        x: sameLine,
        y: lastStart + Math.floor((firstEnd - lastStart) / 2),
      };
    }
    // They have the same y
    const lastStart = Math.max(to.x, from.x);
    const firstEnd = Math.min(toXEnd, fromXEnd);
    const sameLine = toYEnd === from.y
      ? toYEnd - margin
      : to.y + margin;

    return {
      x: lastStart + Math.floor((firstEnd - lastStart) / 2),
      y: sameLine,
    };
  },

  /**
   * getDirection.
   * Gets the direction between two points
   * @returns {string} something like: '0:0', '-1:0', '1:1', 'origin'
   */
  getDirection(start, finish) {
    return finish
      ? `${start.x - finish.x}:${start.y - finish.y}`
      : 'origin';
  },

  /**
   * inArea.
   *
   * @param {} area
   * @param {} point
   */
  inArea(area, point) {
    return area.x <= point.x
      && area.y <= point.y
      && area.x + area.width > point.x
      && area.y + area.height > point.y;
  },

  /**
   * distanceCost.
   *
   * @param start
   * @param finish
   * @returns {number} - distance between start a finish
   */
  distanceCost(start, finish) {
    return ((Math.sqrt((finish.x - start.x) ** 2) + (finish.y - start.y) ** 2)) / 2;
  },

  /**
   * moveCost.
   * A sperate cost calculation for each move.
   * @param {} start
   * @param {} finish
   */
  moveCost(start, finish) {
    return Math.sqrt((start.x - finish.x) ** 2 + (start.y - finish.y) ** 2);
  },

  gridToSubgraph({ grid, width, height, actorSize, x, y }) {
    const subWidth = Math.floor(width / 2);
    const remainderWidth = width - subWidth;
    const subHeight = Math.floor(height / 2);
    const remainderHeight = height - subHeight;

    const isFree = !PathFinding.hasBlock({ grid, x, y, width, height });
    if (width < actorSize && height < actorSize) { return []; }
    if (isFree) {
      const area = { x, y, width, height, neighbors: [] };
      return [area];
    }
    if (subWidth === 0) {
      return [];
    }

    const topLeft = PathFinding.gridToSubgraph({
      grid,
      width: subWidth,
      height: subHeight,
      actorSize,
      x,
      y,
    });
    const topRight = PathFinding.gridToSubgraph({
      grid,
      width: remainderWidth,
      height: subHeight,
      actorSize,
      x: x + subWidth,
      y,
    });
    const botLeft = PathFinding.gridToSubgraph({
      grid,
      width: subWidth,
      height: remainderHeight,
      actorSize,
      x,
      y: y + subHeight,
    });
    const botRight = PathFinding.gridToSubgraph({
      grid,
      width: remainderWidth,
      height: remainderHeight,
      actorSize,
      x: x + subWidth,
      y: y + subHeight,
    });
    /* eslint-disable no-param-reassign */
    const topLeftPotentials = [...topRight, ...botLeft];
    topLeft.forEach((k) => {
      k.neighbors = k.neighbors.concat(topLeftPotentials.filter(
        (t) => PathFinding.areNeighbors(k, t, actorSize),
      ));
    });
    const topRightPotentials = [...topLeft, ...botRight];
    topRight.forEach((k) => {
      k.neighbors = k.neighbors.concat(topRightPotentials.filter(
        (t) => PathFinding.areNeighbors(k, t, actorSize),
      ));
    });
    const botLeftPotentials = [...topLeft, ...botRight];
    botLeft.forEach((k) => {
      k.neighbors = k.neighbors.concat(botLeftPotentials.filter(
        (t) => PathFinding.areNeighbors(k, t, actorSize),
      ));
    });
    const botRightPotentials = [...topRight, ...botLeft];
    botRight.forEach((k) => {
      k.neighbors = k.neighbors.concat(botRightPotentials.filter(
        (t) => PathFinding.areNeighbors(k, t, actorSize),
      ));
    });
    /* eslint-enable no-param-reassign */
    return [...topLeft, ...topRight, ...botLeft, ...botRight];
  },

  gridToGraph({ grid, width, height, actorSize }) {
    const res = PathFinding.gridToSubgraph({
      grid,
      width,
      height,
      actorSize,
      x: 0,
      y: 0,
    });

    const graph = res.filter((t, i, self) => self.indexOf(t) === i);
    return PathFinding.splitGraphIntoPoints(graph, actorSize);

    // return graph;
  },

  hasBlock({ grid, x, y, width, height }) {
    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        if (grid[i] != null && grid[i][j] > 0) {
          return true;
        }
      }
    }

    return false;
  },

  areNeighbors(a, b, overlap) {
    if (a.x + a.width === b.x || b.x + b.width === a.x) {
      const lastStart = Math.max(a.y, b.y);
      const firstEnd = Math.min(a.y + a.height, b.y + b.height);
      return firstEnd - lastStart >= overlap;
    }

    if (a.y + a.height === b.y || b.y + b.height === a.y) {
      const lastStart = Math.max(a.x, b.x);
      const firstEnd = Math.min(a.x + a.width, b.x + b.width);

      return firstEnd - lastStart >= overlap;
    }
    return false;
  },

  graphToForest(graph, marked = [], root = true) {
    if (marked.length > 1240) { return []; }
    const newMarks = graph.filter((t) => !marked.includes(t));
    const treeLevel = newMarks
      .map((t) => ({
        ...t,
        neighbors: PathFinding.graphToForest(
          t.neighbors,
          root ? [t] : newMarks.concat(marked),
          false,
        ),
      }));
    return treeLevel;
  },

  splitGraphIntoPoints(graph, minSize, replace = {}) {
    const key = (t) => `${t.x}:${t.y}`;
    return graph.map((t) => {
      const node = { ...t };
      replace[key(node)] = node;
      node.points = node.neighbors.map((k) => {
        const neighborKey = key(k);
        const neighbor = replace[neighborKey] != null
          ? replace[neighborKey]
          : PathFinding.splitGraphIntoPoints([k], minSize, replace)[0];
        replace[neighborKey] = neighbor;
        return {
          ...PathFinding.getGatewayPoint(k, node, minSize),
          neighbor,
        };
      });
      return node;
    });
  },
};
