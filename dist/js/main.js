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
require.config({
	"paths": {
		"jquery": "lib/jquery.min",
		"bootstrap": "lib/bootstrap.min",
		"lodash": "lib/lodash.min",
		"bootstrap4": "lib/bootstrap.bundle.min",
		"Vue": "lib/vue.min",
		"vue": ["lib/require-vuejs.min"],
		"axios": "lib/axios.min",
		"ace": "lib/",
		"swagger-editor": "swagger/swagger-editor-bundle",
		"swagger-ui": "swagger/swagger-ui-bundle",
		"swagger-ui-css": "swagger/swagger-ui.css?noext",
		//// plugins ////
		"slimscroll": "plugins/jquery.slimscroll.min",
		"moment": "plugins/moment.min",
		"dropzone": "plugins/dropzone/dropzone.min",
		"eonasdan-bootstrap-datetimepicker": "plugins/bootstrap-datetimepicker.min",
		"bootstrap-datetimepicker-css": "plugins/bootstrap-datetimepicker.min.css?noext",
		"colorpicker": "plugins/bootstrap-colorpicker/bootstrap-colorpicker.min",
		"colorpicker-css": "plugins/bootstrap-colorpicker/bootstrap-colorpicker.min.css?noext",
		// "izitoast-css": "plugins/iziToast.min.css?noext",
		"izitoast": "plugins/iziToast.min",
		"sortablejs": "plugins/Sortable.min",
		"tiny-cookie": "plugins/tiny-cookie.min",
		"highcharts": "plugins/Highcharts",
		"sweetalert2": "plugins/sweetalert2.min",
		"sweetalert2-css": "plugins/sweetalert2.min.css?noext",
		"turndown": "plugins/turndown.umd",
		"medium-editor": "plugins/medium-editor.min",
		// "medium-editor-markdown": "plugins/me-markdown.standalone.min",
		"medium-editor-css": "plugins/medium-editor.min.css?noext",
		//// comps ////
		"vuedraggable": "comps/vuedraggable",
		"vee-validate": "comps/vee-validate.min",
		"vue-select": "comps/vue-select",
		"vue-cookie": "comps/vue-cookie",
		"highcharts-vue": "comps/highcharts-vue.min",
		// "date-picker": "comps/date-picker",
		"VueBootstrapDatetimePicker": "comps/vue-bootstrap-datetimepicker.min",
		"vue-dropzone": "comps/vue2Dropzone",
		"vue-dropzone-css": "comps/vue2Dropzone.css?noext",
		// "vue-izitoast": "comps/vue-izitoast.min",
		"vue-izitoast": "comps/vue-my-izitoast",
		"vue-medium-editor": "comps/vueMediumEditor.min",
		// "ace-init": "scripts/ace",
		//// components ////
		"organization-tree": "app/partials/OrganizationTree.htm?noext",
		//// init ////
		"config": "config",
		"global": "/global",
		"auth": "auth",
		"error": "error",
		"root": "app/_root",
		"test": "app/_test",
		"openapi": "app/openapi",
		"testJs": "app/_testJs",
		"index": "app/index",
		"api-policies": "app/api-policies",
		"api-licenses": "app/api-licenses",
		"messages": "app/messages",
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
		'bootstrap': ['jquery'],
		'slimscroll': ['jquery'],
		'axios': {
			deps: ['Vue'],
			exports: 'axios',
		},
		'config': ['global'],
		'vue-snotify': ['Vue'],
		'vue-dropzone': ['dropzone'],
		'vue-cookie': ['tiny-cookie'],
		// 'vue-medium-editor': ['medium-editor'],
		// 'medium-editor-markdown': ['vue-medium-editor'],
		'dropdown': ['jquery', 'bootstrap'],
		'dropzone': { exports: 'Dropzone'},
		'moment': { exports: 'moment'},
		'Vue': { exports: 'Vue'},
		'lodash': { exports: '_'},
		'auth': ['global', 'config', 'jquery', 'bootstrap'],
		'error': ['global', 'config', 'jquery', 'bootstrap'],
		'app': ['global', 'config', 'jquery', 'bootstrap', 'root', 'slimscroll'],
		'root': [reqModules[0], reqModules[1], reqModules[2], 'jquery', 'Vue', 'axios', 'lodash']
	},
	deps: reqModules
});
if (typeof jQuery === 'function') {
	define('jquery', function() { return jQuery; });
}
define('css', {
	load: function (name, require, load, config) {
		function inject(filename) {
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
// domready
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
			if (callbacks.length) {
				readyCalls = [];
				runCallbacks(callbacks);
			}
		}
	}
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
			document.addEventListener("DOMContentLoaded", pageLoaded, false);
			window.addEventListener("load", pageLoaded, false);
		} else if (window.attachEvent) {
			window.attachEvent("onload", pageLoaded);
			testDiv = document.createElement('div');
			try {
				isTop = window.frameElement === null;
			} catch (e) {}
			if (testDiv.doScroll && isTop && window.external) {
				scrollIntervalId = setInterval(function () {
					try {
						testDiv.doScroll();
						pageLoaded();
					} catch (e) {}
				}, 30);
			}
		}
		if (document.readyState === "complete") {
			pageLoaded();
		}
	}
	function domReady(callback) {
		if (isPageLoaded) {
			callback(doc);
		} else {
			readyCalls.push(callback);
		}
		return domReady;
	}
	domReady.version = '2.0.1';
	domReady.load = function (name, req, onLoad, config) {
		if (config.isBuild) {
			onLoad(null);
		} else {
			domReady(onLoad);
		}
	};
	return domReady;
});