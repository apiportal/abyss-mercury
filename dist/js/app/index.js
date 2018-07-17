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
					var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == this.api.apivisibilityid );
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
		computed: {},
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
				ajaxUrl: abyss.ajax.index,
				ajaxHeaders: {},
				dashboardList: [],
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
			// Develop "View my API subscription summary list" api (US061)
			// Develop "View my APIs' subscribers summary list" user interface (US062)
			// Develop "View my API subscription summary list" user interface (US061)
			getPage(p, d) {
				axios.all([
					axios.get(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid, this.ajaxHeaders),
					axios.get(abyss.ajax.my_business_api_list + this.$root.rootData.user.uuid, this.ajaxHeaders),
					axios.get(abyss.ajax.my_proxy_api_list + this.$root.rootData.user.uuid, this.ajaxHeaders),
					// axios.get(abyss.ajax.permissions_app + this.$root.rootData.user.uuid, this.ajaxHeaders),
				]).then(
					axios.spread((permission_my_apis, my_business_api_list, my_proxy_api_list) => {
						// this.myApiSubscriptions = permission_my_apis.data.filter( (item) => item.isdeleted == false );
						this.myApiSubscriptions = permission_my_apis.data;
						this.myBusinessApiList = my_business_api_list.data;
						this.myProxyApiList = my_proxy_api_list.data;
						var buss = [];
						this.myProxyApiList.forEach((value, key) => {
							Vue.set(value, 'subscriptions', []);
							// this.getResources(value, 'API', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description);
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
							/*setTimeout(() => {
								var subs = this.myApiSubscriptions.filter((el) => el.resourceid == value.resource.uuid );
								if (subs) {
									value.subscriptions = subs;
									this.mySubscribers = this.myApiSubscriptions.length;
									this.preload();
									this.isLoading = false;
								}
							},100);*/
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
			},
			////////////////
		},
		mounted() {
			// this.preload();
			console.log("this.$root.appList: ", this.$root.appList);
			/*setTimeout(() => {
				this.$root.appList.forEach((value, key) => {
					// console.log("value: ", value);
					console.log("value.contracts.length: ", value.contracts.length);
					this.mySubscriptions += value.contracts.length;
				});
				this.getPage(1);
			},100);*/
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'index', 'init');
			this.getMyApps(true);
			this.getPage(1);
		}
	});
});