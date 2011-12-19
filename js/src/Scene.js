/**
 * Scene object
 * fades in a large image and waits for Controller input to proceed
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Scene = (function(){

			var waitTime,
				waitFor = 2000, // cannot skip for this many ms
				rootPath = 'assets/sf2/' ,
				scenes = [
					'scene-start.png',
					'world1-start.png',
					'world1-end.png',
					'world2-start.png',
					'world2-end.png',
					'world3-start.png',
					'world3-end.png',
					'world4-start.png',
					'world4-end.png',
					'world5-start.png',
					'world5-end.png',
					'world6-start.png'
				],
				sequence = [],
				onProceed = null,
				showAndWait = function(sceneNum, cb, data){
					onProceed = cb;
					Gauntlet.Renderer.drawScene(rootPath + scenes[ sceneNum ], data);
					waitTime = new Date();
				},
				showSequenceAndWait = function(sceneNums,cb, data){
					var firstScene = sceneNums.shift();
					onProceed = cb;
					sequence = sceneNums;
					Gauntlet.Renderer.drawScene(rootPath + scenes[ firstScene ], data);
					waitTime = new Date();
				},
				nextInSequence = function(){
					if(!sequence.length){
						waitTime = new Date();
						return;
					}
					var nextScene = sequence.shift();
					Gauntlet.Renderer.drawScene(rootPath + scenes[ nextScene ]);
					waitTime = new Date();
				},
				proceed = function(){
					if(((new Date()).getTime() - waitTime.getTime()) > waitFor){
						if(sequence.length){
							nextInSequence();
						}else{
							if(onProceed && _.isFunction(onProceed)){
								onProceed();
								onProceed = null;
							}
						}
					}
				};
			
			return {
				showAndWait:showAndWait,
				showSequenceAndWait:showSequenceAndWait,
				proceed:proceed
			}

		})();

	Gauntlet.Scene = Scene;
	window.Gauntlet = Gauntlet;

})(this);