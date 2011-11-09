/**
 * Missile object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Missile = (function(){
			var module = Gauntlet.MoveableAgent.instance();
			// set speed
			module.speed = 10;
			module.type = 0; // 0 is the default player missile
			module.time = 16;

			/**
			 * timeOut
			 * returns true if the Missile has timed out
			 */
			module.timeOut = function(){
				this.time--;
				return this.time < 0;
			};
			/**
			 * hitWall
			 * returns true if the Missile has hit a wall, otherwise false
			 */
			module.hitWall = function(){
			  var tile = Gauntlet.Stage.getTileAt( this.coords );
			  if( !tile ){ return true; }
			  if( tile.substr(0,1) === 'w' ){
				return true;
			  }
			  return false;
			};

			/**
			 * hitMonster
			 * returns an array of monsters the missile has hit
			 */
			module.hitMonster = function(){
			  var monsters = Gauntlet.MonsterSpawnerCollection.getAllMonsterStates() , self = this ,
				  collisions = [];
			  _( monsters ).each( function( mState ){
				var mX = mState.coords.x ,
					mY = mState.coords.y ,
					sX = self.coords.x ,
					sY = self.coords.y;
				if( mX === sX && mY === sY ){
					mState.monster.health--;
					collisions.push( { monster: mState.monster , missile: self } );
				}
			  });
			  return collisions;
			};

			/**
			 * hitMonster
			 * returns true if it hits the Boss
			 */
			module.hitBoss = function(){
				if( !Gauntlet.Boss.isActive() ){ return false; }
				var bossPos = Gauntlet.Boss.getPosition() ,
					minX = bossPos.x , maxX = bossPos.x + 1,
					minY = bossPos.y+1 , maxY = bossPos.y + 1,
					sX = this.coords.x ,
					sY = this.coords.y ,
					hitBoss = false;
				if( minX <= sX && maxX >= sX && minY <= sY && minY >= sY ){
					return true;
				}
				return false;
			};

			/**
			 * hitSpawner
			 * returns an array of spawners the missile has hit
			 */
			module.hitSpawner = function(){
				var spawners = Gauntlet.MonsterSpawnerCollection.getAllSpawners() , spX , spY ,
					collisions = [] , 
					self = this ,
					selfX = self.coords.x , selfY = self.coords.y;
				_( spawners ).each( function( spawner ){
					spX = spawner.coords.x;
					spY = spawner.coords.y;
					if( spX === selfX && spY === selfY ){
						spawner.health--;
						collisions.push( { spawner: spawner , missile: self } );
					}
				});
				return collisions;
			};

			/**
			 * setType
			 * sets the missile type
			 */
			module.setType = function( t ){
				this.type = t;
			};

			/**
			 * getType
			 * gets the missile type
			 */
			module.getType = function( t ){
				return this.type;
			};

			return module;
		})();

	Gauntlet.Missile = Missile;
	window.Gauntlet = Gauntlet;

})(this);