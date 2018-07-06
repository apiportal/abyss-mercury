define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment'], function(abyss, Vue, axios, VeeValidate, _, moment) {
	Vue.component('api-list', {
		props: ['api', 'index'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {
		},
		methods : {
		}
	});
	Vue.component('my-apps', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				isReady: false,
				sort: {
					key: 'firstname',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxAppListUrl: abyss.ajax.app_list,
				ajaxUrl: abyss.ajax.subject_app_list,
				ajaxPutUrl: abyss.ajax.subjects,
				ajaxUserAppListUrl: abyss.ajax.subject_app_subject_list + this.$cookie.get('abyss.principal.uuid'),
				ajaxHeaders: {},
				selected: null,
				resetPassword: true,
				api: {},
				app: {
					"uuid": null,
					"organizationid": this.$root.rootData.user.organizationid,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"isactivated": false,
					"subjecttypeid": "ca80dd37-7484-46d3-b4a1-a8af93b2d3c6",
					"subjectname": null,
					"firstname": null,
					"lastname": null,
					"displayname": null,
					"email": this.$root.rootData.user.email,
					"secondaryemail": null,
					"effectivestartdate": moment().format('YYYY-MM-DD HH:mm:ss'),
					"effectiveenddate": moment().add(6, 'months').format('YYYY-MM-DD HH:mm:ss'),
					"password": null,
					"picture": null,
					"totallogincount": null,
					"failedlogincount": null,
					"invalidpasswordattemptcount": null,
					"ispasswordchangerequired": true,
					"passwordexpiresat": null,
					"lastloginat": "",
					"lastpasswordchangeat": "",
					"lastauthenticatedat": "",
					"lastfailedloginat": "",
					"subjectdirectoryid": null,
					"islocked": false,
					"issandbox": false,
					"url": null,
					"isrestrictedtoprocessing": false,
				},
				selectedApp: {},
				newApp: {},
				appList: [],

				directoryOptions: [],
				orgOptions: [],

				permissionList: [],
				appOptions: [],
				end: []
			};
		},
		computed: {
			xxx : {
				get() {
					return this.app.name;
				},
			},
		},
		methods: {
			regenPass(numLc, numUc, numDigits, numSpecial) {
				Vue.set(this.app, 'password',this.generatePassword(numLc, numUc, numDigits, numSpecial));
			},
			regenKey() {
				Vue.set(this.app, 'uuid',this.uuidv4());
			},
			cancelApp() {
				var index = this.appList.indexOf(this.app);
				this.appList[index] = this.selectedApp;
				this.app = _.cloneDeep(this.newApp);
				this.selectedApp = _.cloneDeep(this.newApp);
				this.selected = null;
			},
			fixProps(item) {
				if (item.effectiveenddate == null) {
					Vue.set(item, 'effectiveenddate', moment().add(6, 'months').format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.effectivestartdate == null) {
					Vue.set(item, 'effectivestartdate', moment().format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.secondaryemail == null) {
					Vue.set(item, 'secondaryemail', item.email);
				}
				if (item.picture == null) {
					Vue.set(item, 'picture', '');
				}
				if (item.islocked == null) {
					Vue.set(item, 'islocked', false);
				}
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid', this.$root.rootData.user.uuid);
				}
				if (item.subjectname == null) {
					Vue.set(item,'subjectname', item.firstname);
				}
				if (item.displayname == null) {
					Vue.set(item,'displayname', item.lastname);
				}
			},
			selectApp(item, i) {
				this.fixProps(item);
				this.selectedApp = _.cloneDeep(item);
				this.app = item;
				this.selected = i;
				this.app.subscriptions.forEach((sub, k) => {
					axios.get(abyss.ajax.api_list + sub.resource.resourcerefid, this.ajaxHeaders)
					.then(response => {
						Vue.set(sub, 'api', response.data[0] );
					}, error => {
						this.handleError(error);
					});
				});
			},
			isSelected(i) {
				return i === this.selected;
			},
			deleteApp(item) {
				//2DO
				axios.delete(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders).then(response => {
					item.isdeleted = true;
					console.log("deleteUser response: ", response);
				}, error => {
					this.handleError(error);
				});
			},
			deleteProps() {
				var item = _.cloneDeep(this.app);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				Vue.delete(item, 'isactivated');
				Vue.delete(item, 'totallogincount');
				Vue.delete(item, 'failedlogincount');
				Vue.delete(item, 'invalidpasswordattemptcount');
				Vue.delete(item, 'ispasswordchangerequired');
				Vue.delete(item, 'passwordexpiresat');
				Vue.delete(item, 'lastloginat');
				Vue.delete(item, 'lastpasswordchangeat');
				Vue.delete(item, 'lastauthenticatedat');
				Vue.delete(item, 'lastfailedloginat');
				Vue.delete(item, 'appObj');
				Vue.delete(item, 'subscriptions');
				item.effectivestartdate = moment(this.app.effectivestartdate).toISOString();
				item.effectiveenddate = moment(this.app.effectiveenddate).toISOString();
				return item;
			},
			/*fixRel(act) {
				var itemObj = {
					organizationid: this.$root.rootData.user.organizationid,
					crudsubjectid: this.$root.rootData.user.uuid,
					subjectid: this.$root.rootData.user.uuid,
					appid: '4cd010b5-9ef1-4a09-a5d5-f1be56de2d09',
				};
				var itemArr = [];
				itemArr.push(itemObj);
				axios.post(this.ajaxUrl, itemArr, this.ajaxHeaders).then(response => {
					console.log("addUserApp response: ", response);
					if (response.data[0].status != 500 ) {
						// this.appList.push(response.data[0].response);
						// this.$emit('set-state', 'init');
						// this.app = _.cloneDeep(this.newApp);
					}
				}, error => {
					this.handleError(error);
				});
			},*/
			appAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
							this.fixProps(this.app);
							var iAppArr = [];
							iAppArr.push(this.deleteProps());
							// axios.post(this.ajaxAppListUrl, iAppArr, this.ajaxHeaders).then(response => {
							axios.post(this.ajaxPutUrl, iAppArr, this.ajaxHeaders).then(response => {
								console.log("addApp response: ", response);
								if (response.data[0].status != 500 ) {
									var res = response.data[0].response;
									this.appList.push(res);
									var itemObj = {
										organizationid: this.$root.rootData.user.organizationid,
										crudsubjectid: this.$root.rootData.user.uuid,
										subjectid: this.$root.rootData.user.uuid,
										apiid: res.uuid,
									};
									var itemArr = [];
									itemArr.push(itemObj);
									axios.post(this.ajaxUrl, itemArr, this.ajaxHeaders).then(response => {
										console.log("addUserApp response: ", response);
										if (response.data[0].status != 500 ) {
											// this.appList.push(response.data[0].response);
											// this.$emit('set-state', 'init');
											// this.app = _.cloneDeep(this.newApp);
										}
									}, error => {
										this.handleError(error);
									});
								}
							}, error => {
								this.handleError(error);
							});
						}
						if (act == 'edit') {
							Vue.set(this.app,'subjectname', this.app.firstname);
							Vue.set(this.app,'displayname', this.app.lastname);
							// https://dev2.apiportal.com/abyss/oapi/subjects/apps/ NOT WORKING
							this.updateItem(this.ajaxPutUrl + '/' + this.app.uuid, this.deleteProps(), this.ajaxHeaders, this.appList).then(response => {
								console.log("editApp response: ", response);
								this.$emit('set-state', 'init');
								this.app = _.cloneDeep(this.newApp);
								this.selected = null;
							}, error => {
								this.handleError(error);
							});
						}
						return;
					}
				});
			},
			getPage(p, d) {
				var param = d || '';
				axios.all([
					axios.get(this.ajaxUserAppListUrl ),
					axios.get(this.ajaxAppListUrl + '?page=' + p + param, this.ajaxHeaders),
				]).then(
					axios.spread((user_app_list, app_list) => {
						var myAppList = user_app_list.data.filter( (item) => item.isdeleted == false );
						var appList = app_list.data.filter( (item) => item.isdeleted == false );
						this.appList = _.filter(appList, (v) => _.includes( myAppList.map(e => e.appid), v.uuid)) ;
						this.appList.forEach((value, key) => {
							var flt = _.find(myAppList, { 'appid': value.uuid });
							Vue.set(value, 'appObj', flt );
							axios.get(abyss.ajax.permission_list_api_subscriptions_subject + value.uuid, this.ajaxHeaders)
							.then(response => {
								Vue.set(value, 'subscriptions', response.data );
								value.subscriptions.forEach((sub, k) => {
									axios.get(abyss.ajax.resources + sub.resourceid, this.ajaxHeaders)
									.then(response => {
										Vue.set(sub, 'resource', response.data[0] );
										this.preload();
									}, error => {
										this.handleError(error);
									});
								});
							}, error => {
								this.handleError(error);
							});
						});
					})
				).catch(error => {
					this.handleError(error);
				});
			},
		},
		mounted() {
			// this.preload();
			new ClipboardJS('.js-copy', {
				text: function(trigger) {
					// return trigger.getAttribute('aria-label');
					var targets = $(trigger).data('clipboard-targets');
					targets = targets.split(',');
					console.log("targets: ", targets);
					var copyString = 'APP Key: ' + $(targets[0]).val() + '\nAPP Secret: ' + $(targets[1]).val();
					// var copyString = 'APP Secret: ';
					// var qtd = targets.length;
					// for (var i = 0; i < qtd; i++) {
					// 	copyString += ' APP Key: ' + $(targets[i]).val();
					// }
					// console.log("copyString: ", copyString);
					return copyString;
				}
			});
		},
		created() {
			// this.log(this.$options.name);
			this.$emit('set-page', 'my-apps', 'init');
			this.newApp = _.cloneDeep(this.app);
			axios.all([
				axios.get(abyss.ajax.subject_directories_list),
				axios.get(abyss.ajax.organizations_list),
			]).then(
				axios.spread((subject_directories_list, organizations_list) => {
					this.directoryOptions = subject_directories_list.data.filter( (item) => item.isdeleted == false );
					this.orgOptions = organizations_list.data.filter( (item) => item.isdeleted == false );
					this.getPage(1);
				})
			).catch(error => {
				this.handleError(error);
			});
		}
	});
});