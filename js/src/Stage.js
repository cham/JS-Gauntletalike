/**
 * Stage object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Stage = (function(){

			var	map = {},
				$_canvas = {} ,
				$_health = {} ,
				$_lives = {} ,
				$_multiplier = {},
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
				  $_health = jQuery( '<span></span>' );
				  $_score = jQuery( '<span></span>' );
				  $_lives = jQuery( '<span></span>' );
				  $_multiplier = jQuery( '<span></span>' );
				  $_hud.append( 'Health: ' );
				  $_hud.append( $_health );
				  $_hud.append( 'Multiplier: ' );
				  $_hud.append( $_multiplier )
				  $_hud.append( 'Score: ' );
				  $_hud.append( $_score );
				  $_hud.append( 'Lives: ' );
				  $_hud.append( $_lives );;
				  jQuery( '.game' ).append( $_hud );
				},
				load = function( lnum , cb ){
				  // load the level as JSON
				  Gauntlet.MapProvider.getLevel( lnum , function( mapObj ){
					// set map
					map = mapObj;
					pixelsdims = Gauntlet.Tileset.getPixelDims();
					// set stge width and height
					stageDims.width = ( map.mapdims.x * pixelsdims.x );
					stageDims.height = ( map.mapdims.y * pixelsdims.y );
					// make a new canvas for the given map
					makeCanvas( stageDims.width , stageDims.height );
					// pass to dom
					injectCanvas();
					// inject HUD
					injectHUD();
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
				  $_health.css({
					color: (h<25)?'#f00':'#000'
				  })
				  $_health.text( h );
				},
				updateScore = function( s ){
				  $_score.text( s );
				},
				updateLives = function( l ){
				  $_lives.text( l );
				},
				updateMultiplier = function( m ){
					$_multiplier.text( m );
				},
				updateTileAtCoords = function( coords , changeTo ){
					var index = getIndexFor( coords );
					map.mapdata[ index ] = changeTo;
					Gauntlet.Renderer.queueForUpdate( index );
				};

			return {
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
			  getContext:function(){return ctx;},
			  getCanvas:function(){return $_canvas;}
			};

		})();

	Gauntlet.Stage = Stage;
	window.Gauntlet = Gauntlet;

})(this);