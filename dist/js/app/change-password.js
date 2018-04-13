define(['Vue', 'axios', 'vee-validate', 'lodash'], function(Vue, axios, VeeValidate, _) {
	Vue.component('change-password', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				pageState: 'init',
				end: []
			}
		},
		methods: {
			validateBeforeSubmit(event) {
				event.preventDefault();
				this.$validator.validateAll().then((result) => {
					if (result) {
						// alert('Form Submitted!');
						document.querySelector('#validForm').submit();
						return;
					}
					// alert('Correct them errors!');
				});
			}
		},
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'change-password', 'init');
		}
	});
});