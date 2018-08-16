define(['config', 'Vue', 'axios', 'vee-validate', 'lodash'], function(abyss, Vue, axios, VeeValidate, _) {
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
						document.querySelector('#validForm').submit();
						return;
					}
				});
			}
		},
		mounted() {
			this.preload();
		},
		created() {
			this.$emit('set-page', 'change-password', 'init');
		}
	});
});