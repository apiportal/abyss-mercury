define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment'], function(abyss, Vue, axios, VeeValidate, _, moment) {
	Vue.component('access-manager-types', {
		props: ['t','index', 'orgoptions'],
		data() {
			return {};
		},
		computed: {
			stringifyTemplate : {
				get() {
					return JSON.stringify(this.t.attributetemplate, null, '\t');
				},
				set(newVal) {
					console.log("newVal: ", newVal);
					this.t.attributetemplate = JSON.parse(newVal);
					console.log("this.t.attributetemplate: ", this.t.attributetemplate);
				}
			},
		},
		methods: {
			addType() {
				this.$parent.addType();
			},
			cancelAddType(t) {
				this.$parent.cancelAddType(t);
			},
			saveAddType(t) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						this.$parent.saveAddType(t);
					}
				});
			},
			saveType(item) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						this.$parent.saveType(item);
					}
				});
			},
			deleteType(item) {
				this.$parent.deleteType(item);
			},
		}
	});
	Vue.component('access-managers', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'accessmanagername',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				selected: null,
				accessManager: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"accessmanagername": null,
					"description": "",
					"isactive": true,
					"accessmanagertypeid": null,
					"accessmanagerattributes": {},
				},
				accessManagerType: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"typename": "newType",
					"description": "",
					"attributetemplate": {},
				},
				selectedAccessManager: {},
				newAccessManager: {},
				accessManagerList: [],
				accessManagerTypes: [],
				orgOptions: [],
				end: []
			};
		},
		computed: {
			stringifyAttribute : {
				get() {
					return JSON.stringify(this.accessManager.accessmanagerattributes, null, '\t');
				},
				set(newVal) {
					console.log("newVal: ", newVal);
					this.accessManager.accessmanagerattributes = JSON.parse(newVal);
					console.log("this.accessmanagerattributes: ", this.accessManager.accessmanagerattributes);
				}
			},
		},
		methods: {
			getTemplate(typ) {
				var type = this.accessManagerTypes.find((el) => el.uuid === typ );
				Vue.set(this.accessManager, 'accessmanagerattributes', type.attributetemplate);
			},
			addType() {
				var ttt = _.findIndex(this.accessManagerTypes, function(o) { return o.typename === 'newType'; });
				if (ttt === -1) {
					var newType = _.cloneDeep(this.accessManagerType);
					this.accessManagerTypes.push(newType);
				}
				var i = this.accessManagerTypes.length - 1;
				setTimeout(() => {
					$('#t'+i).collapse('show');
				},0);
			},
			cancelAddType(t) {
				var index = this.accessManagerTypes.indexOf(t);
				this.accessManagerTypes.splice(index, 1);
			},
			/*saveAddType(t) {
				this.fillProps(t);
				var itemArr = [];
				itemArr.push(this.deleteProps(t));
				// console.log("this.deleteProps(t): ", this.deleteProps(t));
				axios.post(abyss.ajax.access_manager_types, itemArr).then(response => {
					console.log("access_manager_types response: ", response);
					this.accessManagerTypes.push(response.data[0].response);
					this.cancelAddType(t);
					this.$emit('set-state', 'init');
				}, error => {
					this.handleError(error);
				});
			},*/
			async saveAddType(item) {
				this.fixProps(item);
				await this.addItem( abyss.ajax.access_manager_types, this.deleteProps(item), this.accessManagerTypes );
				this.cancelAddType(item);
				this.$emit('set-state', 'init');
			},
			/*saveType(item) {
				this.updateItem(abyss.ajax.access_manager_types + '/' + item.uuid, this.deleteProps(item)).then(response => {
					console.log("save access_manager_types response: ", response);
					this.$emit('set-state', 'init');
				});
			},*/
			async saveType(item) {
				await this.editItem( abyss.ajax.access_manager_types, item.uuid, this.deleteProps(item), this.accessManagerTypes );
				this.$emit('set-state', 'init');
			},
			/*deleteType(item) {
				var r = confirm('Are you sure to delete?');
				if (r === true) {
					axios.delete(abyss.ajax.access_manager_types + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("deleteUser response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async deleteAccessManager(item) {
				var del = await this.deleteItem(abyss.ajax.access_manager_types, item, true);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
				}
			},
			getTypeName(typ) {
				var subType = this.accessManagerTypes.find((el) => el.uuid === typ );
				if (subType) {
					return subType.typename;
				}
			},
			cancelAccessManager() {
				var index = this.accessManagerList.indexOf(this.accessManager);
				this.accessManagerList[index] = this.selectedAccessManager;
				this.accessManager = _.cloneDeep(this.newAccessManager);
				this.selectedAccessManager = _.cloneDeep(this.newAccessManager);
				this.selected = null;
			},
			selectAccessManager(item, i) {
				this.fixProps(item);
				this.selectedAccessManager = _.cloneDeep(item);
				this.accessManager = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				this.fillProps(item);
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				return item;
			},
			async deleteAccessManager(item) {
				var del = await this.deleteItem(abyss.ajax.access_managers, item, true);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
				}
			},
			/*deleteAccessManager(item) {
				var r = confirm('Are you sure to delete?');
				if (r === true) {
					axios.delete(abyss.ajax.access_managers + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE accessManager response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async accessManagerAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					/*if (act === 'add') {
						this.fixProps(this.accessManager);
						var itemArr = [];
						itemArr.push(this.deleteProps(this.accessManager));
						axios.post(abyss.ajax.access_managers, itemArr).then(response => {
							console.log("addAccessManager response: ", response);
							this.accessManagerList.push(response.data[0].response);
							this.$emit('set-state', 'init');
							this.accessManager = _.cloneDeep(this.newAccessManager);
						}, error => {
							this.handleError(error);
						});
					}*/
					if (act === 'add') {
						this.fixProps(this.accessManager);
						var item = await this.addItem(abyss.ajax.access_managers, this.deleteProps(this.accessManager), this.accessManagerList);
						this.$emit('set-state', 'init');
						this.accessManager = _.cloneDeep(this.newAccessManager);
					}
					if (act === 'edit') {
						var item = await this.editItem( abyss.ajax.access_managers, this.accessManager.uuid, this.deleteProps(this.accessManager), this.accessManagerList );
						this.$emit('set-state', 'init');
						this.accessManager = _.cloneDeep(this.newAccessManager);
						this.selected = null;
					}
					/*if (act === 'edit') {
						this.updateItem(abyss.ajax.access_managers + '/' + this.accessManager.uuid, this.deleteProps(this.accessManager), this.accessManagerList).then(response => {
							console.log("editAccessManager response: ", response);
							this.$emit('set-state', 'init');
							this.accessManager = _.cloneDeep(this.newAccessManager);
							this.selected = null;
						});
					}*/
				}
			},
			/*getPage(p, d) {
				axios.all([
					axios.get(abyss.ajax.access_manager_types),
					axios.get(abyss.ajax.organizations_list),
					axios.get(abyss.ajax.access_managers)
				]).then(
					axios.spread((access_manager_types, organizations_list, access_managers) => {
						this.accessManagerTypes = access_manager_types.data;
						// this.orgOptions = this.$root.rootData.user.organizations;
						this.orgOptions = organizations_list.data;
						this.accessManagerList = access_managers.data;
						this.paginate = this.makePaginate(this.accessManagerList);
						this.preload();
					})
				).catch(error => {
					this.handleError(error);
				});
			},*/
			async getPage(p, d) {
				var access_managers = this.getList(abyss.ajax.access_managers);
				var access_manager_types = this.getList(abyss.ajax.access_manager_types);
				var organizations_list = this.getList(abyss.ajax.organizations_list);
				var [accessManagerList, accessManagerTypes, orgOptions] = await Promise.all([access_managers, access_manager_types, organizations_list]);
				Vue.set( this, 'accessManagerList', accessManagerList );
				Vue.set( this, 'accessManagerTypes', accessManagerTypes );
				Vue.set( this, 'orgOptions', orgOptions );
				this.paginate = this.makePaginate(this.accessManagerList);
				this.preload();
				console.timeEnd();
			},
		},
		created() {
			this.$emit('set-page', 'access-managers', 'init');
			this.newAccessManager = _.cloneDeep(this.accessManager);
			console.time();
			this.getPage(1);
		}
	});
});