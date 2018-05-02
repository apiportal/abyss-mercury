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
					key: 'group_name',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.user_group_list,
				ajaxHeaders: {
                    //timeout: 10000,
                    contentType: 'application/json; charset=utf-8',
                    datatype: 'json',
                    withCredentials : true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                },
				selected: null,
				resetPassword: false,
				groupOLD: {
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
				group: {
					"uuid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"is_deleted": 0,
					"is_enabled": 1,
					"group_name": null,
					"description": null,
					"effective_start_date": null,
					"effective_end_date": null,

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

				date: null,
					config: {
					format: 'YYYY-MM-DD HH:mm:ss',
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
					this.getPage(1, '&group='+filter.uuid);
				}
			},
			getUserOptions(search, loading) {
				loading(true)
				axios.get(abyss.ajax.user_list, {
					params: {
						q: search
					},
                    timeout: 10000,
                    contentType: 'application/json; charset=utf-8',
                    datatype: 'json',
                    withCredentials : true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
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
					},
                    timeout: 10000,
                    contentType: 'application/json; charset=utf-8',
                    datatype: 'json',
                    withCredentials : true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
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
				axios.get(abyss.ajax.permission_list, {
					params: {
						q: search
					},
                    timeout: 10000,
                    contentType: 'application/json; charset=utf-8',
                    datatype: 'json',
                    withCredentials : true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
				})
				.then(response => {
					console.log(response);
					this.permissionOptions = response.data.permissionList;
					loading(false);
				})
			},
			fakeData() { // delete
				this.groupList.forEach((value, key) => {
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
					value.userCount = 5;
				});
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
					this.groupList = response.data.groupList;
					this.paginate = this.makePaginate(response.data);
					this.fakeData(); // delete
					console.log("this.groupList: ", this.groupList);
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
				this.removeItem(this.ajaxUrl, item, this.ajaxHeaders, this.groupList);
			},
			groupAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						if (act == 'add') {
							this.group.created = moment().toISOString();
							var postItem = _.cloneDeep(this.group);
							postItem.effective_start_date = moment(this.group.effective_start_date).toISOString();
							postItem.effective_end_date = moment(this.group.effective_end_date).toISOString();
							this.addItem(this.ajaxUrl, postItem, this.ajaxHeaders, this.groupList).then(response => {
								this.$emit('set-state', 'init');
								this.group = _.cloneDeep(this.newGroup);
								console.log("this.group: ", this.group );
							});
						}
						if (act == 'edit') {
							this.group.updated = moment().toISOString();
							var postItem = _.cloneDeep(this.group);
							postItem.effective_start_date = moment(this.group.effective_start_date).toISOString();
							postItem.effective_end_date = moment(this.group.effective_end_date).toISOString();
							console.log("postItem: ", postItem);
							this.updateItem(this.ajaxUrl, postItem, this.ajaxHeaders, this.groupList).then(response => {
								console.log("response: ", response);
								console.log("postItem: ", postItem);
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
		}
	});
});