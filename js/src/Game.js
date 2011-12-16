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
				levelsperworld = 3,
				onlyDrawUpdated = false,
				themes ,
				mapnum = 9 ,
				showIntro = false,
				gameRunning = false,
				playaudio = false,
				worldscenes = [
					[2,3],
					[4,5],
					[6,7],
					[8,9]
				],
				tick = function(){
				  //Renderer.clear();
				  Gauntlet.Player.move();
				  Gauntlet.NPCCollection.moveNPCs();
				  Gauntlet.MonsterSpawnerCollection.moveAllMonsters();
				  Gauntlet.MissileLauncher.moveMissiles();
				  Gauntlet.Renderer.render();
				  Gauntlet.Stage.updateTime();
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
						// init Dialog
						Gauntlet.Dialog.init();
						// once loaded, laoad the stage data
						Gauntlet.Stage.load( mapnum , function(){
							// clear map
							Gauntlet.Renderer.init();
							Gauntlet.Renderer.clear();
							function startTheGame(){
								var bossloc = Gauntlet.Stage.getMap().bosslocation || null ,
								bosstype = Gauntlet.Stage.getMap().bosstype || 0;
								stopped = false;
								// heal player back to full health
								Gauntlet.Player.heal(100);
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
								// set max monsters per spawner
								Gauntlet.MonsterSpawnerCollection.setMonstersPerSpawner( Math.ceil( mapnum / levelsperworld ) );
								// make all npcs
								Gauntlet.NPCCollection.makeAllNPCs();
								// make all monster spawners
								Gauntlet.MonsterSpawnerCollection.makeAllSpawners();
								// make all bosses
								if( bossloc ){
									Gauntlet.Boss.makeBoss( bossloc , bosstype );
								}
								// start tick
								tick();
								gameRunning = true;
							}
							// listen for keyboard input
							Gauntlet.Controller.listen();
							// if showing the intro, restore themes, load scene 0
							if( showIntro ){
								restoreThemes();
								Gauntlet.Scene.showSequenceAndWait([0,1], function(){
									Gauntlet.Stage.updateLevel('World 1-1');
									nextTheme();
									startTheGame();
									Gauntlet.Stage.resetTime();
									Gauntlet.Renderer.setLightning(true);
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
					var nextWorld = ((mapnum % levelsperworld) === 0),
						worldnum = ~~((mapnum) / levelsperworld),
						curlevelnum = mapnum-(worldnum * levelsperworld);
					Gauntlet.Stage.updateLevel('World '+(worldnum+1)+'-'+(curlevelnum+1));
					stop();
					killAllSprites();
					Gauntlet.Dialog.killAll();
					mapnum++;
					if(mapnum === 2){
						Gauntlet.Renderer.setShake(true);
					}
					if(mapnum === 4){
						Gauntlet.Renderer.setShake(false);
						Gauntlet.Renderer.setLightning(false);
					}
					if(mapnum === 9){
						nextTheme();
					}
					if(nextWorld){
						gameRunning = false;
						Gauntlet.Scene.showSequenceAndWait(worldscenes[worldnum-1],function(){
							nextTheme();
							if(mapnum === 7 || mapnum === 10){
								Gauntlet.Player.upgradeWeapon();
							}
							gameRunning = true;
							start();
						});
					}else{
						start();
					}
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
					if( !themes.length || !playaudio ){ return; }
				 	var playNext = themes.shift();
				 	jQuery( '#youtubecontainer' ).html( '<object width="1" height="1" style="position:absolute;left:-5000px;"><param name="movie" value="http://www.youtube.com/v/' + playNext + '?version=3&amp;hl=en_GB&amp;autoplay=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/' + playNext + '?version=3&amp;hl=en_GB&amp;autoplay=1" type="application/x-shockwave-flash" width="1" height="1" allowscriptaccess="always" allowfullscreen="true"></embed></object>' );
				},
				/**
				 * restoreThemes
				 * plays the intro theme and restored themes array
				 */
				restoreThemes = function(){
					themes = [ 'X5nJXQL04gQ' , 'vHqjziy-Epc' , 'ULXnfaQg-ZI' , 'RzkIiflWggU' , '8lhpWOfwRyY' , 'NYpf6lfr_Is' ,'F2mOlCNRe_o' ];
					nextTheme();
				},
				/**
				 * gameInProgress
				 * returns true if the game is in progress - used by Controller to switch between showing a Scene or controlling the player
				 */
				gameInProgress = function(){
					return gameRunning;
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
					gameRunning = false;
					start();
				},
				killAllSprites = function(){
					Gauntlet.MonsterSpawnerCollection.killAll();
					Gauntlet.MissileLauncher.killAllMissiles();
					Gauntlet.Boss.killAllMissiles();
					Gauntlet.Boss.sleep();
					Gauntlet.NPCCollection.killAll();
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