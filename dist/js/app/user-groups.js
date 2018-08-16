define(['config', 'Vue', 'axios', 'vee-validate', 'vue-select', 'moment', 'VueBootstrapDatetimePicker', 'eonasdan-bootstrap-datetimepicker'], function(abyss, Vue, axios, VeeValidate, VueSelect, moment, VueBootstrapDatetimePicker) {
	Vue.component('date-picker', VueBootstrapDatetimePicker.default);
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('user-groups', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'groupname',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				selected: null,
				resetPassword: false,
				group: {
					"uuid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"isenabled": true,
					"groupname": null,
					"description": null,
					"effectivestartdate": moment().format('YYYY-MM-DD HH:mm:ss'),
					"effectiveenddate": moment().add(6, 'months').format('YYYY-MM-DD HH:mm:ss'),
					"organizationid": null,
					"crudsubjectid": null,
					"subjectdirectoryid": null,

					"userCount": 0,
					"permissions": [],
					"userList": [],
					"users": []
				},
				selectedGroup: {},
				newGroup: {},
				groupList: [],

				userOptions: [],
				groupOptions: [],
				permissionOptions: [],
				orgOptions: [],
				directoryOptions: [],
				memberOptions: [],

				memberAdd: [],
				memberDelete: [],

				date: null,
				dateConfig: {
					format: 'YYYY-MM-DD HH:mm:ss',
					useCurrent: false,
					showClear: true,
					showClose: true,
				},
				end: []
			};
		},
		methods: {
			/*filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					// this.getPage(1, '&group='+filter.uuid);
					axios.get(abyss.ajax.user_group_list + '/' +filter.uuid)
					.then(response => {
						this.groupList = response.data;
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					// this.groupList = await this.getItem(abyss.ajax.user_group_list, filter.uuid);
					this.groupList = [];
					this.groupList.push(filter);
				}
			},
			async getGroupOptions(search, loading) {
				loading(true);
				this.groupOptions = await this.getList(abyss.ajax.user_group_list + '?likename=' + search);
				loading(false);
			},
			async getUserOptions(search, loading) {
				loading(true);
				var userOptions = await this.getList(abyss.ajax.user_list + '?likename=' + search);
				this.userOptions = userOptions.filter( (item) => item.isdeleted == false );
				loading(false);
			},
			async getPermissionOptions(search, loading) {
				loading(true);
				var permissionOptions = await this.getList(abyss.ajax.user_list + '?likename=' + search);
				this.permissionOptions = permissionOptions.filter( (item) => item.isdeleted == false );
				loading(false);
			},
			/*getGroupOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.user_group_list + '?likename=' + search)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.groupOptions = response.data;
					} else {
						this.groupOptions = [];
					}
					loading(false);
				}, error => {
					this.handleError(error);
					loading(false);
				});
			},*/
			/*getUserOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.user_list + '?likename=' + search)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.userOptions = response.data.filter( (item) => item.isdeleted == false );
					} else {
						this.userOptions = [];
					}
					loading(false);
				}, error => {
					loading(false);
					this.handleError(error);
				});
			},*/
			/*getPermissionOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.permission_list + '?likename=' + search)
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
			},*/
			setGroupUsers(filter) {
				console.log("this.group.users: ", this.group.users);
				if (filter && filter.length != 0) {
					var itemArr = [];
					filter.forEach((value, key) => {
						console.log("value: ", value);
						var newObj = {
							"organizationid": value.organizationid,
							"crudsubjectid": this.$root.rootData.user.uuid,
							"subjectid": value.uuid,
							"subjectgroupid": this.group.uuid
						};
						itemArr.push(newObj);
					});
					console.log("itemArr: ", itemArr);
					console.log("this.group.membershiplist: ", this.group.membershiplist);
					this.memberDelete = _.reject(this.group.membershiplist, (v) => _.includes( itemArr.map(e => e.subjectid), v.subjectid));
					console.log("this.memberDelete: ", this.memberDelete);
					this.memberAdd = _.reject(itemArr, (v) => _.includes( this.group.membershiplist.map(e => e.subjectid), v.subjectid));
					console.log("this.memberAdd: ", this.memberAdd);
				}
			},
			cancelGroup() {
				this.memberDelete = [];
				this.memberAdd = [];
				var index = this.groupList.indexOf(this.group);
				this.groupList[index] = this.selectedGroup;
				this.group = _.cloneDeep(this.newGroup);
				this.selectedGroup = _.cloneDeep(this.newGroup);
				this.selected = null;
			},
			selectGroup(item, i) {
				this.fixProps(item);
				this.selectedGroup = _.cloneDeep(item);
				this.group = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				if (item.effectiveenddate == null) {
					Vue.set(item, 'effectiveenddate', moment().add(6, 'months').format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.effectivestartdate == null) {
					Vue.set(item, 'effectivestartdate', moment().format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'userCount');
				Vue.delete(item, 'permissions');
				Vue.delete(item, 'users');
				item.effectivestartdate = moment(this.group.effectivestartdate).toISOString();
				item.effectiveenddate = moment(this.group.effectiveenddate).toISOString();
				return item;
			},
			async deleteGroup(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					if (item.membershiplist.length > 0) {
						await this.deleteGroupMemberships(item);
						await this.deleteGroupOnly(item, false);
					} else {
						await this.deleteGroupOnly(item, true);
					}
				}
			},
			async deleteGroupMemberships(item) {
				item.membershiplist.forEach(async (value, key) => {
					var del = await this.deleteItem(abyss.ajax.subject_memberships, value, false);
					console.log("del: ", del);
					if (del) {
						console.log("value: ", value);
					}
				});
			},
			async deleteGroupOnly(item, conf) {
				var del = await this.deleteItem(abyss.ajax.user_group_list, item, conf);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
				}
			},
			/*deleteGroup(item) {
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
					axios.delete(abyss.ajax.user_group_list + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE group response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async addDeleteGroupUsers() {
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
			/*addDeleteGroupUsers() {
				if (this.memberAdd.length > 0) {
					console.log("ADD: ");
					axios.post(abyss.ajax.subject_memberships, this.memberAdd).then(response => {
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
						axios.delete(abyss.ajax.subject_memberships + '/' +value.uuid, obj).then(response => {
							console.log("DELETE License response: ", response);
						}, error => {
							this.handleError(error);
						});
					});
				}
			},*/
			async groupAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act == 'add') {
						this.fixProps(this.group);
						var item = await this.addItem(abyss.ajax.user_group_list, this.deleteProps(this.group), this.groupList);
						if (item) {
							await this.addDeleteGroupUsers();
							this.$emit('set-state', 'init');
							this.group = _.cloneDeep(this.newGroup);
						}
					}
					if (act == 'edit') {
						var item = await this.editItem( abyss.ajax.user_group_list, this.group.uuid, this.deleteProps(this.group), this.groupList );
						if (item) {
							await this.addDeleteGroupUsers();
							this.$emit('set-state', 'init');
							this.group = _.cloneDeep(this.newGroup);
							this.selected = null;
						}
					}
				}
			},
			/*groupAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
							this.fixProps(this.group);
							var itemArr = [];
							itemArr.push(this.deleteProps(this.group));
							axios.post(abyss.ajax.user_group_list, itemArr).then(response => {
								console.log("addGroup response: ", response);
								if (response.data[0].status != 500 ) {
									this.groupList.push(response.data[0].response);
									this.addDeleteGroupUsers();
									this.$emit('set-state', 'init');
									this.group = _.cloneDeep(this.newGroup);
								}
							}, error => {
								this.handleError(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(abyss.ajax.user_group_list + '/' + this.group.uuid, this.deleteProps(this.group), this.groupList).then(response => {
								console.log("editGroup response: ", response);
								this.addDeleteGroupUsers();
								// console.log("this.group: ", JSON.stringify(this.group, null, '\t') );
								this.$emit('set-state', 'init');
								this.group = _.cloneDeep(this.newGroup);
								this.selected = null;
							});
						}
						return;
					}
				});
			},*/
			/*getPage(p, d) {
				axios.get(abyss.ajax.user_group_list)
				.then(response => {
					// this.groupList = response.data;
					this.groupList = _.map(response.data, o => _.extend({users: []}, o));
					this.groupList.forEach((value, key) => {
						// var flt = this.memberOptions.filter((item) => item.subjectgroupid == value.uuid );
						var flt = this.memberOptions.filter((item) => item.subjectgroupid == value.uuid && item.isdeleted == false );
						// console.log("flt: ", flt);
						var grpusr = _.filter(this.userList, (item) => _.find(flt, { subjectid: item.uuid, isdeleted: false }));
						// console.log("grpusr: ", grpusr);
						Vue.set(value, 'membershiplist', flt);
						Vue.set(value, 'users', grpusr);
						Vue.set(value, 'userCount', grpusr.length);
						// value.users = grpusr;
					});
					// 2DO append memberOptions.uuid
					this.paginate = this.makePaginate(this.groupList);
					this.preload();
				}, error => {
					this.handleError(error);
				});
			},*/
			async getPage(p, d) {
				var subject_directories_list = this.getList(abyss.ajax.subject_directories_list);
				var user_list = this.getList(abyss.ajax.user_list);
				var subject_memberships = this.getList(abyss.ajax.subject_memberships);
				var user_group_list = this.getList(abyss.ajax.user_group_list);
				var organizations_list = this.getList(abyss.ajax.organizations_list);

				var [directoryOptions, userList, memberOptions, groupList, orgOptions] = await Promise.all([subject_directories_list, user_list, subject_memberships, user_group_list, organizations_list]);

				this.directoryOptions = directoryOptions.filter( (item) => item.isdeleted == false );
				this.userList = userList.filter( (item) => item.isdeleted == false );
				this.memberOptions = memberOptions.filter( (item) => item.isdeleted == false );

				this.groupList = _.map(groupList, o => _.extend({users: []}, o));
				this.groupList.forEach((value, key) => {
					var flt = this.memberOptions.filter((item) => item.subjectgroupid == value.uuid && item.isdeleted == false );
					var grpusr = _.filter(this.userList, (item) => _.find(flt, { subjectid: item.uuid, isdeleted: false }));
					Vue.set(value, 'membershiplist', flt);
					Vue.set(value, 'users', grpusr);
					Vue.set(value, 'userCount', grpusr.length);
				});

				this.orgOptions = orgOptions.filter( (item) => item.isdeleted == false );
				this.paginate = this.makePaginate(this.groupList);
				this.preload();
			},
		},
		computed: {
			commaJoin() {
				return this.groupList.map( (item) => {
				// return this.groupList.map(function(item) {
					console.log("item: ", item);
					if (item.permissions.length) {
						return item.permissions.map(e => e.name).join(', ');
					}
				});
			},
		},
		created() {
			this.$emit('set-page', 'user-groups', 'init');
			this.newGroup = _.cloneDeep(this.group);
			this.getPage(1);
			/*axios.all([
				axios.get(abyss.ajax.subject_directories_list),
				axios.get(abyss.ajax.user_list),
				axios.get(abyss.ajax.subject_memberships),
				axios.get(abyss.ajax.organizations_list),
			]).then(
				axios.spread((subject_directories_list, user_list, subject_memberships, organizations_list) => {
					this.directoryOptions = subject_directories_list.data.filter( (item) => item.isdeleted == false );
					// this.orgOptions = this.$root.rootData.user.organizations.filter( (item) => item.isdeleted == false );
					this.orgOptions = organizations_list.data.filter( (item) => item.isdeleted == false );
					this.userList = user_list.data.filter( (item) => item.isdeleted == false );
					this.memberOptions = subject_memberships.data.filter( (item) => item.isdeleted == false );

					this.getPage(1);
				})
			).catch(error => {
				this.handleError(error);
			});*/
		}
	});
});