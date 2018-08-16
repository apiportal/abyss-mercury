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
			businessapi: {
				get() {
					var bapi = this.$parent.myBusinessApiList.find((el) => el.uuid == this.api.businessapiid );
					if (bapi) {
						return bapi.openapidocument.info.title;
					}
				}
			},
			activeVisibility: {
				get() {
					var slcVisibility = this.$root.rootData.apiVisibilityList.find((el) => el.uuid == this.api.apivisibilityid );
					if (slcVisibility) {
						return slcVisibility.name;
					}
				},
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
					key: 'proxies',
					type: Array,
					order: 'desc'
				},
				sortProxy: {
					key: 'subscriptions',
					type: Array,
					order: 'desc'
				},
				sortApp: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				myBusinessApiList: [],
				myProxyApiList: [],
				myApiSubscriptions: [],
				mySubscribers: 0,
				mySubscriptions: 0,
				appList: [],
				api: {},
				app: {},

				end: []
			};
		},
		methods: {
			/*getPage(p, d) {
				axios.all([
					axios.get(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid),
					axios.get(abyss.ajax.my_business_api_list + this.$root.rootData.user.uuid),
					axios.get(abyss.ajax.my_proxy_api_list + this.$root.rootData.user.uuid),
					// axios.get(abyss.ajax.permissions_app + this.$root.rootData.user.uuid),
				]).then(
					axios.spread((permission_my_apis, my_business_api_list, my_proxy_api_list) => {
						// this.myApiSubscriptions = permission_my_apis.data.filter( (item) => item.isdeleted == false );
						this.myApiSubscriptions = permission_my_apis.data;
						this.myBusinessApiList = my_business_api_list.data;
						this.myProxyApiList = my_proxy_api_list.data;
						var buss = [];
						this.myProxyApiList.forEach((value, key) => {
							Vue.set(value, 'subscriptions', []);
							this.getResources2(value, 'API', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description)
							.then(response => {
								var subs = this.myApiSubscriptions.filter((el) => el.resourceid == value.resource.uuid );
								if (subs) {
									value.subscriptions = subs;
									this.mySubscribers = this.myApiSubscriptions.length;
									this.preload();
									this.isLoading = false;
								}
							});
							buss.push(value.businessapiid);
						});
						console.log("buss: ", buss);
						this.myBusinessApiList.forEach((value, key) => {
							Vue.set(value, 'proxies', []);
							var papi = this.myProxyApiList.filter((el) => el.businessapiid == value.uuid );
							if (papi) {
								value.proxies = papi;
							}
						});
						this.preload();
					})
				).catch(error => {
					this.handleError(error);
				});
			},*/
			async getPage(p, d) {
				var permission_my_apis = this.getList(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid);
				var my_business_api_list = this.getList(abyss.ajax.my_business_api_list + this.$root.rootData.user.uuid);
				var my_proxy_api_list = this.getList(abyss.ajax.my_proxy_api_list + this.$root.rootData.user.uuid);
				var [myApiSubscriptions, myBusinessApiList, myProxyApiList] = await Promise.all([permission_my_apis, my_business_api_list, my_proxy_api_list]);
				this.myApiSubscriptions = myApiSubscriptions;
				this.myBusinessApiList = myBusinessApiList;
				this.myProxyApiList = myProxyApiList;
				var buss = [];
				this.myProxyApiList.forEach(async (value, key) => {
					Vue.set(value, 'subscriptions', []);
					await this.getResources(value, 'API', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description);
					var subs = this.myApiSubscriptions.filter((el) => el.resourceid == value.resource.uuid );
					if (subs) {
						value.subscriptions = subs;
						this.mySubscribers = this.myApiSubscriptions.length;
						this.preload();
						this.isLoading = false;
					}
					buss.push(value.businessapiid);
				});
				console.log("buss: ", buss);
				this.myBusinessApiList.forEach((value, key) => {
					Vue.set(value, 'proxies', []);
					var papi = this.myProxyApiList.filter((el) => el.businessapiid == value.uuid );
					if (papi) {
						value.proxies = papi;
					}
				});
				this.preload();
			},
		},
		mounted() {
			console.log("this.$root.appList: ", this.$root.appList);
		},
		created() {
			this.$emit('set-page', 'index', 'init');
			this.getPage(1);
			this.getMyApps(true);
		}
	});
});