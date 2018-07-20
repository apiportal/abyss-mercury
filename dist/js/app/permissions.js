define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select', 'moment', 'VueBootstrapDatetimePicker', 'eonasdan-bootstrap-datetimepicker'], function(abyss, Vue, axios, VeeValidate, _, VueSelect, moment, VueBootstrapDatetimePicker) {
	Vue.component('date-picker', VueBootstrapDatetimePicker.default);
	Vue.component('v-select', VueSelect.VueSelect);
// ■■■■■■■■ index ■■■■■■■■ //
	Vue.component('permissions', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'permission',
					type: String,
					order: 'asc'
				},
				sortCreated: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				permissionList: [],
				permissionOptions: [],
				selected: null,
				permission: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"permission": null,
					"description": null,
					"effectivestartdate": null,
					"effectiveenddate": null,
					"subjectid": null,
					"resourceid": null,
					"resourceactionid": null,
					"accessmanagerid": null,
				},
				selectedPermission: {},
				newPermission: {},

				orgOptions: [],
				resourceOptions: [],
				subjectOptions: [],
				accessManagerOptions: [],
				resourceActionOptions: [],
				date: null,
				dateConfig: {
					format: 'YYYY-MM-DD HH:mm:ss',
					useCurrent: false,
					showClear: true,
					showClose: true,
				},
				end: []
			};
		},
		methods: {
			permissionEndpoint() {
				// 2DO /subject-permissions/organization/{uuid}
				if (this.$root.rootData.user.isAdmin) {
					return abyss.ajax.permission_list;
				} else {
					return abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid;
				}
			},
			subjectEndpoint() {
				// 2DO /subjects/organization/{uuid}
				if (this.$root.rootData.user.isAdmin) {
					return abyss.ajax.subjects;
				} else {
					return abyss.ajax.subjects;
				}
			},
			resourceEndpoint() {
				if (this.$root.rootData.user.isAdmin) {
					return abyss.ajax.resources;
					// return abyss.ajax.resources_organization + this.$root.abyssOrgId;
				} else {
					return abyss.ajax.resources_subject + this.$root.rootData.user.uuid;
				}
			},
			cancelPermission() {
				var index = this.permissionList.indexOf(this.permission);
				this.permissionList[index] = this.selectedPermission;
				this.permission = _.cloneDeep(this.newPermission);
				this.selectedPermission = _.cloneDeep(this.newPermission);
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
			selectPermission(item, i) {
				this.fixProps(item);
				this.selectedPermission = _.cloneDeep(item);
				this.permission = item;
				this.selected = i;
			},
			isSelected(i) {
				return i === this.selected;
			},
			deletePermission(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.delete(abyss.ajax.permission_list + '/' + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE permission response: ", response);
					}, error => {
						this.handleError(error);
					});
				}
			},
			deleteProps() {
				var item = _.cloneDeep(this.permission);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				Vue.delete(item, 'resource');
				Vue.delete(item, 'accessManager');
				Vue.delete(item, 'resourceAction');
				Vue.delete(item, 'subject');
				item.effectivestartdate = moment(item.effectivestartdate).toISOString();
				item.effectiveenddate = moment(item.effectiveenddate).toISOString();
				return item;
			},
			permissionAction(act) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						if (act == 'add') {
							this.fixProps(this.permission);
							var itemArr = [];
							itemArr.push(this.deleteProps());
							axios.post(abyss.ajax.permission_list, itemArr, this.ajaxHeaders).then(response => {
								console.log("addPermission response: ", response);
								if (response.data[0].status != 500 ) {
									this.getPage(1);
									this.$emit('set-state', 'init');
									this.permission = _.cloneDeep(this.newPermission);
								}
							}, error => {
								this.handleError(error);
							});
						}
						if (act == 'edit') {
							this.updateItem(abyss.ajax.permission_list + '/' + this.permission.uuid, this.deleteProps(), this.ajaxHeaders, this.permissionList).then(response => {
								console.log("editPermission response: ", response);
								var item = response.data[0];
								this.$emit('set-state', 'init');
								this.permission = _.cloneDeep(this.newPermission);
								this.selected = null;
							});
						}
						return;
					}
				});
			},
			getPermissionOptions(search, loading) {
				loading(true);
				axios.get(this.permissionEndpoint() + '?likename=' + search)
				.then((response) => {
					if (response.data != null) {
						this.permissionOptions = response.data;
					} else {
						this.permissionOptions = [];
					}
					loading(false);
				}, error => {
					this.handleError(error);
					loading(false);
				});
			},
			filterPermission(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					axios.get(this.permissionEndpoint())
					.then(response => {
						if (response.data != null) {
							this.permissionList = [];
							this.permissionList.push(filter);
							this.setPage();
						}
					}, error => {
						this.handleError(error);
					});
				}
			},
			setPage() {
				this.permissionList.forEach((value, key) => {
					var rAct = _.find(this.$root.rootData.resourceActions, { 'uuid': value.resourceactionid });
					Vue.set(value, 'resourceAction', rAct );
					var rTyp = _.find(this.$root.rootData.resourceTypes, { 'uuid': rAct.resourcetypeid });
					Vue.set(value.resourceAction, 'resourceType', rTyp.type );
					var acMn = _.find(this.accessManagerOptions, { 'uuid': value.accessmanagerid });
					Vue.set(value, 'accessManager', acMn );
					var aTyp = _.find(this.accessManagerTypes, { 'uuid': acMn.accessmanagertypeid });
					Vue.set(value.accessManager, 'accessManagerType', aTyp );
					axios.get(abyss.ajax.resources + value.resourceid).then(response => {
						Vue.set(value, 'resource', response.data[0] );
						var rTyp = _.find(this.$root.rootData.resourceTypes, { 'uuid': value.resource.resourcetypeid });
						Vue.set(value.resource, 'resourceType', rTyp.type );
					}, error => {
						this.handleError(error);
					});
					axios.get(abyss.ajax.subjects + '/' + value.subjectid).then(response => {
						Vue.set(value, 'subject', response.data[0] );
						var sTyp = _.find(this.subjectTypes, { 'uuid': value.subject.subjecttypeid });
						Vue.set(value.subject, 'subjectType', sTyp.typename );
					}, error => {
						this.handleError(error);
					});
				});
			},
			getPage(p, d) {
				axios.all([
					axios.get(this.permissionEndpoint()),
				]).then(
					axios.spread((permission_list) => {
						this.permissionList = permission_list.data;
						this.paginate = this.makePaginate(permission_list.data);
						this.setPage();
						this.preload();
					})
				).catch(error => {
					this.handleError(error);
				});
			},
		},
		mounted() {
			
		},
		created() {
			// this.log(this.$options.name);
			this.$emit('set-page', 'permissions', 'init');
			this.newPermission = _.cloneDeep(this.permission);
			axios.all([
				axios.get(abyss.ajax.access_managers),
				axios.get(abyss.ajax.access_manager_types),
				axios.get(abyss.ajax.subject_types),
				axios.get(this.resourceEndpoint()),
				axios.get(this.subjectEndpoint()),
				axios.get(abyss.ajax.organizations_list),
			]).then(
				axios.spread((access_managers, access_manager_types, subject_types, resources, subjects, organizations_list) => {
					this.accessManagerTypes = access_manager_types.data;
					this.subjectTypes = subject_types.data;
					this.accessManagerOptions = access_managers.data;
					this.resourceOptions = resources.data;
					this.subjectOptions = subjects.data;
					// this.orgOptions = this.$root.rootData.user.organizations;
					this.orgOptions = organizations_list.data;
					this.resourceActionOptions = this.$root.rootData.resourceActions;
					this.getPage(1);
				})
			).catch(error => {
				this.handleError(error);
			});
		}
	});
});