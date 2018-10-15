define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment'], function(abyss, Vue, axios, VeeValidate, _, moment) {
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
				selectedPolicy: {},
				newPolicy: {},
				policyList: [],
				policyTypes: [],
				end: []
			};
		},
		methods: {
			selectType(typ) {
				var type = this.policyTypes.find((el) => el.uuid === typ );
				Vue.set(this.policy,'policyinstance',type.template);
			},
			cancelPolicy() {
				var index = this.policyList.indexOf(this.policy);
				this.policyList[index] = this.selectedPolicy;
				this.policy = _.cloneDeep(this.newPolicy);
				this.selectedPolicy = _.cloneDeep(this.newPolicy);
				this.selected = null;
			},
			selectPolicy(item, i) {
				this.fixProps(item);
				this.selectedPolicy = _.cloneDeep(item);
				this.policy = item;
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
					}
					if (act === 'edit') {
						var resEdit = await this.editItem( abyss.ajax.policies, this.policy.uuid, this.deleteProps(this.policy), this.policyList );
						await this.getResources(resEdit, 'POLICY', resEdit.name, resEdit.description); // for error check
						await this.updateResource(resEdit, 'POLICY', resEdit.name, resEdit.description);
						this.$emit('set-state', 'init');
						this.policy = _.cloneDeep(this.newPolicy);
						this.selected = null;
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
			},
		},
		created() {
			this.$emit('set-page', 'policies', 'init');
			this.newPolicy = _.cloneDeep(this.policy);
			this.getPage(1);
		}
	});
});