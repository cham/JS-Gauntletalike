/**
 * Stage object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Stage = (function(){

			var	map = {},
				walkable_map = [],
				$_canvas = {} ,
				$_health = {} ,
				$_lives = {} ,
				$_multiplier = {},
				$_time = 0,
				start_time = new Date(),
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
				injectHUD = function(){
				  var $_hud = jQuery( '<div></div>' );
				  $_health = jQuery( '<div class="healthbar"><div></div></div>' );
				  $_score = jQuery( '<span class="score"></span>' );
				  $_lives = jQuery( '<span class="lives"></span>' );
				  $_multiplier = jQuery( '<span class="multiplier"></span>' );
				  $_time = jQuery( '<span class="multiplier"></span>' );
				  $_level = jQuery( '<span class="currentlevel"></span>' );
				  $_hud.append( 'Health: ' );
				  $_hud.append( $_health );
				  $_hud.append( $_lives );
				  $_hud.append( 'Multiplier: ' );
				  $_hud.append( $_multiplier )
				  $_hud.append( 'Score: ' );
				  $_hud.append( $_score );
				  $_hud.append( 'Time: ' );
				  $_hud.append( $_time );
				  $_hud.append( $_level );
				  jQuery( '.hud' ).append( $_hud );
				},
				/**
				 * setWalkableMap
				 * sets the simplified walkable map for path finding algorithms
				 */
				setWalkableMap = function(){
					// walk map items, new array every map.mapdims.x
					var row = [] , floor_tiles = ['f' , 's'] , newRowAt = map.mapdims.x;
					walkable_map = [];
					_( map.mapdata ).each( function( tiletype , i ){
						if( i % newRowAt === 0 && row.length ){
							walkable_map.push( row );
							row = [];
						}
						row.push( floor_tiles.indexOf( tiletype.substr(0,1) ) > -1 ? 'w' : 'u' );
					});
					if( row.length ){
						walkable_map.push( row );
					}
				},
				load = function( lnum , cb ){
				  // load the level as JSON
				  Gauntlet.MapProvider.getLevel( lnum , function( mapObj ){
					// set map
					map = mapObj;
					// set walkable_map for astar
					setWalkableMap();
					pixelsdims = Gauntlet.Tileset.getPixelDims();
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
				  var coords;// = getCoordsFor( _.indexOf( map.mapdata , 'fe' ) );
				  _( map.mapdata ).each( function( mapitem , i ){
					if( mapitem.substr( 0, 2 ) === 'fe' ){
					  coords = getCoordsFor( i );
					}
				  });
				  return coords;
				},
				getTileAt = function( coords ){
				  if( coords.x < 0 || coords.x >= map.mapdims.x || coords.y < 0 || coords.y >= map.mapdims.y ){
					return '0';
				  }
				  // translate coords into index
				  return map.mapdata[ getIndexFor( coords ) ];
				},
				getCoordsFor = function( ind ){
				  var row = ~~( ind / map.mapdims.x ) ,
					  col = ind - ( map.mapdims.x * row );
				  return {
					x: col ,
					y: row
				  };
				},
				getIndexFor = function( coords ){
				  var ind = coords.y * map.mapdims.x;
				  return ( ind + coords.x );
				},
				updateHealth = function( h ){
				  $_health.find( 'div' ).css( { width: ~~(h*1.5) } );
				},
				updateScore = function( s ){
				  $_score.text( s );
				},
				updateLives = function( l ){
				  $_lives.text( 'x'+l );
				},
				updateMultiplier = function( m ){
					$_multiplier.text( m );
				},
				updateTileAtCoords = function( coords , changeTo ){
					var index = getIndexFor( coords );
					map.mapdata[ index ] = changeTo;
					Gauntlet.Renderer.queueForUpdate( index );
				},
				resetTime = function(){
					start_time = new Date();
				},
				formatTimeDiff = function(t){
					var mins = ~~(t/60),
						secs = ~~(t-(mins*60)),
						minStr = (''+mins).length<2 ? '0':'',
						secStr = (''+secs).length<2 ? '0':'';
					return minStr + mins + ':' + secStr + secs;
				},
				updateTime = function(){
					var timenow = new Date(),
						diff = timenow.getTime() - start_time.getTime();
					$_time.text( formatTimeDiff(diff/1000) );
				},
				updateLevel = function(lnum){
					$_level.text(lnum);
				},
				setOpacity = function(v){
					$_canvas.css({opacity:v});
				};

			return {
			  injectHUD:injectHUD,
			  load: load,
			  getEntrance: getEntrance,
			  getTileAt:getTileAt,
			  getCoordsFor:getCoordsFor,
			  getIndexFor:getIndexFor,
			  updateHealth:updateHealth,
			  updateScore:updateScore,
			  updateLives:updateLives,
			  updateMultiplier:updateMultiplier,
			  updateTileAtCoords:updateTileAtCoords,
			  getMap:function(){return map;},
			  getWalkableMap:function(){return walkable_map.slice();},
			  getContext:function(){return ctx;},
			  getCanvas:function(){return $_canvas;},
			  setOpacity:setOpacity,
			  resetTime:resetTime,
			  updateTime:updateTime,
			  updateLevel:updateLevel
			};

		})();

	Gauntlet.Stage = Stage;
	window.Gauntlet = Gauntlet;

})(this);