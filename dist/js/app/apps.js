define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment'], function(abyss, Vue, axios, VeeValidate, _, moment) {
	Vue.component('api-list', {
		props: ['api', 'index'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {},
		methods : {},
		created() {
			this.apiOwner(this.api);
		}
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
				ajaxHeaders: {},
				selected: null,
				resetKey: false,
				preventCancel: false,
				showSecretAndKey: false,
				api: {},
				app: {
					"uuid": null,
					"organizationid": null,
					// "organizationid": this.$root.abyssOrgId,
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
					"password": 'temppassword',
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
				if (!this.preventCancel) {
					this.preventCancel = false;
					this.$emit('set-state', 'init'); 
					var index = this.$root.appList.indexOf(this.app);
					this.$root.appList[index] = this.selectedApp;
					this.app = _.cloneDeep(this.newApp);
					this.selectedApp = _.cloneDeep(this.newApp);
					this.selected = null;
				}
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
				if (item.url == null) {
					Vue.set(item, 'url', '');
				}
				if (item.displayname == null) {
					Vue.set(item,'displayname', item.lastname);
				}
			},
			selectApp(item, i) {
				this.preventCancel = false;
				this.fixProps(item);
				this.selectedApp = _.cloneDeep(item);
				this.app = item;
				this.selected = i;
				////////////////////////////////
				// this.fixApp();
				////////////////////////////////
			},
			fixApp(i) {
				axios.get(abyss.ajax.permission_list, this.ajaxHeaders)
				.then(response => {
					var res = response.data;
					var ddd = _.find(res, { 'resourceid': this.app.resource.uuid });
					console.log("ddd: ", ddd);
					if (!ddd) {
						this.setAppSubsAndToken();
					}
					// this.createAccessTokens(this.app, 'APP', ddd);
				}, error => {
					this.handleError(error);
				});
			},
			isSelected(i) {
				return i === this.selected;
			},
			deleteApp(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					// 2ASK NOT DELETING in apps deleting in users this.deleteProps()
					axios.delete(abyss.ajax.subjects + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE app response: ", response);
						this.deleteResource(item);
						axios.delete(abyss.ajax.subject_app_list + '/' + item.appUser.uuid, item.appUser).then(response => {
							item.appUser.isdeleted = true;
							console.log("DELETE userApp response: ", response);
						}, error => {
							this.handleError(error);
						});
					}, error => {
						this.handleError(error);
					});
				}
			},
			deleteProps() {
				var item = _.cloneDeep(this.app);
				// Vue.delete(item, 'password');
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
				Vue.delete(item, 'appUser');
				Vue.delete(item, 'subscriptions');
				Vue.delete(item, 'resource');
				Vue.delete(item, 'permission');
				Vue.delete(item, 'accessToken');
				item.effectivestartdate = moment(this.app.effectivestartdate).toISOString();
				item.effectiveenddate = moment(this.app.effectiveenddate).toISOString();
				return item;
			},
			/*fixRel(act) {
				var itemObj = {
					organizationid: this.$root.abyssOrgId,
					crudsubjectid: this.$root.rootData.user.uuid,
					subjectid: this.$root.rootData.user.uuid,
					appid: '4cd010b5-9ef1-4a09-a5d5-f1be56de2d09',
				};
				var itemArr = [];
				itemArr.push(itemObj);
				axios.post(abyss.ajax.subject_app_list, itemArr).then(response => {
					console.log("addUserApp response: ", response);
					if (response.data[0].status != 500 ) {
						// this.$root.appList.push(response.data[0].response);
						// this.$emit('set-state', 'init');
						// this.app = _.cloneDeep(this.newApp);
					}
				}, error => {
					this.handleError(error);
				});
			},*/
			beforeAppAction(c) {
				/*if ( (this.app.password && this.app.uuid && !this.resetKey && this.$root.rootState != 'add') ) {
					alert('Please copy APP Key and APP Secret!');
					return false;
				} else if (this.preventCancel) {
					console.log("this.preventCancel: ", this.preventCancel);
					if (!this.app.password || this.app.password == 'temppassword') {
						alert('Please generate APP Secret!');
						return false;
					} else {
						if (this.resetKey) {
							this.preventCancel = false;
							return true;
						}
					}
				} else {
					console.log("HEYOOO: ");
					return true;
				}*/
				return true;
			},
			appAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
							if (this.beforeAppAction()) {
								this.fixProps(this.app);
								var iAppArr = [];
								iAppArr.push(this.deleteProps());
								// DUP !!!
								// this.$emit('set-state', 'edit');
								// this.preventCancel = true;
								axios.post(abyss.ajax.subjects, iAppArr).then(response => {
									console.log("addApp response: ", response);
									var item = response.data[0].response;
									this.$root.appList.push(item);
									this.app = item;
									this.createResource(item, 'APP', item.firstname, item.lastname);
									var itemObj = {
										organizationid: this.$root.abyssOrgId,
										crudsubjectid: this.$root.rootData.user.uuid,
										subjectid: this.$root.rootData.user.uuid,
										appid: item.uuid,
									};
									var itemArr = [];
									itemArr.push(itemObj);
									axios.post(abyss.ajax.subject_app_list, itemArr).then(response => {
										console.log("addUserApp response: ", response);
										var uApp = response.data[0].response;
										///////////////////////////
										this.setAppSubsAndToken();
										setTimeout(() => {
											// this.$root.appList.push(response.data[0].response);
											// this.app = _.cloneDeep(this.newApp);
											// Vue.set(this.app, 'subscriptions', []);
											this.getMyApps();
											this.$emit('set-state', 'init');
											//// !! DISABLE KEY CONTROL
											// Vue.set(this.app, 'appUser', uApp);
											// this.$emit('set-state', 'edit');
											// this.preventCancel = true;
										},100);
									}, error => {
										this.handleError(error);
									});

								}, error => {
									this.handleError(error);
								});
							}
						}
						if (act == 'edit') {
							if (this.beforeAppAction() && !this.preventCancel) {
								Vue.set(this.app,'subjectname', this.app.firstname);
								Vue.set(this.app,'displayname', this.app.lastname);
								console.log("EDITTTTTTTTTTTTTTT: ", this.app);
								this.updateItem(abyss.ajax.subjects + '/' + this.app.uuid, this.deleteProps(), this.$root.appList).then(response => {
									console.log("editApp response: ", response);
									var item = response.data[0];
									this.getResources(item, 'APP', item.firstname, item.lastname);
									setTimeout(() => {
										this.updateResource(item, 'APP', item.firstname, item.lastname);
									},100);
									this.$emit('set-state', 'init');
									this.app = _.cloneDeep(this.newApp);
									this.selected = null;
								}, error => {
									this.handleError(error);
								});
							}
						}
						return;
					}
				});
			},
			setAppSubsAndToken() {
				var subscription = {
					organizationid: this.$root.abyssOrgId,
					crudsubjectid: this.$root.rootData.user.uuid,
					permission: 'Subscription of my own ' + this.app.firstname + ' APP',
					description: 'Subscription of my own ' + this.app.firstname + ' APP',
					effectivestartdate: moment().toISOString(),
					effectiveenddate: moment().add(1, 'years').toISOString(),
					subjectid: this.app.uuid,
					resourceid: this.app.resource.uuid,
					resourceactionid: 'e085cb50-8a98-4511-bc8a-00edabbae8a9', // OWN_APP
					accessmanagerid: '6223ebbe-b30f-4976-bcf9-364003142379',
					isactive: true,
				};
				var subsArr = [];
				subsArr.push(subscription);
				console.log("subsArr: ", subsArr);
				axios.post(abyss.ajax.permission_list, subsArr).then(response => {
					console.log("POST app to app subscription response: ", response);
					var subs = response.data[0].response;
					Vue.set(this.app, 'permission', subs);
					this.createAccessTokens(this.app, 'APP', subs);
				}, error => {
					this.handleError(error);
				});
			},
			resetCtrl(i) {
				Vue.set(this, 'resetKey', true);
			},
		},
		/*watch: {
			isLoading: {
				handler(val, oldVal) {
					console.log("val: ", val);
				},
				// deep: true
			},
		},*/
		mounted() {
			vm = this;
			new ClipboardJS('.js-copy', {
				text: function(trigger) {
					var targets = $(trigger).data('clipboard-targets');
					targets = targets.split(',');
					var copyString = 'APP Key: ' + $(targets[0]).val() + '\nAPP Secret: ' + $(targets[1]).val();
					return copyString;
				}
			}).on('success', function(e) {
				console.info('Action:', e.action);
				console.info('Text:', e.text);
				console.info('Trigger:', e.trigger);
				vm.resetCtrl();
			});
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'my-apps', 'init');
			this.newApp = _.cloneDeep(this.app);
			this.getMyApps();
			// this.getPage();
			axios.all([
				axios.get(abyss.ajax.subject_directories_list),
			]).then(
				axios.spread((subject_directories_list) => {
					this.directoryOptions = subject_directories_list.data.filter( (item) => item.isdeleted == false );
					this.orgOptions = this.$root.rootData.user.organizations.filter( (item) => item.isdeleted == false );
				})
			).catch(error => {
				this.handleError(error);
			});
		}
	});
});