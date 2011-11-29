/**
 * Dialog object
 *
 */
(function(window){

	var jQuery = window.jQuery ,

		Gauntlet = window.Gauntlet || {} ,

		fadeTime = 500,

		DialogMessage = {
			showing: false,
			$el: null,
			onClose: null,
			show: function($appendTo){
				var self = this;
				$appendTo.append(this.$el);
				this.$el.fadeIn(fadeTime,function(){
					this.showing = true;
				});
				window.setTimeout(function(){
					self.hide();
				},4000);
			},
			hide: function(){
				var self = this;
				this.$el.fadeOut(fadeTime,function(){
					this.showing = false;
					self.$el.remove();
					if(self.onClose && _.isFunction(self.onClose)){
						self.onClose();
					}
				});
			},
			init: function(txt,pos,onClickOk){
				var self = this;
				// make $el
				this.$el = jQuery( '<div class="dialog-message"><div class="dialog-text">' + txt + '</div></div>' ).css({
					'position':'absolute',
					'top':pos.top,
					'left':pos.left
				});
				this.$el.hide();
				this.onClose = function(){
					if( onClickOk && _.isFunction( onClickOk ) ){
						onClickOk();
					}
					return false;
				}
				/*
				this.$el.find('.dialog-ok').click( );*/
				this.showing = false;
				this.t = null;
			},
			instance: function(){
			  function F() {}
			  F.prototype = this;
			  return new F();
			}
		};

		Dialog = (function(){
			var dialogs = [] ,
				owner = [],
				showing = false ,
				owners = [],
				$el = jQuery( '<div class="dialog-background"></div>' );
			return {
				showMessage: function(txt,coords,offset,owner,onClose){
					var newDialog = DialogMessage.instance() ,
						self = this ,
						pixelDims = Gauntlet.Tileset.getPixelDims() ,
						popupPosition = {
							left: (coords.x * pixelDims.x) + offset.x,
							top: (coords.y * pixelDims.y) + offset.y
						};
					if( _.indexOf(owners,owner) > -1 ){
						return;
					}
					newDialog.init(txt,popupPosition,function(){
						dialogs = _(dialogs).without(newDialog);
						owners = _(owners).without(owner);
						if(onClose && _.isFunction(onClose)){
							onClose();
						}
						return false;
					});
					owners.push(owner);
					dialogs.push(newDialog);
					_(dialogs).each(function(dialog){
						if(!dialog.showing){
							dialog.show($el);
						}
					});
				},
				init: function(){
					var $appendTo = jQuery('.gamecontainer');
					$appendTo.find('.dialog-background').remove();
					$appendTo.append($el);
				}
			};
		})();

	Gauntlet.Dialog = Dialog;
	window.Gauntlet = Gauntlet;

})(this);