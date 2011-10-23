/**
 * Game
 *
 * dependency tree:
 *   MapProvider
 *   Tileset
 *     Stage
 *       Player
 *         Renderer
 *         Controller
 *
 *
 * @author Dan Neame <@cham>
 */
(function(window){

  var jQuery = window.jQuery ,

	  Gauntlet = window.Gauntlet || {} ,

	  /**
	   * MapProvider
	   * provides an interface for loading JSON map files
	   *
	   * getLevel(lnum:Number,cb:Function):Object
	   */
	  MapProvider = (function(){

		var	filepath = 'maps/',
			getLevel = function( lnum ,cb ){
			  jQuery.ajax( {
				url: filepath + lnum + '.json',
				dataType: 'json',
				success: function( data ){
				  cb( data );
				},
				error: function(a,b,c){ console.log(a,b,c); }
			  } );
			};

		return {
		  'getLevel': getLevel
		};

	  })(),

	  /**
	   * Tileset
	   * provides an interface for loading JSON map files
	   *
	   * load(cb:Function):undefined,
	   * getSpriteInfo(tiletype:String,salt:Number):Object
	   */
	  Tileset = (function(){

		var tileinfopath = 'maps/tilesets/shiningforce.json' ,
			mappath ,characterpath = '' ,
			pixel_dims ,
			mapsprite = document.createElement( 'canvas' ) ,
			charactersprite = document.createElement( 'canvas' ) ,
			tilepositions = {} , playerstates = {}, monsterstates = {},
			/**
			 * load
			 * load and parse the tileset description, then load the associated sprites, then run the given callback
			 *
			 * @function undefined
			 * @param {Function} cb the callback to run when loaded
			 */
			load = function( cb ){
			  var count = 2; // number of images still to load
			  jQuery.ajax({
				url: tileinfopath ,
				dataType: 'json',
				success: function( data ){
				  var mapimg = new Image() ,
					  characterimg = new Image();
				  // set local vars
				  mappath = data.mappath;
				  characterpath = data.characterpath;
				  pixel_dims = data.tilepixeldims;
				  tilepositions = data.tilepositions;
				  playerstates = data.playerstates;
				  monsterstates = data.monsterstates;
				  // load images, onload create canvas elements and execute cb when both done
				  mapimg.onload = function(){
					var ctx = mapsprite.getContext( '2d' );
					mapsprite.width = this.naturalWidth;
					mapsprite.height = this.naturalHeight;
					ctx.drawImage( this , 0 , 0 , this.naturalWidth , this.naturalHeight );
					count--; if( !count && cb ){ cb(); }
				  };
				  characterimg.onload = function(){
					charactersprite.width = this.naturalWidth;
					charactersprite.height = this.naturalHeight;
					charactersprite.getContext( '2d' ).drawImage( this , 0 , 0 , this.naturalWidth , this.naturalHeight );
					count--; if( !count && cb ){ cb(); }
				  };
				  mapimg.src = mappath;
				  characterimg.src = characterpath;
				},
				error: function(a,b,c){
console.log(a,b,c);
				}
			  });
			},
			/**
			 * getSpriteInfo
			 * returns an object containing the image to load and co-ordinates to load it at
			 *
			 * @function object
			 * @param {String} tiletype
			 * @param {Number} salt
			 */
			getSpriteInfo = function( tiletype , salt , f ){
			  var facing = f || '';
			  // if player return player sheet else return tilesheet
			  if( tiletype === 'player' ){
				return { canvas: charactersprite , x: playerstates[  facing ][ salt ].x  , y: playerstates[  facing ][ salt ].y , tiledims: pixel_dims };
			  }else if( tiletype === 'monster' ){
				return { canvas: charactersprite , x: monsterstates[ facing ][ salt ].x  , y: monsterstates[ facing ][ salt ].y , tiledims: pixel_dims };
			  }else{
				return { canvas: mapsprite , x: tilepositions[ tiletype ].x , y: tilepositions[ tiletype ].y , tiledims: pixel_dims };
			  }
			};

		return {
		  load:load,
		  getSpriteInfo:getSpriteInfo,
		  getPixelDims: function(){ return pixel_dims; }
		};

	  })(),

	  Monster = (function(){

		var coords = {x:0,y:0},
			offset = {x:0,y:0},
			moving = [0,0],
			facing = 'down',
			movementSpeed = 3,
			getNewOffset = function(){
			  var newX = offset.x + ( moving[0] * movementSpeed ) ,
				  newY = offset.y + ( moving[1] * movementSpeed ) ,
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
			setPosition = function(newCoords){
			  coords = newCoords;
			},
			getPosition = function(){
			  return coords;
			},
			getFacing = function(){
			  return facing;
			},
			getOffset = function(){
			  return offset;
			},
			getTilesToRedraw = function(){
			  // tiles to redraw are the current position and all surrounding tiles
			  var currentIndex = Stage.getIndexFor( coords ) ,
				  map = Stage.getMap() ,
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
			/**
			 * move
			 * sets moving array to move in the direction of the player
			 */
			move = function(){
			  // calculate movement vector
			  var playerPos = Player.getTile() ,
				  xdiff = coords.x - playerPos.x ,
				  ydiff = coords.y - playerPos.y ,
				  newOffset,newTilePos,tilesToUpdate=[],
				  tile;
			  moving = [ xdiff > 0 ? -1 : ( xdiff < 0 ? 1 : 0 ) , ydiff > 0 ? -1 : ( ydiff < 0 ? 1 : 0 ) ];
			  // calculate new offset / tile
			  newOffset = getNewOffset();
			  newTilePos = { x: coords.x + newOffset.tileX , y: coords.y + newOffset.tileY };
			  tile = Stage.getTileAt( newTilePos );
			  if( tile.substr(0,1) === "f" ){
				offset.x = newOffset.x;
				offset.y = newOffset.y;
				coords = newTilePos;
			  }
			  // set facing
			  switch( moving[0] ){
				case -1:
				  facing = 'left';
				  break;
				case 1:
				  facing = 'right';
				  break;
			  }
			  switch( moving[1] ){
				case -1:
				  facing = 'up';
				  break;
				case 1:
				  facing = 'down';
				  break;
			  }
			  if( playerPos.x === coords.x && playerPos.y === coords.y ){
				Game.stop();
				alert( 'You were eaten by a grue' );
			  }
			  // get indexes of tiles to redraw
			  tilesToUpdate = getTilesToRedraw();
			  _( tilesToUpdate ).each( function( tileIndex ){
				Renderer.queueForUpdate( tileIndex );
			  });
			};

		return {
		  'move': move,
		  'setPosition': setPosition,
		  'getPosition': getPosition,
		  'getOffset': getOffset,
		  'getFacing': getFacing,
		  'clone' : function(){
			function F() {}
			F.prototype = this;
			return new F();
		  }
		};

	  })();

	  /**
	   * MonsterSpawner
	   * clones and sets up new Monster objects
	   */
	  MonsterSpawner = (function(){

		var monsters = [], // array of monster objects the spawner has spawned
			coords = {x:17,y:7}, // coordinates to spawn new monsters at
			/**
			 * spawnNewMonster
			 * creates a new monster object and runs initialisation methods on it
			 */
			spawnNewMonster = function(){
			  var monster = Monster.clone();
			  monster.setPosition( coords );
			  monsters.push( monster );
			},
			/**
			 * moveMonsters
			 * moves all monsters in local array
			 */
			moveMonsters = function(){
			  _( monsters ).each( function( monster ){
				monster.move();
			  });
			},
			getMonsterStates = function(){
			  var states = [];
			  _( monsters ).each( function( monster ){
				states.push( {
				  'facing': monster.getFacing(),
				  'coords': monster.getPosition(),
				  'offset': monster.getOffset()
				} );
			  });
			  return states;
			};

		return {
		  'spawnNewMonster':spawnNewMonster,
		  'getMonsterStates':getMonsterStates,
		  'moveMonsters':moveMonsters
		};

	  })(),

	  /**
	   * Renderer
	   * renders the playing area
	   *
	   * render():undefined
	   */
	  Renderer = (function(){

		var map ,
			ctx ,
			pixeldims ,
			updateList = [] ,
			playerSwitch = 7 ,
			clear = function(){
			  ctx.clearRect( 0 , 0 , ( map.mapdims.x * pixeldims.x ) , ( map.mapdims.y * pixeldims.y ) );
			},
			drawTile = function( ox , oy , dx , dy , tileType , tileIndex , facing , offS ){
			  var spriteInfo , chunk , offset = offS || {x:0,y:0};
			  spriteInfo = Tileset.getSpriteInfo( tileType , tileIndex , facing );
			  //chunk = spriteInfo.canvas.getContext( '2d' ).getImageData( spriteInfo.x , spriteInfo.y , spriteInfo.tiledims.x , spriteInfo.tiledims.y );
			  //ctx.putImageData( chunk , ox , oy );
			  try {
				ctx.drawImage( spriteInfo.canvas, spriteInfo.x, spriteInfo.y , spriteInfo.tiledims.x, spriteInfo.tiledims.y, ox  + offset.x , oy  + offset.y , dx - ox , dy - oy );
			  }catch( e ){
				console.log( e , spriteInfo );
			  }
			},
			drawBackground = function(){
			  _.each( _.uniq( updateList ) , function( i ){
				var tilecoords = Stage.getCoordsFor( i ) ,
				  tx = pixeldims.x , ty = pixeldims.y ,
				  ox = tilecoords.x * tx ,
				  oy = tilecoords.y * ty;
				drawTile( ox , oy , ox + tx , oy + ty , map.mapdata[ i ] , i );
			  });
			},
			drawPlayer = function(){
			  var pc = Player.getTile() ,
				  tx = pixeldims.x , ty = pixeldims.y ,
				  ox = pc.x * tx ,
				  oy = pc.y * ty;
			  playerSwitch--;
			  if( playerSwitch < 0 ){
				playerSwitch = 7;
			  }
			  drawTile( ox , oy , ox + tx , oy + ty , 'player' , +( playerSwitch > 3 ) , Player.getFacing() , Player.getOffset() );
			},
			drawMonsters = function(){
			  var monsterStates = MonsterSpawner.getMonsterStates() ,
				  tx = pixeldims.x , ty = pixeldims.y ,
				  ox,oy;
			  _( monsterStates ).each( function( mState ){
				ox = mState.coords.x * tx ,
				oy = mState.coords.y * ty;
				drawTile( ox , oy , ox + tx , oy + ty , 'monster' , +( playerSwitch > 3 ) , mState.facing , mState.offset );
			  } );
			},
			render = function(){
			  map = Stage.getMap();
			  ctx = Stage.getContext();
			  pixeldims = Tileset.getPixelDims();
			  // draw background
			  drawBackground();
			  // draw player
			  drawPlayer();
			  // draw monsters
			  drawMonsters();
			  updateList = []; // empty updatelist for next render
			};

		return {
		  render: render,
		  queueForUpdate: function( index ){ updateList.push( index ); },
		  setUpdateList: function( ul ){ updateList = ul; }
		}

	  })(),

	  Stage = (function(){

		var	map = {},
			$_canvas = {} ,
			stageDims = {width:null,height:null},
			ctx = null,
			makeCanvas = function( w , h ){
			  $_canvas = jQuery( '<canvas/>' );
			  ctx = $_canvas.get( 0 ).getContext( '2d' );
			  $_canvas.attr({
				width:w,
				height:h
			  });
			},
			injectCanvas = function(){
			  jQuery( '.game' ).html( $_canvas );
			},
			load = function( lnum , cb ){
			  // load the level as JSON
			  MapProvider.getLevel( lnum , function( mapObj ){
				// set map
				map = mapObj;
				pixelsdims = Tileset.getPixelDims();
				// set stge width and height
				stageDims.width = ( map.mapdims.x * pixelsdims.x );
				stageDims.height = ( map.mapdims.y * pixelsdims.y );
				// make a new canvas for the given map
				makeCanvas( stageDims.width , stageDims.height );
				// pass to dom
				injectCanvas();
				// run callback if passed
				if( cb ){ cb(); }
			  });
			},
			getEntrance = function(){
			  // find entrance (fe) in mapdata and return correspoding co-ords
			  return getCoordsFor( _.indexOf( map.mapdata , 'fe' ) );
			},
			getTileAt = function( coords ){
			  if( coords.x < 0 || coords.x >= map.mapdims.x || coords.y < 0 || coords.y >= map.mapdims.y ){
				return '0';
			  }
			  // translate coords into index
			  return map.mapdata[ getIndexFor( coords ) ];
			},
			getCoordsFor = function( ind ){
			  var row = Math.floor( ind / map.mapdims.x ) ,
				  col = ind - ( map.mapdims.x * row );
			  return {
				x: col ,
				y: row
			  };
			},
			getIndexFor = function( coords ){
			  var ind = coords.y * map.mapdims.x;
			  return ( ind + coords.x );
			};

		return {
		  load: load,
		  getEntrance: getEntrance,
		  getTileAt:getTileAt,
		  getCoordsFor:getCoordsFor,
		  getIndexFor:getIndexFor,
		  getMap:function(){return map;},
		  getContext:function(){return ctx;},
		  getCanvas:function(){return $_canvas;}
		};

	  })(),

	  Player = (function(){

		var intile = {x:0,y:0} ,
			moving = [0,0],
			facing = 'down',
			pixel_offset = {x:0,y:0},
			movementSpeed = 5,
			moveToEntrance = function(){
			  intile = Stage.getEntrance();
			},
			getNewOffset = function(){
			  var newX = pixel_offset.x + ( moving[0] * movementSpeed ) ,
				  newY = pixel_offset.y + ( moving[1] * movementSpeed ) ,
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
			getTilesToRedraw = function(){
			  // tiles to redraw are the current position and all surrounding tiles
			  var currentIndex = Stage.getIndexFor( intile ) ,
				  map = Stage.getMap() ,
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
			move = function(){
			  // get new offset and set new tile position if moving tile
			  var newOffset = getNewOffset() ,
				  newTilePos = { x: intile.x + newOffset.tileX , y: intile.y + newOffset.tileY } ,
				  tile = Stage.getTileAt( newTilePos ) ,
				  tilesToUpdate = [];
			  // set facing
			  switch( moving[0] ){
				case -1:
				  facing = 'left';
				  break;
				case 1:
				  facing = 'right';
				  break;
			  }
			  switch( moving[1] ){
				case -1:
				  facing = 'up';
				  break;
				case 1:
				  facing = 'down';
				  break;
			  }
			  // set new offset and tile position if moving into a floor tile
			  if( tile.substr(0,1) === "f" ){
				pixel_offset.x = newOffset.x;
				pixel_offset.y = newOffset.y;
				intile = newTilePos;
			  }
			  // get indexes of tiles to redraw
			  tilesToUpdate = getTilesToRedraw();
			  _( tilesToUpdate ).each( function( tileIndex ){
				Renderer.queueForUpdate( tileIndex );
			  });
			},
			setMovement = function( index , val ){
			  moving[ index ] = val;
			};

		return {

		  moveToEntrance: moveToEntrance,
		  move:move,
		  setMovement:setMovement,
		  getTile:function(){return intile;},
		  getOffset:function(){return pixel_offset;},
		  getFacing:function(){return facing;}

		};

	  })(),

	  Controller = (function(){

		var listen = function(){
		  jQuery( document ).keydown( function(e){
			var which = String.fromCharCode( e.which ).toLowerCase();
			switch( which ){
			  case 'w':
				Player.setMovement(1,-1);
				break;
			  case 'a':
				Player.setMovement(0,-1);
				break;
			  case 's':
				Player.setMovement(1,1);
				break;
			  case 'd':
				Player.setMovement(0,1);
				break;
			  default:
				break;
			}
		  }).keyup( function(e){
			var which = String.fromCharCode( e.which ).toLowerCase();
			switch( which ){
			  case 'w':
			  case 's':
				Player.setMovement(1,0);
				Player.setMovement(1,0);
				break;
			  case 'a':
			  case 'd':
				Player.setMovement(0,0);
				Player.setMovement(0,0);
				break;
			  default:
				break;
			}
		  });
		};

		return {
		  listen:listen
		};

	  })();

	  Game = (function(){

		var	frametime = 40,
			t,
			stopped = false,
			tick = function(){
			  Player.move();
			  MonsterSpawner.moveMonsters();
			  Renderer.render();
			  if( !stopped ){
				t = window.setTimeout( tick , frametime );
			  }
			}
			start = function(){
			  // load Tileset images
			  Tileset.load( function(){
				// once loaded, load the stage data
				Stage.load( 1 , function(){
				  // move player to entrance
				  Player.moveToEntrance();
				  // set render list to be whole map
				  Renderer.setUpdateList( _.keys( Stage.getMap().mapdata ) ); // set updatelist to be every tile for first render
				  MonsterSpawner.spawnNewMonster();
				  // start tick
				  tick();
				  // listen for keyboard input
				  Controller.listen();
				});
			  });
			},
			stop = function(){
			  stopped = true;
			  window.clearTimeout( t );
			};

		return {
		  start: start,
		  stop: stop
		};

	  })();

	  Gauntlet.Game = Game;
	  window.Gauntlet = Gauntlet;

})(this);
