/**
* NPCCollection
* note - closer to a MonsterSpawner than a MonsterSpawnerCollection
* creates and controls NPCs on the map
*/
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		NPCCollection = {
			
			npcs: [], // array of npc objects the spawner has spawned
			/**
			 * spawnNPC
			 * creates a new NPC object and runs initialisation methods on it
			 */
			spawnNPC: function(type,coords){
			  var npc = Gauntlet.NPC.instance();

			  npc.setPosition(coords);
			  npc.setOffset({x:0, y:0});
			  npc.setType(type);
			  npc.count = ~~(Math.random() * 30); // random count down for first move
			  this.npcs.push(npc);
			},
			/**
			 * moveMonsters
			 * moves all monsters in local array
			 */
			moveNPCs: function(){
			  _( this.npcs ).each( function( npc ){
				npc.move();
			  });
			},
			getStates: function(){
			  var states = [];
			  _( this.npcs ).each( function( npc ){
				states.push( {
				  'facing': npc.getFacing(),
				  'coords': npc.getPosition(),
				  'offset': npc.getOffset(),
				  'npc': npc
				} );
			  });
			  return states;
			},
			isTileFree: function( checkCoords , ignorenpc ){
			  var nPos;
			  return _( this.npcs ).select( function( npc ){
				nPos = npc.getPosition();
				return ( nPos.x === checkCoords.x && nPos.y === checkCoords.y && npc !== ignorenpc );
			  } ).length < 1;
			},
			/**
			 * killNPC
			 * kills the npc specified
			 */
			killNPC: function( n ){
			  // remove from local array
			  var newNPCList = _( this.npcs ).without( n );
			  if( _.isEqual( this.npcs , newNPCList ) ){ return; }

			  this.npcs = newNPCList;
			  // set tiles for update
			  var update = n.getTilesToRedraw();
			  _( update ).each( function( tile ){
			    Gauntlet.Renderer.queueForUpdate( tile );
			  });
			  Gauntlet.Renderer.updateHUD();
			},
			/**
			 * killAll
			 * kills all npcs
			 */
			killAll: function(){
				// queue npc tiles for redraw
				_(this.npcs).each(function(npc,i){
					_(npc.getTilesToRedraw()).each(function(tile){
						Gauntlet.Renderer.queueForUpdate(tile);
					});
				});
				// clear npc list
				this.npcs = [];
			},
			/**
			 * makeAllNPCs - builds local array of NPCs by iterating over the npcs object on the current map
			 */
			makeAllNPCs: function(){
				var npcinfo = Gauntlet.Stage.getMap().npcs || [] ,
					self = this;

				this.killAll();
				_(npcinfo).each(function(npc){
					self.spawnNPC(npc.type,{x:npc.x,y:npc.y});
				});
			}
		};

	Gauntlet.NPCCollection = NPCCollection;
	window.Gauntlet = Gauntlet;

})(this);