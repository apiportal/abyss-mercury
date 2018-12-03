define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue!schema-template-form'], function(abyss, Vue, axios, VeeValidate, _, moment) {
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
			getTemplate(typ) {
				var type = this.policyTypes.find((el) => el.uuid === typ );
				this.template = _.cloneDeep(type.template);
				// Vue.set(this.policy,'policyinstance',type.template);
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
						this.$emit('set-state', 'init');
						this.policy = _.cloneDeep(this.newPolicy);
						this.template = null;
					}
					if (act === 'edit') {
						var resEdit = await this.editItem( abyss.ajax.policies, this.policy.uuid, this.deleteProps(this.policy), this.policyList );
						await this.getResources(resEdit, 'POLICY', resEdit.name, resEdit.description); // for error check
						await this.updateResource(resEdit, 'POLICY', resEdit.name, resEdit.description);
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
				var [policyList, policyTypes] = await Promise.all([subject_policies_list, policy_types]);
				Vue.set( this, 'policyList', policyList );
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