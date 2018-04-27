define(['config', 'Vue', 'axios', 'vee-validate', 'lodash'], function(abyss, Vue, axios, VeeValidate, _) {
	Vue.component('user-directories', {
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
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'user-directories', 'init');
		}
	});
});