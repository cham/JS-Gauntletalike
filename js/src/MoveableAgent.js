/**
 * MoveableAgent object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		MoveableAgent = {
			coords: {x:0,y:0},
			offset: {x:0,y:0},
			moving: [0,0],
			facing: 'down',
			speed: 1,
			/**
			 * setPosition
			 * sets the position and offset
			 */
			setPosition: function( co , off ){
			  this.coords = co;
			  if( off ){
			    this.offset = off;
			  }
			},
			/**
			 * setMovement
			 * sets movement in the vector specified
			 */
			setMovement: function( v ){
			  this.moving = v;
			},
			/**
			 * getNewOffset
			 * returns a new offset for the Missile
			 */
			getNewOffset: function( movementToUse ){
			  var m = movementToUse || this.moving;
			      newX = this.offset.x + ( m[0] * this.speed ) ,
				  newY = this.offset.y + ( m[1] * this.speed ) ,
				  tileX = 0, tileY = 0;
			  // check for tile movement in x
			  if( newX > 12  ){ newX -= 24; tileX = 1; }
			  if( newX < -12 ){  newX += 24; tileX = -1; }
			  if( newY > 4  ){ newY -= 24; tileY = 1; }
			  if( newY < -20 ){  newY += 24; tileY = -1; }
			  return {
				x: newX ,
				y: newY ,
				tileX: tileX,
				tileY: tileY
			  };
			},
			/**
			 * getTilesToRedraw
			 * returns an array of tile indexes to redraw on the tile the Missile is on and those around it
			 */
			getTilesToRedraw: function(){
			  // tiles to redraw are the current position and all surrounding tiles
			  var currentIndex = Gauntlet.Stage.getIndexFor( this.coords ) ,
				  map = Gauntlet.Stage.getMap() ,
				  maxIndex = map.mapdata.length ,
				  mapDims = map.mapdims , mw = mapDims.x , mh = mapDims.y ,
				  candidatePoints = [
					currentIndex - ( mw - 1 ) ,
					currentIndex - mw ,
					currentIndex - ( mw + 1 ) ,
					currentIndex - 1 ,
					currentIndex ,
					currentIndex + 1 ,
					currentIndex + ( mw - 1 ) ,
					currentIndex + mw ,
					currentIndex + ( mw + 1 )
				  ];
			  return _.select( candidatePoints , function( index ){
				return index > -1 && index < maxIndex;
			  } );
			},
			setOffset: function( off ){
			  this.offset = off;
			},
			getPosition: function(){
			  return this.coords;
			},
			getFacing: function(){
			  return this.facing;
			},
			getPosition: function(){
			  return this.coords;
			},
			getOffset: function(){
			  return this.offset;
			},
			instance: function(){
			  function F() {}
			  F.prototype = this;
			  return new F();
			},
			/**
			 * move
			 * moves the Missile
			 */
			move: function(){
			  // check for timed events etc
			  this.beforeMoving();
			  // check current movement is safe / decide current movement
			  var checkedMovement = this.checkMovement();
			  // if not moving exit
			  if( checkedMovement && checkedMovement[ 0 ] === 0 && checkedMovement[ 1 ] === 0 ){
			    this.afterMoving();
				return;
			  }
			  // get new offset and set new tile position if moving tile
			  var newOffset = this.getNewOffset( checkedMovement ) ,
				  newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y + newOffset.tileY } ,
				  tile = Gauntlet.Stage.getTileAt( newTilePos ) ,
				  tilesToUpdate = [] ,
				  canMove = this.canMoveIntoTile( tile , newTilePos );
			  // set facing
			  switch( checkedMovement[0] ){
				case -1: this.facing = 'left';  break;
				case  1: this.facing = 'right'; break;
			  }
			  switch( checkedMovement[1] ){
				case -1: this.facing = 'up'; break;
				case  1: this.facing = 'down'; break;
			  }
			  // set new offset and tile position if agent can move into the tile specified
			  if( canMove ){
				this.offset.x = newOffset.x;
				this.offset.y = newOffset.y;
				this.coords = newTilePos;
				tilesToUpdate = this.getTilesToRedraw();
				_( tilesToUpdate ).each( function( tileIndex ){
					Gauntlet.Renderer.queueForUpdate( tileIndex );
				});
			  }
			  // check for victory conditions etc
			  this.afterMoving();
			  this.checkForSpecialTile( tile );
			},
			/**
			 * checkMovement
			 * stub function - replace if movement requires pathfinding
			 */
			checkMovement: function(){
			 	return this.moving;
			},
			/**
			 * canMoveIntoTile
			 * stub function - replace if movement checking is required
			 */
			canMoveIntoTile: function( t , c ){
				return true;
			},
			/**
			 * checkForSpecialTile
			 * stub - replace if special logic needs to run if certain tile/s passed
			 */
			checkForSpecialTile: function( t ){
				
			},
			/**
			 * afterMoving
			 * stub - replace if logic needs to run after movement complete
			 */
			afterMoving: function(){
				
			},
			/**
			 * beforeMoving
			 * stub - replace if logic needs to run after movement complete
			 */
			beforeMoving: function(){
				
			}
		};

	Gauntlet.MoveableAgent = MoveableAgent;
	window.Gauntlet = Gauntlet;

})(this);