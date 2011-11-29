/**
 * NPC object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		NPC = (function(){
			var module = Gauntlet.MoveableAgent.instance();
			module.speed = 1;

			module.weaponSpeed = 5;
			module.currentSwing = 0;
			module.type = 1;
			module.damage = 3;
			module.health = 1;
			module.vect = [0,0];// current desired movement vector
			module.count = 0;
			module.moveEvery = 20;
			module.says = '';

			/**
			 * checkMovement
			 * sets the movement for the monster depending on the player location and the closest floor tile in that direction
			 */
			module.checkMovement = function(){
			  this.count--;
			  if( this.count < 0 ){
			  	var x = ~~((Math.random()*3)-1.5),
					y = ~~((Math.random()*3)-1.5);
				if( x !== 0 ){ y = 0; }
				this.vect = [ x , y ];
				this.count = this.moveEvery;
			  }
			  var vectX = [ this.vect[ 0 ] , 0 ], vectY = [ 0 , this.vect[ 1 ] ],
				  newOffset = this.getNewOffset( this.vect ) ,
				  newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y + newOffset.tileY },
				  tile = Gauntlet.Stage.getTileAt( newTilePos );
			  // if tile in vect direction is a floor tile, set it and return
			  if( (tile.substr(0,1) === 'f' || tile.substr(0,1) === 's') ){
				this.moving = this.vect;
			  }else{
				// else if tile in x is ok
				newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y };
				tile = Gauntlet.Stage.getTileAt( newTilePos );
				if( (tile.substr(0,1) === 'f' || tile.substr(0,1) === 's' ) ){
				  this.moving = vectX;
				}else{
				  // else if tile in y is ok
				  newTilePos = { x: this.coords.x , y: this.coords.y + newOffset.tileY };
				  tile = Gauntlet.Stage.getTileAt( newTilePos );
				  if( (tile.substr(0,1) === 'f' || tile.substr(0,1) === 's') ){
					this.moving = vectY;
				  }else{
					this.moving = [ 0 , 0 ];
				  }
				}
			  }
			  return this.moving;
			};

			module.canMoveIntoTile = function( t , newCoords ){
				var pPos = Gauntlet.Player.getPosition();
				return ( t.substr(0,1) === "f" || t.substr(0,1) === 's' ) && Gauntlet.MonsterSpawnerCollection.isTileFree( newCoords , this ) && ( newCoords.x !== pPos.x || newCoords.y !== pPos.y );
			};

			module.setType = function( npcT ){
			  this.type = npcT;
			};

			module.setDialog = function(s){
				this.says = s;
			};

			module.talk = function(){
				if(this.says){
					Gauntlet.Dialog.showMessage(this.says,this.coords,this.offset,this);
				}
			};

			return module;

		})();

	Gauntlet.NPC = NPC;
	window.Gauntlet = Gauntlet;

})(this);