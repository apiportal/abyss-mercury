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
				var type = this.policyTypes.find((el) => el.uuid == typ );
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
				console.log("del: ", del);
				if (del) {
					this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
					this.deleteResource(item);
				}
			},
			/*deletePolicy(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(abyss.ajax.policies + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE policy response: ", response);
						this.deleteResource(item);
					}, error => {
						this.handleError(error);
					});
				}
			},*/
			async policyAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					/*if (act == 'add') {
						this.fixProps(this.policy);
						var itemArr = [];
						itemArr.push(this.deleteProps(this.policy));
						axios.post(abyss.ajax.policies, itemArr).then(response => {
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
					}*/
					if (act == 'add') {
						this.fixProps(this.policy);
						console.log("this.deleteProps(this.policy): ", this.deleteProps(this.policy));
						var item = await this.addItem(abyss.ajax.policies, this.deleteProps(this.policy), this.policyList);
						await this.createResource(item, 'POLICY', item.name, item.description);
						this.$emit('set-state', 'init');
						this.policy = _.cloneDeep(this.newPolicy);
					}
					if (act == 'edit') {
						var item = await this.editItem( abyss.ajax.policies, this.policy.uuid, this.deleteProps(this.policy), this.policyList );
						await this.getResources(item, 'POLICY', item.name, item.description); // for error check
						await this.updateResource(item, 'POLICY', item.name, item.description);
						this.$emit('set-state', 'init');
						this.policy = _.cloneDeep(this.newPolicy);
						this.selected = null;
					}
					/*if (act == 'edit') {
						this.updateItem(abyss.ajax.policies + '/' + this.policy.uuid, this.deleteProps(this.policy), this.policyList).then(response => {
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
					}*/
				}
			},
			/*getPageOld(p, d) {
				axios.all([
					axios.get(abyss.ajax.subject_policies_list + this.$root.rootData.user.uuid ),
					axios.get(abyss.ajax.policy_types),
				]).then(
					axios.spread((subject_policies_list, policy_types) => {
						this.policyList = subject_policies_list.data;
						this.policyList.forEach((value, key) => {
							this.getResources(value, 'POLICY', value.name, value.description);
						});
						this.paginate = this.makePaginate(this.policyList);
						this.preload();
						this.policyTypes = policy_types.data;
						console.timeEnd();
					})
				).catch(error => {
					this.handleError(error);
				});
			},*/
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
				console.timeEnd();
			},
		},
		created() {
			this.$emit('set-page', 'policies', 'init');
			this.newPolicy = _.cloneDeep(this.policy);
			console.time();
			this.getPage(1);
		}
	});
});