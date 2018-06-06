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
				userOld: {
					// "id": null,
					// "uuid": null,
					// "organization_id": null,
					"created": null,
					// "updated": null,
					// "deleted": null,
					// "is_deleted": null,
					// "crud_subject_id": null,
					"is_activated": null,
					// "subject_type_id": null,
					"subject_name": null,
					"first_name": null,
					"last_name": null,
					"display_name": null,
					"email": null,
					// "secondary_email": null,
					// "effective_start_date": null,
					// "effective_end_date": null,
					"password": null,
					// "password_salt": null,
					// "picture": null,
					// "total_login_count": null,
					// "failed_login_count": null,
					// "invalid_password_attempt_count": null,
					// "is_password_change_required": null,
					// "password_expires_at": null,
					// "last_login_at": null,
					// "last_password_change_at": null,
					// "last_authenticated_at": null,
					// "last_failed_login_at": null,
					"groups": [],
					"permissions": [],
					"directory": "Internal Directory",
					"notify": true
				},
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
					"effectivestartdate": null,
					"effectiveenddate": null,
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
					"groups": null,
					"permissions": null
				},
				selectedUser: {},
				newUser: {},
				userList: [],

				userOptions: [],
				groupOptions: [],
				permissionOptions: [],

				end: []
			};
		},
		methods: {
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
			getGroupOptions(search, loading) {
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
			fakeData() { // delete
				this.userList.forEach((value, key) => {
					value.permissions = [
						{
							"uuid": "dc221d15-9dc6-4ebe-84ab-5a8f5edf4c12",
							"permission": "Add, edit, delete API"
						},
						{
							"uuid": "313c2a4e-6eb0-4a6c-b3da-f2b1be08945d",
							"permission": "Add, edit, delete APP"
						},
						{
							"uuid": "416d94e1-9129-4e69-9fea-986d999ec32b",
							"permission": "Add, edit, delete Proxy"
						}
					]
					value.groups =  [
						{
							"uuid": "dbcadc32-c16c-4c95-b6f3-bcc6d26b7744",
							"groupname": "admin"
						}, {
							"uuid": "0f6f8ebd-8e4e-4cd6-a03d-16b07a1d93db",
							"groupname": "developer"
						}
					],
					value.totallogincount = 5;
					value.lastloginat = "2018-04-12T14:48:00.000Z";
					value.failedlogincount = 1;
					value.lastfailedloginat = "2018-04-10T11:15:00.000Z";
					value.directory = "Internal Directory";
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
					// this.fakeData(); // delete
				}, error => {
					console.error(error);
				});
			},
			cancelUser() {
				var index = this.userList.indexOf(this.user);
				this.userList[index] = this.selectedUser;
				this.user = _.cloneDeep(this.newUser);
				this.selectedUser = _.cloneDeep(this.newUser);
				// this.groupOptions = [],
				// this.permissionOptions = [],
				this.selected = null;
			},
			selectUser(item, i) {
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
			userAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						var item = _.cloneDeep(this.user);
						if (act == 'add') {
							// this.user.created = moment().toISOString();
							var itemArr = [];
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
							itemArr.push(item);
							this.addItem(this.ajaxUrl, itemArr, this.ajaxHeaders, this.userList).then(response => {
								console.log("addUser response: ", response);
								// console.log("this.user: ", JSON.stringify(this.user, null, '\t') );
								this.$emit('set-state', 'init');
								this.user = _.cloneDeep(this.newUser);
							});
						}
						if (act == 'edit') {
							// this.user.updated = moment().toISOString();
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
							this.updateItem(this.ajaxUrl + '/' + this.user.uuid, item, this.ajaxHeaders, this.userList).then(response => {
								console.log("editUser response: ", response);
								// console.log("this.user: ", JSON.stringify(this.user, null, '\t') );
								this.$emit('set-state', 'init');
								this.user = _.cloneDeep(this.newUser);
								this.selected = null;
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
		}
	});
});