/**
* MonsterSpawner
* spawns new Monster objects
*/
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		MonsterSpawner = {
			monsters: [], // array of monster objects the spawner has spawned
			autoSpawn: false,
			spawntime: 10 * 1000,
			coords: {x:0,y:0},
			t:null,
			stopped:false,
			limit: 0, // if set then only spawns up to this many monsters
			monsterType: 0,
			health: 3,
			/**
			 * spawnNewMonster
			 * creates a new monster object and runs initialisation methods on it
			 */
			spawnNewMonster: function(){
			  if( this.stopped ){ return; }
			  var self = this , monster;
			  if( !this.limit || this.limit > this.monsters.length ){
				monster = Gauntlet.Monster.instance();
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
				  Gauntlet.Renderer.queueForUpdate( tile );
				});
				// give Player points
				Gauntlet.Player.givePoints( m.getPointValue() );
				Gauntlet.Renderer.updateHUD();
			  }
			},
			/**
			 * kill
			 * kills the spawner and all monsters it owns
			 */
			kill: function(){
				// replace current tile with spawner floor tile
				var replaceWith = Gauntlet.Tileset.getSpawnerFloorStates()[ 's' + this.monsterType ];
				Gauntlet.Stage.updateTileAtCoords( this.coords , replaceWith );
				// queue update for all monster tiles
				_( this.monsters ).each( function( m ){
					_( m.getTilesToRedraw() ).each( function( tileIndex ){
				  		Gauntlet.Renderer.queueForUpdate( tileIndex );
					});
					// give Player points
					Gauntlet.Player.givePoints( m.getPointValue() );
				});
				_( this.getTilesToRedraw() ).each( function( tileIndex ){
					Gauntlet.Renderer.queueForUpdate( tileIndex );
				});
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
			 * getTilesToRedraw
			 * returns an array of tile indexes to redraw on the tile the MonsterSpawner is on and those around it
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
			/**
			 * sets
			 */
			setType: function( mType ){
				var h;
				this.monsterType = mType;
				switch( this.monsterType ){
					case '0':
						h = 1;
						break;
					case '1':
						h = 3;
						break;
					case '2':
						h = 5;
						break;
					case '3':
						h = 3;
						break;
					default:
						h = 2;
						break;
				}
				this.setHealth( h );
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
			setHealth: function( h ){
				this.health = h;
			},
			instance: function(){
			  function F() {}
			  F.prototype = this;
			  return new F();
			}
		};

	Gauntlet.MonsterSpawner = MonsterSpawner;
	window.Gauntlet = Gauntlet;

})(this);