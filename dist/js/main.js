var reqBust = '.js?bust=' + new Date().getTime();
var reqJs = document.getElementById('reqJs');
var reqVue = document.getElementById('reqVue');
var reqGetModules = '';
if(reqJs != null) { 
	reqGetModules = reqJs.getAttribute('data-module');
}
if(reqVue != null) { 
	reqGetModules = reqVue.getAttribute('data-module');
}
var reqModules = reqGetModules.split('|');
reqModules.unshift('config');
reqModules.unshift('global');
if(reqVue != null) { 
	reqModules.push('root', 'app');
}
console.log("reqModules: ", reqModules);
require.config({
	// "baseUrl": "/js",
	// "urlArgs": "bust=" + (new Date()).getTime(),
	"paths": {
		//// libs ////
		"jquery": "lib/jquery.min",
		// "jquery": "lib/jquery-3.3.1.min",
		// "domready": "lib/domReady",
		"bootstrap": "lib/bootstrap.min",
		"lodash": "lib/lodash.min",
		"bootstrap4": "lib/bootstrap.bundle.min",
		"Vue": "lib/vue",
		// "vue": ["require-vuejs", "https://rawgit.com/edgardleal/require-vuejs/master/dist/require-vuejs"],
		"vue": ["lib/require-vuejs.min"],
		"axios": "lib/axios.min",
		"ace": "lib/",
		"swagger-ui": "swagger/swagger-ui-bundle",
		"swagger-ui-css": "swagger/swagger-ui.css?noext",
		//// plugins ////
		"slimscroll": "plugins/jquery.slimscroll",
		"moment": "plugins/moment.min",
		"dropzone": "plugins/dropzone/dropzone",
		"eonasdan-bootstrap-datetimepicker": "plugins/bootstrap-datetimepicker.min",
		"bootstrap-datetimepicker-css": "plugins/bootstrap-datetimepicker.min.css?noext",
		"colorpicker": "plugins/bootstrap-colorpicker/bootstrap-colorpicker.min",
		"colorpicker-css": "plugins/bootstrap-colorpicker/bootstrap-colorpicker.min.css?noext",
		"izitoast-css": "plugins/iziToast.min.css?noext",
		"izitoast": "plugins/iziToast.min",
		"tiny-cookie": "plugins/tiny-cookie.min",
		//// comps ////
		"vee-validate": "comps/vee-validate.min",
		"vue-select": "comps/vue-select",
		"vue-cookie": "comps/vue-cookie",
		// "date-picker": "comps/date-picker",
		"VueBootstrapDatetimePicker": "comps/vue-bootstrap-datetimepicker.min",
		"vue-dropzone": "comps/vue2Dropzone",
		"vue-dropzone-css": "comps/vue2Dropzone.css?noext",
		// "vue-izitoast": "comps/vue-izitoast.min",
		"vue-izitoast": "comps/vue-my-izitoast",

		//// unused plugins ////
		// "vue-slimscroll": "comps/vue-slimscroll",
		// "vue-snotify": "comps/vue-snotify",
		// "filepond": "https://unpkg.com/filepond/dist/filepond",
		// "filepond-css": "https://unpkg.com/filepond/dist/filepond.css?noext",
		// "vue-filepond": "https://unpkg.com/vue-filepond@1.0.4/dist/vue-filepond.min",
		// "jq-filepond": "plugins/filepond.jquery",
		// "v-lazy-img": "comps/v-lazy-img",
		// "VueLazyBackgroundImage": "comps/VueLazyBackgroundImage",
		// "PasswordStrengthMeter": "app/PasswordStrengthMeter.htm",
		"openapi": "app/openapi",

		//// init ////
		"ace-init": "scripts/ace",
		"config": "config",
		"global": "/global",
		// "vue-my-apis": "/comps/my-apis.htm",
		"auth": "auth",
		"error": "error",
		"root": "app/_root",
		"test": "app/_test",
		"testJs": "app/_testJs",
		"index": "app/index",
		"api-policies": "app/api-policies",
		"api-licenses": "app/api-licenses",
		"my-apis": "app/my-apis",
		"explore": "app/explore",
		"users": "app/users",
		"apps": "app/apps",
		"permissions": "app/permissions",
		"access-managers": "app/access-managers",
		"user-groups": "app/user-groups",
		"user-directories": "app/user-directories",
		"change-password": "app/change-password",
		"app": "app"
	},
	shim: {
		// 'VueBootstrapDatetimePicker': ['Vue', 'eonasdan-bootstrap-datetimepicker'],
		'bootstrap': ['jquery'],
		'slimscroll': ['jquery'],
		// 'owlcarousel': ['jquery'],
		'axios': {
			deps: ['Vue'],
			exports: 'axios',
		},
		'config': ['global'],
		'vue-snotify': ['Vue'],
		'vue-dropzone': ['dropzone'],
		'vue-cookie': ['tiny-cookie'],
		'dropdown': ['jquery', 'bootstrap'],
		'dropzone': { exports: 'Dropzone'},
		'moment': { exports: 'moment'},
		'Vue': { exports: 'Vue'},
		'lodash': { exports: '_'},
		// 'filepond': { exports: 'FilePond'},
		// 'jq-filepond': { exports: 'FilePond'},
		'auth': ['global', 'config', 'jquery', 'bootstrap'],
		'error': ['global', 'config', 'jquery', 'bootstrap'],
		'app': ['global', 'config', 'jquery', 'bootstrap', 'root', 'slimscroll'],
		'root': [reqModules[0], reqModules[1], reqModules[2], 'jquery', 'Vue', 'axios', 'lodash']
		// 'app': ['config', 'jquery', 'bootstrap', 'dropdown', 'vee-validate', 'moment', 'lodash']
	},
	deps: reqModules
});
if (typeof jQuery === 'function') {
	define('jquery', function() { return jQuery; });
}
define('css', {
	load: function (name, require, load, config) {
		function inject(filename)
		{
			var head = document.getElementsByTagName('head')[0];
			var link = document.createElement('link');
			link.href = filename;
			link.rel = 'stylesheet';
			link.type = 'text/css';
			head.appendChild(link);
		}
		inject(requirejs.toUrl(name));
		load(true);
	},
	pluginBuilder: './css-build'
});
/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define('domready', function () {
	'use strict';

	var isTop, testDiv, scrollIntervalId,
		isBrowser = typeof window !== "undefined" && window.document,
		isPageLoaded = !isBrowser,
		doc = isBrowser ? document : null,
		readyCalls = [];

	function runCallbacks(callbacks) {
		var i;
		for (i = 0; i < callbacks.length; i += 1) {
			callbacks[i](doc);
		}
	}

	function callReady() {
		var callbacks = readyCalls;

		if (isPageLoaded) {
			//Call the DOM ready callbacks
			if (callbacks.length) {
				readyCalls = [];
				runCallbacks(callbacks);
			}
		}
	}

	/**
	 * Sets the page as loaded.
	 */
	function pageLoaded() {
		if (!isPageLoaded) {
			isPageLoaded = true;
			if (scrollIntervalId) {
				clearInterval(scrollIntervalId);
			}

			callReady();
		}
	}

	if (isBrowser) {
		if (document.addEventListener) {
			//Standards. Hooray! Assumption here that if standards based,
			//it knows about DOMContentLoaded.
			document.addEventListener("DOMContentLoaded", pageLoaded, false);
			window.addEventListener("load", pageLoaded, false);
		} else if (window.attachEvent) {
			window.attachEvent("onload", pageLoaded);

			testDiv = document.createElement('div');
			try {
				isTop = window.frameElement === null;
			} catch (e) {}

			//DOMContentLoaded approximation that uses a doScroll, as found by
			//Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
			//but modified by other contributors, including jdalton
			if (testDiv.doScroll && isTop && window.external) {
				scrollIntervalId = setInterval(function () {
					try {
						testDiv.doScroll();
						pageLoaded();
					} catch (e) {}
				}, 30);
			}
		}

		//Check if document already complete, and if so, just trigger page load
		//listeners. Latest webkit browsers also use "interactive", and
		//will fire the onDOMContentLoaded before "interactive" but not after
		//entering "interactive" or "complete". More details:
		//http://dev.w3.org/html5/spec/the-end.html#the-end
		//http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
		//Hmm, this is more complicated on further use, see "firing too early"
		//bug: https://github.com/requirejs/domReady/issues/1
		//so removing the || document.readyState === "interactive" test.
		//There is still a window.onload binding that should get fired if
		//DOMContentLoaded is missed.
		if (document.readyState === "complete") {
			pageLoaded();
		}
	}

	/** START OF PUBLIC API **/

	/**
	 * Registers a callback for DOM ready. If DOM is already ready, the
	 * callback is called immediately.
	 * @param {Function} callback
	 */
	function domReady(callback) {
		if (isPageLoaded) {
			callback(doc);
		} else {
			readyCalls.push(callback);
		}
		return domReady;
	}

	domReady.version = '2.0.1';

	/**
	 * Loader Plugin API method
	 */
	domReady.load = function (name, req, onLoad, config) {
		if (config.isBuild) {
			onLoad(null);
		} else {
			domReady(onLoad);
		}
	};

	/** END OF PUBLIC API **/

	return domReady;
});