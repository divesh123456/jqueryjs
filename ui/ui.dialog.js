;(function($) {
	
	//If the UI scope is not available, add it
	$.ui = $.ui || {};

	$.fn.extend({
		dialog: function(options, data) {
			var args = Array.prototype.slice.call(arguments, 1);

			return this.each(function() {
				if (typeof options == "string") {
					var dialog = $.data(this, "ui-dialog") ||
						$.data($(this).parents(".ui-dialog:first").find(".ui-dialog-content")[0], "ui-dialog");
					dialog[options].apply(dialog, args);

				// INIT with optional options
				} else if (!$(this).is(".ui-dialog-content"))
					new $.ui.dialog(this, options);
			});
		}
	});

	$.ui.dialog = function(el, options) {
		
		this.options = options = $.extend({}, $.ui.dialog.defaults, options);
		this.element = el;
		var self = this; //Do bindings

		$.data(this.element, "ui-dialog", this);
		
		$(el).bind("setData.dialog", function(event, key, value){
			options[key] = value;
		}).bind("getData.dialog", function(event, key){
			return options[key];
		});

		var uiDialogContent = $(el).addClass('ui-dialog-content');

		if (!uiDialogContent.parent().length) {
			uiDialogContent.appendTo('body');
		}
		uiDialogContent
			.wrap(document.createElement('div'))
			.wrap(document.createElement('div'));
		var uiDialogContainer = uiDialogContent.parent().addClass('ui-dialog-container').css({position: 'relative'});
		var uiDialog = this.uiDialog = uiDialogContainer.parent().hide()
			.addClass('ui-dialog')
			.css({position: 'absolute', width: options.width, height: options.height, overflow: 'hidden'}); 

		var classNames = uiDialogContent.attr('className').split(' ');

		// Add content classes to dialog, to inherit theme at top level of element
		$.each(classNames, function(i, className) {
			if (className != 'ui-dialog-content')
				uiDialog.addClass(className);
		});
		
		if (options.resizable && $.fn.resizable) {
			uiDialog.append('<div class="ui-resizable-n ui-resizable-handle"></div>')
				.append('<div class="ui-resizable-s ui-resizable-handle"></div>')
				.append('<div class="ui-resizable-e ui-resizable-handle"></div>')
				.append('<div class="ui-resizable-w ui-resizable-handle"></div>')
				.append('<div class="ui-resizable-ne ui-resizable-handle"></div>')
				.append('<div class="ui-resizable-se ui-resizable-handle"></div>')
				.append('<div class="ui-resizable-sw ui-resizable-handle"></div>')
				.append('<div class="ui-resizable-nw ui-resizable-handle"></div>');
			uiDialog.resizable({
				maxWidth: options.maxWidth,
				maxHeight: options.maxHeight,
				minWidth: options.minWidth,
				minHeight: options.minHeight,
				stop: $.ui.dialog.overlay.resize
			});
		}

		uiDialogContainer.prepend('<div class="ui-dialog-titlebar"></div>');
		var uiDialogTitlebar = $('.ui-dialog-titlebar', uiDialogContainer);
		var title = (options.title) ? options.title : (uiDialogContent.attr('title')) ? uiDialogContent.attr('title') : '';
		uiDialogTitlebar.append('<span class="ui-dialog-title">' + title + '</span>');
		uiDialogTitlebar.append('<a href="#" class="ui-dialog-titlebar-close"><span>X</span></a>');
		this.uiDialogTitlebarClose = $('.ui-dialog-titlebar-close', uiDialogTitlebar)
			.hover(function() { $(this).addClass('ui-dialog-titlebar-close-hover'); }, 
			       function() { $(this).removeClass('ui-dialog-titlebar-close-hover'); })
			.mousedown(function(ev) {
				ev.stopPropagation();
			})
			.click(function() {
				self.close();
				return false;
			})
			.keydown(function(ev) {
				var ESC = 27;
				ev.keyCode && ev.keyCode == ESC && self.close(); 
			});

		var l = 0;
		$.each(options.buttons, function() { l = 1; return false; });
		if (l == 1) {
			uiDialog.append('<div class="ui-dialog-buttonpane"></div>');
			var uiDialogButtonPane = $('.ui-dialog-buttonpane', uiDialog);
			$.each(options.buttons, function(name, value) {
				var btn = $(document.createElement('button')).text(name).click(value);
				uiDialogButtonPane.append(btn);
			});
		}
	
		if (options.draggable && $.fn.draggable) {
			uiDialog.draggable({
				handle: '.ui-dialog-titlebar',
				start: function() {
					self.activate();
				},
				stop: $.ui.dialog.overlay.resize
			});
		}
		uiDialog.mousedown(function() {
			self.activate();
		});
		uiDialogTitlebar.click(function() {
			self.activate();
		});
		
		// TODO: determine if this is necessary for modal dialogs
		options.bgiframe && $.fn.bgiframe && uiDialog.bgiframe();
		
		this.open = function() {
			this.overlay = options.modal ? new $.ui.dialog.overlay(self) : null;
			uiDialog.appendTo('body');
			var wnd = $(window), doc = $(document), top = doc.scrollTop(), left = doc.scrollLeft();
			if (options.position.constructor == Array) {
				// [x, y]
				top += options.position[1];
				left += options.position[0];
			} else {
				switch (options.position) {
					case 'center':
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
						break;
					case 'top':
						top += 0;
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
						break;
					case 'right':
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += (wnd.width()) - (uiDialog.width());
						break;
					case 'bottom':
						top += (wnd.height()) - (uiDialog.height());
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
						break;
					case 'left':
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += 0;
						break;
					default:
						//center
						top += (wnd.height() / 2) - (uiDialog.height() / 2);
						left += (wnd.width() / 2) - (uiDialog.width() / 2);
				}
			}
			top = top < doc.scrollTop() ? doc.scrollTop() : top;
			uiDialog.css({top: top, left: left});
			uiDialog.show();
			self.moveToTop();
			self.activate();
			
			// CALLBACK: open
			var openEV = null;
			var openUI = {
				options: options
			};
			this.uiDialogTitlebarClose.focus();
			$(this.element).triggerHandler("dialogopen", [openEV, openUI], options.open);
		};

		this.activate = function() {
			// Move modeless dialogs to the top when they're activated.  Even
			// if there is a modal dialog in the window, the modeless dialog
			// should be on top because it must have been opened after the modal
			// dialog.  Modal dialogs don't get moved to the top because that
			// would make any modeless dialogs that it spawned unusable until
			// the modal dialog is closed.
			!options.modal && this.moveToTop();
		};
		
		this.moveToTop = function() {
			var maxZ = options.zIndex;
			$('.ui-dialog:visible').each(function() {
				maxZ = Math.max(maxZ, parseInt($(this).css('z-index'), 10) || options.zIndex);
			});
			this.overlay && this.overlay.$el.css('z-index', ++maxZ);
			uiDialog.css('z-index', ++maxZ);
		};
		
		this.close = function() {
			this.overlay && this.overlay.destroy();
			uiDialog.hide();

			// CALLBACK: close
			var closeEV = null;
			var closeUI = {
				options: options
			};
			$(this.element).triggerHandler("dialogclose", [closeEV, closeUI], options.close);
			$.ui.dialog.overlay.resize();
		};
		
		if (options.autoOpen)
			this.open();
	};
	
	$.extend($.ui.dialog, {
		defaults: {
			autoOpen: true,
			bgiframe: false,
			buttons: [],
			draggable: true,
			height: 200,
			minHeight: 100,
			minWidth: 150,
			modal: false,
			overlay: {},
			position: 'center',
			resizable: true,
			width: 300,
			zIndex: 1000
		},
		
		overlay: function(dialog) {
			this.$el = $.ui.dialog.overlay.create(dialog);
		}
	});
	
	$.extend($.ui.dialog.overlay, {
		instances: [],
		events: $.map('focus,mousedown,mouseup,keydown,keypress,click'.split(','),
			function(e) { return e + '.ui-dialog-overlay'; }).join(' '),
		create: function(dialog) {
			if (this.instances.length === 0) {
				// TODO: don't get selects inside dialogs
				this.selects = this.ie6 && $('select:visible').css('visibility', 'hidden');
				
				// prevent use of anchors and inputs
				$('a, :input').bind(this.events, function() {
					// allow use of the element if inside a dialog and
					// - there are no modal dialogs
					// - there are modal dialogs, but we are in front of the
					//   topmost modal dialog
					var allow = false;
					var $dialog = $(this).parents('.ui-dialog');
					if ($dialog.length) {
						var $overlays = $('.ui-dialog-overlay');
						if ($overlays.length) {
							var maxZ = parseInt($overlays.css('z-index'), 10);
							$overlays.each(function() {
								maxZ = Math.max(maxZ, parseInt($(this).css('z-index'), 10));
							});
							allow = parseInt($dialog.css('z-index'), 10) > maxZ;
						} else {
							allow = true;
						}
					}
					return allow;
				});
				
				// allow closing by pressing the escape key
				$(document).bind('keydown.ui-dialog-overlay', function(e) {
					var ESC = 27;
					e.keyCode && e.keyCode == ESC && dialog.close(); 
				});
				
				// handle window resize
				$(window).bind('resize.ui-dialog-overlay', $.ui.dialog.overlay.resize);
			}
			
			$el = $('<div/>').appendTo(document.body)
				.addClass('ui-dialog-overlay').css($.extend({
					borderWidth: 0, margin: 0, padding: 0,
					position: 'absolute', top: 0, left: 0,
					width: this.width(),
					height: this.height()
				}, dialog.options.overlay));
			
			this.instances.push($el);
			return $el;
		},
		
		destroy: function($el) {
			this.instances.splice($.inArray(this.instances, $el), 1);
			
			if (this.instances.length === 0) {
				$('a, :input').add([document, window]).unbind('.ui-dialog-overlay');
				this.ie6 && this.selects.css('visibility', 'visible');
			}
			
			$el.remove();
		},
		
		height: function() {
			if (this.ie6) {
				var scrollHeight = Math.max(
					document.documentElement.scrollHeight,
					document.body.scrollHeight
				);
				var offsetHeight = Math.max(
					document.documentElement.offsetHeight,
					document.body.offsetHeight
				);
				
				if (scrollHeight < offsetHeight) {
					return $(window).height() + 'px';
				} else {
					return scrollHeight + 'px';
				}
			} else {
				return $(document).height() + 'px';
			}
		},
		
		width: function() {
			if (this.ie6) {
				var scrollWidth = Math.max(
					document.documentElement.scrollWidth,
					document.body.scrollWidth
				);
				var offsetWidth = Math.max(
					document.documentElement.offsetWidth,
					document.body.offsetWidth
				);
				
				if (scrollWidth < offsetWidth) {
					return $(window).width() + 'px';
				} else {
					return scrollWidth + 'px';
				}
			} else {
				return $(document).width() + 'px';
			}
		},
		
		resize: function() {
			// If the dialog is draggable and the user drags it past the
			// right edge of the window, the document becomes wider so we
			// need to stretch the overlay.  If the user then drags the
			// dialog back to the left, the document will become narrower,
			// so we need to shrink the overlay to the appropriate size.
			// This is handled by shrinking the overlay before setting it
			// to the full document size.
			var $overlays = $([]);
			$.each($.ui.dialog.overlay.instances, function() {
				$overlays = $overlays.add(this);
			});
			
			$overlays.css({
				width: 0,
				height: 0
			}).css({
				width: $.ui.dialog.overlay.width(),
				height: $.ui.dialog.overlay.height()
			});
		},
		
		// IE 6 compatibility
		ie6: $.browser.msie && $.browser.version < 7,
		selects: null
	});
	
	$.extend($.ui.dialog.overlay.prototype, {
		destroy: function() {
			$.ui.dialog.overlay.destroy(this.$el);
		}
	});
})(jQuery);
