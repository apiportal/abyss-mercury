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
					key: 'first_name',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.user_list,
				ajaxHeaders: {
					//timeout: 10000,
//					contentType: 'application/json; charset=utf-8',
//					datatype: 'json',
//					withCredentials : true,
//					headers: {
//						'Accept': 'application/json',
//						'Content-Type': 'application/json'
//					}
				},
				selected: null,
				resetPassword: false,
				userOLD: {
					"id": 0,
					"fullName": "",
					"userName": "",
					"email": "",
					"notify": true,
					"loginCount": 0,
					"lastLogin": "",
					"failedLoginCount": 0,
					"lastFailedLogin": "",
					"directory": "Internal Directory",
					"groups": [],
					"permissions": []
				},
				user: {
					"uuid": null,
					"created": null,
					"updated": null,
					"deleted": null, // ? what is the difference
					"is_deleted": null, // ? what is the difference
					"is_activated": null,
					"subject_name": null,
					"first_name": null,
					"last_name": null,
					"display_name": null,
					"email": null,
					"effective_start_date": null,
					"effective_end_date": null,

					"notify": true,
					"loginCount": 0,
					"lastLogin": null,
					"failedLoginCount": 0,
					"lastFailedLogin": null,
					"directory": "Internal Directory",
					"groups": [],
					"permissions": []
				},
				selectedUser: {},
				newUser: {},
				userList: [],

				userOptions: [],
				groupOptions: [],
				permissionOptions: [],

				end: []
			}
		},
		methods: {
			/*onSearch(search, loading) {
				loading(true);
				this.search(loading, search, this);
			},
			search: (loading, search, vm) => {
				fetch(
					'https://api.github.com/search/repositories?q=${escape(search)}'
				).then(res => {
					res.json().then(json => (vm.groupOptions = json.items));
					loading(false);
				});
			},*/
			/*search: _.debounce((loading, search, vm) => {
				fetch(
					`https://api.github.com/search/repositories?q=${escape(search)}`
				).then(res => {
					res.json().then(json => (vm.groupOptions = json.items));
					loading(false);
				});
			}, 350),*/
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
				loading(true)
				axios.get(this.ajaxUrl, {
					params: {
						q: search
					},
                    // timeout: 10000,
                    // contentType: 'application/json; charset=utf-8',
                    // datatype: 'json',
                    // withCredentials : true,
                    // headers: {
                    //     'Accept': 'application/json',
                    //     'Content-Type': 'application/json'
                    // }
				})
				.then(response => {
					console.log(response);
					this.userOptions = response.data.userList;
					loading(false);
				})
			},
			getGroupOptions(search, loading) {
				loading(true)
				axios.get(abyss.ajax.user_group_list, {
					params: {
						q: search
					},
                    // timeout: 10000,
                    // contentType: 'application/json; charset=utf-8',
                    // datatype: 'json',
                    // withCredentials : true,
                    // headers: {
                    //     'Accept': 'application/json',
                    //     'Content-Type': 'application/json'
                    // }
				})
				.then(response => {
					console.log(response);
					this.groupOptions = response.data.groupList;
					loading(false);
				})
			},
			getPermissionOptions(search, loading) {
				loading(true)
				axios.get(abyss.ajax.permission_list, {
					params: {
						q: search
					},
                    // timeout: 10000,
                    // contentType: 'application/json; charset=utf-8',
                    // datatype: 'json',
                    // withCredentials : true,
                    // headers: {
                    //     'Accept': 'application/json',
                    //     'Content-Type': 'application/json'
                    // }
				})
				.then(response => {
					console.log(response);
					this.permissionOptions = response.data.permissionList;
					loading(false);
				})
			},
			fakeData() { // delete
				this.userList.forEach((value, key) => {
				// this.userList.forEach(function (value, key) {
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
					value.loginCount = 5;
					value.lastLogin = "2018-04-12T14:48:00.000Z";
					value.failedLoginCount = 1;
					value.lastFailedLogin = "2018-04-10T11:15:00.000Z";
					value.directory = "Internal Directory";
				});
			},
			getPage(p, d) {
				// axios.get(this.ajaxUrl, {
				// 	params: {
				// 		page: p
				// 	}
				// })
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					this.userList = response.data.userList;
					this.paginate = this.makePaginate(response.data);
					this.fakeData(); // delete
					console.log("this.userList: ", this.userList);
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
				this.removeItem(this.ajaxUrl, item, this.ajaxHeaders, this.userList);
			},
			userAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						if (act == 'add') {
							this.user.created = moment().toISOString();
							this.addItem(this.ajaxUrl, this.user, this.ajaxHeaders, this.userList).then(response => {
								this.$emit('set-state', 'init');
								this.user = _.cloneDeep(this.newUser);
								console.log("this.user: ", this.user );
							});
						}
						if (act == 'edit') {
							this.user.updated = moment().toISOString();
							this.updateItem(this.ajaxUrl, this.user, this.ajaxHeaders, this.userList).then(response => {
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
			newUser: {
				handler(val, oldVal) {
					console.log('Item Changed', oldVal.permissions, '----', val.permissions.length)
				},
				deep: true
			}
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