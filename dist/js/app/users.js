define(['Vue', 'axios', 'vee-validate', 'lodash', 'vue-select', 'eonasdan-bootstrap-datetimepicker'], function(Vue, axios, VeeValidate, _, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('users', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'fullName',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: '/users',
				testUrl: 'http://www.monasdyas.com/api/api',
				ajaxHeaders: {
					contentType: 'application/json',
					datatype: 'json',
					headers: {'Content-Type': 'application/json'}
				},
				selected: null,
				resetPassword: false,
				user: {
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
				axios.get('/data/user-group-list.json', {
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
				axios.get('/data/permission-list.json', {
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
			getPage(p, d) {
				// axios.get(this.ajaxUrl, {
				// 	params: {
				// 		page: p
				// 	}
				// })
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param)
				.then(response => {
					// console.log("p: ", p);
					this.userList = response.data.userList;
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
							this.addItem(this.userList, this.user).then(response => {
								// this.addItem(this.userList, this.user);
								this.$emit('set-state', 'init');
								// this.resetItem(this.user, this.newUser);
								this.user = _.cloneDeep(this.newUser);
								console.log("this.user: ", this.user );
							});
						}
						if (act == 'edit') {
							this.updateItem(this.userList, this.user).then(response => {
								this.$emit('set-state', 'init');
								this.user = _.cloneDeep(this.newUser);
								this.selected = null;
							});
						}
						this.$emit('set-state', 'init');
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