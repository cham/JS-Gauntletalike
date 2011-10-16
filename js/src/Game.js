/**
 * Game
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

		var tileinfopath = 'maps/tilesets/chaosengine.json' ,
			mappath ,characterpath = '' ,
			maptiledims , charactertiledims ,
			mapsprite = document.createElement( 'canvas' ) ,
			charactersprite = document.createElement( 'canvas' ) ,
			floors , walls ,
			scaling = -1 ,
			playerstates = {},
			/**
			 * load
			 * load and parse the tileset description, then load the associated sprites, then run the given callback
			 *
			 * @function undefined
			 * @param {Function} cb
			 */
			load = function( cb ){
			  var count = 2;
			  jQuery.ajax({
				url: tileinfopath ,
				dataType: 'json',
				success: function( data ){
				  var mapimg = new Image() ,
					  characterimg = new Image();
				  // set local vars
				  mappath = data.mappath;
				  characterpath = data.characterpath;
				  maptiledims = data.maptiledims;
				  charactertiledims = data.charactertiledims;
				  floors = data.floors;
				  walls = data.walls;
				  playerstates = data.playerstates;
				  scaling = 4;
console.log( scaling );
				  // load images, onload create canvas elements and execute cb when both done
				  mapimg.onload = function(){
					var ctx = mapsprite.getContext( '2d' );
					mapsprite.width = this.naturalWidth * scaling;
					mapsprite.height = this.naturalHeight * scaling;
					ctx.drawImage( this , 0 , 0 , this.naturalWidth , this.naturalHeight , 0 , 0 , mapsprite.width , mapsprite.height );
					//ctx.scale( 2 , 2 );
					count--; if( !count && cb ){ cb(); }
				  };
				  characterimg.onload = function(){
					charactersprite.width = this.naturalWidth;
					charactersprite.height = this.naturalHeight;
					charactersprite.getContext( '2d' ).drawImage( this , 0 , 0 , this.naturalWidth , this.naturalHeight , 0 , 0 , charactersprite.width , charactersprite.height );
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
			  var floorind = ( salt % floors.length ) || 0 ,
				wallind = ( salt % walls.length ) || 0 ,
				playerfacing = Player.getDirectionFacing();
			  switch( tiletype ){
				case 'floor':
				  return { canvas: mapsprite , x: floors[ floorind ].x , y: floors[ floorind ].y , tiledims: maptiledims };
				  break;
				case 'wall':
				  return { canvas: mapsprite , x: walls[ wallind ].x , y: walls[ wallind ].y , tiledims: maptiledims };
				  break;
				case 'wall_entrance':
				  return { canvas: mapsprite , x: 171 , y: 18 , tiledims: maptiledims };
				  break;
				case 'player':
				  return { canvas: charactersprite , x: ~~( playerstates[playerfacing].x / scaling ) , y: ~~( playerstates[playerfacing].y / scaling ) , tiledims: { x: ~~( charactertiledims.x / scaling ) , y: ~~( charactertiledims.y / scaling ) } };
				  break;
				case 'decoration_valve_tl':
				  return { canvas: mapsprite , x: 273 , y: 239 , tiledims: maptiledims };
				  break;
				case 'decoration_valve_tr':
				  return { canvas: mapsprite , x: 290 , y: 239 , tiledims: maptiledims };
				  break;
				case 'decoration_valve_bl':
				  return { canvas: mapsprite , x: 273 , y: 256 , tiledims: maptiledims };
				  break;
				case 'decoration_valve_br':
				  return { canvas: mapsprite , x: 290 , y: 256 , tiledims: maptiledims };
				  break;
			  }
			  return { canvas: mapsprite , x: 290 , y: 290 , tiledims: maptiledims };
			};

		return {
		  load:load,
		  getSpriteInfo:getSpriteInfo
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
			clear = function(){
			  ctx.clearRect( 0 , 0 , ( map.mapdims.x * map.tiledims.x ) , ( map.mapdims.y * map.tiledims.y ) );
			},
			drawTile = function( ox , oy , dx , dy , tileType , tileIndex ){
			  var spriteInfo , chunk;
			  switch( tileType ){
				case 'P':
				  spriteInfo = Tileset.getSpriteInfo( 'player' );
				  break;
				case '1':
				  spriteInfo = Tileset.getSpriteInfo( 'floor' , tileIndex );
				  break;
				case '0':
				  spriteInfo = Tileset.getSpriteInfo( 'wall' , tileIndex );
				  break;
				case 'X':
				  spriteInfo = Tileset.getSpriteInfo( 'wall_entrance' );
				  break;
				case 'E':
				  spriteInfo = Tileset.getSpriteInfo( 'wall_entrance' );
				  break;
				case 'U':
				  spriteInfo = Tileset.getSpriteInfo( 'decoration_valve_tl' );
				  break;
				case 'I':
				  spriteInfo = Tileset.getSpriteInfo( 'decoration_valve_tr' );
				  break;
				case 'J':
				  spriteInfo = Tileset.getSpriteInfo( 'decoration_valve_bl' );
				  break;
				case 'K':
				  spriteInfo = Tileset.getSpriteInfo( 'decoration_valve_br' );
				  break;
			  }
			  var ratio = 4;
			  chunk = spriteInfo.canvas.getContext( '2d' ).getImageData( spriteInfo.x * ratio , spriteInfo.y * ratio , spriteInfo.tiledims.x * ratio , spriteInfo.tiledims.y * ratio );
			  ctx.putImageData( chunk , ox , oy );
//			  ctx.drawImage( spriteInfo.canvas, spriteInfo.x , spriteInfo.y , spriteInfo.tiledims.x, spriteInfo.tiledims.y, ox , oy , dx - ox , dy - oy );
			},
			drawBackground = function(){
			  _.each( map.mapdata , function( tile , i ){
				var tilecoords = Stage.getCoordsFor( i ) ,
				  tx = map.tiledims.x , ty = map.tiledims.y ,
				  ox = tilecoords.x * tx ,
				  oy = tilecoords.y * ty;
				drawTile( ox , oy , ox + tx , oy + ty , tile , i );
			  });
			},
			drawPlayer = function(){
			  var pc = Player.getPosition() ,
				  tx = map.tiledims.x , ty = map.tiledims.y ,
				  ox = pc.x * tx ,
				  oy = pc.y * ty;
			  drawTile( ox , oy , ox + tx , oy + ty , 'P' );
			},
			render = function(){
			  map = Stage.getMap();
			  ctx = Stage.getContext();
			  // clear
			  clear();
			  // draw background
			  drawBackground();
			  // draw player
			  drawPlayer();
			};

		return {
		  render: render
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
				// set stge width and height
				stageDims.width = ( map.mapdims.x * map.tiledims.x );
				stageDims.height = ( map.mapdims.y * map.tiledims.y );
				// make a new canvas for the given map
				makeCanvas( stageDims.width , stageDims.height );
				// pass to dom
				injectCanvas();
				// run callback if passed
				if( cb ){ cb(); }
			  });
			},
			getEntrance = function(){
			  // find entrance (E) in mapdata and return correspoding co-ords
			  return getCoordsFor( _.indexOf( map.mapdata , 'E' ) );
			},
			getTileAt = function( coords ){
			  if( coords.x < 0 || coords.x >= map.mapdims.x || coords.y < 0 || coords.y >= map.mapdims.y ){
				return '0';
			  }
			  // translate coords into index
			  var ind = coords.y * map.mapdims.x;
			  ind += coords.x;
			  return map.mapdata[ ind ];
			},
			getCoordsFor = function( ind ){
			  var row = Math.floor( ind / map.mapdims.x ) ,
				  col = ind - ( map.mapdims.x * row );
			  return {
				x: col ,
				y: row
			  };
			};

		return {
		  load: load,
		  getEntrance: getEntrance,
		  getTileAt:getTileAt,
		  getCoordsFor:getCoordsFor,
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
			  // move in the vector sent
			  var newCoords = { x: pos.x + vect[0] , y: pos.y + vect[1] };
			  // check position valid
			  var tile = Stage.getTileAt( newCoords );
			  if( tile !== "0" ){
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

		var frametime = 50,
			start = function(){
			  // load Tileset images
			  Tileset.load( function(){
				// once loaded, load the stage data
				Stage.load( 2 , function(){
				  // move player to entrance
				  Player.moveToEntrance();
				  // move player and render frame every frametime ms
				  window.setTimeout( function(){
					Player.move();
					Renderer.render();
					window.setTimeout( arguments.callee , frametime );
				  } , frametime );
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
