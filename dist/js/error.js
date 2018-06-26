define(['config', 'Vue'], function (abyss, Vue) {
	new Vue({
		el: '#portal',
		data: {
			abyssVersion: abyss.abyssVersion,
			end: []
		},
		created() {
			console.log("JS: auth.js: ", this.abyssVersion);
		}
	});
});
