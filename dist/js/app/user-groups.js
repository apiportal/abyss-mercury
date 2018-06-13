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
				date: null,
					config: {
					format: 'YYYY-MM-DD HH:mm:ss',
					useCurrent: false,
					showClear: true,
					showClose: true,
				},
				end: []
			}
		},
		methods: {
			filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&group='+filter.uuid);
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
					this.groupList = response.data;
					// console.log("this.groupList: ", JSON.stringify(this.userList, null, '\t') );
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
			cancelGroup() {
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
				axios.delete(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders).then(response => {
					item.isdeleted = true;
					console.log("deleteUser response: ", response);
				}, error => {
					console.error(error);
				});
			},
			deleteGroup222(item) {
				this.removeItem(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders, this.groupList).then(response => {
					console.log("deleteGroup response: ", response);
				});
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
									this.$emit('set-state', 'init');
									this.group = _.cloneDeep(this.newGroup);
								}
							}, error => {
								console.error(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(this.ajaxUrl + '/' + this.group.uuid, this.deleteProps(), this.ajaxHeaders, this.groupList).then(response => {
								console.log("editGroup response: ", response);
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
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'user-groups', 'init');
			this.newGroup = _.cloneDeep(this.group);
			this.getPage(1);
			this.getDirectoryOptions();
			this.getOrgOptions();
		}
	});
});