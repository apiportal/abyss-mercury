define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment'], function(abyss, Vue, axios, VeeValidate, _, moment) {
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
					"typename": null,
					"description": "",
				},
				selectedDirectory: {},
				newDirectory: {},
				directoryList: [],
				directoryTypes: [],
				orgOptions: this.$root.rootData.user.organizations,
				end: []
			};
		},
		methods: {
			addType: function () {
				var ttt = _.findIndex(this.directoryTypes, function(o) { return o.typename == 'newType'; });
				if (ttt == -1) {
					var newType = {};
					newType.typename = 'newType';
					newType.externalDocs = {};
					this.directoryTypes.push(newType);
				}
				var i = this.directoryTypes.length - 1;
				setTimeout(() => {
					$('#tags').collapse('show');
					$('#t'+i).collapse('show');
				},0);
			},
			deleteType(item) {
				axios.delete(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders).then(response => {
					item.isdeleted = true;
					console.log("deleteUser response: ", response);
				}, error => {
					this.handleError(error);
				});
			},
			deleteType222: function (item) {
				this.removeItem(abyss.ajax.subject_directory_types + '/' + item.uuid, item, this.ajaxHeaders, this.directoryTypes).then(response => {
					console.log("deleteDirectoryType response: ", response);
				});
			},
			getTypeName(typ) {
				var subType = this.directoryTypes.find((el) => el.uuid == typ );
				if (subType) {
					return subType.typename;
				}
			},
			getDirectoryTypes() {
				axios.get(abyss.ajax.subject_directory_types, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					if (response.data != null) {
						this.directoryTypes = response.data.filter( (item) => item.isdeleted == false );
					} else {
						this.directoryTypes = [];
					}
				}, error => {
					this.handleError(error);
				});
			},
			cancelDirectory() {
				var index = this.directoryList.indexOf(this.directory);
				this.directoryList[index] = this.selectedDirectory;
				this.directory = _.cloneDeep(this.newDirectory);
				this.selectedDirectory = _.cloneDeep(this.newDirectory);
				this.selected = null;
			},
			fixProps(item) {
				if (item.lastsyncronizedat == null) {
					Vue.set(item,'lastsyncronizedat', moment().toISOString());
				}
				if (item.lastsyncronizationduration == null) {
					Vue.set(item,'lastsyncronizationduration', 0);
				}
				if (item.crudsubjectid == null) {
					// Vue.set(item,'crudsubjectid','e20ca770-3c44-4a2d-b55d-2ebcaa0536bc');
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
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
				this.removeItem(this.ajaxUrl + '/' + item.uuid, item, this.ajaxHeaders, this.directoryList).then(response => {
					console.log("deleteDirectory response: ", response);
				});
			},
			deleteProps() {
				var item = _.cloneDeep(this.directory);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				return item;
			},
			directoryAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
							this.fixProps(this.directory);
							var itemArr = [];
							itemArr.push(this.deleteProps());
							// this.addItem(this.ajaxUrl, itemArr, this.ajaxHeaders, this.directoryList).then(response => {
							axios.post(this.ajaxUrl, itemArr, this.ajaxHeaders).then(response => {
								console.log("addDirectory response: ", response);
								if (response.data[0].status != 500 ) {
									this.directoryList.push(response.data[0].response);
									this.$emit('set-state', 'init');
									this.directory = _.cloneDeep(this.newDirectory);
								}
							}, error => {
								this.handleError(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(this.ajaxUrl + '/' + this.directory.uuid, this.deleteProps(), this.ajaxHeaders, this.directoryList).then(response => {
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
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					console.log(response);
					this.directoryList = response.data;
					this.paginate = this.makePaginate(response.data);
					this.preload();
				}, error => {
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
			this.getDirectoryTypes();
		}
	});
});