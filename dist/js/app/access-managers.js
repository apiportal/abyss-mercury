define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue!schema-template-form'], function(abyss, Vue, axios, VeeValidate, _, moment) {
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
					this.t.attributetemplate = JSON.parse(newVal);
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
				template: null,
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
					this.accessManager.accessmanagerattributes = JSON.parse(newVal);
				}
			},
		},
		methods: {
			getTemplate(typ, clear) {
				if (clear) {
					Vue.set(this.accessManager, 'accessmanagerattributes', {} );
				}
				var type = this.accessManagerTypes.find((el) => el.uuid === typ );
				this.template = _.cloneDeep(type.attributetemplate);
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
			async saveAddType(item) {
				this.fixProps(item);
				await this.addItem( abyss.ajax.access_manager_types, this.deleteProps(item), this.accessManagerTypes );
				this.cancelAddType(item);
				this.$emit('set-state', 'init');
			},
			async saveType(item) {
				await this.editItem( abyss.ajax.access_manager_types, item.uuid, this.deleteProps(item), this.accessManagerTypes );
				this.$emit('set-state', 'init');
			},
			async deleteType(item) {
				item.isdeleted = true;
				await this.deleteItem(abyss.ajax.access_manager_types, item, true);
			},
			getTypeName(typ) {
				var subType = this.accessManagerTypes.find((el) => el.uuid === typ );
				if (subType) {
					return subType.typename;
				} else {
					return false;
				}
			},
			cancelAccessManager() {
				var index = this.accessManagerList.indexOf(this.accessManager);
				this.accessManagerList[index] = this.selectedAccessManager;
				this.accessManager = _.cloneDeep(this.newAccessManager);
				this.selectedAccessManager = _.cloneDeep(this.newAccessManager);
				this.selected = null;
				this.template = null;
			},
			selectAccessManager(item, i) {
				this.fixProps(item);
				this.selectedAccessManager = _.cloneDeep(item);
				this.accessManager = item;
				this.getTemplate(this.accessManager.accessmanagertypeid);
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
				item.isdeleted = true;
				await this.deleteItem(abyss.ajax.access_managers, item, true);
			},
			async accessManagerAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act === 'add') {
						this.fixProps(this.accessManager);
						await this.addItem(abyss.ajax.access_managers, this.deleteProps(this.accessManager), this.accessManagerList);
						this.$emit('set-state', 'init');
						this.accessManager = _.cloneDeep(this.newAccessManager);
						this.template = null;
					}
					if (act === 'edit') {
						await this.editItem( abyss.ajax.access_managers, this.accessManager.uuid, this.deleteProps(this.accessManager), this.accessManagerList );
						this.$emit('set-state', 'init');
						this.accessManager = _.cloneDeep(this.newAccessManager);
						this.selected = null;
						this.template = null;
					}
				}
			},
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
			},
		},
		created() {
			this.$emit('set-page', 'access-managers', 'init');
			this.newAccessManager = _.cloneDeep(this.accessManager);
			this.getPage(1);
		}
	});
});