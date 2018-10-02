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
			/*saveAddType(t) {
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
			},*/
			async saveAddType(item) {
				this.fixProps(item);
				await this.addItem( abyss.ajax.subject_directory_types, this.deleteProps(item), this.directoryTypes );
				this.cancelAddType(item);
				this.$emit('set-state', 'init');
			},
			/*saveType(item) {
				this.updateItem(abyss.ajax.subject_directory_types + '/' + item.uuid, this.deleteProps(item)).then(response => {
					console.log("save subject_directory_types response: ", response);
					this.$emit('set-state', 'init');
				});
			},*/
			async saveType(item) {
				await this.editItem( abyss.ajax.subject_directory_types, item.uuid, this.deleteProps(item), this.directoryTypes );
				this.$emit('set-state', 'init');
			},
			/*deleteType(item) {
				var r = confirm('Are you sure to delete?');
				if (r === true) {
					axios.delete(abyss.ajax.subject_directory_types + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("deleteUser response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async deleteType(item) {
				var del = await this.deleteItem(abyss.ajax.subject_directory_types, item, true);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
				}
			},
			getTypeName(typ) {
				var subType = this.directoryTypes.find((el) => el.uuid == typ );
				if (subType) {
					return subType.typename;
				} else {
					return false;
				}
			},
			cancelDirectory() {
				var index = this.directoryList.indexOf(this.directory);
				this.directoryList[index] = this.selectedDirectory;
				this.directory = _.cloneDeep(this.newDirectory);
				this.selectedDirectory = _.cloneDeep(this.newDirectory);
				this.selected = null;
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
			fixProps(item) {
				this.fillProps(item);
				if (item.lastsyncronizedat == null) {
					Vue.set(item,'lastsyncronizedat', moment().toISOString());
				}
				if (item.lastsyncronizationduration == null) {
					Vue.set(item,'lastsyncronizationduration', 0);
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				return item;
			},
			async deleteDirectory(item) {
				var del = await this.deleteItem(abyss.ajax.subject_directories_list, item, true);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
				}
			},
			/*deleteDirectory(item) {
				var r = confirm('Are you sure to delete?');
				if (r === true) {
					axios.delete(abyss.ajax.subject_directories_list + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE directory response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async directoryAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					/*if (act === 'add') {
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
					}*/
					if (act === 'add') {
						this.fixProps(this.directory);
						await this.addItem(abyss.ajax.subject_directories_list, this.deleteProps(this.directory), this.directoryList);
						this.$emit('set-state', 'init');
						this.directory = _.cloneDeep(this.newDirectory);
					}
					if (act === 'edit') {
						await this.editItem( abyss.ajax.subject_directories_list, this.directory.uuid, this.deleteProps(this.directory), this.directoryList );
						this.$emit('set-state', 'init');
						this.directory = _.cloneDeep(this.newDirectory);
						this.selected = null;
					}
					/*if (act === 'edit') {
						this.updateItem(abyss.ajax.subject_directories_list + '/' + this.directory.uuid, this.deleteProps(this.directory), this.directoryList).then(response => {
							console.log("editDirectory response: ", response);
							this.$emit('set-state', 'init');
							this.directory = _.cloneDeep(this.newDirectory);
							this.selected = null;
						});
					}*/
				}
			},
			/*getPage(p, d) {
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
			},*/
			async getPage(p, d) {
				var subject_directories_list = this.getList(abyss.ajax.subject_directories_list);
				var subject_directory_types = this.getList(abyss.ajax.subject_directory_types);
				var organizations_list = this.getList(abyss.ajax.organizations_list);
				var [directoryList, directoryTypes, orgOptions] = await Promise.all([subject_directories_list, subject_directory_types, organizations_list]);
				Vue.set( this, 'directoryList', directoryList );
				Vue.set( this, 'directoryTypes', directoryTypes );
				Vue.set( this, 'orgOptions', orgOptions );
				this.paginate = this.makePaginate(this.directoryList);
				this.preload();
				console.timeEnd();
			},
		},
		created() {
			this.$emit('set-page', 'user-directories', 'init');
			this.newDirectory = _.cloneDeep(this.directory);
			console.time();
			this.getPage(1);
		}
	});
});