define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select', 'moment'], function(abyss, Vue, axios, VeeValidate, _, VueSelect, moment) {
	Vue.component('v-select', VueSelect.VueSelect);
	/*Vue.component('user-list', {
		props: ['user', 'index'],
		data() {
			return {};
		},
		methods: {
			// isSelected(i) {
			// 	this.$parent.isSelected(i);
			// },
		}
	});*/
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
				ajaxUrl: abyss.ajax.subjects,
				ajaxUserListUrl: abyss.ajax.user_list,
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
					"subjecttypeid": "21371a15-04f8-445e-a899-006ee11c0e09",
					"subjectname": null,
					"firstname": null,
					"lastname": null,
					"displayname": null,
					"url": null,
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
					"membershiplist": null,
					"groupslist": null,
					"permissions": null,
					"permissionslist": null,
					"permissionfilter": true,
					"groupfilter": true,
					"userfilter": true
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

				memberAdd: [],
				memberDelete: [],

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
				var grpName = [];
				if (subGrp) {
					subGrp.forEach((value, key) => {
						grpName.push(this.groupOptions.find((el) => el.uuid == value.subjectgroupid ));
						// console.log("grpName: ", grpName);
					});
					// console.log("subGrp: ", subGrp, grpName);
					// console.log("grpName.map(e => e.groupname).join(', '): ", grpName.map(e => e.groupname).join(', '));
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
					// this.getPage(1);
					var sss = this.userList.filter((item) => item.permissionfilter == false );
					sss.forEach((value, key) => {
						value.permissionfilter = true;
					});
				} else {
					// this.getPage(1, '&permission='+filter.uuid);
					var flt = this.permissionOptions.filter((item) => item.uuid == filter.uuid );
					var xxx = _.reject(this.userList, (item) => _.find(flt, { subjectid: item.uuid }));
					xxx.forEach((value, key) => {
						value.permissionfilter = false;
					});
				}
			},
			filterGroup(filter) {
				if (filter == null) {
					// this.getPage(1);
					// var sss = _.filter(this.userList, (item) => _.find(flt, { filtered: 'group' }));
					var sss = this.userList.filter((item) => item.groupfilter == false );
					sss.forEach((value, key) => {
						value.groupfilter = true;
					});
				} else {
					// this.getPage(1, '&group='+filter.uuid);
					var flt = this.memberOptions.filter((item) => item.subjectgroupid == filter.uuid );
					var xxx = _.reject(this.userList, (item) => _.find(flt, { subjectid: item.uuid }));
					xxx.forEach((value, key) => {
						value.groupfilter = false;
					});
				}
			},
			filterUser(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					// this.getPage(1, '&user='+filter.uuid);
					axios.get(this.ajaxUrl + '/' +filter.uuid, this.ajaxHeaders)
					.then(response => {
						this.userList = _.map(response.data, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
					}, error => {
						this.handleError(error);
					});
				}
			},
			getUserOptions(search, loading) {
				loading(true);
				axios.get(this.ajaxUserListUrl + '?likename=' + search, this.ajaxHeaders)
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
				}, error => {
					this.handleError(error);
					loading(false);
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
						this.groupOptions = response.data.filter( (item) => item.isdeleted == false );
					} else {
						this.groupOptions = [];
					}
					loading(false);
				}, error => {
					loading(false);
					this.handleError(error);
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
						this.permissionOptions = response.data.filter( (item) => item.isdeleted == false );
					} else {
						this.permissionOptions = [];
					}
					loading(false);
				}, error => {
					loading(false);
					this.handleError(error);
				});
			},
			setUserPermissions(filter) {
				console.log("filter: ", filter);
				console.log("this.user.uuid: ", this.user.uuid);
			},
			setUserGroups(filter) {
				console.log("this.user.groups: ", this.user.groups);
				console.log("this.user.membershiplist: ", this.user.membershiplist);
				if (filter && filter.length != 0) {
					var itemArr = [];
					filter.forEach((value, key) => {
						var newObj = {
							"organizationid": this.user.organizationid,
							"crudsubjectid": this.$root.rootData.user.uuid,
							"subjectid": this.user.uuid,
							"subjectgroupid": value.uuid
						};
						itemArr.push(newObj);
					});
					console.log("itemArr: ", itemArr);
					// var exists = _.filter(this.user.membershiplist, (v) => _.includes( itemArr.map(e => e.subjectgroupid), v.subjectgroupid));
					// console.log("exists: ", exists);
					this.memberDelete = _.reject(this.user.membershiplist, (v) => _.includes( itemArr.map(e => e.subjectgroupid), v.subjectgroupid));
					console.log("this.memberDelete: ", this.memberDelete);
					this.memberAdd = _.reject(itemArr, (v) => _.includes( this.user.membershiplist.map(e => e.subjectgroupid), v.subjectgroupid));
					console.log("this.memberAdd: ", this.memberAdd);
					// var existss = _.filter(itemArr, (v) => _.includes( this.user.membershiplist.map(e => e.subjectgroupid), v.subjectgroupid));
					// console.log("existss: ", existss);
					this.user.groupslist = filter.map(e => e.groupname).join(', ');
				}
			},
			regenPass(numLc, numUc, numDigits, numSpecial) {
				Vue.set(this.user, 'password',this.generatePassword(numLc, numUc, numDigits, numSpecial));
			},
			cancelUser() {
				this.memberDelete = [];
				this.memberAdd = [];
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
				if (item.url == null) {
					Vue.set(item, 'url', '');
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
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					console.log("item.membershiplist: ", item.membershiplist);
					if (item.membershiplist.length > 0) {
						item.membershiplist.forEach((value, key) => {
							console.log("value.uuid: ", value.uuid);
							axios.delete(abyss.ajax.subject_memberships + '/' + value.uuid, value).then(response => {
								console.log("DELETE subject_memberships response: ", response);
							}, error => {
								this.handleError(error);
							});
						});
					}
					axios.delete(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders).then(response => {
						item.isdeleted = true;
						console.log("DELETE user response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},
			deleteProps() {
				var item = _.cloneDeep(this.user);
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
				Vue.delete(item, 'membershiplist');
				Vue.delete(item, 'groupslist');
				Vue.delete(item, 'permissionslist');
				Vue.delete(item, 'userfilter');
				Vue.delete(item, 'groupfilter');
				Vue.delete(item, 'permissionfilter');
				item.effectivestartdate = moment(this.user.effectivestartdate).toISOString();
				item.effectiveenddate = moment(this.user.effectiveenddate).toISOString();
				return item;
			},
			addDeleteUserGroups(act) {
				if (this.memberAdd.length > 0) {
					console.log("ADD: ");
					axios.post(abyss.ajax.subject_memberships, this.memberAdd, this.ajaxHeaders).then(response => {
						console.log("response: ", response);
						if (response.data[0].status != 500 ) {
							console.log("memberAdd response.data[0].response: ", response.data[0].response);
						}
					}, error => {
						this.handleError(error);
					});
				}
				if (this.memberDelete.length > 0) {
					console.log("DELETE: ");
					this.memberDelete.forEach((value, key) => {
						var obj = _.cloneDeep(value);
						Vue.delete(obj, 'uuid');
						Vue.delete(obj, 'created');
						Vue.delete(obj, 'updated');
						Vue.delete(obj, 'deleted');
						Vue.delete(obj, 'isdeleted');
						Vue.delete(obj, 'isactivated');
						axios.delete(abyss.ajax.subject_memberships + '/' +value.uuid, obj, this.ajaxHeaders).then(response => {
							console.log("DELETE License response: ", response);
						}, error => {
							this.handleError(error);
						});
					});
					// var item = _.cloneDeep(this.user);
					// !!!!!2DO NOT DELETING array
					/*axios.delete(abyss.ajax.subject_memberships, this.memberDelete, this.ajaxHeaders).then(response => {
						console.log("DELETE License response: ", response);
					}, error => {
						this.handleError(error);
					});*/
				}
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
									this.addDeleteUserGroups();
									this.$emit('set-state', 'init');
									this.user = _.cloneDeep(this.newUser);
								}
							}, error => {
								this.handleError(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(this.ajaxUrl + '/' + this.user.uuid, this.deleteProps(), this.ajaxHeaders, this.userList).then(response => {
								console.log("editUser response: ", response);
								this.addDeleteUserGroups();
								this.$emit('set-state', 'init');
								this.user = _.cloneDeep(this.newUser);
								this.selected = null;
							}, error => {
								this.handleError(error);
							});
						}
						return;
					}
					// alert('Correct them errors!');
				});
			},
			getPage(p, d) {
				axios.get(this.ajaxUserListUrl, this.ajaxHeaders)
				.then(response => {
					this.userList = _.map(response.data, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
					this.userList.forEach((value, key) => {
						console.log("value.organizationid: ", value.organizationid);
						axios.get(abyss.ajax.subject_memberships_subject + value.uuid, this.ajaxHeaders)
						.then(response => {
							var flt = response.data;
							// console.log("flt: ", flt.map(e => e.subjectgroupid), flt);
							var grpusr = _.filter(this.groupOptions, (v) => _.includes( flt.map(e => e.subjectgroupid), v.uuid)) ;
							// console.log("grpusr: ", grpusr);
							Vue.set(value, 'membershiplist', flt);
							Vue.set(value, 'groups', grpusr);
							Vue.set(value, 'groupslist', grpusr.map(e => e.groupname).join(', '));
						}, error => {
							Vue.set(value, 'membershiplist', []);
							Vue.set(value, 'groups', []);
							Vue.set(value, 'groupslist', '');
							this.handleError(error);
						});
						// 2DO permissons
						this.preload();
					});
					// 2DO append memberOptions.uuid
					this.paginate = this.makePaginate(response.data);
				}, error => {
					this.handleError(error);
				});
			},
		},
		mounted() {
			// this.preload();
		},
		created() {
			// this.log(this.$options.name);
			this.$emit('set-page', 'users', 'init');
			this.newUser = _.cloneDeep(this.user);
			axios.all([
				axios.get(abyss.ajax.subject_directories_list),
				axios.get(abyss.ajax.user_group_list),
				axios.get(abyss.ajax.subject_memberships),
				axios.get(abyss.ajax.subject_types),
				axios.get(abyss.ajax.permission_list),
				axios.get(abyss.ajax.organizations_list),
			]).then(
				axios.spread((subject_directories_list, user_group_list, subject_memberships, subject_types, permission_list, organizations_list) => {
					this.directoryOptions = subject_directories_list.data.filter( (item) => item.isdeleted == false );
					// this.orgOptions = this.$root.rootData.user.organizations.filter( (item) => item.isdeleted == false );
					this.orgOptions = organizations_list.data.filter( (item) => item.isdeleted == false );
					this.groupOptions = user_group_list.data.filter( (item) => item.isdeleted == false );
					// this.groupOptions = user_group_list.data;
					this.memberOptions = subject_memberships.data.filter( (item) => item.isdeleted == false );
					this.typeOptions = subject_types.data.filter( (item) => item.isdeleted == false );
					this.permissionOptions = permission_list.data.filter( (item) => item.isdeleted == false );
					console.log("this.directoryOption: ", this.directoryOption);

					this.getPage(1);
				})
			).catch(error => {
				this.handleError(error);
			});
		}
	});
});