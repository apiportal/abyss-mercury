define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select', 'moment'], function(abyss, Vue, axios, VeeValidate, _, VueSelect, moment) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('users', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'firstname',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.user_list,
				ajaxHeaders: {},
				selected: null,
				resetPassword: false,
				user: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"isactivated": false,
					"subjecttypeid": null,
					"subjectname": null,
					"firstname": null,
					"lastname": null,
					"displayname": null,
					"email": null,
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
					"groups": null,
					"permissions": null
				},
				selectedUser: {},
				newUser: {},
				userList: [],

				userOptions: [],
				groupOptions: [],
				permissionOptions: [],
				orgOptions: [],
				directoryOptions: [],
				typeOptions: [],
				memberOptions: [],

				end: []
			};
		},
		methods: {
			getDirName(dir) {
				var subDir = this.directoryOptions.find((el) => el.uuid == dir );
				if (subDir) {
					return subDir.directoryname;
				}
			},
			getGroupName(dir) {
				var subGrp = this.memberOptions.filter((el) => el.subjectid == dir );
				// console.log("subGrp: ", subGrp);
				var grpName = [];
				if (subGrp) {
					subGrp.forEach((value, key) => {
						grpName.push(this.groupOptions.find((el) => el.uuid == value.subjectgroupid ));
						// console.log("grpName: ", grpName);
					});
					return grpName.map(e => e.groupname).join(', ');
				}
			},
			getPermissionName(dir) {
				var subPrm = this.permissionOptions.filter((el) => el.subjectid == dir );
				// console.log("subPrm: ", subPrm);
				if (subPrm) {
					return subPrm.map(e => e.permission).join(', ');
				}
			},
			filterPermission(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&permission='+filter.uuid);
				}
			},
			filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&group='+filter.uuid);
				}
			},
			filterUser(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&user='+filter.uuid);
				}
			},
			getUserOptions(search, loading) {
				loading(true);
				axios.get(this.ajaxUrl + '?likename=' + search, this.ajaxHeaders)
				// axios.get(this.ajaxUrl, {
				// 	params: {
				// 		likename: search
				// 	}
				// })
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.userOptions = response.data;
					} else {
						this.userOptions = [];
					}
					loading(false);
				});
			},
			getOrgOptions() {
				axios.get(abyss.ajax.organizations_list, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.orgOptions = response.data;
					} else {
						this.orgOptions = [];
					}
				});
			},
			getDirectoryOptions() {
				axios.get(abyss.ajax.subject_directories_list, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.directoryOptions = response.data;
					} else {
						this.directoryOptions = [];
					}
				});
			},
			getTypeOptions() {
				axios.get(abyss.ajax.subject_types, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.typeOptions = response.data;
					} else {
						this.typeOptions = [];
					}
				});
			},
			getMemberOptions() {
				axios.get(abyss.ajax.subject_memberships, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.memberOptions = response.data;
					} else {
						this.memberOptions = [];
					}
				});
			},
			getGroupOptions() {
				axios.get(abyss.ajax.user_group_list, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.groupOptions = response.data;
					} else {
						this.groupOptions = [];
					}
				});
			},
			getPermissionOptions() {
				axios.get(abyss.ajax.permission_list, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.permissionOptions = response.data;
					} else {
						this.permissionOptions = [];
					}
				});
			},
			getGroupOptions222(search, loading) {
				loading(true);
				axios.get(abyss.ajax.user_group_list + '?likename=' + search, this.ajaxHeaders)
				// axios.get(abyss.ajax.user_group_list, {
				// 	params: {
				// 		byname: search
				// 	}
				// })
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.groupOptions = response.data;
					} else {
						this.groupOptions = [];
					}
					loading(false);
				});
			},
			getPermissionOptions222(search, loading) {
				loading(true);
				axios.get(abyss.ajax.permission_list + '?likename=' + search, this.ajaxHeaders)
				// axios.get(abyss.ajax.permission_list, {
				// 	params: {
				// 		likename: search
				// 	}
				// })
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.permissionOptions = response.data;
					} else {
						this.permissionOptions = [];
					}
					loading(false);
				});
			},
			getPage(p, d) {
				var param = d || '';
				console.log("this.ajaxUrl: ", this.ajaxUrl);
				axios.get(this.ajaxUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					this.userList = response.data;
					// console.log("this.userList: ", JSON.stringify(this.userList, null, '\t') );
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
			cancelUser() {
				var index = this.userList.indexOf(this.user);
				this.userList[index] = this.selectedUser;
				this.user = _.cloneDeep(this.newUser);
				this.selectedUser = _.cloneDeep(this.newUser);
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
					Vue.set(item,'crudsubjectid','e20ca770-3c44-4a2d-b55d-2ebcaa0536bc');
				}
			},
			selectUser(item, i) {
				this.fixProps(item);
				this.selectedUser = _.cloneDeep(item);
				this.user = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			deleteUser(item) {
				this.removeItem(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders, this.userList).then(response => {
					console.log("deleteUser response: ", response);
				});
			},
			deleteProps() {
				var item = _.cloneDeep(this.user);
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
				item.effectivestartdate = moment(this.user.effectivestartdate).toISOString();
				item.effectiveenddate = moment(this.user.effectiveenddate).toISOString();
				return item;
			},
			userAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						if (act == 'add') {
							this.fixProps(this.user);
							var itemArr = [];
							itemArr.push(this.deleteProps());
							// this.addItem(this.ajaxUrl, itemArr, this.ajaxHeaders, this.userList).then(response => {
							axios.post(this.ajaxUrl, itemArr, this.ajaxHeaders).then(response => {
								console.log("addUser response: ", response);
								if (response.data[0].status != 500 ) {
									this.userList.push(response.data[0].response);
									this.$emit('set-state', 'init');
									this.user = _.cloneDeep(this.newUser);
								}
							}, error => {
								console.error(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(this.ajaxUrl + '/' + this.user.uuid, this.deleteProps(), this.ajaxHeaders, this.userList).then(response => {
								console.log("editUser response: ", response);
								this.$emit('set-state', 'init');
								this.user = _.cloneDeep(this.newUser);
								this.selected = null;
							}, error => {
								console.error(error);
							});
						}
						return;
					}
					// alert('Correct them errors!');
				});
			},
		},
		watch: {
			// newUser: {
			// 	handler(val, oldVal) {
			// 		console.log('Item Changed', oldVal.permissions, '----', val.permissions.length)
			// 	},
			// 	deep: true
			// }
		},
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'users', 'init');
			this.newUser = _.cloneDeep(this.user);
			this.getPage(1);
			this.getGroupOptions();
			this.getPermissionOptions();
			this.getOrgOptions();
			this.getDirectoryOptions();
			this.getTypeOptions();
			this.getMemberOptions();
		}
	});
});