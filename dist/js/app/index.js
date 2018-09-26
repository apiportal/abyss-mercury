define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select', 'Highcharts', 'highcharts-vue'], function(abyss, Vue, axios, VeeValidate, _, VueSelect, Highcharts, HighchartsVue) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.use(HighchartsVue.default);
// ■■■■■■■■ api-list ■■■■■■■■ //
	Vue.component('api-list', {
		props: ['api', 'index', 'subs'],
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
					key: 'subscriptions',
					type: Array,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				myBusinessApiList: [],
				myProxyApiList: [],
				myApiSubscriptions: [],
				apisSharedWithMe: [],
				apisSharedByMe: [],
				permissionsSharedWithMe: [],
				permissionsSharedByMe: [],
				mySubscribersCount: 0,
				// mySubscribers: [],
				mySubscriptions: 0,
				appList: [],
				api: {},
				app: {},

				mySubscribersChart: {
					chart: {
						// type: 'spline'
						// type: 'column'
						type: 'pie'
					},
					title: {
						text: 'My APIs'
					},
					series: [
						{
							"name": "My Subscribers",
							"colorByPoint": true,
							"data": [],
						}
					]
				},
				mySubscriptionsChart: {
					chart: {
						// type: 'column'
						type: 'pie'
					},
					title: {
						text: 'My APPS'
					},
					series: [
						{
							"name": "My Subscriptions",
							"colorByPoint": true,
							"data": [],
						}
					]
				},
				myBusinessApisChart: {
					chart: {
						type: 'pie'
					},
					title: {
						text: 'My Proxy APİs'
					},
					series: [
						{
							"name": "My Business APIs",
							"colorByPoint": true,
							"data": [],
						}
					]
				},

				end: []
			};
		},
		methods: {
			async getPage(p, d) {
				var permission_my_apis = this.getList(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid);
				var my_business_api_list = this.getList(abyss.ajax.my_business_api_list + this.$root.rootData.user.uuid);
				var my_proxy_api_list = this.getList(abyss.ajax.my_proxy_api_list + this.$root.rootData.user.uuid);
				var my_api_permissions = this.getList(abyss.ajax.permissions_app + this.$root.rootData.user.uuid);
				var [myApiSubscriptions, myBusinessApiList, myProxyApiList, permissionsSharedWithMe] = await Promise.all([permission_my_apis, my_business_api_list, my_proxy_api_list, my_api_permissions]);
				// this.myApiSubscriptions = myApiSubscriptions;
				this.myApiSubscriptions = myApiSubscriptions.filter((el) => el.resourceactionid == abyss.defaultIds.invokeApi );
				this.myBusinessApiList = myBusinessApiList;
				this.myProxyApiList = myProxyApiList;

				this.permissionsSharedWithMe = permissionsSharedWithMe.filter( (el) => el.isdeleted != true );
				this.permissionsSharedByMe = myApiSubscriptions.filter((el) => el.resourceactionid != abyss.defaultIds.invokeApi && el.isdeleted != true );
				// this.permissionsSharedWithMe = permissionsSharedWithMe;
				// this.permissionsSharedByMe = myApiSubscriptions.filter((el) => el.resourceactionid != abyss.defaultIds.invokeApi );

				this.myApiSubscriptions.forEach(async (value, key) => {
					var subject_Name = await this.getItem(abyss.ajax.subjects, value.subjectid);
					var subject_Owner = await this.getItem(abyss.ajax.subjects, value.crudsubjectid);
					var [subjectName, subjectOwner] = await Promise.all([subject_Name, subject_Owner]);
					Vue.set(value, 'subjectName', subjectName.displayname);
					Vue.set(value, 'subjectOwner', subjectOwner.displayname);
				});
				this.mySubscribersCount = this.myApiSubscriptions.length;
				this.myProxyApiList.forEach(async (value, key) => {
					Vue.set(value, 'subscriptions', []);
					await this.getResources(value, 'API', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description);
					var subs = this.myApiSubscriptions.filter((el) => el.resourceid == value.resource.uuid );
					// if (subs) {
						value.subscriptions = subs;
						value.subscriptionsCount = subs.length;
					// }
				});
				this.myBusinessApiList.forEach((value, key) => {
					Vue.set(value, 'proxies', []);
					var papi = this.myProxyApiList.filter((el) => el.businessapiid == value.uuid );
					if (papi) {
						value.proxies = papi;
					}
				});
			},
			async getApisSharedByMe() {
				var apisSharedByMe = await this.getList(abyss.ajax.apis_shared_by_me + this.$root.rootData.user.uuid);
				// 2DO ABYSSP-300 "/apis/sharedby/subject" returns 2 same API's if shared read/write
				this.apisSharedByMe = _.uniqBy(apisSharedByMe, 'uuid');
				this.apisSharedByMe.forEach(async (value, key) => {
					Vue.set(value, 'subscriptions', []);
					await this.getResources(value, 'API', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description);
					var subs = this.myApiSubscriptions.filter((el) => el.resourceid == value.resource.uuid );
					if (subs) {
						value.subscriptions = subs;
					}
					var perms = this.permissionsSharedByMe.filter((el) => el.resourceid == value.resource.uuid );

					if (perms.length) {
						perms = _.uniqBy(perms, 'subjectid');
						perms.forEach(async (value, key) => {
							var sharedWith = await this.getItem(abyss.ajax.subjects, value.subjectid)
							Vue.set(value, 'sharedWith', sharedWith.displayname);
							// console.log("value.sharedWith: ", value.sharedWith);
						});
						Vue.set( value, 'sharedArr', perms );
					} else {
						Vue.set( value, 'isShareDeleted', true );
					}
					console.log("getApisSharedByMe: ", perms);
					/*var permView = perms.find((el) => el.resourceactionid == abyss.defaultIds.viewApi );
					var permEdit = perms.find((el) => el.resourceactionid == abyss.defaultIds.editApi );
					var perm = permView;
					if (permEdit) {
						Vue.set(value, 'permissions', permEdit);
						perm = permEdit;
					} else {
						Vue.set(value, 'permissions', permView);
					}
					console.log("perm: ", perm);
					if (perm) {
						var sharedWith = await this.getItem(abyss.ajax.subjects, perm.subjectid)
						Vue.set(value, 'sharedWith', sharedWith.displayname);
					} else {
						Vue.set( value, 'isShareDeleted', true );
					}*/
				});
			},
			async getApisSharedWithMe() {
				var apisSharedWithMe = await this.getList(abyss.ajax.apis_shared_with_me + this.$root.rootData.user.uuid);
				this.apisSharedWithMe = _.uniqBy(apisSharedWithMe, 'uuid');
				this.apisSharedWithMe.forEach(async (value, key) => {
					Vue.set(value, 'subscriptions', []);
					await this.getResources(value, 'API', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description);
					var subs = this.myApiSubscriptions.filter((el) => el.resourceid == value.resource.uuid );
					if (subs) {
						value.subscriptions = subs;
					}
					var perms = this.permissionsSharedWithMe.filter((el) => el.resourceid == value.resource.uuid );

					if (perms.length) {
						perms = _.uniqBy(perms, 'resourceid');
						var sharedBy = await this.getItem(abyss.ajax.subjects, perms[0].crudsubjectid)
						Vue.set(value, 'sharedBy', sharedBy.displayname);
					} else {
						Vue.set( value, 'isShareDeleted', true );
					}
					console.log("getApisSharedWithMe: ", perms);

					/*var permView = perms.find((el) => el.resourceactionid == abyss.defaultIds.viewApi );
					var permEdit = perms.find((el) => el.resourceactionid == abyss.defaultIds.editApi );
					var perm = permView;
					if (permEdit) {
						Vue.set(value, 'permissions', permEdit);
						perm = permEdit;
					} else {
						Vue.set(value, 'permissions', permView);
					}
					// console.log("perm: ", perm);
					if (perm) {
						var sharedBy = await this.getItem(abyss.ajax.subjects, perm.crudsubjectid)
						Vue.set(value, 'sharedBy', sharedBy.displayname);
					} else {
						Vue.set( value, 'isShareDeleted', true );
					}*/
				});
			},
		},
		mounted() {
			// console.log("this.$root.appList: ", this.$root.appList);
		},
		async created() {
			this.$emit('set-page', 'index', 'init');
			await this.getPage(1);
			await this.getMyApps(true);
			await this.getApisSharedByMe();
			await this.getApisSharedWithMe();
			// await this.qqq(true);
			this.isLoading = false;
			this.preload();
			setTimeout(() => {
				var mySubscribers = this.myProxyApiList.filter((el) => el.subscriptionsCount != 0 );
				this.mySubscribersChart.series[0].data = _.map(mySubscribers, v => ({"y":v.subscriptionsCount, "id":v.uuid, "name":v.openapidocument.info.title}));
				var mySubscriptions = this.$root.appList.filter((el) => el.subscriptionsCount != 0 );
				this.mySubscriptionsChart.series[0].data = _.map(mySubscriptions, v => ({"y":v.subscriptionsCount, "id":v.uuid, "name":v.firstname}));
				var myBusinessApis = this.myBusinessApiList.filter((el) => el.proxies.length != 0 );
				this.myBusinessApisChart.series[0].data = _.map(myBusinessApis, v => ({"y":v.proxies.length, "id":v.uuid, "name":v.openapidocument.info.title}));
			},1000);
	},
	});
});