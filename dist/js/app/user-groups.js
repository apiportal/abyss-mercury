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
					"isdeleted": false,
					"isenabled": true,
					"groupname": null,
					"description": null,
					"effectivestartdate": null,
					"effectiveenddate": null,

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
				var param = d || '';
				console.log("this.ajaxUrl: ", this.ajaxUrl);
				axios.get(this.ajaxUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					this.groupList = response.data;
					// console.log("this.groupList: ", JSON.stringify(this.userList, null, '\t') );
					this.paginate = this.makePaginate(response.data);
					// this.fakeData(); // delete
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
				this.removeItem(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders, this.groupList).then(response => {
					console.log("deleteGroup response: ", response);
				});
			},
			groupAction(act) {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						var item = _.cloneDeep(this.group);
						if (act == 'add') {
							// this.group.created = moment().toISOString();
							var itemArr = [];
							Vue.delete(item, 'uuid');
							Vue.delete(item, 'created');
							Vue.delete(item, 'updated');
							Vue.delete(item, 'deleted');
							Vue.delete(item, 'isdeleted');
							item.effectivestartdate = moment(this.group.effectivestartdate).toISOString();
							item.effectiveenddate = moment(this.group.effectiveenddate).toISOString();
							itemArr.push(item);
							this.addItem(this.ajaxUrl, itemArr, this.ajaxHeaders, this.groupList).then(response => {
								console.log("addGroup response: ", response);
								// console.log("this.group: ", JSON.stringify(item, null, '\t') );
								this.$emit('set-state', 'init');
								this.group = _.cloneDeep(this.newGroup);
							});
						}
						if (act == 'edit') {
							// this.group.updated = moment().toISOString();
							Vue.delete(item, 'uuid');
							Vue.delete(item, 'created');
							Vue.delete(item, 'updated');
							Vue.delete(item, 'deleted');
							Vue.delete(item, 'isdeleted');
							item.effectivestartdate = moment(this.group.effectivestartdate).toISOString();
							item.effectiveenddate = moment(this.group.effectiveenddate).toISOString();
							this.updateItem(this.ajaxUrl + '/' + this.group.uuid, item, this.ajaxHeaders, this.groupList).then(response => {
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
		}
	});
});