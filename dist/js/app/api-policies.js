define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue!schema-template-form'], function(abyss, Vue, axios, VeeValidate, _, moment) {
	Vue.component('policy-types', {
		props: ['t','index', 'orgoptions'],
		data() {
			return {};
		},
		computed: {
			stringifyTemplate : {
				get() {
					return JSON.stringify(this.t.template, null, '\t');
				},
				set(newVal) {
					this.t.template = JSON.parse(newVal);
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
	Vue.component('api-policies', {
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
				policy: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"subjectid": null,
					"name": null,
					"description": null,
					"typeid": null,
					"policyinstance": {},
				},
				template: null,
				selectedPolicy: {},
				newPolicy: {},
				policyList: [],
				policyTypes: [],
				orgOptions: [],
				end: []
			};
		},
		computed: {
			stringifyAttribute : {
				get() {
					return JSON.stringify(this.policy.policyinstance, null, '\t');
				},
				set(newVal) {
					this.policy.policyinstance = JSON.parse(newVal);
				}
			},
		},
		methods: {
			getTemplate(typ, clear) {
				if (clear) {
					Vue.set(this.policy, 'policyinstance', {
						"openApiLifeCycle": {
							"onProxyRequest": true,
							"onProxyResponse": true,
							"onBusinessRequest": true,
							"onBusinessResponse": true
						}
					} );
				}
				var type = this.policyTypes.find((el) => el.uuid === typ );
				this.template = _.cloneDeep(type.template);
				Vue.set(this.policy.policyinstance, 'info', {} );
				Vue.set(this.policy.policyinstance.info, 'type', this.template.info['x-type'] );
				Vue.set(this.policy.policyinstance.info, 'subType', this.template.info['x-subType'] );
				Vue.delete(this.policy.policyinstance, 'configuration');
				// Vue.set(this.policy.policyinstance.info, 'title', this.template.info.title );
				// Vue.set(this.policy.policyinstance.info, 'description', this.template.info.description );
			},
			addItemToConfig(item, arr) {
				newItem = _.cloneDeep(item);
				arr.push(newItem);
			},
			removeItemToConfig(index, arr) {
				arr.splice(index,1);
			},
			addType() {
				var ttt = _.findIndex(this.policyTypes, function(o) { return o.typename == 'newType'; });
				if (ttt == -1) {
					var newType = _.cloneDeep(this.policyType);
					this.policyTypes.push(newType);
				}
				var i = this.policyTypes.length - 1;
				setTimeout(() => {
					$('#t'+i).collapse('show');
				},0);
			},
			cancelAddType(t) {
				var index = this.policyTypes.indexOf(t);
				this.policyTypes.splice(index, 1);
			},
			async saveAddType(item) {
				this.fixProps(item);
				await this.addItem( abyss.ajax.policy_types, this.deleteProps(item), this.policyTypes );
				this.cancelAddType(item);
				this.$emit('set-state', 'init');
			},
			async saveType(item) {
				await this.editItem( abyss.ajax.policy_types, item.uuid, this.deleteProps(item), this.policyTypes );
				this.$emit('set-state', 'init');
			},
			async deleteType(item) {
				await this.deleteItem(abyss.ajax.policy_types, item, true);
			},
			getTypeName(typ) {
				var type = this.policyTypes.find((el) => el.uuid == typ );
				if (type) {
					return type.type;
				} else {
					return false;
				}
			},
			getSubTypeName(typ) {
				var type = this.policyTypes.find((el) => el.uuid == typ );
				if (type) {
					return type.subtype;
				} else {
					return false;
				}
			},
			cancelPolicy() {
				var index = this.policyList.indexOf(this.policy);
				this.policyList[index] = this.selectedPolicy;
				this.policy = _.cloneDeep(this.newPolicy);
				this.selectedPolicy = _.cloneDeep(this.newPolicy);
				this.selected = null;
				this.template = null;
			},
			selectPolicy(item, i) {
				this.fixProps(item);
				this.selectedPolicy = _.cloneDeep(item);
				this.policy = item;
				this.getTemplate(this.policy.typeid);
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
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'resource');
				return item;
			},
			async deletePolicy(item) {
				var del = await this.deleteItem(abyss.ajax.policies, item, true);
				if (del) {
					item.isdeleted = true;
					this.deleteResource(item);
				}
			},
			async policyAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act === 'add') {
						this.fixProps(this.policy);
						console.log("this.deleteProps(this.policy): ", this.deleteProps(this.policy));
						var resAdd = await this.addItem(abyss.ajax.policies, this.deleteProps(this.policy), this.policyList);
						await this.createResource(resAdd, 'POLICY', resAdd.name, resAdd.description);
						await this.getPage(1);
						this.$emit('set-state', 'init');
						this.policy = _.cloneDeep(this.newPolicy);
						this.template = null;
					}
					if (act === 'edit') {
						var resEdit = await this.editItem( abyss.ajax.policies, this.policy.uuid, this.deleteProps(this.policy), this.policyList );
						await this.getResources(resEdit, 'POLICY', resEdit.name, resEdit.description); // for error check
						await this.updateResource(resEdit, 'POLICY', resEdit.name, resEdit.description);
						await this.getPage(1);
						this.$emit('set-state', 'init');
						this.policy = _.cloneDeep(this.newPolicy);
						this.selected = null;
						this.template = null;
					}
				}
			},
			async getPage(p, d) {
				var subject_policies_list = this.getList(abyss.ajax.subject_policies_list + this.$root.rootData.user.uuid);
				var policy_types = this.getList(abyss.ajax.policy_types);
				var organizations_list = this.getList(abyss.ajax.organizations_list);
				var [policyList, policyTypes, orgOptions] = await Promise.all([subject_policies_list, policy_types, organizations_list]);
				Vue.set( this, 'policyList', policyList );
				Vue.set( this, 'orgOptions', _.orderBy(orgOptions, [item => item['name'].toLowerCase()], 'asc') );
				this.paginate = this.makePaginate(this.policyList);
				this.preload();
				this.policyList.forEach((value, key) => {
					this.getResources(value, 'POLICY', value.name, value.description);
				});
				Vue.set( this, 'policyTypes', policyTypes );
				console.log("policyTypes: ", policyTypes);
			},
		},
		created() {
			this.$emit('set-page', 'policies', 'init');
			this.newPolicy = _.cloneDeep(this.policy);
			this.getPage(1);
		}
	});
});