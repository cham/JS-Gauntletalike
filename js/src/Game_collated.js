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
				  missilestates = data.missilestates;
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
			getSpriteInfo = function( tiletype , salt , f , subindex ){
			  var facing = f || '';
			  // if player return player sheet else return tilesheet
			  if( tiletype === 'player' ){
				return { canvas: charactersprite , x: playerstates[  facing ][ salt ].x  , y: playerstates[  facing ][ salt ].y , tiledims: pixel_dims };
			  }else if( tiletype === 'monster' ){
				return { canvas: charactersprite , x: monsterstates[ subindex ][ facing ][ salt ].x  , y: monsterstates[ subindex ][ facing ][ salt ].y , tiledims: pixel_dims };
			  }else if( tiletype === 'missile' ){
				return { canvas: charactersprite , x: missilestates[ facing ][ salt ].x  , y: missilestates[ facing ][ salt ].y , tiledims: pixel_dims };
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

	  Monster = {
		coords: {x:0,y:0},
		offset: {x:0,y:0},
		moving: [0,0],
		facing: 'down',
		movementSpeed: 3,
		weaponSpeed: 5,
		currentSwing: 0,
		pointsWorth: 5,
		type: 1,
		damage: 3,
		getNewOffsetForMovement: function( moveVect ){
		  var newX = this.offset.x + ( moveVect[0] * this.movementSpeed ) ,
			  newY = this.offset.y + ( moveVect[1] * this.movementSpeed ) ,
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
		setPosition: function(newCoords){
		  this.coords = newCoords;
		},
		getPosition: function(){
		  return this.coords;
		},
		getFacing: function(){
		  return this.facing;
		},
		getOffset: function(){
		  return this.offset;
		},
		getPointValue: function(){
		  return this.pointsWorth;
		},
		getTilesToRedraw: function(){
		  // tiles to redraw are the current position and all surrounding tiles
		  var currentIndex = Stage.getIndexFor( this.coords ) ,
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
		 * decideMovement
		 * sets the movement for the monster depending on the player location and the closest floor tile in that direction
		 */
		decideMovement: function(){
		  var playerPos = Player.getTile() ,
			  xdiff = this.coords.x - playerPos.x ,
			  ydiff = this.coords.y - playerPos.y ,
			  vectorToPlayer = [ xdiff > 0 ? -1 : ( xdiff < 0 ? 1 : 0 ) , ydiff > 0 ? -1 : ( ydiff < 0 ? 1 : 0 ) ] ,
			  vectX = [ vectorToPlayer[ 0 ] , 0 ], vectY = [ 0 , vectorToPlayer[ 1 ] ],
			  newOffset = this.getNewOffsetForMovement( vectorToPlayer ) ,
			  newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y + newOffset.tileY },
			  tile = Stage.getTileAt( newTilePos );
		  // if tile in vectorToPlayer direction is a floor tile, set it and return
		  if( tile.substr(0,1) === 'f' || tile.substr(0,1) === 's' && newTilePos.x !== playerPos.x && newTilePos.y !== playerPos.y ){
			this.moving = vectorToPlayer;
		  }else{
			// else if tile in x is ok
			newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y };
			tile = Stage.getTileAt( newTilePos );
			if( tile.substr(0,1) === 'f' || tile.substr(0,1) === 's' && newTilePos.x !== playerPos.x && newTilePos.y !== playerPos.y ){
			  this.moving = vectX;
			}else{
			  // else if tile in y is ok
			  newTilePos = { x: this.coords.x , y: this.coords.y + newOffset.tileY };
			  tile = Stage.getTileAt( newTilePos );
			  if( tile.substr(0,1) === 'f' || tile.substr(0,1) === 's' && newTilePos.x !== playerPos.x && newTilePos.y !== playerPos.y ){
				this.moving = vectY;
			  }else{
				this.moving = [ 0 , 0 ];
			  }
			}
		  }
		},
		/**
		 * move
		 * sets moving array to move in the direction of the player
		 */
		move: function(){
		  // calculate movement vector
		  var playerPos = Player.getTile() ,/*
			  xdiff = this.coords.x - playerPos.x ,
			  ydiff = this.coords.y - playerPos.y ,*/
			  newOffset,newTilePos,tilesToUpdate=[],
			  tile;
		  this.decideMovement();
		  //this.moving = [ xdiff > 0 ? -1 : ( xdiff < 0 ? 1 : 0 ) , ydiff > 0 ? -1 : ( ydiff < 0 ? 1 : 0 ) ];
		  // calculate new offset / tile
		  newOffset = this.getNewOffsetForMovement( this.moving );
		  newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y + newOffset.tileY };
		  tile = Stage.getTileAt( newTilePos );
		  if( ( tile.substr(0,1) === "f" || tile.substr(0,1) === 's' ) && MonsterSpawnerCollection.isTileFree( newTilePos , this ) ){
			this.offset.x = newOffset.x;
			this.offset.y = newOffset.y;
			this.coords = newTilePos;
		  }
		  // set facing
		  switch( this.moving[0] ){
			case -1: this.facing = 'left'; break;
			case 1: this.facing = 'right'; break;
		  }
		  switch( this.moving[1] ){
			case -1: this.facing = 'up'; break;
			case 1:  this.facing = 'down'; break;
		  }
		  if( playerPos.x === this.coords.x && playerPos.y === this.coords.y ){
			this.currentSwing++;
			if( this.currentSwing === 1 ){
			  Player.hurt( this.damage );
			}else if( this.currentSwing > this.weaponSpeed ){
			  this.currentSwing = 0;
			}
		  }
		  // get indexes of tiles to redraw
		  tilesToUpdate = this.getTilesToRedraw();
		  _( tilesToUpdate ).each( function( tileIndex ){
			Renderer.queueForUpdate( tileIndex );
		  });
		},
		setType: function( mT ){
		  this.type = mT;
		  switch( this.type ){
			case '0':
			  this.movementSpeed = 3;
			  this.damage = 3;
			  this.pointsWorth = 5;
			  this.weaponSpeed = 5;
			  break;
			case '1':
			  this.movementSpeed = 5;
			  this.damage = 6;
			  this.pointsWorth = 10;
			  this.weaponSpeed = 6;
			  break;
			default:
			  this.movementSpeed = 3;
			  this.damage = 3;
			  this.pointsWorth = 5;
			  this.weaponSpeed = 5;
			  break;
		  }
		},
		instance: function(){
		  function F() {}
		  F.prototype = this;
		  return new F();
		},
		setOffset: function( off ){
		  this.offset = off;
		}
	  },

	  /**
	   * MonsterSpawner
	   * spawns new Monster objects
	   */
	  MonsterSpawner = {
		monsters: [], // array of monster objects the spawner has spawned
		autoSpawn: false,
		spawntime: 10 * 1000,
		coords: {x:0,y:0},
		t:null,
		stopped:false,
		limit: 0, // if set then only spawns up to this many monsters
		monsterType: 0,
		/**
		 * spawnNewMonster
		 * creates a new monster object and runs initialisation methods on it
		 */
		spawnNewMonster: function(){
		  if( this.stopped ){ return; }
		  var self = this , monster;
		  if( !this.limit || this.limit > this.monsters.length ){
			monster = Monster.instance();
			monster.setPosition( this.coords );
			monster.setOffset( { x:0 , y:0 } );
			monster.setType( this.monsterType );
			this.monsters.push( monster );
		  }
		  if( this.autoSpawn ){
			this.t = window.setTimeout( function(){ self.spawnNewMonster(); } , this.spawntime );
		  }
		},
		/**
		 * moveMonsters
		 * moves all monsters in local array
		 */
		moveMonsters: function(){
		  _( this.monsters ).each( function( monster ){
			monster.move();
		  });
		},
		getStates: function(){
		  var states = [];
		  _( this.monsters ).each( function( monster ){
			states.push( {
			  'facing': monster.getFacing(),
			  'coords': monster.getPosition(),
			  'offset': monster.getOffset(),
			  'monster': monster
			} );
		  });
		  return states;
		},
		// TODO this probably needs to go in the monster spawner collection when that exists
		isTileFree: function( checkCoords , ignoreMonster ){
		  var mPos;
		  return _( this.monsters ).select( function( monster ){
			mPos = monster.getPosition();
			return ( mPos.x === checkCoords.x && mPos.y === checkCoords.y && monster !== ignoreMonster );
		  } ).length < 1;
		},
		/**
		 * killMonster
		 * kills the monster specified
		 */
		killMonster: function( m ){
		  // remove from local array
		  var newMonsterList = _( this.monsters ).without( m );
		  if( !_.isEqual( this.monsters , newMonsterList ) ){
			this.monsters = newMonsterList;
			// set tiles for update
			var update = m.getTilesToRedraw();
			_( update ).each( function( tile ){
			  Renderer.queueForUpdate( tile );
			});
			// give Player points
			Player.givePoints( m.getPointValue() );
			Renderer.updateHUD();
		  }
		},
		startSpawn: function(){
		  this.autoSpawn = true;
		  this.spawnNewMonster();
		},
		stop: function(){
		  this.stopped = true;
		  this.autoSpawn = false;
		  window.clearTimeout( this.t );
		},
		/**
		 * sets
		 */
		setMonsterType: function( mType ){
		  this.monsterType = mType;
		},
		setMonsters: function( arr ){
		  this.monsters = arr;
		},
		setSpawntime: function( t ){
		  this.spawntime = t;
		},
		setCoords: function( obj ){
		  this.coords = obj;
		},
		setLimit: function( l ){
		  this.limit = l;
		},
		instance: function(){
		  function F() {}
		  F.prototype = this;
		  return new F();
		}
	  },

	  /**
	   * MonsterSpawnerCollection
	   * creates MonsterSpawners
	   */
	  MonsterSpawnerCollection = (function(){

		var	monstersPerSpawner = 5,
			spawners = [],
			timers = [],
			minimumSpawnTime = 2000,
			spawnTimeRange = 4500,
			/**
			 * makeSpawner
			 * makes a new spawner at the specified position
			 */
			makeSpawner = function( type , coords , sTime , dTime ){
			  var spawntime = sTime || 10 * 1000 ,
				  delaytime = dTime || 0;
			  // inner function - either run now or on startdelay
			  doMakeSpawner = function(){
				var spawner = MonsterSpawner.instance();
				spawner.setMonsterType( type );
				spawner.setMonsters([]);
				spawner.setLimit( monstersPerSpawner );
				spawner.setSpawntime( spawntime );
				spawner.setCoords( { x: coords.x , y: coords.y } );
				spawner.startSpawn();
				spawners.push( spawner );
			  };
			  if( delaytime ){
				timers.push( window.setTimeout( doMakeSpawner , delaytime ) );
			  }else{
				doMakeSpawner();
			  }
			},
			/**
			 * makeAllSpawners
			 * iterates over every tile in the map and creates a new MonsterSpawner at any 's' tiles it finds
			 */
			makeAllSpawners = function(){
			  var self = this,
				  mapdata = Stage.getMap().mapdata ,
				  coords = {} , type;
			  _( mapdata ).each( function( tile , i ){
				if( tile.substr( 0 , 1 ) === 's' ){
				  type = tile.substr( 1 , 1 );
				  coords = Stage.getCoordsFor( i );
				  self.makeSpawner( type , {x:coords.x , y:coords.y } , ( minimumSpawnTime + ~~( Math.random() * spawnTimeRange )) , ~~( Math.random() * spawnTimeRange ) );
				}
			  });
			},
			/**
			 * getAllMonsterStates
			 */
			getAllMonsterStates = function(){
			  var totStates = [] , mStates;
			  _( spawners ).each( function( spawner ){
				mStates = spawner.getStates();
				totStates = _( totStates ).union( mStates );
			  } );
			  return totStates;
			},
			/**
			 * moveAllMonsters
			 */
			moveAllMonsters = function(){
			  _( spawners ).each( function( spawner ){
				spawner.moveMonsters();
			  } );
			},
			/**
			 * killMonster
			 */
			killMonster = function( m ){
			  _( spawners ).each( function( spawner ){
				spawner.killMonster( m );
			  });
			},
			/**
			 * isTileFree
			 */
			isTileFree = function( tile , ignoreMonster ){
			  var isFree = true;
			  _( spawners ).each( function( spawner ){
				if( !spawner.isTileFree( tile , ignoreMonster ) ){
				  isFree = false;
				}
			  });
			  return isFree;
			},
			/**
			 * killAll - removes all monster spawners
			 * note does not update map - tile will still be present
			 */
			killAll = function(){
			  _( spawners ).each( function( spawner ){
				spawner.stop();
			  } );
			  _( timers ).each( function( t ){
				window.clearTimeout( t );
			  });
			  spawners = [];
			};

		return {
		  killAll:killAll,
		  makeSpawner:makeSpawner,
		  makeAllSpawners:makeAllSpawners,
		  getAllMonsterStates:getAllMonsterStates,
		  moveAllMonsters:moveAllMonsters,
		  killMonster:killMonster,
		  isTileFree:isTileFree
		};
	  })();

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
			/**
			 * clear
			 * clears the whole map
			 */
			clear = function(){
			  ctx.clearRect( 0 , 0 , ( map.mapdims.x * pixeldims.x ) , ( map.mapdims.y * pixeldims.y ) );
			},
			/**
			 * drawTile
			 * draws a tile at the position specified, with dimensions, tileType, [index,facing,offset]
			 */
			drawTile = function( ox , oy , dx , dy , tileType , tileIndex , facing , offS , subindex ){
			  var spriteInfo , chunk , offset = offS || {x:0,y:0};
			  spriteInfo = Tileset.getSpriteInfo( tileType , tileIndex , facing , subindex );
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
			  drawTile( ox , oy , ox + tx , oy + ty , 'player' , +( playerSwitch > 3 ) , Player.getFacing() , Player.getOffset() );
			},
			drawMonsters = function(){
			  var monsterStates = MonsterSpawnerCollection.getAllMonsterStates() ,
				  tx = pixeldims.x , ty = pixeldims.y ,
				  ox,oy, monsterType;
			  _( monsterStates ).each( function( mState ){
				ox = mState.coords.x * tx;
				oy = mState.coords.y * ty;
				monsterType = mState.monster.type;
				drawTile( ox , oy , ox + tx , oy + ty , 'monster' , +( playerSwitch > 3 ) , mState.facing , mState.offset , monsterType );
			  } );
			},
			drawMissiles = function(){
			  var missileStates = MissileLauncher.getStates() ,
				  tx = pixeldims.x , ty = pixeldims.y ,
				  ox,oy;
			  _( missileStates ).each( function( mState ){
				ox = mState.coords.x * tx ,
				oy = mState.coords.y * ty;
				drawTile( ox , oy , ox + tx , oy + ty , 'missile' , +( playerSwitch > 3 ) , mState.facing , mState.offset );
			  } );
			},
			init = function(){
			  map = Stage.getMap();
			  ctx = Stage.getContext();
			  pixeldims = Tileset.getPixelDims();
			},
			render = function(){
			  playerSwitch--;
			  if( playerSwitch < 0 ){
				playerSwitch = 7;
			  }
			  // draw background
			  drawBackground();
			  // draw player
			  drawPlayer();
			  // draw monsters
			  drawMonsters();
			  // draw missiles
			  drawMissiles();
			  updateList = []; // empty updatelist for next render
			},
			/**
			 * updateHUD
			 * updates the HUD - health bar etc
			 */
			updateHUD = function(){
			  // todo don't use dom elements
			  Stage.updateHealth( Player.getHealth() );
			  Stage.updateScore( Player.getScore() );
			};

		return {
		  init: init,
		  clear: clear,
		  render: render,
		  queueForUpdate: function( index ){ updateList.push( index ); },
		  setUpdateList: function( ul ){ updateList = ul; },
		  updateHUD: updateHUD
		}

	  })(),

	  Stage = (function(){

		var	map = {},
			$_canvas = {} ,
			$_health = {} ,
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
			  $_hud.append( 'Health: ' );
			  $_hud.append( $_health );
			  $_hud.append( 'Score: ' );
			  $_hud.append( $_score );
			  jQuery( '.game' ).append( $_hud );
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
			},
			updateHealth = function( h ){
			  $_health.css({
				color: (h<25)?'#f00':'#000'
			  })
			  $_health.text( h );
			},
			updateScore = function( s ){
			  $_score.text( s );
			};

		return {
		  load: load,
		  getEntrance: getEntrance,
		  getTileAt:getTileAt,
		  getCoordsFor:getCoordsFor,
		  getIndexFor:getIndexFor,
		  updateHealth:updateHealth,
		  updateScore:updateScore,
		  getMap:function(){return map;},
		  getContext:function(){return ctx;},
		  getCanvas:function(){return $_canvas;}
		};

	  })(),

	  Missile = {
		coords: {x:0,y:0},
		offset: {x:0,y:0},
		moving: [0,0],
		facing: 'down',
		speed: 8,
		/**
		 * setPosition
		 * sets the position and offset
		 */
		setPosition: function( co , off ){
		  this.coords = co;
		  this.offset = off;
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
		getNewOffset: function(){
		  var newX = this.offset.x + ( this.moving[0] * this.speed ) ,
			  newY = this.offset.y + ( this.moving[1] * this.speed ) ,
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
		  var currentIndex = Stage.getIndexFor( this.coords ) ,
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
		 * hitWall
		 * returns true if the Missile has hit a wall, otherwise false
		 */
		hitWall: function(){
		  var tile = Stage.getTileAt( this.coords );
		  if( tile.substr(0,1) === 'w' ){
			return true;
		  }
		  return false;
		},
		/**
		 * hitMonster
		 * returns the Monster if the missile has hit a monster, otherwise false
		 */
		hitMonster: function(){
		  var monsters = MonsterSpawnerCollection.getAllMonsterStates() , self = this ,
			  collisions = [];
		  _( monsters ).each( function( mState ){
			var mX = mState.coords.x ,
				mY = mState.coords.y ,
				sX = self.coords.x ,
				sY = self.coords.y;
			if( mX === sX && mY === sY ){
			  collisions.push( { monster: mState.monster , missile: self } );
			}
		  });
		  return collisions;
		},
		/**
		 * move
		 * moves the Missile
		 */
		move: function(){
		  // get new offset and set new tile position if moving tile
		  var newOffset = this.getNewOffset() ,
			  newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y + newOffset.tileY } ,
			  tile = Stage.getTileAt( newTilePos ) ,
			  tilesToUpdate = [];
		  // set facing
		  switch( this.moving[0] ){
			case -1: this.facing = 'left';  break;
			case  1: this.facing = 'right'; break;
		  }
		  switch( this.moving[1] ){
			case -1: this.facing = 'up'; break;
			case  1: this.facing = 'down'; break;
		  }
		  // set new offset and tile position if moving into a floor tile
		  //if( tile.substr(0,1) === "f" ){
			this.offset.x = newOffset.x;
			this.offset.y = newOffset.y;
			this.coords = newTilePos;
		  //}
		  // get indexes of tiles to redraw
		  tilesToUpdate = this.getTilesToRedraw();
		  _( tilesToUpdate ).each( function( tileIndex ){
			Renderer.queueForUpdate( tileIndex );
		  });
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
		}
	  },

	  MissileLauncher = (function(){
		var missiles = [],
			/**
			 * fireMissile
			 * fires a new Missile object
			 * @param Object coords co-ordinates as {x:y:}
			 */
			fireMissile = function( coords , offset , movement ){
			  var missile = Missile.instance();
			  missile.setPosition( coords , offset );
			  missile.setMovement( movement );
			  missiles.push( missile );
			},
			/**
			 * moveMissiles
			 * runs move() on every Missile in the stack
			 */
			moveMissiles = function(){
			  var notDead = [], // missiles that are not dead
				  collisions = [];
			  _( missiles ).each( function( missile ){
				collisions = missile.hitMonster();
				if( missile.hitWall() ){
				  // redraw area around where the missile died
				  _( missile.getTilesToRedraw() ).each( function( tile ){
					Renderer.queueForUpdate( tile );
				  });
				}else if( collisions.length ){
				  // kill all monsters in the collisions array
				  _( collisions ).each( function( c ){
					MonsterSpawnerCollection.killMonster( c.monster );
				  });
				}else{
				  // else move and push to not dead stack
				  missile.move();
				  notDead.push( missile );
				}
			  } );
			  missiles = notDead;
			},
			/**
			 * getStates
			 * returns position and movement state of each missile
			 */
			getStates = function(){
			  var states = [];
			  _( missiles ).each( function( missile ){
				states.push( {
				  'facing': missile.getFacing(),
				  'coords': missile.getPosition(),
				  'offset': missile.getOffset()
				} );
			  });
			  return states;
			};

		return {
		  fireMissile: fireMissile,
		  moveMissiles: moveMissiles,
		  getStates: getStates
		}
	  })(),

	  Player = (function(){

		var intile = {x:0,y:0} ,
			moving = [0,0],
			facing = 'down',
			pixel_offset = {x:0,y:0},
			movementSpeed = 5,
			canfire = true,
			health = 100,
			score = 0,
			/**
			 * checkMovement
			 * checks local moving vector is valid and sets closest possible if not
			 */
			checkMovement = function(){
			  var vectX = [ moving[ 0 ] , 0 ], vectY = [ 0 , moving[ 1 ] ],
				  newOffset = getNewOffset() ,
				  newTilePos = { x: intile.x + newOffset.tileX , y: intile.y + newOffset.tileY } ,
				  tile = Stage.getTileAt( newTilePos );
			  // if tile is a floor tile, return - movement is ok
			  if( tile.substr(0,1) === 'f' || tile.substr(0,1) === 'c' ){
				return moving;
			  }else{
				// else if tile in x is ok
				tile = Stage.getTileAt( { x: intile.x + newOffset.tileX , y: intile.y } );
				if( tile.substr(0,1) === 'f' ){
				  return vectX;
				}else{
				  // else if tile in y is ok
				  tile = Stage.getTileAt( { x: intile.x , y: intile.y + newOffset.tileY } );
				  if( tile.substr(0,1) === 'f' ){
					return vectY;
				  }else{
					return [ 0 , 0 ];
				  }
				}
			  }
			},
			/**
			 * fire
			 * fires a Missile in the current movement or direction facing
			 */
			fire = function(){
			  if( !canfire ){ return; }
			  canfire = false;
			  var vect = moving;
			  // if not moving use facing
			  if( vect[ 0 ] === 0 && vect[ 1 ] === 0 ){
				switch( facing ){
				  case 'up'  : vect = [  0 , -1 ]; break;
				  case 'down': vect = [  0 ,  1 ]; break;
				  case 'left': vect = [ -1 ,  0 ]; break;
				  default    : vect = [  1 ,  0 ]; break;
				}
			  }
			  MissileLauncher.fireMissile( {x:intile.x,y:intile.y} , {x:pixel_offset.x,y:pixel_offset.y} , [vect[0],vect[1]] );
			},
			allowFiring = function(){
			  canfire = true;
			},
			moveToEntrance = function(){
			  intile = Stage.getEntrance();
			},
			getNewOffset = function( checkedMovement ){
			  var movementVector = checkedMovement || moving; // if no movement vector passed then use player defined / local vector
			  var newX = pixel_offset.x + ( movementVector[0] * movementSpeed ) ,
				  newY = pixel_offset.y + ( movementVector[1] * movementSpeed ) ,
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
			  var checkedMovement = checkMovement();
			  // if not moving exit
			  if( checkedMovement[ 0 ] === 0 && checkedMovement[ 1 ] === 0 ){
				return;
			  }
			  // get new offset and set new tile position if moving tile
			  var newOffset = getNewOffset( checkedMovement ) ,
				  newTilePos = { x: intile.x + newOffset.tileX , y: intile.y + newOffset.tileY } ,
				  tile = Stage.getTileAt( newTilePos ) ,
				  tileType = tile.substr(0,1),
				  tilesToUpdate = [];
			  // set facing
			  switch( checkedMovement[0] ){
				case -1: facing = 'left'; break;
				case 1:  facing = 'right'; break;
			  }
			  switch( checkedMovement[1] ){
				case -1: facing = 'up'; break;
				case 1:  facing = 'down'; break;
			  }
			  // set new offset and tile position if moving into a floor tile or castle
			  if( tileType === 'f' ){
				pixel_offset.x = newOffset.x;
				pixel_offset.y = newOffset.y;
				intile = newTilePos;
			  }
			  // get indexes of tiles to redraw
			  tilesToUpdate = getTilesToRedraw();
			  _( tilesToUpdate ).each( function( tileIndex ){
				Renderer.queueForUpdate( tileIndex );
			  });
			  // if player has reached the exit then load next level
			  if( tile === 'fx' || tileType === 'c' ){
				Game.nextLevel();
			  }
			},
			setMovement = function( index , val ){
			  moving[ index ] = val;
			},
			hurt = function( howmuch ){
			  health -= howmuch;
			  if( health < 1 ){
				die();
			  }
			  Renderer.updateHUD();
			},
			heal = function( howmuch ){
			  health += howmuch;
			  if( health > 100 ){
				health = 100;
			  }
			  Renderer.updateHUD();
			},
			givePoints = function( numpoints ){
			  score += numpoints;
			},
			getHealth = function(){
			  return health;
			},
			getScore = function(){
			  return score;
			},
			die = function(){
			  Game.stop();
			  alert( 'You were eaten by a grue' );
			};

		return {

		  moveToEntrance: moveToEntrance,
		  move:move,
		  fire:fire,
		  allowFiring:allowFiring,
		  setMovement:setMovement,
		  getTile:function(){return intile;},
		  getOffset:function(){return pixel_offset;},
		  getFacing:function(){return facing;},
		  hurt:hurt,
		  heal:heal,
		  die:die,
		  givePoints:givePoints,
		  getHealth:getHealth,
		  getScore:getScore

		};

	  })(),

	  Controller = (function(){

		var listen = function(){
		  jQuery( document ).keydown( function(e){
			var which = String.fromCharCode( e.which ).toLowerCase();
			switch( which ){
			  case 'w': case '&':
				Player.setMovement(1,-1);
				break;
			  case 'a': case '%':
				Player.setMovement(0,-1);
				break;
			  case 's': case '(':
				Player.setMovement(1,1);
				break;
			  case 'd': case '\'':
				Player.setMovement(0,1);
				break;
			  case ' ':
				Player.fire();
				break;
			  default:
				break;
			}
		  }).keyup( function(e){
			var which = String.fromCharCode( e.which ).toLowerCase();
			switch( which ){
			  case 'w': case '&':
			  case 's': case '(':
				Player.setMovement(1,0);
				break;
			  case 'a': case '%':
			  case 'd': case '\'':
				Player.setMovement(0,0);
				break;
			  case ' ':
				Player.allowFiring();
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
			mapnum = 5 ,
			tick = function(){
			  //Renderer.clear();
			  Player.move();
			  MonsterSpawnerCollection.moveAllMonsters();
			  MissileLauncher.moveMissiles();
			  Renderer.render();
			  if( !stopped ){
				t = window.setTimeout( tick , frametime );
			  }
			}
			start = function(){
			  // load Tileset images
			  Tileset.load( function(){
				// once loaded, load the stage data
				Stage.load( mapnum , function(){
				  stopped = false;
				  // clear map
				  Renderer.init();
				  Renderer.clear();
				  // draw HUD
				  Renderer.updateHUD();
				  // move player to entrance
				  Player.moveToEntrance();
				  // set render list to be whole map
				  Renderer.setUpdateList( _.keys( Stage.getMap().mapdata ) ); // set updatelist to be every tile for first render
				  // make all monster spawners
				  MonsterSpawnerCollection.makeAllSpawners();
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
			},
			nextLevel = function(){
			  stop();
			  MonsterSpawnerCollection.killAll();
			  mapnum++;
			  if( mapnum % 5 === 0 ){
				nextTheme();
			  }
			  start();
			},
			// nextTheme
			// todo - use audio element
			// todo - make Audio class
			// todo - put this in the map data
			nextTheme = function(){
console.log( 'nextTheme' );
			  jQuery( '#youtubecontainer' ).html( '<object width="420" height="315" style="position:absolute;left:-5000px;"><param name="movie" value="http://www.youtube.com/v/RzkIiflWggU?version=3&amp;hl=en_GB&amp;autoplay=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/RzkIiflWggU?version=3&amp;hl=en_GB&amp;autoplay=1" type="application/x-shockwave-flash" width="420" height="315" allowscriptaccess="always" allowfullscreen="true"></embed></object>' );
			};

		return {
		  start: start,
		  stop: stop,
		  nextLevel:nextLevel
		};

	  })();

	  Gauntlet.Game = Game;
	  window.Gauntlet = Gauntlet;

})(this);
