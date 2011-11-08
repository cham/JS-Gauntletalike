/**
 * Controller object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		Controller = (function(){

			var listen = function(){
			  jQuery( document ).keydown( function(e){
				var which = String.fromCharCode( e.which ).toLowerCase() ,
					inGame = Gauntlet.Game.gameInProgress();
				switch( which ){
				  case 'w': case '&':
				 	if( inGame ){
						Gauntlet.Player.setMovement(1,-1);
					}
					break;
				  case 'a': case '%':
				 	if( inGame ){
						Gauntlet.Player.setMovement(0,-1);
					}
					break;
				  case 's': case '(':
				 	if( inGame ){
						Gauntlet.Player.setMovement(1,1);
					}
					break;
				  case 'd': case '\'':
				 	if( inGame ){
						Gauntlet.Player.setMovement(0,1);
					}
					break;
				  case ' ':
				 	if( inGame ){
						Gauntlet.Player.fireOn();
					}else{
						Gauntlet.Scene.proceed();
					}
					break;
				  default:
					break;
				}
			  }).keyup( function(e){
				var which = String.fromCharCode( e.which ).toLowerCase();
				switch( which ){
				  case 'w': case '&':
				  case 's': case '(':
					Gauntlet.Player.setMovement(1,0);
					break;
				  case 'a': case '%':
				  case 'd': case '\'':
					Gauntlet.Player.setMovement(0,0);
					break;
				  case ' ':
				    Gauntlet.Player.fireOff();
					break;
				  default:
					break;
				}
			  });
			};

			return {
			  listen:listen
			};

		})();

	Gauntlet.Controller = Controller;
	window.Gauntlet = Gauntlet;

})(this);