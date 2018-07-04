define(['config', 'Vue'], function (abyss, Vue) {
	new Vue({
		el: '#portal',
		data: {
			abyssVersion: abyss.abyssVersion,
			end: []
		},
		methods: {
			preload() {
				$('.preloader-it > .la-anim-1').addClass('la-animate');
				$(document).ready(function() {
					$(".preloader-it").fadeOut("slow");
				});
			},
		},
		mounted() {
			this.preload();
		},
		created() {
			console.log("JS: auth.js: ", this.abyssVersion);
		}
	});
});
