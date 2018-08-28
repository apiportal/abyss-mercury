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
					key: 'firstname',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				selected: null,
				resetPassword: false,
				groupOld: {
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
				group: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"isactivated": false,
					"subjecttypeid": "c5ef2da7-b55e-4dec-8be3-96bf30255781",
					"subjectname": null,
					"firstname": null,
					"lastname": null,
					"displayname": null,
					"url": null,
					"email": null,
					"secondaryemail": null,
					"effectivestartdate": moment().format('YYYY-MM-DD HH:mm:ss'),
					"effectiveenddate": moment().add(50, 'years').format('YYYY-MM-DD HH:mm:ss'),
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
					"isrestrictedtoprocessing": false,
					"description": null,

					"users": [],
					"membershiplist": [],
					"userList": [],
					"permissions": [],
					"permissionslist": [],
					"permissionfilter": true,
					"groupfilter": true,
					"userfilter": true,
					"userCount": 0,
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
			/*async getPermissionOptions(search, loading) {
				loading(true);
				var permissionOptions = await this.getList(abyss.ajax.permission_list + '?likename=' + search);
				this.permissionOptions = permissionOptions.filter( (item) => item.isdeleted == false );
				loading(false);
			},*/
			filterUser(filter) {
				if (filter == null) {
					// this.getPage(1);
					// var sss = _.filter(this.groupList, (item) => _.find(flt, { filtered: 'group' }));
					var sss = this.groupList.filter((item) => item.userfilter == false );
					console.log("sss: ", sss);
					sss.forEach((value, key) => {
						value.userfilter = true;
					});
				} else {
					// this.getPage(1, '&group='+filter.uuid);
					var flt = this.memberOptions.filter((item) => item.subjectid == filter.uuid );
					console.log("flt: ", flt);
					var xxx = _.reject(this.groupList, (item) => _.find(flt, { subjectgroupid: item.uuid }));
					console.log("xxx: ", xxx);
					xxx.forEach((value, key) => {
						value.userfilter = false;
					});
				}
			},
			async getUserOptions(search, loading) {
				loading(true);
				var userOptions = await this.getList(abyss.ajax.user_list + '?likename=' + search);
				this.userOptions = userOptions.filter( (item) => item.isdeleted == false );
				loading(false);
			},
			getDirName(dir) {
				var subDir = this.directoryOptions.find((el) => el.uuid == dir );
				if (subDir) {
					return subDir.directoryname;
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
					var sss = this.groupList.filter((item) => item.permissionfilter == false );
					sss.forEach((value, key) => {
						value.permissionfilter = true;
					});
				} else {
					// this.getPage(1, '&permission='+filter.uuid);
					var flt = this.permissionOptions.filter((item) => item.uuid == filter.uuid );
					var xxx = _.reject(this.groupList, (item) => _.find(flt, { subjectid: item.uuid }));
					xxx.forEach((value, key) => {
						value.permissionfilter = false;
					});
				}
			},
			async filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					// this.groupList = await this.getItem(abyss.ajax.subjects, filter.uuid);
					this.groupList = [];
					this.groupList.push(filter);
					this.groupList = _.map(this.groupList, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
				}
			},
			async getGroupOptions(search, loading) {
				loading(true);
				this.groupOptions = await this.getList(abyss.ajax.user_group_list + '?likename=' + search);
				loading(false);
			},
			// 2DO
			setGroupPermissions(filter) {
				console.log("filter: ", filter);
				console.log("this.group.uuid: ", this.group.uuid);
			},
			setGroupUsers(filter) {
				console.log("this.group.users: ", this.group.users);
				console.log("this.group.membershiplist: ", this.group.membershiplist);
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
				this.fillProps(item);
				if (item.effectiveenddate == null) {
					Vue.set(item, 'effectiveenddate', moment().add(50, 'years').format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.effectivestartdate == null) {
					Vue.set(item, 'effectivestartdate', moment().format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.email == null) {
					Vue.set(item, 'email', item.displayname + '@verapi.com');
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

				Vue.delete(item, 'users');
				Vue.delete(item, 'membershiplist');
				Vue.delete(item, 'userList');
				Vue.delete(item, 'permissions');
				Vue.delete(item, 'permissionslist');
				Vue.delete(item, 'permissionfilter');
				Vue.delete(item, 'groupfilter');
				Vue.delete(item, 'userfilter');
				Vue.delete(item, 'userCount');
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
				var del = await this.deleteItem(abyss.ajax.subjects, item, conf);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
				}
			},
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
			async groupAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act == 'add') {
						this.fixProps(this.group);
						var item = await this.addItem(abyss.ajax.subjects, this.deleteProps(this.group), this.groupList);
						if (item) {
							await this.addDeleteGroupUsers();
							this.$emit('set-state', 'init');
							this.group = _.cloneDeep(this.newGroup);
						}
					}
					if (act == 'edit') {
						Vue.set(this.group,'subjectname', this.group.firstname);
						Vue.set(this.group,'displayname', this.group.firstname);
						Vue.set(this.group,'lastname', this.group.firstname);
						var item = await this.editItem( abyss.ajax.subjects, this.group.uuid, this.deleteProps(this.group), this.groupList );
						if (item) {
							await this.addDeleteGroupUsers();
							this.$emit('set-state', 'init');
							this.group = _.cloneDeep(this.newGroup);
							this.selected = null;
						}
					}
				}
			},
			async getPage(p, d) {
				var subject_directories_list = this.getList(abyss.ajax.subject_directories_list);
				var user_list = this.getList(abyss.ajax.user_list);
				var subject_memberships = this.getList(abyss.ajax.subject_memberships);
				var permission_list = this.getList(abyss.ajax.permission_list);
				var user_group_list = this.getList(abyss.ajax.user_group_list);
				var organizations_list = this.getList(abyss.ajax.organizations_list);

				var [directoryOptions, userList, memberOptions, permissionOptions, groupList, orgOptions] = await Promise.all([subject_directories_list, user_list, subject_memberships, permission_list, user_group_list, organizations_list]);

				this.directoryOptions = directoryOptions.filter( (item) => item.isdeleted == false );
				this.userList = userList.filter( (item) => item.isdeleted == false );
				this.memberOptions = memberOptions.filter( (item) => item.isdeleted == false );
				this.permissionOptions = permissionOptions;

				// this.groupList = _.map(groupList, o => _.extend({users: []}, o));
				this.groupList = _.map(groupList, o => _.extend({permissionfilter: true, groupfilter: true, userfilter: true}, o));
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
		}
	});
});