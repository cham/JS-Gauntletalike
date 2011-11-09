/**
 * Game object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Game = (function(){

			var	frametime = 35,
				t,
				stopped = false,
				mapnum = 1 ,
				onlyDrawUpdated = false,
				themes ,
				showIntro = true,
				gameStarted = false,
				tick = function(){
				  //Renderer.clear();
				  Gauntlet.Player.move();
				  Gauntlet.MonsterSpawnerCollection.moveAllMonsters();
				  Gauntlet.MissileLauncher.moveMissiles();
				  Gauntlet.Renderer.render();
				  if( Gauntlet.Boss.isActive() ){
					Gauntlet.Boss.fire();
					Gauntlet.Boss.moveMissiles();
				  }
				  if( !stopped ){
					t = window.setTimeout( tick , frametime );
				  }
				},
				start = function(){
					// load Tileset images
					Gauntlet.Tileset.load( function(){
						// once loaded, laoad the stage data
						Gauntlet.Stage.load( mapnum , function(){
							// clear map
							Gauntlet.Renderer.init();
							Gauntlet.Renderer.clear();
							function startTheGame(){
								var bossloc = Gauntlet.Stage.getMap().bosslocation || null ,
								bosstype = Gauntlet.Stage.getMap().bosstype || 0;
								stopped = false;
								// clear map
								Gauntlet.Renderer.clear();
								// draw HUD
								Gauntlet.Renderer.updateHUD();
								// move player to entrance
								Gauntlet.Player.moveToEntrance();
								// set render list to be whole map
								if( !onlyDrawUpdated ){
									Gauntlet.Renderer.setUpdateList( _.keys( Gauntlet.Stage.getMap().mapdata ) ); // set updatelist to be every tile for first render
								}
								// make all monster spawners
								Gauntlet.MonsterSpawnerCollection.makeAllSpawners();
								// make all bosses
								if( bossloc ){
									Gauntlet.Boss.makeBoss( bossloc , bosstype );
								}
								// start tick
								tick();
								gameStarted = true;
							}
							// listen for keyboard input
							Gauntlet.Controller.listen();
							// if showing the intro, restore themes, load scene 0
							if( showIntro ){
								restoreThemes();
								Gauntlet.Scene.showAndWait( 0 , function(){
									nextTheme();
									startTheGame();
								});
								showIntro = false;
							}else{
								startTheGame();
							}
						});
					});
				},
				stop = function(){
				  stopped = true;
				  window.clearTimeout( t );
				},
				nextLevel = function(){
				  stop();
				  killAllSprites();
				  mapnum++;
				  if( mapnum === 5 || mapnum === 7 ){
					nextTheme();
				  }
				  if( mapnum === 8 ){
				  	nextTheme();
				  	Gauntlet.Player.upgradeWeapon();
				  }
				  start();
				},
				restartLevel = function(){
					stop();
					killAllSprites();
					start();
				},
				// nextTheme
				// todo - use audio element
				// todo - make Audio class
				// todo - put this in the map data
				nextTheme = function(){
					if( !themes.length ){ return; }
				 	var playNext = themes.shift();
				 	jQuery( '#youtubecontainer' ).html( '<object width="1" height="1" style="position:absolute;left:-5000px;"><param name="movie" value="http://www.youtube.com/v/' + playNext + '?version=3&amp;hl=en_GB&amp;autoplay=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/' + playNext + '?version=3&amp;hl=en_GB&amp;autoplay=1" type="application/x-shockwave-flash" width="1" height="1" allowscriptaccess="always" allowfullscreen="true"></embed></object>' );
				},
				/**
				 * restoreThemes
				 * plays the intro theme and restored themes array
				 */
				restoreThemes = function(){
					themes = [ 'VYcCSVsISXo' , 'ULXnfaQg-ZI' , 'RzkIiflWggU' , '8lhpWOfwRyY' , 'NYpf6lfr_Is' ];
					nextTheme();
				},
				/**
				 * gameInProgress
				 * returns true if the game is in progress - used by Controller to switch between showing a Scene or controlling the player
				 */
				gameInProgress = function(){
					return gameStarted;
				},
				/**
				 * end
				 * ends the current game and returns to the start Scene
				 */
				end = function(){
					stop();
					killAllSprites();
					Gauntlet.Player.reset();
					mapnum = 1;
					showIntro = true;
					gameStarted = false;
					start();
				},
				killAllSprites = function(){
					Gauntlet.MonsterSpawnerCollection.killAll();
					Gauntlet.MissileLauncher.killAllMissiles();
					Gauntlet.Boss.killAllMissiles();
					Gauntlet.Boss.sleep();
				},
				startNewGame = function(){
					// draw HUD
					Gauntlet.Stage.injectHUD();
					start();
				};

			return {
			  start: start,
			  stop: stop,
			  nextLevel:nextLevel,
			  restartLevel:restartLevel,
			  onlyDrawUpdated:onlyDrawUpdated,
			  gameInProgress:gameInProgress,
			  end:end,
			  startNewGame:startNewGame
			};

		})();

	  Gauntlet.Game = Game;
	  window.Gauntlet = Gauntlet;

})(this);