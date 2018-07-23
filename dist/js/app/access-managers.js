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
				this.$parent.saveAddType(t);
			},
			saveType(item) {
				this.$parent.saveType(item);
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
				ajaxUrl: abyss.ajax.subject_directories_list,
				ajaxHeaders: {},
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
				var type = this.accessManagerTypes.find((el) => el.uuid == typ );
				Vue.set(this.accessManager, 'accessmanagerattributes', type.attributetemplate);
			},
			addType() {
				var ttt = _.findIndex(this.accessManagerTypes, function(o) { return o.typename == 'newType'; });
				if (ttt == -1) {
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
			saveAddType(t) {
				this.fixProps(t);
				var itemArr = [];
				itemArr.push(this.deleteProps(t));
				axios.post(abyss.ajax.access_manager_types, itemArr).then(response => {
					console.log("access_manager_types response: ", response);
					this.accessManagerTypes.push(response.data[0].response);
					this.cancelAddType(t);
					this.$emit('set-state', 'init');
				}, error => {
					this.handleError(error);
				});
			},
			saveType(item) {
				this.updateItem(abyss.ajax.access_manager_types + '/' + item.uuid, this.deleteProps(item)).then(response => {
					console.log("save access_manager_types response: ", response);
					this.$emit('set-state', 'init');
				});
			},
			deleteType(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(abyss.ajax.access_manager_types + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("deleteUser response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},
			getTypeName(typ) {
				var subType = this.accessManagerTypes.find((el) => el.uuid == typ );
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
			fixProps(item) {
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
				}
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
			deleteAccessManager(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(abyss.ajax.access_managers + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE accessManager response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},
			deleteProps(obj) {
				var item = _.cloneDeep(obj);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				return item;
			},
			accessManagerAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
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
						}
						if (act == 'edit') {
							this.updateItem(abyss.ajax.access_managers + '/' + this.accessManager.uuid, this.deleteProps(this.accessManager), this.accessManagerList).then(response => {
								console.log("editAccessManager response: ", response);
								this.$emit('set-state', 'init');
								this.accessManager = _.cloneDeep(this.newAccessManager);
								this.selected = null;
							});
						}
						return;
					}
				});
			},
			getPage(p, d) {
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
			},
		},
		mounted() {
			// this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'access-managers', 'init');
			this.newAccessManager = _.cloneDeep(this.accessManager);
			this.getPage(1);
		}
	});
});