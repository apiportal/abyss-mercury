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
					});
					return grpName.map(e => e.groupname).join(', ');
				}
			},
			getPermissionName(dir) {
				var subPrm = this.permissionOptions.filter((el) => el.subjectid == dir );
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
			async filterUser(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					// var userList = await this.getItem(abyss.ajax.subjects, filter.uuid);
					this.userList = [];
					this.userList.push(filter);
					this.userList = _.map(this.userList, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
				}
			},
			async getUserOptions(search, loading) {
				loading(true);
				this.userOptions = await this.getList(abyss.ajax.user_list + '?likename=' + search);
				loading(false);
			},
			/*filterUser(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					axios.get(abyss.ajax.subjects + '/' +filter.uuid)
					.then(response => {
						this.userList = _.map(response.data, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			/*getUserOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.user_list + '?likename=' + search)
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
			},*/
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
					this.memberDelete = _.reject(this.user.membershiplist, (v) => _.includes( itemArr.map(e => e.subjectgroupid), v.subjectgroupid));
					console.log("this.memberDelete: ", this.memberDelete);
					this.memberAdd = _.reject(itemArr, (v) => _.includes( this.user.membershiplist.map(e => e.subjectgroupid), v.subjectgroupid));
					console.log("this.memberAdd: ", this.memberAdd);
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
			selectUser(item, i) {
				this.fixProps(item);
				this.selectedUser = _.cloneDeep(item);
				this.user = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				this.fillProps(item);
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
			async deleteUser(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					if (item.membershiplist.length > 0) {
						await this.deleteUserMemberships(item);
						await this.deleteUserOnly(item, false);
					} else {
						await this.deleteUserOnly(item, true);
					}
				}
			},
			async deleteUserMemberships(item) {
				item.membershiplist.forEach(async (value, key) => {
					var del = await this.deleteItem(abyss.ajax.subject_memberships, value, false);
					console.log("del: ", del);
					if (del) {
						console.log("value: ", value);
					}
				});
			},
			async deleteUserOnly(item, conf) {
				var del = await this.deleteItem(abyss.ajax.subjects, item, conf);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
				}
			},
			/*deleteUser(item) {
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
					axios.delete(abyss.ajax.subjects + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE user response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async addDeleteUserGroups() {
				if (this.memberAdd.length > 0) {
					await this.addBulkItems(abyss.ajax.subject_memberships, this.memberAdd);
				}
				if (this.memberDelete.length > 0) {
					this.memberDelete.forEach(async (value, key) => {
						var item = this.cleanProps(value);
						Vue.delete(item, 'isactivated');
						var del = await this.deleteItem(abyss.ajax.subject_memberships, value, false);
						console.log("del: ", del);
						if (del) {
							console.log("value: ", value);
						}
					});
				}
			},
			/*addDeleteUserGroups() {
				if (this.memberAdd.length > 0) {
					axios.post(abyss.ajax.subject_memberships, this.memberAdd).then(response => {
						if (response.data[0].status != 500 ) {
							console.log("memberAdd response.data[0].response: ", response.data[0].response);
						}
					}, error => {
						this.handleError(error);
					});
				}
				if (this.memberDelete.length > 0) {
					this.memberDelete.forEach((value, key) => {
						var obj = _.cloneDeep(value);
						Vue.delete(obj, 'uuid');
						Vue.delete(obj, 'created');
						Vue.delete(obj, 'updated');
						Vue.delete(obj, 'deleted');
						Vue.delete(obj, 'isdeleted');
						Vue.delete(obj, 'isactivated');
						axios.delete(abyss.ajax.subject_memberships + '/' +value.uuid, obj).then(response => {
							console.log("DELETE License response: ", response);
						}, error => {
							this.handleError(error);
						});
					});
				}
			},*/
			async userAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act == 'add') {
						this.fixProps(this.user);
						var item = await this.addItem(abyss.ajax.subjects, this.deleteProps(this.user), this.userList);
						await this.addDeleteUserGroups();
						if (item) {
							this.$emit('set-state', 'init');
							this.user = _.cloneDeep(this.newUser);
						}
					}
					if (act == 'edit') {
						var item = await this.editItem( abyss.ajax.subjects, this.user.uuid, this.deleteProps(this.user), this.userList );
						if (item) {
							this.addDeleteUserGroups();
							this.$emit('set-state', 'init');
							this.user = _.cloneDeep(this.newUser);
							this.selected = null;
						}
					}
				}
			},
			/*userAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						if (act == 'add') {
							this.fixProps(this.user);
							var itemArr = [];
							itemArr.push(this.deleteProps(this.user));
							axios.post(abyss.ajax.subjects, itemArr).then(response => {
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
							this.updateItem(abyss.ajax.subjects + '/' + this.user.uuid, this.deleteProps(this.user), this.userList).then(response => {
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
			},*/
			async getPage(p, d) {
				var subject_directories_list = this.getList(abyss.ajax.subject_directories_list);
				var user_group_list = this.getList(abyss.ajax.user_group_list);
				var subject_memberships = this.getList(abyss.ajax.subject_memberships);
				var subject_types = this.getList(abyss.ajax.subject_types);
				var permission_list = this.getList(abyss.ajax.permission_list);
				var user_list = this.getList(abyss.ajax.user_list);
				var organizations_list = this.getList(abyss.ajax.organizations_list);

				var [directoryOptions, groupOptions, memberOptions, typeOptions, permissionOptions, userList, orgOptions] = await Promise.all([subject_directories_list, user_group_list, subject_memberships, subject_types, permission_list, user_list, organizations_list]);
				// .filter( (item) => item.isdeleted == false )
				this.directoryOptions = directoryOptions;
				this.groupOptions = groupOptions;
				this.memberOptions = memberOptions;
				this.typeOptions = typeOptions;
				this.permissionOptions = permissionOptions;

				this.userList = _.map(userList, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
				this.userList.forEach(async (value, key) => {
					var flt = await this.getList(abyss.ajax.subject_memberships_subject + value.uuid);
					if (flt) {
						var grpusr = _.filter(this.groupOptions, (v) => _.includes( flt.map(e => e.subjectgroupid), v.uuid)) ;
						Vue.set(value, 'membershiplist', flt);
						Vue.set(value, 'groups', grpusr);
						Vue.set(value, 'groupslist', grpusr.map(e => e.groupname).join(', '));
					} else {
						Vue.set(value, 'membershiplist', []);
						Vue.set(value, 'groups', []);
						Vue.set(value, 'groupslist', '');
					}
				});
				
				this.orgOptions = orgOptions;
				this.paginate = this.makePaginate(this.userList);
				this.preload();
			},
			/*getPage(p, d) {
				axios.get(abyss.ajax.user_list)
				.then(response => {
					this.userList = _.map(response.data, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
					this.userList.forEach((value, key) => {
						console.log("value.organizationid: ", value.organizationid);
						axios.get(abyss.ajax.subject_memberships_subject + value.uuid)
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
					this.paginate = this.makePaginate(this.userList);
				}, error => {
					this.handleError(error);
				});
			},*/
		},
		created() {
			this.$emit('set-page', 'users', 'init');
			this.newUser = _.cloneDeep(this.user);
			this.getPage(1);
			/*axios.all([
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
			});*/
		}
	});
});