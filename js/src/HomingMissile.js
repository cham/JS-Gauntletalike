/**
 * HomingMissile object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		HomingMissile = (function(){
			var module = Gauntlet.Missile.instance();
			// set speed
			module.speed = 3;
			module.lifeleft = 120;
			module.damage = 3;
			module.setType( 2 ); // 1 is the boss' homing missile

			/**
			 * checkMovement
			 * sets the movement for the monster depending on the player location and the closest floor tile in that direction
			 */
			module.checkMovement = function(){
			  var playerPos = Gauntlet.Player.getPosition() ,
				  xdiff = this.coords.x - playerPos.x ,
				  ydiff = this.coords.y - playerPos.y ,
				  vectorToPlayer = [ xdiff > 0 ? -1 : ( xdiff < 0 ? 1 : 0 ) , ydiff > 0 ? -1 : ( ydiff < 0 ? 1 : 0 ) ] ,
				  newOffset = this.getNewOffset( vectorToPlayer ) ,
				  newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y + newOffset.tileY },
				  tile = Gauntlet.Stage.getTileAt( newTilePos );
			  // if tile in vectorToPlayer direction is a floor tile, set it and return
			  if( tile.substr(0,1) === 'f' || tile.substr(0,1) === 's' ){
				this.moving = vectorToPlayer;
			  }
			  return this.moving;
			};

			/**
			* hitPlayer
			* returns true if this HomingMissile has hit the player
			*/
			module.hitPlayer = function(){
				var playerPos = Gauntlet.Player.getPosition();
				return ( playerPos.x === this.coords.x && playerPos.y === this.coords.y );
			};

			module.timeExpired = function(){
			  this.lifeleft--;
			  return this.lifeleft < 0;
			};

			module.getDamage = function(){
				return this.damage;
			};

			return module;
		})();

	Gauntlet.HomingMissile = HomingMissile;
	window.Gauntlet = Gauntlet;

})(this);