/**
 * Renderer
 * renders the playing area
 *
 * render():undefined
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Renderer = (function(){

			var map ,
				ctx ,
				pixeldims ,
				updateList = [] ,
				playerSwitch = 7 ,
				altSwitch = 10 ,
				longSwitch = 30 ,
				shakeEffect = [-1,-2,2,-4,3,-3,2],
				shakeEffectOn = false,
				lightningEffectOn = false,
				tx , ty ,
				/**
				 * clear
				 * clears the whole map
				 */
				clear = function(){
				  ctx.clearRect( 0 , 0 , ( map.mapdims.x * pixeldims.x ) , ( map.mapdims.y * pixeldims.y ) );
				},
				/**
				 * drawTile
				 * draws a tile at the position specified, with dimensions, tileType, [index,facing,offset]
				 */
				drawTile = function( ox , oy , dx , dy , tileType , tileIndex , facing , offS , subindex ){
					var spriteInfo , chunk , offset = offS || {x:0,y:0};
						spriteInfo = Gauntlet.Tileset.getSpriteInfo( tileType , tileIndex , facing , subindex );
					try{
						ctx.drawImage( spriteInfo.canvas, spriteInfo.x, spriteInfo.y , spriteInfo.tiledims.x, spriteInfo.tiledims.y, ox  + offset.x , oy  + offset.y , dx - ox , dy - oy );
					}catch(e){
						console.log(e);
					}
				},
				drawBackground = function(){
					_.each( _.uniq( updateList ) , function( i ){
						var tilecoords = Gauntlet.Stage.getCoordsFor( i ) ,
							ox = tilecoords.x * tx ,
							oy = tilecoords.y * ty;
						drawTile( ox , oy , ox + tx , oy + ty , map.mapdata[ i ] , i );
					});
				},
				drawPlayer = function(){
				  var pc = Gauntlet.Player.getPosition() ,
					  ox = pc.x * tx ,
					  oy = pc.y * ty;
				  drawTile( ox , oy , ox + tx , oy + ty , 'player' , +( playerSwitch > 3 ) , Gauntlet.Player.getFacing() , Gauntlet.Player.getOffset() );
				},
				drawNPCs = function(){
					var npcs = Gauntlet.NPCCollection.getStates() ,
						ox,oy;
					_( npcs ).each(function(npcState){
						ox = npcState.coords.x * tx;
						oy = npcState.coords.y * ty;
						drawTile( ox , oy , ox + tx , oy + ty , 'npc' , +( playerSwitch > 3 ) , npcState.facing , npcState.offset , npcState.npc.type );
					});
				},
				drawMonsters = function(){
				  var monsterStates = Gauntlet.MonsterSpawnerCollection.getAllMonsterStates() ,
					  ox,oy, monsterType;
				  _( monsterStates ).each( function( mState ){
					ox = mState.coords.x * tx;
					oy = mState.coords.y * ty;
					monsterType = mState.monster.type;
					drawTile( ox , oy , ox + tx , oy + ty , 'monster' , +( playerSwitch > 3 ) , mState.facing , mState.offset , monsterType );
				  } );
				},
				drawMissiles = function(){
				  var missileStates = Gauntlet.MissileLauncher.getStates() ,
					  tx = pixeldims.x , ty = pixeldims.y ,
					  ox,oy;
				  _( missileStates ).each( function( mState ){
					ox = mState.coords.x * tx ,
					oy = mState.coords.y * ty;
					drawTile( ox , oy , ox + tx , oy + ty , 'missile' , +( playerSwitch > 3 ) , mState.facing , mState.offset , mState.type-1 );
				  } );
				},
				drawBossMissiles = function(){
				  var missileStates = Gauntlet.Boss.getMissileStates() ,
					  ox,oy;
				  _( missileStates ).each( function( mState ){
					ox = mState.coords.x * tx ,
					oy = mState.coords.y * ty;
					drawTile( ox , oy , ox + tx , oy + ty , 'missile' , +( playerSwitch > 3 ) , mState.facing , mState.offset , mState.type );
				  } );
				},
				drawBoss = function(){
				  if( !Gauntlet.Boss.isActive() ){
					return;
				  }
				  var bossCoords = Gauntlet.Boss.getPosition() ,
				  	  bossType = Gauntlet.Boss.getType() ,
					  ox,oy ,
					  bossTiles = [
					  	bossCoords,
					  	{x:bossCoords.x+1,y:bossCoords.y},
					  	{x:bossCoords.x,y:bossCoords.y+1},
					  	{x:bossCoords.x+1,y:bossCoords.y+1}
					  ];
				  _( bossTiles ).each( function( bossTile , i ){
					ox = bossTile.x * tx ,
					oy = bossTile.y * ty;
					drawTile( ox , oy , ox + tx , oy + ty , 'boss' , +( altSwitch > 5 ) , ''+bossType , null , ''+i );
				  } );
				},
				drawScene = function(path, data){
					// load image and draw it into the canvas
					var preload = new Image();
					preload.onload = function(){
						ctx.drawImage( preload , 0 , 0 );
						_(data).each(function(dataItem,k){
console.log(dataItem,k);
						});
					}
					preload.src = path;
				},
				init = function(){
				  map = Gauntlet.Stage.getMap();
				  ctx = Gauntlet.Stage.getContext();
				  pixeldims = Gauntlet.Tileset.getPixelDims();
				  tx = pixeldims.x;
				  ty = pixeldims.y;
				},
				render = function(){
				  playerSwitch--;
				  altSwitch--;
				  longSwitch--;
				  if( playerSwitch < 0 ){ playerSwitch = 7; }
				  if( altSwitch < 0 ){ altSwitch = 10; }
				  if( longSwitch < 0 ){ longSwitch = 30; }
				  if( Gauntlet.Game.onlyDrawUpdated ){
				  	clear();
				  }
				  // draw background
				  drawBackground();
				  // draw player
				  drawPlayer();
				  // draw monsters
				  drawMonsters();
				  // draw boss
				  drawBoss();
				  // draw missiles
				  drawMissiles();
				  // draw missiles
				  drawBossMissiles();
				  // draw NPCs
				  drawNPCs();
				  // canvas shake effect
				  if( shakeEffectOn ){
				  	shakeCanvas();
				  }
				  if( lightningEffectOn ){
				  	shootLightning();
				  }
				  updateList = []; // empty updatelist for next render
				},
				/**
				 * shakeCanvas - shakes the canvas
				 */
				shakeCanvas = function(){
					Gauntlet.Stage.getCanvas().css({'margin-left': shakeEffect[playerSwitch]});
				},
				setShake = function(b){
					shakeEffectOn = b;
					if( !b ){
						Gauntlet.Stage.getCanvas().css({'margin-left':0});
					}
				},
				shootLightning = function(){
					if( longSwitch > 5 ){ return ;}
					_( ~~(Math.random() * 5) ).times( function(){
						Gauntlet.Stage.setOpacity(1);
						window.setTimeout( function(){
							Gauntlet.Stage.setOpacity(0.5);
						} , ~~(Math.random * 1000)+100 );
					});
				},
				setLightning = function(b){
					lightningEffectOn = b;
					if( b ){
						Gauntlet.Stage.setOpacity(0.5);
					}
				},
				/**
				 * updateHUD
				 * updates the HUD - health bar etc
				 */
				updateHUD = function(){
				  Gauntlet.Stage.updateHealth( Gauntlet.Player.getHealth() );
				  Gauntlet.Stage.updateScore( Gauntlet.Player.getScore() );
				  Gauntlet.Stage.updateLives( Gauntlet.Player.getLives() );
				  Gauntlet.Stage.updateMultiplier( Gauntlet.Player.getMultiplier() );
				};

			return {
			  init: init,
			  clear: clear,
			  render: render,
			  queueForUpdate: function( index ){ updateList.push( index ); },
			  setUpdateList: function( ul ){ updateList = ul; },
			  updateHUD: updateHUD,
			  drawScene:drawScene,
			  setShake:setShake,
			  setLightning:setLightning
			}

		})();

	Gauntlet.Renderer = Renderer;
	window.Gauntlet = Gauntlet;

})(this);