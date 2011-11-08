/**
 * Scene object
 * fades in a large image and waits for Controller input to proceed
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Scene = (function(){

			var rootPath = 'assets/sf2/' ,
				scenes = [
					'scene-start.png'
				],
				onProceed = null,
				showAndWait = function( sceneNum , cb ){
					onProceed = cb;
					Gauntlet.Renderer.drawScene( rootPath + scenes[ sceneNum ] );
				},
				proceed = function(){
					if( onProceed && _.isFunction(onProceed) ){
						onProceed();
						onProceed = null;
					}
				};
			
			return {
				showAndWait:showAndWait,
				proceed:proceed
			}

		})();

	Gauntlet.Scene = Scene;
	window.Gauntlet = Gauntlet;

})(this);