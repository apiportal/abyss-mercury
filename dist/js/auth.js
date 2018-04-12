console.log("JS: auth.js");
define(['Vue', 'axios', 'vee-validate'], function (Vue, axios, VeeValidate) {
	Vue.use(VeeValidate)
	new Vue({
		el: '#portal',
		methods: {
			validateBeforeSubmit() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						// alert('Form Submitted!');
						return;
					}
					// alert('Correct them errors!');
				});
			}
		},
		created() {
			console.log("this: ", this);
		}
	});
});
