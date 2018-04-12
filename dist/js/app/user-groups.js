// define(['Vue', 'axios', 'vee-validate', 'eonasdan-bootstrap-datetimepicker', 'css!bootstrap-datetimepicker-css', 'vue!date-picker.htm', 'vue!comps/component.html'], function(Vue, axios, VeeValidate) {
define(['Vue', 'axios', 'vee-validate', 'vue-select', 'VueBootstrapDatetimePicker', 'eonasdan-bootstrap-datetimepicker'], function(Vue, axios, VeeValidate, VueSelect, VueBootstrapDatetimePicker) {
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
					key: 'name',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: '/data/user-group-list.json',
				testUrl: 'http://www.monasdyas.com/api/api',
				ajaxHeaders: {
					contentType: 'application/json',
					datatype: 'json',
					headers: {'Content-Type': 'application/json'}
				},
				selected: null,
				resetPassword: false,
				group: {
					"id": 0,
					"name": "",
					"description": "",
					"userCount": 0,
					"dateFrom": null,
					"dateTo": null,
					"status": null,
					"permissions": [],
					"users": []
				},
				selectedGroup: {},
				newGroup: {},
				groupList: [],

				userOptions: [],
				groupOptions: [],
				permissionOptions: [],

				date: null,
					config: {
					format: 'YYYY-MM-DD hh:mm:ss',
					// format: 'YYYY-MM-DD',
					useCurrent: false,
					showClear: true,
					showClose: true,
					// inline: true
				},
				end: []
			}
		},
		methods: {
			filterGroup(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&group='+filter.id);
				}
			},
			getUserOptions(search, loading) {
				loading(true)
				axios.get('/data/user-list.json', {
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
				axios.get(this.ajaxUrl, {
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
				// axios.get(this.ajaxUrl).then(response => {
				// 	console.log("p: ", p);
				// 	this.groupList = response.data.groupList;
				// }, error => {
				// 	console.error(error);
				// });
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					// console.log("p: ", p);
					this.groupList = response.data.groupList;
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
			selectGroup(item, i) {
				this.selectedGroup = _.cloneDeep(item);
				this.group = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			deleteGroup(item) {
				this.removeItem(this.groupList, item);
			},
			groupAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						if (act == 'add') {
							this.addItem(this.groupList, this.group).then(response => {
								// this.addItem(this.groupList, this.group);
								this.$emit('set-state', 'edit');
								// this.resetItem(this.group, this.newGroup);
								this.group = _.cloneDeep(this.newGroup);
								console.log("this.group: ", this.group );
							});
						}
						if (act == 'edit') {
							this.updateItem(this.groupList, this.group).then(response => {
								this.$emit('set-state', 'init');
								this.group = _.cloneDeep(this.newGroup);
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
			this.log(this.$options.name);
			this.$emit('set-page', 'user-groups', 'init');
			this.newGroup = _.cloneDeep(this.group);
			// axios.all([
			// 	axios.get(this.ajaxUrl),
			// 	// axios.get('/data/create-api.json')
			// ]).then(
			// 	axios.spread((groupList, create) => {
			// 		this.groupList = groupList.data.groupList;
			// 		this.paginate = this.makePaginate(groupList.data);
			// 		// this.$set('paginate', this.makePaginate(groupList.data));
			// 	})
			// ).catch(error => {
			// 	console.log(error.response)
			// });
			this.getPage(1);
		}
	});
});