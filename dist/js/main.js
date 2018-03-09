var bust = '.js?bust=' + new Date().getTime();
require.config({
	// "baseUrl": "/js",
	// "urlArgs": "bust=" + (new Date()).getTime(),
	"paths": {
		"jquery": "lib/jquery.min",
		"domready": "lib/domReady",
		"bootstrap": "lib/bootstrap.min",
		"bootstrap4": "lib/bootstrap.bundle.min",
		"slimscroll": "plugins/jquery.slimscroll",
		"owlcarousel": "plugins/owl.carousel.min",
		"switchery": "plugins/switchery.min",
		"dropdown": "plugins/dropdown-bootstrap-extended",

		"moment": "/Content/vendors/bower_components/moment/min/moment-with-locales.min",
		"colorpicker": "/Content/vendors/bower_components/mjolnic-bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min",
		"datetimepicker": "/Content/vendors/bower_components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min",
		"daterangepicker": "/Content/vendors/bower_components/bootstrap-daterangepicker/daterangepicker",

		"datatables": "/Content/vendors/bower_components/datatables/media/js/jquery.dataTables.min",
		"datatables-data": "/Content/dist/js/dataTables-data",

		"hideseek": "plugins/jquery.hideseek.min",
		"ace": "https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.6",
		// "configg": "config",
		"auth": "auth",
		"error": "error",
		"app": "app"
	},
	shim: {
		'bootstrap': ['jquery'],
		'slimscroll': ['jquery'],
		'owlcarousel': ['jquery'],
		'moment': {
			exports: 'moment'
		},
		'auth': ['config', 'jquery', 'bootstrap'],
		'error': ['config', 'jquery', 'bootstrap'],
		'app': ['config', 'jquery', 'bootstrap', 'dropdown', 'moment']
	}
	// deps: ['app']
});
if (typeof jQuery === 'function') {
	define('jquery', function() { return jQuery; });
}
define(['config', 'jquery'], function(config, $){
	var module = $('script[src*="require.min"]').data('module');
	var args = module.split('|');
	if (module.length) {
		require([args[0]], function () {
			if (args.length > 1) {
				args.shift();
				// args.push('app');
				require(args);
			}
		});
	}
});