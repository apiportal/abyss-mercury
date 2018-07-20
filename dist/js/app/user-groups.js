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
				ajaxUrl: abyss.ajax.user_group_list,
				ajaxHeaders: {},
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
			filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					// this.getPage(1, '&group='+filter.uuid);
					axios.get(this.ajaxUrl + '/' +filter.uuid, this.ajaxHeaders)
					.then(response => {
						this.groupList = response.data;
					}, error => {
						this.handleError(error);
					});
				}
			},
			filterOrg(filter) {
				if (filter == null) {
					console.log("null filter: ", filter);
					this.group.organizationid = '';
				} else {
					console.log("filter: ", filter);
					this.group.organizationid = filter.organizationid;
				}
			},
			getUserOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.user_list + '?likename=' + search, this.ajaxHeaders)
				// axios.get(abyss.ajax.user_list, {
				// 	params: {
				// 		likename: search
				// 	}
				// })
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
			},
			getGroupOptions(search, loading) {
				loading(true);
				axios.get(this.ajaxUrl + '?likename=' + search, this.ajaxHeaders)
				// axios.get(this.ajaxUrl, {
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
				}, error => {
					this.handleError(error);
					loading(false);
				});
			},
			getPermissionOptions(search, loading) {
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
			fixProps(item) {
				if (item.effectiveenddate == null) {
					Vue.set(item, 'effectiveenddate', moment().add(6, 'months').format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.effectivestartdate == null) {
					Vue.set(item, 'effectivestartdate', moment().format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.crudsubjectid == null) {
					// Vue.set(item,'crudsubjectid','e20ca770-3c44-4a2d-b55d-2ebcaa0536bc');
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
				}
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
			deleteGroup(item) {
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
						console.log("DELETE group response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},
			deleteProps() {
				var item = _.cloneDeep(this.group);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				Vue.delete(item, 'userCount');
				Vue.delete(item, 'permissions');
				Vue.delete(item, 'users');
				item.effectivestartdate = moment(this.group.effectivestartdate).toISOString();
				item.effectiveenddate = moment(this.group.effectiveenddate).toISOString();
				return item;
			},
			addDeleteGroupUsers() {
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
				}
			},
			groupAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						if (act == 'add') {
							this.fixProps(this.group);
							var itemArr = [];
							itemArr.push(this.deleteProps());
							// this.addItem(this.ajaxUrl, itemArr, this.ajaxHeaders, this.groupList).then(response => {
							axios.post(this.ajaxUrl, itemArr, this.ajaxHeaders).then(response => {
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
							this.updateItem(this.ajaxUrl + '/' + this.group.uuid, this.deleteProps(), this.ajaxHeaders, this.groupList).then(response => {
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
					// alert('Correct them errors!');
				});
			},
			getPage(p, d) {
				axios.get(this.ajaxUrl, this.ajaxHeaders)
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
					this.paginate = this.makePaginate(response.data);
					this.preload();
				}, error => {
					this.handleError(error);
				});
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
		mounted() {
			// this.preload();
		},
		created() {
			// this.log(this.$options.name);
			this.$emit('set-page', 'user-groups', 'init');
			this.newGroup = _.cloneDeep(this.group);
			axios.all([
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
			});
		}
	});
});