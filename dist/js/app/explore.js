define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
// ■■■■■■■■ api-list ■■■■■■■■ //
	Vue.component('api-list', {
		props: ['api', 'index'],
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'name',
					type: String,
					order: 'asc'
				},
				sortApi: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
			};
		},
		computed: {
		},
		methods : {
		}
	});
// ■■■■■■■■ index ■■■■■■■■ //
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
				sortApi: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.proxy_list,
				ajaxHeaders: {},
				dashboardList: [],
				apiList: [],
				subjectPermissionList: [],
				selectedApi: {},
				api: {},
				apiOptions: [],

				end: []
			};
		},
		methods: {
			getApiOptions(search, loading) {
				loading(true);
				axios.get(this.ajaxUrl + '?likename=' + search, this.ajaxHeaders)
				.then((response) => {
					if (response.data != null) {
						this.apiOptions = response.data.filter( (item) => item.isdeleted == false && item.apivisibilityid == 'e63c2874-aa12-433c-9dcf-65c1e8738a14' );
						this.apiOptions.forEach((value, key) => {
							Vue.set(value, 'name', value.openapidocument.info.title);
						});
					} else {
						this.apiOptions = [];
					}
					loading(false);
				}, error => {
					this.handleError(error);
					loading(false);
				});
			},
			filterApi(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					axios.get(this.ajaxUrl, this.ajaxHeaders)
					.then(response => {
						if (response.data != null) {
							this.apiList = [];
							this.apiList.push(filter);
							// this.paginate = this.makePaginate(response.data);
						}
					}, error => {
						this.handleError(error);
					});
				}
			},
			getPage(p, d) {
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param)
				.then(response => {
					// console.log("p: ", p);
					this.apiList = response.data.filter( (item) => item.isdeleted == false && item.apivisibilityid == 'e63c2874-aa12-433c-9dcf-65c1e8738a14' );
					this.paginate = this.makePaginate(response.data);
					this.preload();
				}, error => {
					this.handleError(error);
				});
			},
			////////////////
		},
		mounted() {
			// this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'explore', 'init');
			this.getPage(1);
		}
	});
});