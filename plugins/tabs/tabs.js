// tabs - jQuery plugin for accessible, unobtrusive tabs by Klaus Hartl
// v 1.3
// http://stilbuero.de/tabs/
// Free beer and free speech. Enjoy!
$.fn.tabs = function(options) {
    // basic stuff
    var ON_CLASS = 'on';
    var OFF_CLASS = 'tabs-hide';
    // options
    var on = (options && options.on && (typeof options.on == 'number' && options.on > 0)) ? options.on - 1 : 0;
    if (options && (options.fxSlide || options.fxFade) && !options.fxSpeed) {
        options['fxSpeed'] = 'normal';
    }
    return this.each(function() {
        var re = /([_\-\w]+$)/i;
        // retrieve active tab from hash in url
        if (location.hash) {
            var hashId = location.hash.replace('#', '');
            $(this).find('>ul>li>a').each(function(i) {
                if (re.exec(this.href)[1] == hashId) {
                    on = i;
                    var unFocus = function() { // required to not scroll to fragment
                        scrollTo(0, 0);
                    }
                    // be nice to IE via Conditional Compilation
                    // this needs to preceed call to unFocus for other browsers
                    /*@cc_on
                    //location.replace('#'); // required to not scroll to fragment
                    setTimeout(unFocus, 150); // IE needs a little timeout here
                    @*/
                    unFocus();
                    setTimeout(unFocus, 100); // be nice to Opera
                }
            });
        }
        $(this).find('>div').not(':eq(' + on + ')').addClass(OFF_CLASS);
        $(this).find('>ul>li:eq(' + on + ')').addClass(ON_CLASS);
        var container = this;
        $(this).find('>ul>li>a').click(function() {
            if (!$(this.parentNode).is('.' + ON_CLASS)) {
                var target = $('#' + re.exec(this.href)[1]);
                if (target.size() > 0) {
                    var self = this;
                    var visible = $(container).find('>div:visible');
                    var callback;
                    if (options && options.callback && typeof options.callback == 'function') {
                        callback = function() {
                            options.callback.apply(target, [target[0], visible[0]]);
                        }
                    }
                    var changeClass = function() {
                        $(container).find('>ul>li').removeClass(ON_CLASS);
                        $(self.parentNode).addClass(ON_CLASS);
                    };
                    if (options && options.fxSlide && options.fxFade) {
                        visible.animate({height: 'hide', opacity: 'hide'}, options.slide, function() {
                            // TODO check accessibility
                            //$(this).addClass(OFF_CLASS).css({display: '', height: 'auto'}); // retain acccessibility for print and other media types
                            changeClass();
                            //target.css('display', 'none').removeClass(OFF_CLASS).animate({height: 'show', opacity: 'show'}, options.slide);
                            target.animate({height: 'show', opacity: 'show'}, options.fxSpeed, callback);
                        });
                    } else if (options && options.fxSlide) {
                        visible.slideUp(options.slide, function() {
                            // TODO check accessibility
                            //$(this).addClass(OFF_CLASS).css({display: '', height: 'auto'}); // retain acccessibility for print and other media types
                            changeClass();
                            //target.css('display', 'none').removeClass(OFF_CLASS).slideDown(options.slide);
                            target.slideDown(options.fxSpeed, callback);
                        });
                    } else if (options && options.fxFade) {
                        visible.fadeOut(options.fade, function() {
                            // TODO check accessibility
                            //$(this).addClass(OFF_CLASS).css({display: '', opacity: '1'}); // retain acccessibility for print and other media types
                            changeClass();
                            //target.css('display', 'none').removeClass(OFF_CLASS).fadeIn(options.fade);
                            target.fadeIn(options.fxSpeed, callback);
                        });
                    } else {
                        visible.addClass(OFF_CLASS);
                        changeClass();
                        target.removeClass(OFF_CLASS);
                        if (callback) {
                            callback();
                        }
                    }
                } else {
                    alert('There is no such container.');
                }
            }
            return false;
        });
    });
};
$.fn.triggerTab = function(tabIndex) {
    var i = tabIndex && tabIndex > 0 && tabIndex - 1 || 0;
    return this.each(function() {
        $(this).find('>ul>li>a').eq(i).click();
    });
};