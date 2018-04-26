define(['Vue', 'axios', 'vee-validate', 'lodash', 'vue-select', 'moment'], function(Vue, axios, VeeValidate, _, VueSelect, moment) {
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
				//ajaxUrl: '/abyss/users/management',
                ajaxUrl: 'http://localhost:38082/abyss/api/subject/getAll',
				// ajaxUrl: 'http://local.monasdyas.com/api/get?file=http://192.168.10.46:38081/abyss/users/management',
				// ajaxUrl: 'http://192.168.21.180:18881/000?file=http://192.168.21.180:18881/data/user-list-abyss.json',
				// ajaxUrl: 'http://local.abyss.com/000?file=http://192.168.10.46:38081/abyss/users/management',
				// ajaxUrl: 'http://local.abyss.com/000?file=http://local.abyss.com/data/user-list-abyss.json',

				ajaxGroupsUrl: '/abyss/user-groups/management',
				// ajaxGroupsUrl: 'http://192.168.21.180:18881/000?file=http://192.168.21.180:18881/data/user-group-list-abyss.json',
				// ajaxGroupsUrl: 'http://local.abyss.com/000?file=http://192.168.10.46:38081/abyss/user-groups/management',
				// ajaxGroupsUrl: 'http://local.abyss.com/000?file=http://local.abyss.com/data/user-group-list-abyss.json',

				// ajaxPermissionsUrl: '/abyss/user-permissions/management',
				ajaxPermissionsUrl: '/data/permission-list.json',
				// ajaxPermissionsUrl: 'http://192.168.21.180:18881/000?file=http://192.168.21.180:18881/data/permission-list.json',
				// ajaxPermissionsUrl: 'http://local.abyss.com/000?file=http://local.abyss.com/data/permission-list.json',
				
				ajaxHeaders: {
					contentType: 'application/json; charset=utf-8',
					datatype: 'json',
					headers: {'Content-Type': 'application/json'}
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
					this.getPage(1, '&permission='+filter.id);
				}
			},
			filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&group='+filter.id);
				}
			},
			filterUser(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&search='+filter.id);
				}
			},
			getUserOptions(search, loading) {
				loading(true)
				axios.get(this.ajaxUrl, {
					params: {
						q: search
					}
				})
				.then(response => {
					console.log(response);
					this.userOptions = response.data.userList;
					loading(false);
				})
			},
			getGroupOptions(search, loading) {
				loading(true)
				axios.get(this.ajaxGroupsUrl, {
					params: {
						q: search
					}
				})
				.then(response => {
					console.log(response);
					this.groupOptions = response.data.groupList;
					loading(false);
				})
			},
			getPermissionOptions(search, loading) {
				loading(true)
				axios.get(this.ajaxPermissionsUrl, {
					params: {
						q: search
					}
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
							"id": 1,
							"name": "Add, edit, delete API"
						},
						{
							"id": 2,
							"name": "Add, edit, delete APP"
						},
						{
							"id": 3,
							"name": "Add, edit, delete Proxy"
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
				axios.get(this.ajaxUrl + '?page=' + p + param)
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
				this.removeItem(this.userList, item);
			},
			userAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						if (act == 'add') {
							this.user.created = moment().toISOString();
							this.addItem(this.userList, this.user).then(response => {
								// this.addItem(this.userList, this.user);
								this.$emit('set-state', 'init');
								// this.resetItem(this.user, this.newUser);
								this.user = _.cloneDeep(this.newUser);
								console.log("this.user: ", this.user );
							});
						}
						if (act == 'edit') {
							this.user.updated = moment().toISOString();
							this.updateItem(this.userList, this.user).then(response => {
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
			// axios.all([
			// 	axios.get(this.ajaxUrl),
			// 	// axios.get('/data/create-api.json')
			// ]).then(
			// 	axios.spread((userList, create) => {
			// 		this.userList = userList.data.userList;
			// 		this.paginate = this.makePaginate(userList.data);
			// 		// this.$set('paginate', this.makePaginate(userList.data));
			// 	})
			// ).catch(error => {
			// 	console.log(error.response)
			// });
			this.getPage(1);
		}
	});
});