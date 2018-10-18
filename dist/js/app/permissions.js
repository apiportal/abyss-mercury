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
					"isactive": true,
					"resourceAction": {},
					"accessManager": {},
					"resource": {
						"resourceType": {}
					},
					"subject": {}
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
			selectPermission(item, i) {
				this.fixProps(item);
				this.selectedPermission = _.cloneDeep(item);
				this.permission = item;
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
				if (item.effectiveenddate == null) {
					Vue.set(item, 'effectiveenddate', moment.utc().add(6, 'months').format('YYYY-MM-DD HH:mm:ss'));
				}
				if (item.effectivestartdate == null) {
					Vue.set(item, 'effectivestartdate', moment.utc().format('YYYY-MM-DD HH:mm:ss'));
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'resource');
				Vue.delete(item, 'accessManager');
				Vue.delete(item, 'resourceAction');
				Vue.delete(item, 'organization');
				Vue.delete(item, 'subject');
				item.effectivestartdate = moment.utc(item.effectivestartdate).toISOString();
				item.effectiveenddate = moment.utc(item.effectiveenddate).toISOString();
				return item;
			},
			async deletePermission(item) {
				await this.deleteItem(abyss.ajax.permission_list, item, true);
			},
			async permissionAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					if (act === 'add') {
						this.fixProps(this.permission);
						await this.addItem(abyss.ajax.permission_list, this.deleteProps(this.permission));
						this.getPage(1);
						this.$emit('set-state', 'init');
						this.permission = _.cloneDeep(this.newPermission);
					}
					if (act === 'edit') {
						await this.editItem( abyss.ajax.permission_list, this.permission.uuid, this.deleteProps(this.permission) );
						this.getPage(1);
						this.$emit('set-state', 'init');
						this.permission = _.cloneDeep(this.newPermission);
						this.selected = null;
					}
				}
			},
			async filterPermission(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					// this.permissionList = await this.getItem(abyss.ajax.permission_list, filter.uuid);
					this.permissionList = [];
					this.permissionList.push(filter);
					this.setGetPage();
				}
			},
			async getPermissionOptions(search, loading) {
				loading(true);
				this.permissionOptions = await this.getList(abyss.ajax.permission_list + '?likename=' + search);
				loading(false);
			},
			async setGetPage() {
				// for (var value of this.permissionList) {
				this.permissionList.forEach(async (value, key) => {
					var rAct = _.find(this.$root.rootData.resourceActions, { 'uuid': value.resourceactionid });
					Vue.set(value, 'resourceAction', rAct );
					var rTyp = _.find(this.$root.rootData.resourceTypes, { 'uuid': rAct.resourcetypeid });
					Vue.set(value.resourceAction, 'resourceType', rTyp.type );
					var acMn = _.find(this.accessManagerOptions, { 'uuid': value.accessmanagerid });
					Vue.set(value, 'accessManager', acMn );
					var pOrg = _.find(this.orgOptions, { 'uuid': value.organizationid });
					Vue.set(value, 'organization', pOrg );
					var aTyp = _.find(this.accessManagerTypes, { 'uuid': acMn.accessmanagertypeid });
					Vue.set(value.accessManager, 'accessManagerType', aTyp );
					var resource = await this.getItem(abyss.ajax.resources, value.resourceid);
					Vue.set(value, 'resource', resource );
					var rTyp = _.find(this.$root.rootData.resourceTypes, { 'uuid': value.resource.resourcetypeid });
					Vue.set(value.resource, 'resourceType', rTyp );
					var subject = await this.getItem(abyss.ajax.subjects, value.subjectid);
					Vue.set(value, 'subject', subject );
					var sTyp = _.find(this.subjectTypes, { 'uuid': value.subject.subjecttypeid });
					Vue.set(value.subject, 'subjectType', sTyp.typename );
				});
				// }
			},
			async getPage(p, d) {
				var access_managers = this.getList(abyss.ajax.access_managers);
				var access_manager_types = this.getList(abyss.ajax.access_manager_types);
				var subject_types = this.getList(abyss.ajax.subject_types);
				var resource_list = this.getList(this.resourceEndpoint());
				var subject_list = this.getList(this.subjectEndpoint());
				var permission_list = this.getList(this.permissionEndpoint());
				var organizations_list = this.getList(abyss.ajax.organizations_list);

				var [accessManagerOptions, accessManagerTypes, subjectTypes, resourceOptions, subjectOptions, permissionList, orgOptions] = await Promise.all([access_managers, access_manager_types, subject_types, resource_list, subject_list, permission_list, organizations_list]);

				this.accessManagerOptions = accessManagerOptions;
				this.accessManagerTypes = accessManagerTypes;
				this.subjectTypes = subjectTypes;
				this.resourceOptions = resourceOptions;
				this.subjectOptions = subjectOptions;

				this.resourceActionOptions = this.$root.rootData.resourceActions;
				this.$root.rootData.resourceTypes.forEach((value, key) => {
					if (value.type == 'API') {
						Vue.set(value, 'subjectTypeId', abyss.defaultIds.subjectTypeApp ); // APP
					} else {
						Vue.set(value, 'subjectTypeId', abyss.defaultIds.subjectTypeUser ); // USER
					}
				});

				this.permissionList = permissionList;
				this.orgOptions = orgOptions;
				this.paginate = this.makePaginate(this.permissionList);
				await this.setGetPage();
				this.isLoading = false;
				this.preload();
			},
		},
		created() {
			this.$emit('set-page', 'permissions', 'init');
			this.newPermission = _.cloneDeep(this.permission);
			this.getPage(1);
		}
	});
});