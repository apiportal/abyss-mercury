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
				ajaxPolicyUrl: abyss.ajax.policies_list,
				ajaxUrl: abyss.ajax.subject_policies_list + this.$root.rootData.user.uuid,
				ajaxHeaders: {},
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
		computed: {
			xxx : {
				get() {
					return this.policy.name;
				},
			},
		},
		methods: {
			selectType(typ) {
				var type = this.policyTypes.find((el) => el.uuid == typ );
				Vue.set(this.policy,'policyinstance',type.template);
			},
			getPolicyTypes() {
				axios.get(abyss.ajax.policy_types, this.ajaxHeaders)
				.then(response => {
					if (response.data != null) {
						this.policyTypes = response.data;
					} else {
						this.policyTypes = [];
					}
				}, error => {
					this.handleError(error);
				});
			},
			cancelPolicy() {
				var index = this.policyList.indexOf(this.policy);
				this.policyList[index] = this.selectedPolicy;
				this.policy = _.cloneDeep(this.newPolicy);
				this.selectedPolicy = _.cloneDeep(this.newPolicy);
				this.selected = null;
			},
			fixProps(item) {
				if (item.subjectid == null) {
					Vue.set(item,'subjectid',this.$root.rootData.user.uuid);
				}
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
				}
				if (item.organizationid == null) {
					Vue.set(item,'organizationid',this.$root.abyssOrgId);
				}
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
			deletePolicy(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(this.ajaxPolicyUrl + item.uuid, item, this.ajaxHeaders).then(response => {
						item.isdeleted = true;
						console.log("DELETE policy response: ", response);
						this.deleteResource(item);
					}, error => {
						this.handleError(error);
					});
				}
			},
			deleteProps() {
				var item = _.cloneDeep(this.policy);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				Vue.delete(item, 'resource');
				return item;
			},
			policyAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
							this.fixProps(this.policy);
							var itemArr = [];
							itemArr.push(this.deleteProps());
							axios.post(this.ajaxPolicyUrl, itemArr, this.ajaxHeaders).then(response => {
								console.log("addPolicy response: ", response);
								if (response.data[0].status != 500 ) {
									var item = response.data[0].response;
									this.policyList.push(item);
									this.$emit('set-state', 'init');
									this.policy = _.cloneDeep(this.newPolicy);
									this.createResource(item, 'POLICY', item.name, item.description);
								}
							}, error => {
								this.handleError(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(this.ajaxPolicyUrl + this.policy.uuid, this.deleteProps(), this.ajaxHeaders, this.policyList).then(response => {
								console.log("editPolicy response: ", response);
								var item = response.data[0];
								this.getResources(item, 'POLICY', item.name, item.description);
								setTimeout(() => {
									this.updateResource(item, 'POLICY', item.name, item.description);
								},100);
								this.$emit('set-state', 'init');
								this.policy = _.cloneDeep(this.newPolicy);
								this.selected = null;
							});
						}
						return;
					}
				});
			},
			getPage(p, d) {
				axios.get(this.ajaxUrl, this.ajaxHeaders)
				.then(response => {
					this.policyList = response.data;
					this.policyList.forEach((value, key) => {
						this.getResources(value, 'POLICY', value.name, value.description);
					});
					this.paginate = this.makePaginate(this.policyList);
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
			// this.log(this.$options.name);
			this.$emit('set-page', 'policies', 'init');
			this.newPolicy = _.cloneDeep(this.policy);
			this.getPage(1);
			this.getPolicyTypes();
		}
	});
});