// define(['Vue', 'axios', 'vee-validate', 'vue-select', 'moment', 'vue-dropzone', 'css!comps/vue2Dropzone.css'], function(Vue, axios, VeeValidate, VueSelect, moment, vueDropzone) {
define(['config', 'Vue', 'axios', 'vee-validate', 'vue-select', 'moment', 'vue-dropzone', 'css!vue-dropzone-css'], function(abyss, Vue, axios, VeeValidate, VueSelect, moment, vue2Dropzone) {
	// Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('my-apis', {
		// template: template,
		components: {
			vueDropzone: vue2Dropzone,
			'v-select': VueSelect.VueSelect
		},
		props: {
			rootState: { type: String },
			childState: { type: String },
			rootData: { type: Object }
		},
		data() {
			return {
				isLoading: true,
				isEditingMethods: false,
				sortApi: {
					key: 'x-abyss-platform.created',
					type: Date,
					order: 'desc'
				},
				sortMethod: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.my_api,
				ajaxHeaders: {},
				api: {
					"info": {
						"title": "Swagger Petstore",
						"contact": {},
						"license": {},
						"version": "1.0.0",
						"description": null,
						"termsOfService": null
					},
					"tags": [],
					"paths": {},
					"openapi": "",
					"servers": [{
						"url": null
					}],
					"x-origin": [],
					"components": {
						"headers": {},
						"schemas": {},
						"examples": {},
						"responses": {},
						"parameters": {},
						"requestBodies": {},
						"securitySchemes": {}
					},
					"externalDocs": {},
					"x-abyss-platform": {
						"apistateid": null,
						"apivisibilityid": null,
						"businessapiid": null,
						"changelog": null,
						"color": null,
						"created": null,
						"dataformat": null,
						"deleted": null,
						"deployed": null,
						"image": null,
						"isdeleted": null,
						"isproxyapi": false,
						"languagename": null,
						"languageversion": null,
						"updated": null,
						"uuid": "00000000-0000-0000-0000-000000000000",
						"tags": [],
						"groups": [],
						"categories": [],
						"proxies_summary": [],
						/////////////
						"tagList": "",
						"groupList": "",
						"categoryList": "",
						"qosPolicy": "",
						"specs": null
					}
				},
				apiOLD: {
					// uuid: "00000000-0000-0000-0000-000000000000",
					// specs: '',
					// name: '',
					// version: 'V.1.0.0',
					// created: '',
					// state: 'draft',
					// visibility: 'private',
					// context: '',
					// baseUrl: '',
					// qosPolicy: '',
					// image: '',
					// color: '',
					// description: '',
					// "tagList": "",
					// "groupList": "",
					// "categoryList": "",
					"authenticationList": "No Authentication",
					"authorizationList": "No Authorization",
					// tags: [],
					// groups: [],
					// categories: [],
					"authentication": [
						{
							"type": "noAuth",
							"enabled": true,
							"name": "No Authentication",
							"disabled": false,
							"fields": {}
						},
						{
							"type": "basic",
							"enabled": false,
							"name": "Basic Authentication",
							"disabled": false,
							"fields": {}
						},
						{
							"type": "apiKey",
							"enabled": false,
							"name": "API Key Authorization",
							"disabled": false,
							"fields": {
								"provider": "Verapi Key",
								"verapiName": "string",
								"verapiType": "verapiKey"
							}
						},
						{
							"type": "oAuth",
							"enabled": false,
							"name": "oAuth 2.0",
							"disabled": true,
							"fields": {}
						},
						{
							"type": "ldap",
							"enabled": false,
							"name": "LDAP Authentication",
							"disabled": true,
							"fields": {}
						},
						{
							"type": "saml",
							"enabled": false,
							"name": "SAML Authentication",
							"disabled": true,
							"fields": {}
						}
					],
					"authorization": [
						{
							"type": "noAuthz",
							"enabled": true,
							"name": "No Authorization",
							"disabled": false,
							"fields": {}
						},
						{
							"type": "apiKey",
							"enabled": false,
							"name": "API Key Authorization",
							"disabled": false,
							"fields": {}
						}
					],
					methods: [],
					proxies: []
				},
				"method": {
					"uuid": "00000000-0000-0000-0000-000000000000",
					"created": null,
					"verb": "GET",
					"resourcePath": null,
					"operationId": null,
					"summary": null,
					"description": null,
					"parameters": [],
					"headers": []
				},
				"parameter": {
					"uuid": "00000000-0000-0000-0000-000000000000",
					"created": null,
					"name": "",
					"description": "",
					"dataType": "",
					"required": false,
					"defaultValue": "",
					"minLength": "",
					"maxLength": "",
					"pattern": ""
				},
				"header": {
					"uuid": "00000000-0000-0000-0000-000000000000",
					"created": null,
					"name": "",
					"description": "",
					"dataType": "",
					"required": false,
					"defaultValue": "",
					"minLength": "",
					"maxLength": "",
					"pattern": ""
				},
				selectedApi: {},
				changes: {},
				isChanged: false,
				newApi: {},
				myApiList: [],

				selectedMethod: {},
				newMethod: {},

				selectedParameter: {},
				newParameter: {},

				selectedHeader: {},
				newHeader: {},

				apiOptions: [],
				categoryOptions: [],
				tagOptions: [],
				groupOptions: [],
				stateOptions: [],

				specData: null,
				dropSpecsOptions: {
					url: 'https://httpbin.org/post',
					method: 'post',
					uploadMultiple: false,
					maxFiles: 1,
					parallelUploads: 1,
					thumbnailWidth: 260,
					thumbnailHeight: 146,
					maxFilesize: 0.5,
					addRemoveLinks: true,
					acceptedFiles: '.txt, .json, .yaml, .wsdl, .wadl',
					headers: {
						"My-Awesome-Header": "header value"
					}
				},
				dropImageOptions: {
					url: 'https://httpbin.org/post',
					method: 'post',
					uploadMultiple: false,
					maxFiles: 1,
					parallelUploads: 1,
					thumbnailWidth: 260,
					thumbnailHeight: 146,
					maxFilesize: 0.5,
					addRemoveLinks: true,
					acceptedFiles: '.jpg, .png, .gif',
					headers: {
						"My-Awesome-Header": "header value"
					}
				},

				end: []
			}
		},
		methods: {
			dropSpecsSuccess(file, response) {
				console.log("file, response ", file, response);
				this.specData = response.files;
			},
			dropSpecsRemoved(file, error, xhr) {
				console.log("file, error, xhr", file, error, xhr);
				this.specData = '';
			},
			dropImageSuccess(file, response) {
				console.log("file, response ", file, response);
				// var image = new Image();
				// image.src = response.files;
				this.api['x-abyss-platform'].image = response.files;
			},
			// ■■ Header
				clickAddHeader(parent) {
					if (this.isEditingMethods) {
						this.$validator.validateAll().then((result) => {
							if (result) {
								this.openAddHeader(parent);
								$('#method'+parent.uuid).collapse('show');
							}
						});
					} else {
						this.openAddHeader(parent);
						$('#method'+parent.uuid).collapse('show');
					}
				},
				openAddHeader(parent) {
					this.$emit('set-child-state', 'add-header');
					this.header = _.cloneDeep(this.newHeader);
					this.selectedHeader = _.cloneDeep(this.newHeader);
					this.method = parent;
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				addHeader() {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.header.created = moment().toISOString();
							this.header.uuid = this.uuidv4();
							this.addItem(this.ajaxUrl, this.header, this.ajaxHeaders, this.method.headers);
							this.header = _.cloneDeep(this.newHeader);
							this.method = _.cloneDeep(this.newMethod);
							this.cleanForHeader();
							this.$emit('set-child-state', '');
						}
					});
				},
				cleanForHeader() {
					this.selectedMethod = _.cloneDeep(this.newMethod);
					this.selectedParameter = _.cloneDeep(this.newParameter);
					this.parameter = _.cloneDeep(this.newParameter);
				},
				deleteHeader(parent, item) {
					this.removeItem(this.ajaxUrl, item, this.ajaxHeaders, parent.headers);
				},
				clickSelectHeader(parent, item) {
					if (this.isEditingMethods) {
						this.$validator.validateAll().then((result) => {
							if (result) {
								this.selectHeader(parent, item);
							}
						});
					} else {
						this.selectHeader(parent, item);
					}
				},
				selectHeader(parent, item) {
					this.selectedHeader = _.cloneDeep(item);
					this.header = item;
					this.method = parent;
					this.cleanForHeader();
					this.$emit('set-child-state', 'edit-header');
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				isSelectedHeader(parent, item) {
					return parent === this.method.uuid && item === this.header.uuid;
				},
				updateHeader(item) {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.header = _.cloneDeep(this.newHeader);
							this.selectedHeader = _.cloneDeep(this.newHeader);
							this.method = _.cloneDeep(this.newMethod);
							this.$emit('set-child-state', '');
							$('.authentication-column, .authorization-column').removeClass('column-minimize');
						}
					});
				},
				cancelHeader() {
					var index = this.method.headers.indexOf(this.header);
					this.method.headers[index] = this.selectedHeader;
					this.header = _.cloneDeep(this.newHeader);
					this.selectedHeader = _.cloneDeep(this.newHeader);
					this.method = _.cloneDeep(this.newMethod);
					this.cleanForHeader();
					this.$emit('set-child-state', '');
					$('.authentication-column, .authorization-column').removeClass('column-minimize');
				},
			// ■■ Parameter
				clickAddParameter(parent) {
					if (this.isEditingMethods) {
						this.$validator.validateAll().then((result) => {
							if (result) {
								this.openAddParameter(parent);
								$('#method'+parent.uuid).collapse('show');
							}
						});
					} else {
						this.openAddParameter(parent);
						$('#method'+parent.uuid).collapse('show');
					}
				},
				openAddParameter(parent) {
					this.$emit('set-child-state', 'add-parameter');
					this.parameter = _.cloneDeep(this.newParameter);
					this.selectedParameter = _.cloneDeep(this.newParameter);
					this.method = parent;
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				addParameter() {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.parameter.created = moment().toISOString();
							this.parameter.uuid = this.uuidv4();
							this.addItem(this.ajaxUrl, this.parameter, this.ajaxHeaders, this.method.parameters);
							this.parameter = _.cloneDeep(this.newParameter);
							this.method = _.cloneDeep(this.newMethod);
							this.cleanForParameter();
							this.$emit('set-child-state', '');
						}
					});
				},
				cleanForParameter() {
					this.selectedMethod = _.cloneDeep(this.newMethod);
					this.selectedHeader = _.cloneDeep(this.newHeader);
					this.header = _.cloneDeep(this.newHeader);
				},
				deleteParameter(parent, item) {
					this.removeItem(this.ajaxUrl, item, this.ajaxHeaders, parent.parameters);
				},
				clickSelectParameter(parent, item) {
					if (this.isEditingMethods) {
						this.$validator.validateAll().then((result) => {
							if (result) {
								this.selectParameter(parent, item);
							}
						});
					} else {
						this.selectParameter(parent, item);
					}
				},
				selectParameter(parent, item) {
					this.selectedParameter = _.cloneDeep(item);
					this.parameter = item;
					this.method = parent;
					this.cleanForParameter();
					this.$emit('set-child-state', 'edit-parameter');
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				isSelectedParameter(parent, item) {
					return parent === this.method.uuid && item === this.parameter.uuid;
				},
				updateParameter(item) {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.parameter = _.cloneDeep(this.newParameter);
							this.selectedParameter = _.cloneDeep(this.newParameter);
							this.method = _.cloneDeep(this.newMethod);
							this.$emit('set-child-state', '');
							$('.authentication-column, .authorization-column').removeClass('column-minimize');
						}
					});
				},
				cancelParameter() {
					var index = this.method.parameters.indexOf(this.parameter);
					this.method.parameters[index] = this.selectedParameter;
					this.parameter = _.cloneDeep(this.newParameter);
					this.selectedParameter = _.cloneDeep(this.newParameter);
					this.method = _.cloneDeep(this.newMethod);
					this.cleanForParameter();
					this.$emit('set-child-state', '');
					$('.authentication-column, .authorization-column').removeClass('column-minimize');
				},
			// ■■ Method
				clickAddMethod() {
					if (this.isEditingMethods) {
						this.$validator.validateAll().then((result) => {
							if (result) {
								this.openAddMethod(parent);
							}
						});
					} else {
						this.openAddMethod(parent);
					}
				},
				openAddMethod() {
					this.$emit('set-child-state', 'add-method');
					this.method = _.cloneDeep(this.newMethod);
					this.selectedMethod = _.cloneDeep(this.newMethod);
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				addMethod() {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.method.created = moment().toISOString();
							this.method.uuid = this.uuidv4();
							this.addItem(this.ajaxUrl, this.method, this.ajaxHeaders, this.api.methods);
							this.method = _.cloneDeep(this.newMethod);
							this.cleanForMethod();
							this.$emit('set-child-state', '');
						}
					});
				},
				cleanForMethod() {
					this.selectedHeader = _.cloneDeep(this.newHeader);
					this.selectedParameter = _.cloneDeep(this.newParameter);
					this.parameter = _.cloneDeep(this.newParameter);
					this.header = _.cloneDeep(this.newHeader);
				},
				deleteMethod(item) {
					this.removeItem(this.ajaxUrl, item, this.ajaxHeaders, this.api.methods);
				},
				clickSelectMethod(item) {
					if (this.isEditingMethods) {
						this.$validator.validateAll().then((result) => {
							if (result) {
								this.selectMethod(item);
								$('#method'+item.uuid).collapse('show');
							}
						});
					} else {
						this.selectMethod(item);
						$('#method'+item.uuid).collapse('show');
					}
				},
				selectMethod(item, i) {
					this.$emit('set-child-state', 'edit-method');
					this.selectedMethod = _.cloneDeep(item);
					this.method = item;
					this.cleanForMethod();
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				isSelectedMethod(item) {
					return item === this.selectedMethod.uuid;
				},
				updateMethod(item) {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.method = _.cloneDeep(this.newMethod);
							this.selectedMethod = _.cloneDeep(this.newMethod);
							this.$emit('set-child-state', '');
							$('.authentication-column, .authorization-column').removeClass('column-minimize');
						}
					});
				},
				cancelMethod() {
					var index = this.api.methods.indexOf(this.method);
					this.api.methods[index] = this.selectedMethod;
					this.method = _.cloneDeep(this.newMethod);
					this.selectedMethod = _.cloneDeep(this.newMethod);
					this.cleanForMethod();
					this.$emit('set-child-state', '');
					$('.authentication-column, .authorization-column').removeClass('column-minimize');
				},
				methodBadge(item, pre) {
					if (item == 'GET') {
						return pre + '-info'
					} else if (item == 'PUT') {
						return pre + '-warning'
					} else if (item == 'POST') {
						return pre + '-success'
					} else if (item == 'DELETE') {
						return pre + '-danger'
					}
				},
				
			selectApi(item, state) {
				this.beforeCancelApi();
				axios.get(this.ajaxUrl + '?id=' + item.uuid).then(response => {
					// this.api = Object.assign(response.data.myApi, item);
					// this.api = Object.assign({}, item, response.data.myApi);
					// this.selectedApi = _.cloneDeep(item);
					// this.api = response.data.myApi;
					this.api = Object.assign(item, response.data.myApi);
					this.$emit('set-state', state);
					this.selectedApi = _.cloneDeep(this.api);
					// console.log("this.api['x-abyss-platform'].uuid: ", this.api['x-abyss-platform'].uuid);
					// $('#api'+this.api['x-abyss-platform'].uuid).collapse('show');
					if ( state != 'preview') {
						// $('.list-column').addClass('column-minimize');
						this.$refs.dropImage.removeAllFiles(true);
						if (this.api['x-abyss-platform'].image != '') {
							this.$refs.dropImage.manuallyAddFile({ size: 123, name: this.api['x-abyss-platform'].image }, this.api['x-abyss-platform'].image);
						}
					}
				}, error => {
					console.error(error);
				});
			},
			isSelectedApi(i) {
				return i === this.api['x-abyss-platform'].uuid;
			},
			beforeCancelApi() {
				if (this.isChanged) {
					var changes = [];
					for (var prop in this.changes) {
						changes.push(prop);
					}
					var r = confirm('Are you sure to cancel editing this API?' + '\nCHANGES: ' + changes.join(', '));
					if (r == true) {
						this.cancelApi()
					}
				} else {
					this.cancelApi()
				}
			},
			cancelApi() {
				var index = this.myApiList.indexOf(this.api);
				this.myApiList[index] = this.selectedApi;
				this.api = _.cloneDeep(this.newApi);
				this.selectedApi = _.cloneDeep(this.newApi);
				this.method = _.cloneDeep(this.newMethod);
				this.selectedMethod = _.cloneDeep(this.newMethod);
				this.parameter = _.cloneDeep(this.newParameter);
				this.selectedParameter = _.cloneDeep(this.newParameter);
				this.header = _.cloneDeep(this.newHeader);
				this.selectedHeader = _.cloneDeep(this.newHeader);
				this.$emit('set-state', 'init');
				this.$emit('set-child-state', '');
				this.isEditingMethods = false;
				$('.column-maximize').removeClass('column-maximize');
				this.$refs.dropSpecs.removeAllFiles(true);
				this.$refs.dropImage.removeAllFiles(true);
				this.specData = '';
				// $('.list-column').removeClass('column-minimize');
			},
			saveApi() {
				// console.log("this.myApiList: ", this.myApiList);
				// console.log("this.api: ", this.api);
				// var index = this.myApiList.indexOf(this.api);
				// console.log("index: ", index);
				// console.log("this.myApiList[index]: ", this.myApiList[index]);
				this.api['x-abyss-platform'].updated = moment().toISOString();
				axios.post(this.ajaxUrl, this.api, this.ajaxHeaders).then(response => {
					// console.log("response: ", response);
					// this.api = response.data;
					// this.selectedApi = _.cloneDeep(this.api);
					this.selectedApi = response.data;
					this.$toast('success', {message: '<strong>' + this.api.info.title + '</strong> saved', title: 'API SAVED'});
					this.isChanged = false;
					this.taxonomies();
					// var xxx = this.myApiList.filter((item) => item.uuid == this.api['x-abyss-platform'].uuid );
					// console.log("xxx: ", xxx);
				}, error => {
					alert(error.code + ': ' + error.message);
				})
			},
			chooseSpec() {
				this.$emit('set-state', 'create');
			},
			createApi() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						this.api['x-abyss-platform'].created = moment().toISOString();
						axios.post(this.ajaxUrl, this.api, this.ajaxHeaders).then(response => {
							this.addItem(this.ajaxUrl, this.api, this.ajaxHeaders, this.myApiList).then(response => {
								// alert('Form Submitted!');
								this.$emit('set-state', 'edit');
								this.selectedApi = _.cloneDeep(this.api);
								$('#api'+this.api['x-abyss-platform'].uuid).collapse('show');
								this.$toast('success', {message: '<strong>' + this.api.info.title + '</strong> successfully registered', title: 'API CREATED'});
								// $('.list-column').addClass('column-minimize');
								this.taxonomies();
							});
						}, error => {
							alert(error.code + ': ' + error.message);
						})
						return;
					}
					// alert('Correct them errors!');
				});
			},
			filterApi(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&id='+filter.id);
				}
			},
			getPage(p, d) {
				var param = d || '';
				axios.get(abyss.ajax.my_api_list + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					this.myApiList = response.data.openApiList;
					this.paginate = this.makePaginate(response.data);
					console.log("getPage: ", response.data.openApiList);
					console.log("getPage: ", response.data.openApiList[0]['x-abyss-platform'].apivisibilityid);
				}, error => {
					console.error(error);
				});
			},
			apiGetStateName(val) {
				var slcState = this.rootData.myApiStateList.find((el) => el.id == val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.rootData.myApiVisibilityList.find((el) => el.id == val );
				return slcVisibility.name;
			},
			apiGetAuthentications(item) {
				var auths = [];
				for (var prop in item.components.securitySchemes) {
					auths.push(item.components.securitySchemes[prop].type);
				}
				return auths.join(', ');
			},
			apiChangeVisibility222(item, val) {
				var slcVisibility = this.rootData.myApiVisibilityList.find((el) => el.id == val );
				var curVisibility = this.rootData.myApiVisibilityList.find((el) => el.id == item['x-abyss-platform'].apivisibilityid );
				if (slcVisibility.id != curVisibility.id) {
					item['x-abyss-platform'].apivisibilityid = slcVisibility.id;
					axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
						console.log("response: ", response);
						curVisibility.count -= 1;
						slcVisibility.count += 1;
						this.$toast('info', {message: 'Visibility changed ' + ' to <strong>' + slcVisibility.name + '</strong>', title: 'Visibility: ' + slcVisibility.name, position: 'topLeft'});
					}, error => {
						alert(error.code + ': ' + error.message);
					});
				}
			},
			apiChangeVisibility(item, val) {
				var slcVisibility = this.rootData.myApiVisibilityList.find((el) => el.id == val );
				var curVisibility = this.rootData.myApiVisibilityList.find((el) => el.id == item['x-abyss-platform'].apivisibilityid );
				if (slcVisibility.id != curVisibility.id) {
					item['x-abyss-platform'].apivisibilityid = slcVisibility.id;
					axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
						console.log("response1: ", response);
						this.$emit('get-root-data');
						console.log("response2: ", response);
						this.$toast('info', {message: 'Visibility changed ' + ' to <strong>' + slcVisibility.name + '</strong>', title: 'Visibility: ' + slcVisibility.name, position: 'topLeft'});
					}, error => {
						alert(error.code + ': ' + error.message);
					});
				}
			},
			apiChangeState(item, val) {
				var slcState = this.rootData.myApiStateList.find((el) => el.id == val );
				var curState = this.rootData.myApiStateList.find((el) => el.id == item['x-abyss-platform'].apistateid );
				if (slcState.id != curState.id) {
					item['x-abyss-platform'].apistateid = slcState.id;
					axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
						console.log("response1: ", response);
						this.$emit('get-root-data');
						console.log("response2: ", response);
						this.$toast('info', {message: 'State changed ' + ' to <strong>' + slcState.name + '</strong>', title: 'State: ' + slcState.name, position: 'topLeft'});
						if (val == 10) {
							this.removeItem(abyss.ajax.my_api_list, item, this.ajaxHeaders, this.myApiList);
						}
					}, error => {
						alert(error.code + ': ' + error.message);
					});
				}
			},
			apiChangeState222(item, val) {
				var slcState = this.rootData.myApiStateList.find((el) => el.id == val );
				var curState = this.rootData.myApiStateList.find((el) => el.id == item['x-abyss-platform'].apistateid );
				item['x-abyss-platform'].apistateid = slcState.id;
				axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
					console.log("response: ", response);
					curState.count -= 1;
					slcState.count += 1;
					this.$toast('info', {message: 'State changed ' + ' to <strong>' + slcState.name + '</strong>', title: 'State: ' + slcState.name, position: 'topLeft'});
				}, error => {
					alert(error.code + ': ' + error.message);
				});
			},
			categoriesToList() {
				if (this.rootState == 'edit' || this.rootState == 'create') {
					if (this.api['x-abyss-platform'].categories != null) {
						this.api['x-abyss-platform'].categoryList = this.api['x-abyss-platform'].categories.map(e => e.name).join(', ');
						console.log("this.api['x-abyss-platform'].categories: ", this.api['x-abyss-platform'].categories);
						console.log("this.api['x-abyss-platform'].categoryList: ", this.api['x-abyss-platform'].categoryList);
					}
				}
			},
			tagsToList() {
				if (this.rootState == 'edit' || this.rootState == 'create') {
					if (this.api['x-abyss-platform'].tags != null) {
						this.api['x-abyss-platform'].tagList = this.api['x-abyss-platform'].tags.map(e => e.name).join(', ');
					}
				}
			},
			groupsToList(item) {
				if (this.api['x-abyss-platform'].groups != null) {
					if (this.rootState == 'edit' || this.rootState == 'create') {
						this.api['x-abyss-platform'].groupList = this.api['x-abyss-platform'].groups.map(e => e.name).join(', ');
					}
				}
			},
			checkAuthentication(a, i) {
				if (i == 0 && a.enabled == true ) {
					for(var j = 1; j < this.api.authentication.length; j++){
						this.api.authentication[j].enabled = false;
					}
				} else if ( i > 0 && a.enabled == true) {
					this.api.authentication[0].enabled = false;
				}
				// var selected = this.api.authentication.filter((item) => item.enabled == true );
				var selected = this.api.authentication.filter((item, index) => item.enabled == true && index > 0);
				if (selected.length == 0) {
					this.api.authentication[0].enabled = true;
				}
				var toList = this.api.authentication.filter((item) => item.enabled == true );
				// this.api.authenticationList = toList.map(e => e.name).join(', ');
			},
			checkAuthorization(a, i) {
				if (i == 0 && a.enabled == true ) {
					for(var i = 1; i < this.api.authorization.length; i++){
						this.api.authorization[i].enabled = false;
					}
				} else if ( i > 0 && a.enabled == true) {
					this.api.authorization[0].enabled = false;
				}
				var selected = this.api.authorization.filter((item, index) => item.enabled == true && index > 0);
				if (selected.length == 0) {
					this.api.authorization[0].enabled = true;
				}
				var toList = this.api.authorization.filter((item) => item.enabled == true );
				this.api.authorizationList = toList.map(e => e.name).join(', ');
			},
			getApiOptions(search, loading) {
				loading(true)
				axios.get(abyss.ajax.my_api_list, {
					params: {
						q: search
					}
				})
				.then(response => {
					this.apiOptions = response.data.openApiList;
					loading(false);
				})
			},
			getCategoryOptions(search, loading) {
				loading(true)
				axios.get(abyss.ajax.api_category_list, {
					params: {
						name: search
					}
				})
				.then((response) => {
					this.categoryOptions = response.data.respDataList;
					loading(false);
				})
			},
			getTagOptions(search, loading) {
				loading(true)
				axios.get(abyss.ajax.api_tag_list, {
					params: {
						name: search
					}
				})
				.then((response) => {
					// this.tagOptions = response.data.respDataList;
					this.tagOptions = _.unionBy(this.rootData.myApiTagList, response.data.respDataList, 'uuid');
					loading(false);
				})
			},
			/*getGroupOptions(search, loading) {
				loading(true)
				axios.get(abyss.ajax.api_group_list, {
					params: {
						name: search
					}
				})
				.then((response) => {
					this.groupOptions = response.data.respDataList;
					loading(false);
				})
			},*/
			wwwwww() {
				if (this.isChanged) {
					console.log("this.isChanged: ", this.isChanged);
					console.log("this.changes: ", this.changes);
					this.$toast('question', {color: 'red', title: 'CHANGES!', message: this.changes});
					// console.log("toastAnswer----------: ", this.$toastAnswer() );
					// this.cancelApi2();
				} else {
					this.cancelApi2()
				}
			},
			taxonomies() {
				var newTags = this.api['x-abyss-platform'].tags.filter((item) => item.uuid == null );
				newTags.forEach((value, key) => {
					value.uuid = this.uuidv4();
					value.count = 1;
				});
				// this.api['x-abyss-platform'].tags.forEach((value, key) => {
				// 	if(this.rootData.myApiTagList.findIndex(obj => obj.uuid == value.uuid) == -1) {
				// 	// if(this.rootData.myApiTagList.indexOf(value) == -1) {
				// 		this.rootData.myApiTagList.push(value);
				// 	}
				// });
				console.log("diffffff: ", _.differenceBy(this.rootData.myApiTagList, this.api['x-abyss-platform'].tags, 'uuid'));
				this.rootData.myApiTagList = _.unionBy(this.rootData.myApiTagList, this.api['x-abyss-platform'].tags, 'uuid');
				this.rootData.myApiCategoryList = _.unionBy(this.rootData.myApiCategoryList, this.api['x-abyss-platform'].categories, 'uuid');
			},
		},
		computed: {
		},
		watch: {
			api: {
				handler(val, oldVal) {
					// console.log('old val', oldVal);
					// console.log('new val', val);
					this.changes = this.checkDiff(val, this.selectedApi);
					console.log("this.changes: ", this.changes);
					if ( Object.keys(this.changes).length == 0 || (Object.keys(this.changes).length == 1 && Object.keys(this.changes).some(v => v == 'updated')) ) {
						this.isChanged = false; 
					} else {
						this.isChanged = true; 
					}
					console.log("this.isChanged: ", Object.keys(this.changes).length, this.isChanged);
				},
				deep: true
			},
			childState: {
				handler(val, oldVal) {
					console.log('old val', oldVal);
					console.log('new val', val);
					if (val == '') {
						this.isEditingMethods = false;
					} else {
						this.isEditingMethods = true;
					}
				},
				deep: true
			}
		},
		mounted() {
			this.preload();
		},
		created() {
			// this.log(this.$options.name);
			this.$emit('set-page', 'my-apis', 'init');
			// this.$emit('set-child-state', 'xxx');
			this.newApi = _.cloneDeep(this.api);
			this.newMethod = _.cloneDeep(this.method);
			this.newParameter = _.cloneDeep(this.parameter);
			this.newHeader = _.cloneDeep(this.header);
			this.getPage(1);

		}
	});
});