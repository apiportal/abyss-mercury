define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment'], function(abyss, Vue, axios, VeeValidate, _, moment) {
	Vue.component('directory-types', {
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
	Vue.component('user-directories', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'directoryname',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.subject_directories_list,
				ajaxHeaders: {},
				selected: null,
				directory: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"directoryname": null,
					"description": "",
					"isactive": true,
					"istemplate": false,
					"directorytypeid": null,
					"directorypriorityorder": null,
					"directoryattributes": {},
					"lastsyncronizedat": null,
					"lastsyncronizationduration": null
				},
				directoryType: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"typename": "newType",
					"description": "",
				},
				selectedDirectory: {},
				newDirectory: {},
				directoryList: [],
				directoryTypes: [],
				orgOptions: [],
				end: []
			};
		},
		methods: {
			addType() {
				var ttt = _.findIndex(this.directoryTypes, function(o) { return o.typename == 'newType'; });
				if (ttt == -1) {
					var newType = _.cloneDeep(this.directoryType);
					this.directoryTypes.push(newType);
				}
				var i = this.directoryTypes.length - 1;
				setTimeout(() => {
					$('#t'+i).collapse('show');
				},0);
			},
			cancelAddType(t) {
				var index = this.directoryTypes.indexOf(t);
				this.directoryTypes.splice(index, 1);
			},
			saveAddType(t) {
				this.fillProps(t);
				var itemArr = [];
				itemArr.push(this.deleteProps(t));
				// console.log("this.deleteProps(t): ", this.deleteProps(t));
				axios.post(abyss.ajax.subject_directory_types, itemArr).then(response => {
					console.log("subject_directory_types response: ", response);
					this.directoryTypes.push(response.data[0].response);
					this.cancelAddType(t);
					this.$emit('set-state', 'init');
				}, error => {
					this.handleError(error);
				});
			},
			saveType(item) {
				this.updateItem(abyss.ajax.subject_directory_types + '/' + item.uuid, this.deleteProps(item)).then(response => {
					console.log("save subject_directory_types response: ", response);
					this.$emit('set-state', 'init');
				});
			},
			deleteType(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(abyss.ajax.subject_directories_list + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("deleteUser response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},
			getTypeName(typ) {
				var subType = this.directoryTypes.find((el) => el.uuid == typ );
				if (subType) {
					return subType.typename;
				}
			},
			cancelDirectory() {
				var index = this.directoryList.indexOf(this.directory);
				this.directoryList[index] = this.selectedDirectory;
				this.directory = _.cloneDeep(this.newDirectory);
				this.selectedDirectory = _.cloneDeep(this.newDirectory);
				this.selected = null;
			},
			fixProps(item) {
				this.fillProps(item);
				if (item.lastsyncronizedat == null) {
					Vue.set(item,'lastsyncronizedat', moment().toISOString());
				}
				if (item.lastsyncronizationduration == null) {
					Vue.set(item,'lastsyncronizationduration', 0);
				}
			},
			selectDirectory(item, i) {
				this.fixProps(item);
				this.selectedDirectory = _.cloneDeep(item);
				this.directory = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			deleteDirectory(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(abyss.ajax.subject_directories_list + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE directory response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				/*var item = _.cloneDeep(obj);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');*/
				return item;
			},
			directoryAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
							this.fixProps(this.directory);
							var itemArr = [];
							itemArr.push(this.deleteProps(this.directory));
							// console.log("this.deleteProps(this.directory): ", this.deleteProps(this.directory));
							axios.post(abyss.ajax.subject_directories_list, itemArr).then(response => {
								console.log("addDirectory response: ", response);
								this.directoryList.push(response.data[0].response);
								this.$emit('set-state', 'init');
								this.directory = _.cloneDeep(this.newDirectory);
							}, error => {
								this.handleError(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(abyss.ajax.subject_directories_list + '/' + this.directory.uuid, this.deleteProps(this.directory), this.directoryList).then(response => {
								console.log("editDirectory response: ", response);
								this.$emit('set-state', 'init');
								this.directory = _.cloneDeep(this.newDirectory);
								this.selected = null;
							});
						}
						return;
					}
				});
			},
			getPage(p, d) {
				axios.all([
					axios.get(abyss.ajax.subject_directory_types),
					axios.get(abyss.ajax.organizations_list),
					axios.get(abyss.ajax.subject_directories_list)
				]).then(
					axios.spread((subject_directory_types, organizations_list, subject_directories_list) => {
						this.directoryTypes = subject_directory_types.data;
						// this.orgOptions = this.$root.rootData.user.organizations;
						this.orgOptions = organizations_list.data;
						this.directoryList = subject_directories_list.data;
						this.paginate = this.makePaginate(this.directoryList);
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
			this.$emit('set-page', 'user-directories', 'init');
			this.newDirectory = _.cloneDeep(this.directory);
			this.getPage(1);
		}
	});
});