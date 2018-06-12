define(['config', 'Vue', 'axios', 'vee-validate', 'lodash'], function(abyss, Vue, axios, VeeValidate, _) {
	Vue.component('user-directories', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				pageState: 'init',
				directoryTypes: [],
				directoryOptions: [],
				end: []
			};
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
			},
			getDirectoryTypes() {
				axios.get(abyss.ajax.subject_directory_types, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.directoryTypes = response.data;
					} else {
						this.directoryTypes = [];
					}
				}, error => {
					console.error(error);
				});
			},
			getDirectoryOptions() {
				axios.get(abyss.ajax.subject_directories_list, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.directoryOptions = response.data;
					} else {
						this.directoryOptions = [];
					}
				});
			},
		},
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'user-directories', 'init');
			this.getDirectoryTypes();
			this.getDirectoryOptions();
		}
	});
});