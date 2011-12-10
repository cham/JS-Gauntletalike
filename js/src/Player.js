/**
 * Player object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Player = (function(){
			var module = Gauntlet.MoveableAgent.instance();

			module.speed = 5;

			module.canfire = true;
			module.health = 100;
			module.score = 0;
			module.lives = 3;
			module.multiplier = 1;
			module.multiCount = 0;
			module.multiCountFrom = 20;
			module.firing = false;
			module.weaponSpeed = 5;
			module.currentSwing = 0;
			module.weaponType = 1;
			module.damage = 1;
			module.weaponswitch = 1;

			module.beforeMoving = function(){
				// if firing then fire
				if( this.firing ){
					this.fire();
				}
				// if on NPC tile make them speak
				_( Gauntlet.NPCCollection.getNPCsInTile(this.coords) ).each(function(npc){
					npc.talk();
				});
				// if no current multiplier countdown return
				if( !this.multiCount ){ return; }
				this.multiCount--;
				if( this.multiCount < 1 ){
					this.multiplier--;
					Gauntlet.Renderer.updateHUD();
					if( this.multiplier > 1 ){
						this.multiCount = this.multiCountFrom;
					}
				}
			};


			/**
			 * checkMovement
			 * checks local moving vector is valid and sets closest possible if not
			 */
			module.checkMovement = function(){
			  var vectX = [ this.moving[ 0 ] , 0 ], vectY = [ 0 , this.moving[ 1 ] ],
				  newOffset = this.getNewOffset() ,
				  newTilePos = { x: this.coords.x + newOffset.tileX , y: this.coords.y + newOffset.tileY } ,
				  tile = Gauntlet.Stage.getTileAt( newTilePos );
			  if( !tile ){ return [ 0 , 0 ]; }
			  // if tile is a floor tile, return - movement is ok
			  if( ( tile.substr(0,1) === 'f' || tile.substr(0,1) === 'c' ) && Gauntlet.MonsterSpawnerCollection.isTileFree( newTilePos , this ) ){
				return this.moving;
			  }else{
				// else if tile in x is ok
				newTilePos =  { x: this.coords.x + newOffset.tileX , y: this.coords.y };
				tile = Gauntlet.Stage.getTileAt( newTilePos );
				if( tile.substr(0,1) === 'f' && Gauntlet.MonsterSpawnerCollection.isTileFree( newTilePos , this ) ){
				  return vectX;
				}else{
				  // else if tile in y is ok
				  newTilePos = { x: this.coords.x , y: this.coords.y + newOffset.tileY };
				  tile = Gauntlet.Stage.getTileAt( newTilePos );
				  if( tile.substr(0,1) === 'f' && Gauntlet.MonsterSpawnerCollection.isTileFree( newTilePos , this ) ){
					return vectY;
				  }else{
					return [ 0 , 0 ];
				  }
				}
			  }
			};

			/**
			 * fire
			 * fires a Missile in the current movement or direction facing
			 */
			module.fire = function(){
				this.currentSwing--;
				if( this.currentSwing < 0 ){
					var vect = this.moving;
					// if not moving use facing
					if( vect[ 0 ] === 0 && vect[ 1 ] === 0 ){
						switch( this.facing ){
							case 'up'  : vect = [  0 , -1 ]; break;
							case 'down': vect = [  0 ,  1 ]; break;
							case 'left': vect = [ -1 ,  0 ]; break;
							default    : vect = [  1 ,  0 ]; break;
						}
					}
					switch( this.weaponType ){
						case 2:
							// if not moving in x
							if( vect[ 0 ] === 0 ){
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x-4,y: this.offset.y} , [vect[0],vect[1]] );
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x+4,y: this.offset.y} , [vect[0],vect[1]] );
							}else{
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y-4} , [vect[0],vect[1]] );
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y+4} , [vect[0],vect[1]] );
							}
							break;
						case 3:
							this.weaponswitch = 1 - this.weaponswitch;
							// if not moving in x
							if( vect[ 0 ] === 0 ){
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x-4,y: this.offset.y} , [vect[0],vect[1]] );
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,  y: this.offset.y} , [vect[0],vect[1]] );
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x+4,y: this.offset.y} , [vect[0],vect[1]] );
								if(this.weaponswitch){
									Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y} , [1,vect[1]] );
									Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y} , [-1,vect[1]] );
								}
							}else if( vect[ 1 ] === 0 ){
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y-4} , [vect[0],vect[1]] );
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y  } , [vect[0],vect[1]] );
								Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y+4} , [vect[0],vect[1]] );
								if(this.weaponswitch){
									Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y} , [vect[0],1] );
									Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y} , [vect[0],-1] );
								}
							}
							break;
						default:
							Gauntlet.MissileLauncher.fireMissile( {x: this.coords.x,y: this.coords.y} , {x: this.offset.x,y: this.offset.y} , [vect[0],vect[1]] );
							break;
					}
					this.currentSwing = this.weaponSpeed;
				}
			};

			module.allowFiring = function(){
			  this.canfire = true;
			};

			module.moveToEntrance = function(){
			  this.coords = Gauntlet.Stage.getEntrance();
			};

			module.checkForSpecialTile = function( t ){
			  // if player has reached the exit then load next level
			  if( t.substr(0,2) === 'fx' || t.substr(0,1) === 'c' ){
				Gauntlet.Game.nextLevel();
			  }
			};

			module.canMoveIntoTile = function( t ){
				return t.substr(0,1) === 'f';
			};

			module.setMovement = function( index , val ){
			  this.moving[ index ] = val;
			};

			module.hurt = function( howmuch ){
			  this.health -= howmuch;
			  if( this.health < 1 ){
				this.die();
			  }
			  Gauntlet.Renderer.updateHUD();
			};

			module.heal = function( howmuch ){
			  this.health += howmuch;
			  if( this.health > 100 ){
				this.health = 100;
			  }
			  Gauntlet.Renderer.updateHUD();
			};

			module.givePoints = function( numpoints ){
			  this.score += numpoints * this.multiplier;
			  this.multiplier++;
			  this.multiCount = this.multiCountFrom;
			};

			module.getMultiplier = function(){
			  return this.multiplier;
			};

			module.getHealth = function(){
			  return this.health;
			};

			module.getScore = function(){
			  return this.score;
			};

			module.getLives = function(){
			  return this.lives;
			};

			module.getDamage = function(){
				return this.damage;
			};

			module.die = function(){
				this.lives--;
				if( this.lives < 0 ){
					Gauntlet.Game.end();
					return;
				}
				// restart the level
				Gauntlet.Player.heal(200); // heal player back to full
				Gauntlet.Game.restartLevel();
			};

			module.reset = function(){
				this.score = 0;
				this.lives = 3;
				this.health = 100;
				this.canfire = true;
			};

			module.fireOn = function(){
				this.firing = true;
			};

			module.fireOff = function(){
				this.firing = false;
				this.currentSwing = 0;
			};

			module.upgradeWeapon = function(){
				this.weaponType++;
				switch( this.weaponType ){
					case 2:
						this.weaponSpeed = 4;
						Gauntlet.Missile.time = 30;
						break;
					case 3:
						this.weaponSpeed = 4;
						Gauntlet.Missile.time = 30;
						break;
					default:
						break;
				}
				module.currentSwing = 0;
			};

			module.getWeaponType = function(){
				return this.weaponType;
			};

			return module;

		})();

	Gauntlet.Player = Player;
	window.Gauntlet = Gauntlet;

})(this);