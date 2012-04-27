/**
 * Boss object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Boss = (function(){

			var coords = {x:0,y:0},
				type = 0,
				active = false,
				weaponSpeed = 20,
				currentSwing = 0,
				missiles = [],
				maxMissiles = 10 ,
				missileSwitch = 0 ,
				health = 20 ,
				/**
				 * makeBoss
				 * creates a new boss at the specified location of the specified type
				 * @param loc Object x,y
				 * @param t Number
				 */
				makeBoss = function( loc , t ){
					coords = loc;
					type = t;
					active = true;
					if(type===1){
						health = 50;
						weaponSpeed = 2;
						maxMissiles = 8;
					}
				},
				/**
				 * isActive
				 * returns true if the boss is active or false if not
				 */
				isActive = function(){
					return active;
				},
				/**
				 * hurt
				 * hurt the current Boss
				 */
				hurt = function( h ){
					health -= h;
					if( health < 0 ){
						die();
					}
				},
				/**
				 * isActive
				 * returns true if the boss is active or false if not
				 */
				sleep = function(){
					active = false;
				},
				/**
				 * getPosition
				 * returns current coords
				 */
				getPosition = function(){
					return coords;
				},
				/**
				 * getType
				 * returns current type
				 */
				getType = function(){
					return type;
				},
				/**
				 * fire
				 * fires a HomingMissile, if swing time not up
				 */
				fire = function(){
					currentSwing++;
					if( weaponSpeed > currentSwing ){
						return;
					}
					missileSwitch++;
					if( missileSwitch > 3 ){
						missileSwitch = 0;
					}
					currentSwing = 0;
					if( missiles.length >= maxMissiles ){ return; }
					var hm = Gauntlet.HomingMissile.instance();
					hm.setPosition( {x:coords.x +(missileSwitch < 2), y:coords.y+(missileSwitch % 2)}  , {x:0,y:0} );
					missiles.push( hm );
				},
				/**
				 * moveMissiles
				 * runs move() on every Missile in the stack
				 */
				moveMissiles = function(){
				  var notDead = [], // missiles that are not dead
					  collisions = [];
				  _( missiles ).each( function( missile ){
					collisions = missile.hitPlayer();
					if( missile.hitWall() ){
					  // redraw area around where the missile died
					  _( missile.getTilesToRedraw() ).each( function( tile ){
						Gauntlet.Renderer.queueForUpdate( tile );
					  });
					}else if( missile.hitPlayer() ){
					  // hit player
					  Gauntlet.Player.hurt( missile.getDamage() );
					}else if( missile.timeExpired() ){

					}else{
					  // else move and push to not dead stack
					  missile.move();
					  notDead.push( missile );
					}
				  } );
				  missiles = notDead;
				},
				/**
				 * getMissileStates
				 * returns position and movement state of each missile
				 */
				getMissileStates = function(){
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
				 * killMissile
				 * deletes the missile from the stack and updates tiles
				 */
				killMissile = function( m ){					
					missiles = _( missiles ).without( m );
					// redraw area around where the missile died
					_( m.getTilesToRedraw() ).each( function( tile ){
						Gauntlet.Renderer.queueForUpdate( tile );
					});
				};
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
				 * die
				 * kills the Boss
				 */
				die = function(){
					active = false;
					killAllMissiles();
					Gauntlet.Renderer.queueForUpdate( Gauntlet.Stage.getIndexFor( coords ) );
					Gauntlet.Renderer.queueForUpdate( Gauntlet.Stage.getIndexFor( {x:coords.x,y:coords.y+1} ) );
					Gauntlet.Renderer.queueForUpdate( Gauntlet.Stage.getIndexFor( {x:coords.x+1,y:coords.y} ) );
					Gauntlet.Renderer.queueForUpdate( Gauntlet.Stage.getIndexFor( {x:coords.x+1,y:coords.y+1} ) );
					if(type === 1){
						Gauntlet.Game.completed();
					}
				};


			return {
				makeBoss:makeBoss,
				isActive:isActive,
				fire:fire,
				moveMissiles:moveMissiles,
				getMissileStates:getMissileStates,
				killMissile:killMissile,
				killAllMissiles:killAllMissiles,
				getPosition:getPosition,
				getType:getType,
				sleep:sleep,
				hurt:hurt
			};

		})();

	Gauntlet.Boss = Boss;
	window.Gauntlet = Gauntlet;

})(this);