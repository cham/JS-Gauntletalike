/**
* Tileset
* provides an interface for loading JSON map files
*
* load(cb:Function):undefined,
* getSpriteInfo(tiletype:String,salt:Number):Object
*/
(function(window){

	var jQuery = window.jQuery ,

	Gauntlet = window.Gauntlet || {} ,

	Tileset = (function(){

		var tileinfopath = 'maps/tilesets/shiningforce.json' ,
			mappath ,characterpath = '' ,
			pixel_dims ,
			mapsprite = document.createElement( 'canvas' ) ,
			charactersprite = document.createElement( 'canvas' ) ,
			tilepositions = {} , playerstates = {}, monsterstates = {}, bossstates = {}, spawnerfloorstates = {},
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
				  missilestates = data.missilestates;
				  bossstates = data.bossstates;
				  spawnerfloorstates = data.spawnerfloorstates;
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
				error: function(a,b,c){}
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
			getSpriteInfo = function( tiletype , salt , f , subindex ){
			  var facing = f || '';
			  // if player return player sheet else return tilesheet
			  if( tiletype === 'player' ){
				return { canvas: charactersprite , x: playerstates[  facing ][ salt ].x  , y: playerstates[  facing ][ salt ].y , tiledims: pixel_dims };
			  }else if( tiletype === 'monster' ){
				return { canvas: charactersprite , x: monsterstates[ subindex ][ facing ][ salt ].x  , y: monsterstates[ subindex ][ facing ][ salt ].y , tiledims: pixel_dims };
			  }else if( tiletype === 'missile' ){
				return { canvas: charactersprite , x: missilestates[ subindex ][ facing ][ salt ].x  , y: missilestates[ subindex ][ facing ][ salt ].y , tiledims: pixel_dims };
			  }else if( tiletype === 'boss' ){
			  	return { canvas: mapsprite , x: bossstates[ facing ][ 'tile_' + subindex ][ salt ].x  , y: bossstates[ facing ][ 'tile_' + subindex ][ salt ].y , tiledims: pixel_dims };
			  }else if( tiletype ){
				return { canvas: mapsprite , x: tilepositions[ tiletype ].x , y: tilepositions[ tiletype ].y , tiledims: pixel_dims };
			  }else{
			  	return { canvas: mapsprite , x: 0 , y: 0 , tiledims: pixel_dims };
			  }
			};

		return {
			load:load,
			getSpriteInfo:getSpriteInfo,
			getPixelDims: function(){ return pixel_dims; },
			getSpawnerFloorStates: function(){ return spawnerfloorstates; }
		};

	})();

	Gauntlet.Tileset = Tileset;
	window.Gauntlet = Gauntlet;

})(this);