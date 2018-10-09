define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, moment, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
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
		}
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
				selected: null,
				resetKey: false,
				preventCancel: false,
				showSecretAndKey: false,
				api: {},
				app: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"isactivated": false,
					"subjecttypeid": abyss.defaultIds.subjectTypeApp,
					"subjectname": null,
					"firstname": null,
					"lastname": null,
					"displayname": null,
					"email": this.$root.rootData.user.email,
					"secondaryemail": null,
					"effectivestartdate": moment.utc().format('YYYY-MM-DD HH:mm:ss'),
					"effectiveenddate": moment.utc().add(6, 'years').format('YYYY-MM-DD HH:mm:ss'),
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
					"description": null,
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
		methods: {
			regenPass(numLc, numUc, numDigits, numSpecial) {
				Vue.set(this.app, 'password',this.generatePassword(numLc, numUc, numDigits, numSpecial));
			},
			regenKey() {
				Vue.set(this.app, 'uuid',this.uuidv4());
			},
			resetCtrl(i) {
				Vue.set(this, 'resetKey', true);
			},
			async getDirectoryOptions() {
				var directoryOptions = await this.getList(abyss.ajax.subject_directories_list);
				this.directoryOptions = directoryOptions.filter( (item) => !item.isdeleted );
				this.orgOptions = this.$root.rootData.user.organizations.filter( (item) => !item.isdeleted );
			},
			filterApp() {
				// 2DO
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
			selectApp(item, i) {
				this.preventCancel = false;
				this.fixProps(item);
				this.selectedApp = _.cloneDeep(item);
				this.app = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				this.fillProps(item);
				if (item.effectiveenddate == null) {
					Vue.set(item, 'effectiveenddate', moment.utc().add(6, 'months').format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.effectivestartdate == null) {
					Vue.set(item, 'effectivestartdate', moment.utc().format('YYYY-MM-DD HH:mm:ss'));
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
				if (item.url == null) {
					Vue.set(item, 'url', '');
				}
				if (item.description == null) {
					Vue.set(item, 'description', '');
				}
				if (item.subjectname == null) {
					Vue.set(item,'subjectname', item.firstname);
				}
				if (item.displayname == null) {
					Vue.set(item,'displayname', item.firstname);
				}
				if (item.lastname == null) {
					Vue.set(item,'lastname', item.firstname);
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				// Vue.delete(item, 'password');
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
				item.effectivestartdate = moment.utc(this.app.effectivestartdate).toISOString();
				item.effectiveenddate = moment.utc(this.app.effectiveenddate).toISOString();
				return item;
			},
			async deleteApp(item) {
				var deleteConfirm = await this.deleteConfirm();
				if (deleteConfirm) {
					item.contracts.forEach(async (con, k) => {
						var del = await this.deleteItem(abyss.ajax.resources, con.resource, false);
						if (del) {
							await this.deleteItem(abyss.ajax.contracts, con, false);
						}
					});
					item.subscriptions.forEach(async (sub, k) => {
						var del = await this.deleteItem(abyss.ajax.resource_access_tokens, sub.accessToken, false);
						if (del) {
							await this.deleteItem(abyss.ajax.permission_list, sub, false);
						}
					});
					var delTok = await this.deleteItem(abyss.ajax.resource_access_tokens, item.permission.accessToken, false);
					if (delTok) {
						var delPer = await this.deleteItem(abyss.ajax.permission_list, item.permission, false);
					}
					if (delPer) {
						var delRes = await this.deleteItem(abyss.ajax.resources, item.resource, false);
					}
					if (delRes) {
						var delUsr = await this.deleteItem(abyss.ajax.subject_app_list, item.appUser, false);
					}
					if (delUsr) {
						var delApp = await this.deleteItem(abyss.ajax.subjects, item, false);
					}
					if (delApp) {
						this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
					}
				}
			},
			beforeAppAction(c) {
				/*if ( (this.app.password && this.app.uuid && !this.resetKey && this.$root.rootState != 'add') ) {
					this.$toast('error', {title: 'Please copy APP Key and APP Secret!', message: '...', position: 'topRight'});
					return false;
				} else if (this.preventCancel) {
					console.log("this.preventCancel: ", this.preventCancel);
					if (!this.app.password || this.app.password == 'temppassword') {
						this.$toast('error', {title: 'Please generate APP Secret!', message: '...', position: 'topRight'});
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
			async appAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act === 'add') {
						if (this.beforeAppAction()) {
							this.fixProps(this.app);
							var item = await this.addItem(abyss.ajax.subjects, this.deleteProps(this.app));
							this.app = item;
							await this.createResource(item, 'APP', item.firstname, item.description);
							var itemObj = {
								organizationid: this.$root.abyssOrgId,
								crudsubjectid: this.$root.rootData.user.uuid,
								subjectid: this.$root.rootData.user.uuid,
								appid: item.uuid,
							};
							var uApp = await this.addItem(abyss.ajax.subject_app_list, itemObj);
							if (uApp) {
								await this.setAppPermAndToken(this.app);
							}
							// this.$root.appList.push(item);
							// this.app = _.cloneDeep(this.newApp);
							this.getMyApps();
							this.$emit('set-state', 'init');
							//// !! DISABLE KEY CONTROL
							// this.$emit('set-state', 'edit');
							// this.preventCancel = true;
						}
					}
					if (act === 'edit') {
						if (this.beforeAppAction() && !this.preventCancel) {
							Vue.set(this.app,'subjectname', this.app.firstname);
							Vue.set(this.app,'displayname', this.app.firstname);
							Vue.set(this.app,'lastname', this.app.firstname);
							var item = await this.editItem( abyss.ajax.subjects, this.app.uuid, this.deleteProps(this.app), this.$root.appList );
							await this.getResources(item, 'APP', item.firstname, item.description);
							await this.updateResource(item, 'APP', item.firstname, item.description);
							this.$emit('set-state', 'init');
							this.app = _.cloneDeep(this.newApp);
							this.selected = null;
						}
					}
				}
			},
		},
		mounted() {
			var vm = this;
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
		async created() {
			this.$emit('set-page', 'my-apps', 'init');
			this.newApp = _.cloneDeep(this.app);
			await this.getMyApps();
			this.preload();
			this.getDirectoryOptions();
		}
	});
});