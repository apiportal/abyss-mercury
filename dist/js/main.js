var bust = '.js?bust=' + new Date().getTime();
var reqJs = document.getElementById('reqJs');
var reqVue = document.getElementById('reqVue');
var getModules = '';
if(reqJs != null) { 
	getModules = reqJs.getAttribute('data-module');
}
if(reqVue != null) { 
	getModules = reqVue.getAttribute('data-module');
}
var modules = getModules.split('|');
if(reqVue != null) { 
	modules.push('app', 'root');
}
// modules.unshift('app');
// console.log("modules: ", modules);
require.config({
	// "baseUrl": "/js",
	// "urlArgs": "bust=" + (new Date()).getTime(),
	"paths": {
		//// libs ////
		"jquery": "lib/jquery.min",
		// "jquery": "lib/jquery-3.3.1.min",
		"domready": "lib/domReady",
		"bootstrap": "lib/bootstrap.min",
		"lodash": "lib/lodash.min",
		"bootstrap4": "lib/bootstrap.bundle.min",
		"Vue": "lib/vue",
		// "vue": ["require-vuejs", "https://rawgit.com/edgardleal/require-vuejs/master/dist/require-vuejs"],
		"vue": ["lib/require-vuejs.min"],
		"axios": "lib/axios.min",
		"ace": "lib/",
		//// plugins ////
		"slimscroll": "plugins/jquery.slimscroll",
		"moment": "plugins/moment.min",
		//// comps ////
		"vee-validate": "comps/vee-validate.min",
		"date-picker": "comps/date-picker",
		"vue-select": "comps/vue-select",
		"VueBootstrapDatetimePicker": "comps/vue-bootstrap-datetimepicker.min",
		"vue-dropzone": "comps/vue2Dropzone",
		// "v-lazy-img": "comps/v-lazy-img",
		// "VueLazyBackgroundImage": "comps/VueLazyBackgroundImage",
		// "PasswordStrengthMeter": "app/PasswordStrengthMeter.htm",
		"eonasdan-bootstrap-datetimepicker": "plugins/bootstrap-datetimepicker.min",
		"bootstrap-datetimepicker-css": "plugins/bootstrap-datetimepicker.min.css?noext",

		//// unused plugins ////
		"owlcarousel": "plugins/owl.carousel.min",
		"datepicker": "plugins/bootstrap-datepicker.min",
		"select2": "/Content/vendors/bower_components/select2/dist/js/select2.full.min",
		"colorpicker": "/Content/vendors/bower_components/mjolnic-bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min",
		"colorpicker-css": "/Content/vendors/bower_components/mjolnic-bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css?noext",
		"datetimepicker": "/Content/vendors/bower_components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min",
		"datetimepicker-css": "/Content/vendors/bower_components/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css",
		"daterangepicker": "/Content/vendors/bower_components/bootstrap-daterangepicker/daterangepicker",
		"daterangepicker-css": "/Content/vendors/bower_components/bootstrap-daterangepicker/daterangepicker.css",

		"datatables": "/Content/vendors/bower_components/datatables/media/js/jquery.dataTables.min",
		"datatables-data": "/Content/dist/js/dataTables-data",
		//// init ////
		"ace-init": "scripts/ace",
		// "configg": "config",
		// "vue-my-apis": "/comps/my-apis.htm",
		"auth": "auth",
		"error": "error",
		"root": "app/_root",
		"index": "app/index",
		"my-apis": "app/my-apis",
		"users": "app/users",
		"user-groups": "app/user-groups",
		"user-directories": "app/user-directories",
		"change-password": "app/change-password",
		"app": "app"
	},
	shim: {
		// 'VueBootstrapDatetimePicker': ['Vue', 'eonasdan-bootstrap-datetimepicker'],
		'bootstrap': ['jquery'],
		'slimscroll': ['jquery'],
		'owlcarousel': ['jquery'],
		'axios': ['Vue'],
		'dropdown': ['jquery', 'bootstrap'],
		'moment': { exports: 'moment'},
		'Vue': { exports: 'Vue'},
		'axios': { exports: 'axios'},
		'lodash': { exports: '_'},
		'auth': ['config', 'jquery', 'bootstrap'],
		'error': ['config', 'jquery', 'bootstrap'],
		'app': ['config', 'jquery', 'bootstrap'],
		'root': [modules[0], 'Vue', 'axios', 'lodash', 'vee-validate', 'moment']
		// 'app': ['config', 'jquery', 'bootstrap', 'dropdown', 'moment', 'lodash']
	},
	deps: modules
});
if (typeof jQuery === 'function') {
	define('jquery', function() { return jQuery; });
}
