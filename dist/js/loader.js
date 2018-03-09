var $lt = null, $pt = null, $pi = null, loaded = false;
loaded = false;
function fragListener(event) {
	// var $source = $(this);
	var isl = event.type != 'load';
	var isb = isl || event.type != 'beforehttp';
	if (!isl && !isb) {
		return;
	}
	if (isl) {
		if (isb && event.pathSiphon.indexOf('frags/cancel') >= 0) {
			// example that shows how to prevent a fragment from showing
			event.preventDefault();
		}
	} else {
		// event.log();
	}
	if (loaded) {
		console.log("fragListener: ", event);
	}
}
function fragsListener(event) {
	if (event.type != 'load') {
		return;
	}
	var firstLoad = !loaded;
	loaded = true;
	event.log();
	UI.layout.init(event, true);
	if (event.actionScope.prop('tagName').toLowerCase() !== 'html') {
		// updateUI(event);
		return;
	}
}