define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('index', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'name',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.index,
				ajaxHeaders: {},
				dashboardList: [],

				end: []
			}
		},
		methods: {
			getPage(p, d) {
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param)
				.then(response => {
					// console.log("p: ", p);
					this.dashboardList = response.data.respDataList;
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
		},
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'index', 'init');
			// this.getPage(1);
		}
	});
});