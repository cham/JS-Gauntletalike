/**
* A* (A-Star) Pathfinding Algorithm in JavaScript
* @author  Matthew Trost
* @license Creative Commons Attribution-ShareAlike 3.0 Unported License
* @datepublished December 2010
*/
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		AStar = (function(){

			function astar (map, heuristic, cutCorners) {
				var listOpen = [];
				var listClosed = [];
				var listPath = [];
				var nodeGoal = createTerminalNode(map, heuristic, "g", null);
				var nodeStart = createTerminalNode(map, heuristic, "s", nodeGoal);
				addNodeToList(nodeStart, listOpen);
				
				var n;
				while (!isListEmpty(listOpen)) {
					n = returnNodeWithLowestFScore(listOpen);
					addNodeToList(n, listClosed);
					removeNodeFromList(n, listOpen);
					if (areNodesEqual(n, nodeGoal)) {
						pathTo(n, listPath);
						listPath.reverse();
						return listPath;
					}
					n.makeChildNodes(map, heuristic, cutCorners, nodeGoal);
					cullUnwantedNodes(n.childNodes, listOpen);
					cullUnwantedNodes(n.childNodes, listClosed);
					removeMatchingNodes(n.childNodes, listOpen);
					removeMatchingNodes(n.childNodes, listClosed);
					addListToList(n.childNodes, listOpen);
				}
				return null;
			}

			function pathTo (n, listPath) {
				listPath.push(new NodeCoordinate(n.row, n.col));
				if (n.parentNode == null)
					return;
				pathTo(n.parentNode, listPath);
			}

			function addListToList(listA, listB) {
				for (x in listA)
					listB.push(listA[x]);
			}

			function removeMatchingNodes (listToCheck, listToClean) {
				var listToCheckLength = listToCheck.length;
				for (var i = 0; i < listToCheckLength; i++) {
					for (var j = 0; j < listToClean.length; j++) {
						if (listToClean[j].row == listToCheck[i].row && listToClean[j].col == listToCheck[i].col)
							listToClean.splice(j, 1);
					}
				}
			}

			function cullUnwantedNodes (listToCull, listToCompare) {
				var listToCompareLength = listToCompare.length;
				for (var i = 0; i < listToCompareLength; i++) {
					for (var j = 0; j < listToCull.length; j++) {
						if (listToCull[j].row == listToCompare[i].row && listToCull[j].col == listToCompare[i].col) {
							if (listToCull[j].f >= listToCompare[i].f)
								listToCull.splice(j, 1);
						}
					}
				}
			}

			function areNodesEqual (nodeA, nodeB) {
				if (nodeA.row == nodeB.row && nodeA.col == nodeB.col)
					return true;
				else
					return false;
			}

			function returnNodeWithLowestFScore (list) {
				var lowestNode = list[0];
				for (x in list)
					lowestNode = (list[x].f < lowestNode.f) ? list[x] : lowestNode;
				return lowestNode;
			}

			function isListEmpty (list) {
				return (list.length < 1) ? true : false;
			}

			function removeNodeFromList (node, list) {
				var listLength = list.length;
				for (var i = 0; i < listLength; i++) {
					if (node.row == list[i].row && node.col == list[i].col) {
						list.splice(i, 1);
						break;
					}
				}
			}

			function addNodeToList (node, list) {
				list.push(node);
			}

			function createTerminalNode (map, heuristic, nodeType, nodeGoal) {
				var mapRows = map.length;
				var mapCols = map[0].length;
				for (var row = 0; row < mapRows; row++) {
					for (var col = 0; col < mapCols; col++) {
						if (map[row][col] == nodeType) {
							return new Node(row, col, map, heuristic, null, nodeGoal);
						}
					}
				}
				return null;
			}

			function returnHScore (node, heuristic, nodeGoal) {
				var y = Math.abs(node.row - nodeGoal.row);
				var x = Math.abs(node.col - nodeGoal.col);
				switch (heuristic) {
					case "manhattan":
						return (y + x) * 10;
					case "diagonal":
						return (x > y) ? (y * 14) + 10 * (x - y) : (x * 14) + 10 * (y - x);
					case "euclidean":
						return Math.sqrt((x * x) + (y * y));
					default:
						return null;
				}
			}

			function NodeCoordinate (row, col) {
				this.row = row;
				this.col = col;
			}

			function Node (row, col, map, heuristic, parentNode, nodeGoal) {
				var mapLength = map.length;
				var mapRowLength = map[0].length;
				this.row = row;
				this.col = col;
				this.northAmbit = (row == 0) ? 0 : row - 1;
				this.southAmbit = (row == mapLength - 1) ? mapLength - 1 : row + 1;
				this.westAmbit = (col == 0) ? 0 : col - 1;
				this.eastAmbit = (col == mapRowLength - 1) ? mapRowLength - 1 : col + 1;
				this.parentNode = parentNode;
				this.childNodes = [];

				if (parentNode != null) {
					if (row == parentNode.row || col == parentNode.col)
						this.g = parentNode.g + 10;
					else
						this.g = parentNode.g + 14;
					this.h = returnHScore(this, heuristic, nodeGoal);
				}
				else {
					this.g = 0;
					if (map[row][col] == "s")
						this.h = returnHScore(this, heuristic, nodeGoal);
					else
						this.h = 0;
				}
				this.f = this.g + this.h;
				
				this.makeChildNodes = function (map, heuristic, cutCorners, nodeGoal) {
					for (var i = this.northAmbit; i <= this.southAmbit; i++) {
						for (var j = this.westAmbit; j <= this.eastAmbit; j++) {
							if (i != this.row || j != this.col) {
								if (map[i][j] != "u") {
									if (cutCorners == true) 
										this.childNodes.push(new Node(i, j, map, heuristic, this, nodeGoal));
									else {
										if (i == this.row || j == this.col)
											this.childNodes.push(new Node(i, j, map, heuristic, this, nodeGoal));	
									}
								}
							}
						}
					}
				}
			}

			var getMovementFromTo = function( c , g ){
					var map = Gauntlet.Stage.getWalkableMap() ,
						goal = g ,
						start = c ,
						path = [] , movement = [0,0] , nextPos , nextX , nextY;

					if( goal.y === start.y && goal.x === start.x ){ return [0,0]; }

					map[goal.y][goal.x] = 'g';
					map[start.y][start.x] = 's';

					path = astar( map , 'manhattan' , true );
					if( path && path.length > 1 ){
						// else calculate movement to NodeCoordinate 2 ([1])
						nextPos = path[1];
						nextX = nextPos.col-start.x;
						nextY = nextPos.row-start.y;
						if( nextX !== 0 ){
							nextX /= Math.abs( nextX );
						}
						if( nextY !== 0 ){
							nextY /= Math.abs( nextY );
						}
						movement = [ nextX , nextY ];
					}
					map[goal.y][goal.x] = 'w';
					map[start.y][start.x] = 'w';
					return movement;
				},
				getMovementSequenceFromTo = function(c,g,seqSize){
					var map = Gauntlet.Stage.getWalkableMap() ,
						goal = g ,
						start = c ,
						path = [] , sequence = [] , nextPos , nextX , nextY;

					if( goal.y === start.y && goal.x === start.x ){ return [0,0]; }

					map[goal.y][goal.x] = 'g';
					map[start.y][start.x] = 's';

					path = astar( map , 'manhattan' , true );
					if( path && path.length > 1 ){
						sequence = _(path).chain()
										.rest()
										.first(seqSize)
										.map(function(pathitem){
											nextX = pathitem.col-start.x;
											nextY = pathitem.row-start.y;
											if( nextX !== 0 ){
												nextX /= Math.abs( nextX );
											}
											if( nextY !== 0 ){
												nextY /= Math.abs( nextY );
											}
											start.x = pathitem.col;
											start.y = pathitem.row;
											return [ nextX , nextY ];
										})
										.compact()
										.value();
					}
					map[goal.y][goal.x] = 'w';
					map[start.y][start.x] = 'w';
					return sequence;
				};

			return {

				'getMovementFromTo': _( getMovementFromTo ).memoize( function(a,b){ return '' +a.x+','+a.y+','+b.x+','+b.y; } ),
				'getMovementSequenceFromTo': _( getMovementSequenceFromTo ).memoize( function(a,b,c){ return '' +a.x+','+a.y+','+b.x+','+b.y+','+c; } ),

			};

		})();

	Gauntlet.AStar = AStar;
	window.Gauntlet = Gauntlet;

})(this);

/**

map format 2D Array:
	u = unwalkable, w = walkable, s = start , g = goal
	if map is not sane (no u,w,s and g) then does not fail gracefully
	map format e.g.: 
	[ ["u", "u", "u", "u", "u"],  
	["w", "w", "w", "w", "g"],  
	["w", "w", "u", "w", "w"],  
	["s", "w", "u", "w", "w"],  
	["u", "u", "u", "w", "w"] ]

heuristic:
	"manhattan" – the speedy Manhattan method, which adds up the x and y distance
	"diagonal" – uses a diagonal line, plus any remaining x/y distance
	"euclidean" – The familiar, elementary distance formula, accurate but slow

cutCorners
	The cutCorners parameter, which accepts a Boolean argument, specifies whether the path can include any diagonal steps – including steps between two unwalkable nodes situated diagonally:
	true – corners may be cut (i.e., diagonal movement is allowed)
	false – corners may not be cut

returns an array of NodeCoordinate objects format [{row:Number,col:Number},...] - NodeCooirdinate approximate to coords object, substitute row with x and col with y
		or null

	to find movement, check array returned greater than 1

  **/