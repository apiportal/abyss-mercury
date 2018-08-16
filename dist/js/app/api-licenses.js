define(['config', 'Vue', 'axios', 'vee-validate', 'vue-select', 'moment'], function(abyss, Vue, axios, VeeValidate, VueSelect, moment) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('api-licenses', {
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
				selected: null,
				license: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"name": null,
					"version": null,
					"subjectid": null,
					"policies": null,
					"licensedocument": {
						"sla": {
							"tierName": "Silver",
							"description": "Silver SLA Package",
							"performance": "10Mbit/s",
							"availability": 98,
							"supportHours": "8x5",
							"blackOutHoursPerYear": 36
						},
						"info": {
							"title": "API License",
							"version": "1.0.0",
							"visibility": "Public",
							"description": "API License Description"
						},
						"legal": {
							"link": "http://example.com/legals/{LegalDocumentID}",
							"name": "API Legal Agreement",
							"description": "API Legal Agreement",
							"documentText": null,
							"agreementType": "signup",
							"documentState": "active",
							"legalDocumentID": null
						},
						"openApiLicense": "0.0.2",
						"termsOfService": {
							"policyKey": []
						}
					}
				},
				selectedLicense: {},
				newLicense: {},
				licenseList: [],
				policyList: [],
				end: []
			};
		},
		computed: {
			licensePolicies : {
				get() {
					return this.license.licensedocument.termsOfService.policyKey;
				},
				set(newVal) {
					
				}
			},
		},
		methods: {
			cancelLicense() {
				var index = this.licenseList.indexOf(this.license);
				this.licenseList[index] = this.selectedLicense;
				this.license = _.cloneDeep(this.newLicense);
				this.selectedLicense = _.cloneDeep(this.newLicense);
				this.selected = null;
			},
			selectLicense(item, i) {
				this.fixProps(item);
				this.selectedLicense = _.cloneDeep(item);
				this.license = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				this.fillProps(item);
				if (item.subjectid == null) {
					Vue.set(item,'subjectid',this.$root.rootData.user.uuid);
				}
				if (item.licensedocument.legal.legalDocumentID == null) {
					Vue.set(item.licensedocument.legal, 'legalDocumentID', this.uuidv4() );
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.set(item.licensedocument.termsOfService, 'policyKey', item.policies.map(e => e.uuid) );
				Vue.set(item.licensedocument.info, 'version', item.version);
				if (item.licensedocument.legal.legalDocumentID == null) {
					Vue.set(item.licensedocument.legal, 'legalDocumentID', this.uuidv4() );
				}
				Vue.delete(item, 'resource');
				Vue.delete(item, 'policies');
				return item;
			},
			async deleteLicense(item) {
				var del = await this.deleteItem(abyss.ajax.licenses, item, true);
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
					this.deleteResource(item);
				}
			},
			/*deleteLicense(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(abyss.ajax.licenses + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE license response: ", response);
						this.deleteResource(item);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async licenseAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					/*if (act == 'add') {
						this.fixProps(this.license);
						var itemArr = [];
						itemArr.push(this.deleteProps(this.license));
						axios.post(abyss.ajax.licenses, itemArr).then(response => {
							console.log("addLicense response: ", response);
							if (response.data[0].status != 500 ) {
								var item = response.data[0].response;
								Vue.set(item, 'policies', _.filter(this.policyList, (v) => _.includes(item.licensedocument.termsOfService.policyKey, v.uuid)) );
								this.licenseList.push(item);
								this.$emit('set-state', 'init');
								this.license = _.cloneDeep(this.newLicense);
								this.createResource(item, 'LICENSE', item.name, item.licensedocument.info.description);
							}
						}, error => {
							this.handleError(error);
						});
					}*/
					if (act == 'add') {
						this.fixProps(this.license);
						console.log("this.deleteProps(this.license): ", this.deleteProps(this.license));
						var item = await this.addItem(abyss.ajax.licenses, this.deleteProps(this.license), this.licenseList);
						await this.createResource(item, 'LICENSE', item.name, item.licensedocument.info.description);
						Vue.set(item, 'policies', _.filter(this.policyList, (v) => _.includes(item.licensedocument.termsOfService.policyKey, v.uuid)) );
						this.$emit('set-state', 'init');
						this.license = _.cloneDeep(this.newLicense);
					}
					if (act == 'edit') {
						console.log("this.deleteProps(this.license): ", this.deleteProps(this.license));
						var item = await this.editItem( abyss.ajax.licenses, this.license.uuid, this.deleteProps(this.license), this.licenseList );
						console.log("getResources--------------: ", item);
						await this.getResources(item, 'LICENSE', item.name, item.licensedocument.info.description); // for error check
						await this.updateResource(item, 'LICENSE', item.name, item.licensedocument.info.description);
						this.$emit('set-state', 'init');
						this.license = _.cloneDeep(this.newLicense);
						this.selected = null;
					}
					/*if (act == 'edit') {
						this.updateItem(abyss.ajax.licenses + '/' + this.license.uuid, this.deleteProps(this.license), this.licenseList).then(response => {
							console.log("editLicense response: ", response);
							var item = response.data[0];
							this.getResources(item, 'LICENSE', item.name, item.licensedocument.info.description);
							setTimeout(() => {
								this.updateResource(item, 'LICENSE', item.name, item.licensedocument.info.description);
							},100);
							this.$emit('set-state', 'init');
							this.license = _.cloneDeep(this.newLicense);
							this.selected = null;
						});
					}*/
				}
			},
			/*getPage(p, d) {
				axios.get(abyss.ajax.subject_licenses_list + this.$root.rootData.user.uuid)
				.then(response => {
					this.licenseList = response.data;
					this.licenseList.forEach((value, key) => {
						Vue.set(value, 'policies', _.filter(this.policyList, (v) => _.includes(value.licensedocument.termsOfService.policyKey, v.uuid)) );
						this.getResources(value, 'LICENSE', value.name, value.licensedocument.info.description);
					});
					// this.licenseList = newLcs;
					this.paginate = this.makePaginate(this.licenseList);
					this.preload();
				}, error => {
					this.handleError(error);
				});
			},*/
			async getPage(p, d) {
				var subject_licenses_list = this.getList(abyss.ajax.subject_licenses_list + this.$root.rootData.user.uuid);
				var subject_policies_list = this.getList(abyss.ajax.subject_policies_list + this.$root.rootData.user.uuid);
				var [licenseList, policyList] = await Promise.all([subject_licenses_list, subject_policies_list]);
				Vue.set( this, 'licenseList', licenseList );
				Vue.set( this, 'policyList', policyList.filter( (item) => item.isdeleted == false ) );
				this.licenseList.forEach((value, key) => {
					Vue.set(value, 'policies', _.filter(this.policyList, (v) => _.includes(value.licensedocument.termsOfService.policyKey, v.uuid)) );
					this.getResources(value, 'LICENSE', value.name, value.licensedocument.info.description);
				});
				this.paginate = this.makePaginate(this.licenseList);
				this.preload();
				console.timeEnd();
			},
		},
		created() {
			this.$emit('set-page', 'licenses', 'init');
			this.newLicense = _.cloneDeep(this.license);
			console.time();
			this.getPage(1);
			/*axios.all([
				axios.get(abyss.ajax.subject_policies_list + this.$root.rootData.user.uuid ),
			]).then(
				axios.spread((subject_policies_list) => {
					this.policyList = subject_policies_list.data.filter( (item) => item.isdeleted == false );
					this.getPage(1);
				})
			).catch(error => {
				this.handleError(error);
			});*/
		}
	});
});