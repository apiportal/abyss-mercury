define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select', 'Highcharts', 'highcharts-vue', 'sortablejs', 'vuedraggable'], function(abyss, Vue, axios, VeeValidate, _, VueSelect, Highcharts, HighchartsVue, Sortable, vuedraggable) {
	Vue.component('draggable', vuedraggable);
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.use(HighchartsVue.default);
// ■■■■■■■■ api-list ■■■■■■■■ //
	Vue.component('api-list', {
		props: ['api', 'index', 'subs', 'business'],
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
					var bapi = this.$parent.myBusinessApiList.find((el) => el.uuid === this.api.businessapiid );
					if (bapi) {
						return bapi.openapidocument.info.title;
					}
				}
			},
			activeVisibility: {
				get() {
					var slcVisibility = this.$root.rootData.apiVisibilityList.find((el) => el.uuid === this.api.apivisibilityid );
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
	Vue.component('apis-shared-with-me', {
		template:'#apis-shared-with-me',
		props: [ 'meta', 'data', 'color' ],
		data() {
			return {
				isLoading: true,
				apisSharedWithMe: [],
				myApiSubscriptions: [],
				permissionsSharedWithMe: [],
			};
		},
		computed : {},
		methods : {
			async getApisSharedWithMe() {
				var permission_my_apis = this.getList(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid);
				var permissions_app = this.getList(abyss.ajax.permissions_app + this.$root.rootData.user.uuid);
				var apis_shared_with_me = this.getList(abyss.ajax.apis_shared_with_me + this.$root.rootData.user.uuid);
				var [myApiSubscriptions, permissionsSharedWithMe, apisSharedWithMe] = await Promise.all([permission_my_apis, permissions_app, apis_shared_with_me]);
				this.permissionsSharedWithMe = permissionsSharedWithMe.filter( (el) => !el.isdeleted );
				this.myApiSubscriptions = myApiSubscriptions.filter((el) => el.resourceactionid === abyss.defaultIds.invokeApi );
				this.apisSharedWithMe = _.uniqBy(apisSharedWithMe, 'uuid');
				for (var item of this.apisSharedWithMe) {
					Vue.set(item, 'subscriptions', []);
					await this.getResources(item, 'API', item.openapidocument.info.title + ' ' + item.openapidocument.info.version, item.openapidocument.info.description);
					var subs = this.myApiSubscriptions.filter((el) => el.resourceid === item.resource.uuid );
					if (subs) {
						item.subscriptions = subs;
					}
					var perms = this.permissionsSharedWithMe.filter((el) => el.resourceid === item.resource.uuid );

					if (perms.length) {
						perms = _.uniqBy(perms, 'resourceid');
						var sharedBy = await this.getItem(abyss.ajax.subjects, perms[0].crudsubjectid)
						Vue.set(item, 'sharedBy', sharedBy.displayname);
					} else {
						Vue.set( item, 'isShareDeleted', true );
					}
					// console.log("getApisSharedWithMe: ", perms);

					/*var permView = perms.find((el) => el.resourceactionid == abyss.defaultIds.viewApi );
					var permEdit = perms.find((el) => el.resourceactionid == abyss.defaultIds.editApi );
					var perm = permView;
					if (permEdit) {
						Vue.set(item, 'permissions', permEdit);
						perm = permEdit;
					} else {
						Vue.set(item, 'permissions', permView);
					}
					// console.log("perm: ", perm);
					if (perm) {
						var sharedBy = await this.getItem(abyss.ajax.subjects, perm.crudsubjectid)
						Vue.set(item, 'sharedBy', sharedBy.displayname);
					} else {
						Vue.set( item, 'isShareDeleted', true );
					}*/
				}
			},
		},
		async created() {
			await this.getApisSharedWithMe();
			this.isLoading = false;
			this.preload('.shared-with-bar');
			console.log("shared-with: ");
		},
	});
	Vue.component('apis-shared-by-me', {
		template:'#apis-shared-by-me',
		props: [ 'meta', 'data', 'color' ],
		data() {
			return {
				isLoading: true,
				apisSharedByMe: [],
				myApiSubscriptions: [],
				permissionsSharedByMe: [],
			};
		},
		computed : {},
		methods : {
			async getApisSharedByMe() {
				var permission_my_apis = this.getList(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid);
				var apis_shared_by_me = this.getList(abyss.ajax.apis_shared_by_me + this.$root.rootData.user.uuid);
				var [myApiSubscriptions, apisSharedByMe] = await Promise.all([permission_my_apis, apis_shared_by_me]);
				this.myApiSubscriptions = myApiSubscriptions.filter((el) => el.resourceactionid === abyss.defaultIds.invokeApi );
				this.permissionsSharedByMe = myApiSubscriptions.filter((el) => el.resourceactionid !== abyss.defaultIds.invokeApi && !el.isdeleted );

				// 2DO ABYSSP-300 "/apis/sharedby/subject" returns 2 same API's if shared read/write
				this.apisSharedByMe = _.uniqBy(apisSharedByMe, 'uuid');
				for (var item of this.apisSharedByMe) {
					Vue.set(item, 'subscriptions', []);
					await this.getResources(item, 'API', item.openapidocument.info.title + ' ' + item.openapidocument.info.version, item.openapidocument.info.description);
					var subs = this.myApiSubscriptions.filter((el) => el.resourceid === item.resource.uuid );
					if (subs) {
						item.subscriptions = subs;
					}
					var perms = this.permissionsSharedByMe.filter((el) => el.resourceid === item.resource.uuid );

					if (perms.length) {
						perms = _.uniqBy(perms, 'subjectid');
						perms.forEach(async (item, key) => {
							var sharedWith = await this.getItem(abyss.ajax.subjects, item.subjectid)
							Vue.set(item, 'sharedWith', sharedWith.displayname);
							// console.log("item.sharedWith: ", item.sharedWith);
						});
						Vue.set( item, 'sharedArr', perms );
					} else {
						Vue.set( item, 'isShareDeleted', true );
					}
					// console.log("getApisSharedByMe: ", perms);
					// var permView = perms.find((el) => el.resourceactionid == abyss.defaultIds.viewApi );
					// var permEdit = perms.find((el) => el.resourceactionid == abyss.defaultIds.editApi );
					// var perm = permView;
					// if (permEdit) {
					// 	Vue.set(item, 'permissions', permEdit);
					// 	perm = permEdit;
					// } else {
					// 	Vue.set(item, 'permissions', permView);
					// }
					// console.log("perm: ", perm);
					// if (perm) {
					// 	var sharedWith = await this.getItem(abyss.ajax.subjects, perm.subjectid)
					// 	Vue.set(item, 'sharedWith', sharedWith.displayname);
					// } else {
					// 	Vue.set( item, 'isShareDeleted', true );
					// }
				}
			},
		},
		async created() {
			await this.getApisSharedByMe();
			this.isLoading = false;
			this.preload('.shared-by-bar');
			console.log("shared-by: ");
		},
	});
	Vue.component('xxxxx', {
		template:'#xxxxx',
		props: [ 'meta', 'data', 'color' ],
		data() {
			return {
				isLoading: true,
				apisSharedWithMe: [],
				myApiSubscriptions: [],
				permissionsSharedWithMe: [],
			};
		},
		computed : {},
		methods : {
			async xxx() {
				var permission_my_apis = this.getList(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid);
				var permissions_app = this.getList(abyss.ajax.permissions_app + this.$root.rootData.user.uuid);
				var apis_shared_with_me = this.getList(abyss.ajax.apis_shared_with_me + this.$root.rootData.user.uuid);
				var [myApiSubscriptions, permissionsSharedWithMe, apisSharedWithMe] = await Promise.all([permission_my_apis, permissions_app, apis_shared_with_me]);
				this.permissionsSharedWithMe = permissionsSharedWithMe.filter( (el) => !el.isdeleted );
				this.myApiSubscriptions = myApiSubscriptions.filter((el) => el.resourceactionid === abyss.defaultIds.invokeApi );
				this.apisSharedWithMe = _.uniqBy(apisSharedWithMe, 'uuid');
				for (var item of this.yyy) {
					
				}
			},
		},
		async created() {
			await this.xxx();
			this.isLoading = false;
			this.preload('.uuu');
		},
	});
	Vue.component('my-proxy-apis', {
		template:'#my-proxy-apis',
		props: [ 'meta', 'data', 'color' ],
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'uuid',
					type: String,
					order: 'asc'
				},
				sortProxy: {
					key: 'subscriptions',
					type: Array,
					order: 'desc'
				},
				myProxyApiList: [],
				myBusinessApiList: [],
				myApiSubscriptions: [],
				mySubscribersCount: 0,
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
			};
		},
		computed : {},
		methods : {
			async getProxyApis() {
				var permission_my_apis = this.getList(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid);
				var my_proxy_api_list = this.getList(abyss.ajax.my_proxy_api_list + this.$root.rootData.user.uuid);
				var my_business_api_list = this.getList(abyss.ajax.my_business_api_list + this.$root.rootData.user.uuid);

				var [myApiSubscriptions, myProxyApiList, myBusinessApiList] = await Promise.all([permission_my_apis, my_proxy_api_list, my_business_api_list]);

				this.myApiSubscriptions = myApiSubscriptions.filter((el) => el.resourceactionid === abyss.defaultIds.invokeApi );
				this.myBusinessApiList = myBusinessApiList;
				this.myProxyApiList = myProxyApiList;
				this.mySubscribersCount = this.myApiSubscriptions.length;
				for (var item of this.myProxyApiList) {
					Vue.set(item, 'subscriptions', []);
					await this.getResources(item, 'API', item.openapidocument.info.title + ' ' + item.openapidocument.info.version, item.openapidocument.info.description);
					var subs = this.myApiSubscriptions.filter((el) => el.resourceid === item.resource.uuid );
					// if (subs) {
						item.subscriptions = subs;
						item.subscriptionsCount = subs.length;
					// }
				}
				for (var item of this.myApiSubscriptions) {
					var subject_Name = await this.getItem(abyss.ajax.subjects, item.subjectid);
					var subject_Owner = await this.getItem(abyss.ajax.subjects, item.crudsubjectid);
					var [subjectName, subjectOwner] = await Promise.all([subject_Name, subject_Owner]);
					Vue.set(item, 'subjectName', subjectName.displayname);
					Vue.set(item, 'subjectOwner', subjectOwner.displayname);
				}
			},
		},
		async created() {
			await this.getProxyApis();
			var mySubscribers = this.myProxyApiList.filter((el) => el.subscriptionsCount !== 0 );
			this.mySubscribersChart.series[0].data = _.map(mySubscribers, v => ({"y":v.subscriptionsCount, "id":v.uuid, "name":v.openapidocument.info.title}));
			this.isLoading = false;
			this.preload('.my-proxy-bar');
			console.log("my-proxy-apis: ");
		},
	});
	Vue.component('my-business-apis', {
		template:'#my-business-apis',
		props: [ 'meta', 'data', 'color' ],
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'uuid',
					type: String,
					order: 'asc'
				},
				sortApi: {
					key: 'proxies',
					type: Array,
					order: 'desc'
				},
				myProxyApiList: [],
				myBusinessApiList: [],
				mySubscriptions: 0,
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
			};
		},
		computed : {},
		methods : {
			async getBusinessApis() {
				var my_proxy_api_list = this.getList(abyss.ajax.my_proxy_api_list + this.$root.rootData.user.uuid);
				var my_business_api_list = this.getList(abyss.ajax.my_business_api_list + this.$root.rootData.user.uuid);

				var [myProxyApiList, myBusinessApiList] = await Promise.all([my_proxy_api_list, my_business_api_list]);

				this.myBusinessApiList = myBusinessApiList;
				this.myProxyApiList = myProxyApiList;
				for (var item of this.myBusinessApiList) {
					Vue.set(item, 'proxies', []);
					var papi = this.myProxyApiList.filter((el) => el.businessapiid === item.uuid );
					if (papi) {
						item.proxies = papi;
					}
				}
			},
		},
		async created() {
			await this.getBusinessApis();
			var myBusinessApis = this.myBusinessApiList.filter((el) => el.proxies.length !== 0 );
			this.myBusinessApisChart.series[0].data = _.map(myBusinessApis, v => ({"y":v.proxies.length, "id":v.uuid, "name":v.openapidocument.info.title}));
			this.isLoading = false;
			this.preload('.my-business-bar');
			console.log("my-business-apis: ");
		},
	});
	Vue.component('my-apps-subscriptions', {
		template:'#my-apps-subscriptions',
		props: [ 'meta', 'data', 'color' ],
		data() {
			return {
				isLoading: true,
				sortApp: {
					key: 'subscriptions',
					type: Array,
					order: 'desc'
				},
				mySubscriptions: 0,
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
			};
		},
		computed : {},
		methods : {
			async xxx() {
				for (var item of this.yyy) {
					
				}
			},
		},
		async created() {
			await this.getMyApps(true);
			var mySubscriptions = this.$root.appList.filter((el) => el.subscriptionsCount !== 0 );
			this.mySubscriptionsChart.series[0].data = _.map(mySubscriptions, v => ({"y":v.subscriptionsCount, "id":v.uuid, "name":v.firstname}));
			this.isLoading = false;
			this.preload('.my-apps-bar');
			console.log("my-apps-subscriptions: ");
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
				sortApp: {
					key: 'subscriptions',
					type: Array,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				appList: [],
				api: {},
				app: {},

				widgets: [
					{
						id: '1',
						title: '111',
						order: '1',
						class: 'fol-sm-12 fol-xl-8 fol-xll-9 p-3 card-item',
						comp: 'my-proxy-apis',
					},
					{
						id: '2',
						title: '222',
						order: '2',
						class: 'fol-sm-6 fol-xl-4 fol-xll-3 p-3 card-item',
						comp: 'apis-shared-with-me',
					},
					{
						id: '3',
						title: '333',
						order: '3',
						class: 'fol-sm-6 fol-xl-4 fol-xll-3 p-3 card-item',
						comp: 'apis-shared-by-me',
					},
					{
						id: '4',
						title: '444',
						order: '4',
						class: 'fol-sm-12 fol-xl-8 fol-xll-9 p-3 card-item',
						comp: 'my-apps-subscriptions',
					},
					{
						id: '5',
						title: '555',
						order: '5',
						class: 'fol-sm-12 fol-xl-8 fol-xll-9 p-3 card-item',
						comp: 'my-business-apis',
					},
				],
				widgetOptions: {
					handle: '.handle',
					draggable: '.card-item',
					animation: 150,
				},
				end: []
			};
		},
		methods: {
			clone(evt) {},
			updateOrder(evt) {
				console.log("evt: ", evt);
				// console.log(evt.oldIndex, evt.newIndex, evt);
				// this.$refs.orderedQuestions.value.forEach((item, index) => {
				// 	Vue.set( item, 'neworder', index + 1 );
				// });
				this.widgets.forEach((item, index) => {
					Vue.set( item, 'neworder', index + 1 );
					if (item.order != item.neworder) {
						this.saveWidgets(item);
					}
				});
			},
			saveWidgets(item) {
				console.log("saveWidgets: ", item);
				item.order = item.neworder;
				// var item = await this.editItem( abyss.ajax.preferences, this.widgets.uuid, this.deleteProps(this.widgets) );
			},
			async getPage(p, d) {
				
			},
		},
		async created() {
			this.$emit('set-page', 'index', 'init');
			// await this.getPage(1);
			this.isLoading = false;
			this.preload();
		},
	});
});