/**
* MonsterSpawnerCollection
* creates MonsterSpawners
*/
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		MonsterSpawnerCollection = (function(){

			var	monstersPerSpawner = 5,
				spawners = [],
				timers = [],
				minimumSpawnTime = 2000,
				spawnTimeRange = 1000,
				/**
				 * makeSpawner
				 * makes a new spawner at the specified position
				 */
				makeSpawner = function( type , coords , sTime , dTime ){
				  var spawntime = sTime || 10 * 1000 ,
					  delaytime = dTime || 0;
				  // inner function - either run now or on startdelay
				  doMakeSpawner = function(){
					var spawner = Gauntlet.MonsterSpawner.instance();
					spawner.setType( type );
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
					  mapdata = Gauntlet.Stage.getMap().mapdata ,
					  coords = {} , type;
				  _( mapdata ).each( function( tile , i ){
					if( tile.substr( 0 , 1 ) === 's' ){
					  type = tile.substr( 1 , 1 );
					  coords = Gauntlet.Stage.getCoordsFor( i );
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
				},
				/**
				 * killSpawner - removes the specified monster spawner from the stack
				 */
				killSpawner = function( s ){
					s.kill();
					spawners = _( spawners ).without( s );
				},
				getAllSpawners = function(){
					return spawners;
				};

			return {
			  killAll:killAll,
			  makeSpawner:makeSpawner,
			  makeAllSpawners:makeAllSpawners,
			  getAllMonsterStates:getAllMonsterStates,
			  moveAllMonsters:moveAllMonsters,
			  killMonster:killMonster,
			  isTileFree:isTileFree,
			  killSpawner:killSpawner,
			  getAllSpawners:getAllSpawners
			};
		})();

	Gauntlet.MonsterSpawnerCollection = MonsterSpawnerCollection;
	window.Gauntlet = Gauntlet;

})(this);