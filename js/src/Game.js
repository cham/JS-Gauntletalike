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
			floors , walls , altWall ,
			playerstates = {},
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
				  floors = data.floors;
				  walls = data.walls;
				  altWall = data.alt_wall_1;
				  playerstates = data.playerstates;
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
			getSpriteInfo = function( tiletype , salt ){
			  var playerfacing = Player.getDirectionFacing();
			  switch( tiletype ){
				case 'floor_0':
				  return { canvas: mapsprite , x: floors[ 0 ].x , y: floors[ 0 ].y , tiledims: pixel_dims };
				  break;
				case 'wall_0':
				  return { canvas: mapsprite , x: walls[ 0 ].x , y: walls[ 0 ].y , tiledims: pixel_dims };
				  break;
				case 'wall_1':
				  return { canvas: mapsprite , x: walls[ 1 ].x , y: walls[ 1 ].y , tiledims: pixel_dims };
				  break;
				case 'wall_2':
				  return { canvas: mapsprite , x: walls[ 2 ].x , y: walls[ 2 ].y , tiledims: pixel_dims };
				  break;
				case 'wall_3':
				  return { canvas: mapsprite , x: walls[ 3 ].x , y: walls[ 3 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_0':
				  return { canvas: mapsprite , x: altWall[ 0 ].x , y: altWall[ 0 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_1':
				  return { canvas: mapsprite , x: altWall[ 1 ].x , y: altWall[ 1 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_2':
				  return { canvas: mapsprite , x: altWall[ 2 ].x , y: altWall[ 2 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_3':
				  return { canvas: mapsprite , x: altWall[ 3 ].x , y: altWall[ 3 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_4':
				  return { canvas: mapsprite , x: altWall[ 4 ].x , y: altWall[ 4 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_5':
				  return { canvas: mapsprite , x: altWall[ 5 ].x , y: altWall[ 5 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_6':
				  return { canvas: mapsprite , x: altWall[ 6 ].x , y: altWall[ 6 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_7':
				  return { canvas: mapsprite , x: altWall[ 7 ].x , y: altWall[ 7 ].y , tiledims: pixel_dims };
				  break;
				case 'lake_8':
				  return { canvas: mapsprite , x: altWall[ 8 ].x , y: altWall[ 8 ].y , tiledims: pixel_dims };
				  break;
				case 'player':
				  return { canvas: charactersprite , x: playerstates[playerfacing].x  , y: playerstates[playerfacing].y , tiledims: pixel_dims };
				  break;
			  }
			  return { canvas: mapsprite , x: 290 , y: 290 , tiledims: pixel_dims };
			};

		return {
		  load:load,
		  getSpriteInfo:getSpriteInfo,
		  getPixelDims: function(){ return pixel_dims; }
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
			clear = function(){
			  ctx.clearRect( 0 , 0 , ( map.mapdims.x * pixeldims.x ) , ( map.mapdims.y * pixeldims.y ) );
			},
			drawTile = function( ox , oy , dx , dy , tileType , tileIndex ){
			  var spriteInfo , chunk;
			  switch( tileType ){
				case 'P':
				  spriteInfo = Tileset.getSpriteInfo( 'player' );
				  break;
				case 'f0':
				  spriteInfo = Tileset.getSpriteInfo( 'floor_0' , tileIndex );
				  break;
				case 'fe':
				  spriteInfo = Tileset.getSpriteInfo( 'floor_0' , tileIndex );
				  break;
				case 'w0':
				  spriteInfo = Tileset.getSpriteInfo( 'wall_0' , tileIndex );
				  break;
				case 'w1':
				  spriteInfo = Tileset.getSpriteInfo( 'wall_1' , tileIndex );
				  break;
				case 'w2':
				  spriteInfo = Tileset.getSpriteInfo( 'wall_2' , tileIndex );
				  break;
				case 'w3':
				  spriteInfo = Tileset.getSpriteInfo( 'wall_3' , tileIndex );
				  break;
				case 'l0':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_0' , tileIndex );
				  break;
				case 'l1':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_1' , tileIndex );
				  break;
				case 'l2':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_2' , tileIndex );
				  break;
				case 'l3':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_3' , tileIndex );
				  break;
				case 'l4':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_4' , tileIndex );
				  break;
				case 'l5':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_5' , tileIndex );
				  break;
				case 'l6':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_6' , tileIndex );
				  break;
				case 'l7':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_7' , tileIndex );
				  break;
				case 'l8':
				  spriteInfo = Tileset.getSpriteInfo( 'lake_8' , tileIndex );
				  break;
			  }
			  //chunk = spriteInfo.canvas.getContext( '2d' ).getImageData( spriteInfo.x , spriteInfo.y , spriteInfo.tiledims.x , spriteInfo.tiledims.y );
			  //ctx.putImageData( chunk , ox , oy );
			  ctx.drawImage( spriteInfo.canvas, spriteInfo.x , spriteInfo.y , spriteInfo.tiledims.x, spriteInfo.tiledims.y, ox , oy , dx - ox , dy - oy );
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
			  var pc = Player.getPosition() ,
				  tx = pixeldims.x , ty = pixeldims.y ,
				  ox = pc.x * tx ,
				  oy = pc.y * ty;
			  drawTile( ox , oy , ox + tx , oy + ty , 'P' );
			},
			render = function(){
			  map = Stage.getMap();
			  ctx = Stage.getContext();
			  pixeldims = Tileset.getPixelDims();
			  //updateList = _.keys( map.mapdata ); // set updatelist to be every tile
			  // draw background
			  drawBackground();
			  // draw player
			  drawPlayer();
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

		var pos = {x:0,y:0} ,
			moveToEntrance = function(){
			  pos = Stage.getEntrance();
			},
			moving = [0,0],
			facing = 'down',
			move = function(){
			  var vect = moving;
			  // push current position to redraw list
			  if( vect[ 0 ] !== 0 || vect[ 1 ] !== 0 ){
				Renderer.queueForUpdate( Stage.getIndexFor( pos ) );
			  }
			  // move in the vector sent
			  var newCoords = { x: pos.x + vect[0] , y: pos.y + vect[1] };
			  // check position valid
			  var tile = Stage.getTileAt( newCoords );
			  if( tile === "f0" ){
				pos = newCoords;
			  }
			  switch( vect[0] ){
				case -1:
				  facing = 'left';
				  break;
				case 1:
				  facing = 'right';
				  break;
			  }
			  switch( vect[1] ){
				case -1:
				  facing = 'up';
				  break;
				case 1:
				  facing = 'down';
				  break;
			  }
			},
			setMovement = function( index , val ){
			  moving[ index ] = val;
			};

		return {

		  moveToEntrance: moveToEntrance,
		  move:move,
		  setMovement:setMovement,
		  getPosition:function(){return pos;},
		  getDirectionFacing:function(){return facing;}

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
				Player.setMovement(1,0);
				break;
			  case 'a':
				Player.setMovement(0,0);
				break;
			  case 's':
				Player.setMovement(1,0);
				break;
			  case 'd':
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

		var frametime = 80,
			start = function(){
			  // load Tileset images
			  Tileset.load( function(){
				// once loaded, load the stage data
				Stage.load( 1 , function(){
				  // move player to entrance
				  Player.moveToEntrance();
				  // set render list to be whole map
				  Renderer.setUpdateList( _.keys( Stage.getMap().mapdata ) ); // set updatelist to be every tile
				  // move player and render frame every frametime ms
				  window.setTimeout(
					function tick(){
					  Player.move();
					  Renderer.render();
					  window.setTimeout( tick , frametime );
					}
				  , frametime );
				  // listen for keyboard input
				  Controller.listen();
				});
			  });
			};

		return {
		  start: start
		};

	  })();

	  Gauntlet.Game = Game;
	  window.Gauntlet = Gauntlet;

})(this);
