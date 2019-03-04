define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
// ■■■■■■■■ api-list ■■■■■■■■ //
	Vue.component('api-list', {
		props: ['api', 'index'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {
			apiEnvironment : {
				get() {
					if (this.api.issandbox) {
						return 'SANDBOX';
					} else {
						return 'LIVE';
					}
				}
			},
		},
		methods : {},
		created() {
			this.apiOwner(this.api);
		},
	});
	Vue.component('api-preview', {
		props: ['api'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {
			filteredApps : {
				get() {
					return _.reject(this.$root.appList, { contracts: [ { apiid: this.api.uuid, isdeleted: false } ]});
				}
			},
			apiEnvironment : {
				get() {
					if (this.api.issandbox) {
						return 'SANDBOX';
					} else {
						return 'LIVE';
					}
				}
			},
			apiGateway : {
				get() {
					return this.$root.abyssGatewayUrl + '/' + this.api.uuid;
				}
			},
			compCategoriesToList : {
				get() {
					if (this.api.categories != null) {
						return this.api.categories.map(e => e.name).join(', ');
					}
				},
			},
			compTagsToList : {
				get() {
					if (this.api.tags != null) {
						return this.api.tags.map(e => e.name).join(', ');
					}
				},
			},
			compGroupsToList : {
				get() {
					if (this.api.groups != null) {
						return this.api.groups.map(e => e.name).join(', ');
					}
				},
			},
		},
		methods : {},
		created() {
			this.apiOwner(this.api);
		},
	});
// ■■■■■■■■ explore ■■■■■■■■ //
	Vue.component('explore', {
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
				filterTxt: '',
				apiList: [],
				subjectPermissionList: [],
				apiOptions: [],
				appList: [],

				end: []
			};
		},
		methods: {
			async getApiOptions(search, loading) {
				loading(true);
				var apiOptions = await this.getList(abyss.ajax.proxy_list + '/?likename=' + search);
				// this.apiOptions = apiOptions.filter( (item) => !item.isdeleted && item.apivisibilityid == abyss.defaultIds.apiVisibilityPublic );
				this.apiOptions = apiOptions.filter( (item) => item.apivisibilityid === abyss.defaultIds.apiVisibilityPublic );
				this.apiOptions.forEach((value, key) => {
					Vue.set(value, 'name', value.openapidocument.info.title);
				});
				loading(false);
			},
			async filterApi(filter) {
				if (filter == null) {
					this.getPage(1);
					this.apiList = this.apiList.filter( (item) => item.apivisibilityid === abyss.defaultIds.apiVisibilityPublic );
					this.filterTxt = '';
				} else {
					console.log("filter: ", filter);
					// var apiList = await this.getItem(abyss.ajax.proxy_list, filter.uuid);
					// Vue.set( this, 'apiList', apiList );
					this.apiList = [];
					this.apiList.push(filter);
					this.filterTxt = 'Search Result';
				}
			},
			async getPage(p, px, nm) {
				var pxEndpoint = abyss.ajax.proxy_list+'/';
				if (px) {
					pxEndpoint = px;
				}
				if (nm) {
					this.filterTxt = nm;
				}
				this.apiList = await this.getList(pxEndpoint);
				this.apiList.forEach(async (value, key) => {
					await this.getResources(value, 'API PROXY', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description);
				});
				// this.apiList = this.apiList.filter( (item) => !item.isdeleted && item.apivisibilityid == abyss.defaultIds.apiVisibilityPublic );
				// this.apiList = apiList;
				
			},
		},
		async created() {
			this.$emit('set-page', 'explore', 'init');
			await this.getPage(1);
			await this.getMyAppList();
			this.apiList = this.apiList.filter( (item) => item.apivisibilityid === abyss.defaultIds.apiVisibilityPublic );
			this.paginate = this.makePaginate(this.apiList);
			this.isLoading = false;
			this.preload();
		}
	});
});