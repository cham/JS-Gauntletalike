/**
 * MapProvider
 * provides an interface for loading JSON map files
 *
 * getLevel(lnum:Number,cb:Function):Object
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		MapProvider = (function(){

			var	filepath = 'maps/',
				getLevel = function( lnum ,cb ){
				  jQuery.ajax( {
					url: filepath + lnum + '.json',
					dataType: 'json',
					success: function( data ){
					  cb( data );
					},
					error: function(a,b,c){ console.log(a,b,c); }
				  } );
				};

			return {
			  'getLevel': getLevel
			};

		})();

	Gauntlet.MapProvider = MapProvider;
	window.Gauntlet = Gauntlet;

})(this);