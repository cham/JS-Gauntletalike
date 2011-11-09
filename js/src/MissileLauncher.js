/**
 * Missile object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		MissileLauncher = (function(){
			var missiles = [],
				maxMissiles = 99 ,
				missileType = 1,
				/**
				 * fireMissile
				 * fires a new Missile object
				 * @param Object coords co-ordinates as {x:y:}
				 */
				fireMissile = function( coords , offset , movement ){
				  if( missiles.length >= maxMissiles ){ return; }
				  var missile = Gauntlet.Missile.instance();
				  missile.setType( Gauntlet.Player.getWeaponType() );
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
					  mCollisions = [] ,
					  sCollisions = [];

				  _( missiles ).each( function( missile ){
					mCollisions = missile.hitMonster();
					sCollisions = missile.hitSpawner();
					if( missile.hitWall() ){
					  // redraw area around where the missile died
					  _( missile.getTilesToRedraw() ).each( function( tile ){
						Gauntlet.Renderer.queueForUpdate( tile );
					  });
					}else if( sCollisions.length ){
					  // kill all spawners in the collisions array
					  _( sCollisions ).each( function( c ){
					  	if( c.spawner.health < 1 ){
							Gauntlet.MonsterSpawnerCollection.killSpawner( c.spawner );
						}
					  });
					}else if( mCollisions.length ){
					  // kill all monsters in the collisions array
					  _( mCollisions ).each( function( c ){
					  	if( c.monster.health < 1 ){
							Gauntlet.MonsterSpawnerCollection.killMonster( c.monster );
						}
					  });
					}else if( missile.hitBoss() ){
						Gauntlet.Boss.hurt( Gauntlet.Player.getDamage() );
					}else if( missile.timeOut() ){
					  // redraw area around where the missile died
					  _( missile.getTilesToRedraw() ).each( function( tile ){
						Gauntlet.Renderer.queueForUpdate( tile );
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
					  'offset': missile.getOffset(),
					  'type': missile.getType()
					} );
				  });
				  return states;
				},
				/**
				 * killAllMissiles
				 * deletes all missiles in cache and updates Tiles
				 */
				killAllMissiles = function(){
					_( missiles ).each( function( missile ){
						// redraw area around where the missile died
						_( missile.getTilesToRedraw() ).each( function( tile ){
							Gauntlet.Renderer.queueForUpdate( tile );
						});
					});
					missiles = [];
				},
				
				/**
				 * killMissile
				 * deletes ths specified missile from local array
				 */
				killMissile = function( m ){
					missiles = _( missiles ).without( m );
					// redraw area around where the missile died
					_( m.getTilesToRedraw() ).each( function( tile ){
						Gauntlet.Renderer.queueForUpdate( tile );
					});
				};


			return {
			  killMissile:killMissile,
			  killAllMissiles:killAllMissiles,
			  fireMissile: fireMissile,
			  moveMissiles: moveMissiles,
			  getStates: getStates
			}
		})();

	Gauntlet.MissileLauncher = MissileLauncher;
	window.Gauntlet = Gauntlet;

})(this);