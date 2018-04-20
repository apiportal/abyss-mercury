// define(['Vue', 'axios', 'vee-validate', 'vue-select', 'moment', 'vue-dropzone', 'css!comps/vue2Dropzone.css'], function(Vue, axios, VeeValidate, VueSelect, moment, vueDropzone) {
define(['Vue', 'axios', 'vee-validate', 'vue-select', 'moment'], function(Vue, axios, VeeValidate, VueSelect, moment) {
	// Vue.component('vue-dropzone', vueDropzone.vueDropzone);
	// Vue.component('vue-dropzone', {
	// 	data() {
	// 		return {
	// 			checked: false,
	// 			title: 'Check me'
	// 		}
	// 	},
	// 	template: '<div class="vue-dropzone dropzone" :id="id" ref="dropzoneElement"></div>',
	// 	props: {
	// 		options: { type: Object },
	// 		mindex: { type: Number },
	// 		id: { type: String }
	// 	},
	// 	methods: {
			
	// 	}
	// });
	// Vue.use(vue2Dropzone);
	// Vue.component('dropzone', Dropzone)
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('my-apis', {
		// template: template,
		props: {
			rootState: { type: String },
			childState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
				pageState: 'init',
				// childState: 'init',
				paginate: {},
				// ajaxApiListUrl: 'http://local.abyss.com/000?file=http://local.abyss.com/data/my-api-list.json',
				// ajaxUrl: 'http://local.abyss.com/000?file=http://local.abyss.com/data/my-api-list.json',
				ajaxApiListUrl: '/data/my-api-list.json',
				ajaxUrl: 'http://www.monasdyas.com/api/api',
				// ajaxApiListUrl: 'http://192.168.21.180:18881/000?file=http://192.168.21.180:18881/data/my-api-list.json',
				// ajaxUrl: 'http://192.168.21.180:18881/000?file=http://192.168.21.180:18881/data/my-api-list.json',
				ajaxHeaders: {
					contentType: 'application/json',
					datatype: 'json',
					headers: {'Content-Type': 'application/json'}
				},
				api: {
					id: 0,
					specs: '',
					name: '',
					version: 'V.1.0.0',
					created: '',
					state: '',
					visibility: '',
					context: '',
					baseUrl: '',
					qosPolicy: '',
					image: '',
					color: '',
					description: '',
					tags: [],
					groups: [],
					categories: [],
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
					"id": 0,
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
					"id": 0,
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
					"id": 0,
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
				selectedApiIndex: null,
				newApi: {},
				myApiList: [],

				selectedMethod: {},
				selectedMethodIndex: null,
				newMethod: {},

				selectedParameter: {},
				selectedParameterIndex: null,
				newParameter: {},

				selectedHeader: {},
				selectedHeaderIndex: null,
				newHeader: {},

				apiOptions: [],
				categoryOptions: [],
				tagOptions: [],
				groupOptions: [],

				// dropzoneOptions: {
				// 	url: 'https://httpbin.org/post',
				// 	thumbnailWidth: 150,
				// 	maxFilesize: 0.5,
				// 	headers: {
				// 		"My-Awesome-Header": "header value"
				// 	}
				// },

				end: []
			}
		},
		methods: {
			// ■■ Header
				clickAddHeader(parent) {
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
							this.addItem(this.method.headers, this.header);
							this.header = _.cloneDeep(this.newHeader);
							this.method = _.cloneDeep(this.newMethod);
							this.$emit('set-child-state', '');
						}
					});
				},
				deleteHeader(parent, item) {
					this.removeItem(parent.headers, item);
				},
				selectHeader(item, i, m) {
					this.selectedHeader = _.cloneDeep(item);
					this.header = item;
					this.selectedHeaderIndex = i;
					this.selectedMethodIndex = m;
					this.$emit('set-child-state', 'edit-header');
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				isSelectedHeader(i, m) {
					return i === this.selectedHeaderIndex && m === this.selectedMethodIndex;
				},
				updateHeader(item) {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.header = _.cloneDeep(this.newHeader);
							this.selectedHeader = _.cloneDeep(this.newHeader);
							this.selectedHeaderIndex = null;
							this.selectedMethodIndex = null;
							this.$emit('set-child-state', '');
							$('.authentication-column, .authorization-column').removeClass('column-minimize');
						}
					});
				},
				cancelHeader() {
					// var index = this.method.headers.indexOf(this.header);
					// this.method.headers[index] = this.selectedHeader;
					this.header = _.cloneDeep(this.newHeader);
					this.selectedHeader = _.cloneDeep(this.newHeader);
					this.method = _.cloneDeep(this.newMethod);
					this.selectedHeaderIndex = null;
					this.$emit('set-child-state', '');
					$('.authentication-column, .authorization-column').removeClass('column-minimize');
				},
			// ■■ Parameter
				clickAddParameter(parent) {
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
							this.addItem(this.method.parameters, this.parameter);
							this.parameter = _.cloneDeep(this.newParameter);
							this.method = _.cloneDeep(this.newMethod);
							this.$emit('set-child-state', '');
						}
					});
				},
				deleteParameter(parent, item) {
					this.removeItem(parent.parameters, item);
				},
				selectParameter(item, i, m) {
					this.selectedParameter = _.cloneDeep(item);
					this.parameter = item;
					this.selectedParameterIndex = i;
					this.selectedMethodIndex = m;
					this.$emit('set-child-state', 'edit-parameter');
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				isSelectedParameter(i, m) {
					return i === this.selectedParameterIndex && m === this.selectedMethodIndex;
				},
				updateParameter(item) {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.parameter = _.cloneDeep(this.newParameter);
							this.selectedParameter = _.cloneDeep(this.newParameter);
							this.selectedParameterIndex = null;
							this.selectedMethodIndex = null;
							this.$emit('set-child-state', '');
							$('.authentication-column, .authorization-column').removeClass('column-minimize');
						}
					});
				},
				cancelParameter() {
					// var index = this.method.parameters.indexOf(this.parameter);
					// this.method.parameters[index] = this.selectedParameter;
					this.parameter = _.cloneDeep(this.newParameter);
					this.selectedParameter = _.cloneDeep(this.newParameter);
					this.method = _.cloneDeep(this.newMethod);
					this.selectedParameterIndex = null;
					this.$emit('set-child-state', '');
					$('.authentication-column, .authorization-column').removeClass('column-minimize');
				},
			// ■■ Method
				clickAddMethod() {
					this.$emit('set-child-state', 'add-method');
					this.method = _.cloneDeep(this.newMethod);
					this.selectedMethod = _.cloneDeep(this.newMethod);
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				addMethod() {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.method.created = moment().toISOString();
							this.addItem(this.api.methods, this.method);
							this.method = _.cloneDeep(this.newMethod);
							this.selectedParameter = _.cloneDeep(this.newParameter);
							this.selectedHeader = _.cloneDeep(this.newHeader);
							this.selectedParameterIndex = null;
							this.selectedHeaderIndex = null;
							this.$emit('set-child-state', '');
							return;
						}
					});
				},
				deleteMethod(item) {
					this.removeItem(this.api.methods, item);
				},
				selectMethod(item, i) {
					this.selectedMethod = _.cloneDeep(item);
					this.method = item;
					this.selectedMethodIndex = i;
					this.selectedParameter = _.cloneDeep(this.newParameter);
					this.selectedHeader = _.cloneDeep(this.newHeader);
					this.selectedParameterIndex = null;
					this.selectedHeaderIndex = null;
					this.$emit('set-child-state', 'edit-method');
					$('.authentication-column, .authorization-column').addClass('column-minimize');
				},
				isSelectedMethod(i) {
					return i === this.selectedMethodIndex;
				},
				updateMethod(item) {
					this.$validator.validateAll().then((result) => {
						if (result) {
							this.method = _.cloneDeep(this.newMethod);
							this.selectedMethod = _.cloneDeep(this.newMethod);
							this.selectedMethodIndex = null;
							this.$emit('set-child-state', '');
							$('.authentication-column, .authorization-column').removeClass('column-minimize');
							return;
						}
					});
				},
				cancelMethod() {
					var index = this.api.methods.indexOf(this.method);
					this.api.methods[index] = this.selectedMethod;
					this.method = _.cloneDeep(this.newMethod);
					this.selectedMethod = _.cloneDeep(this.newMethod);
					this.selectedMethodIndex = null;
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
				
			selectApi(item, i) {
				// axios.get('/data/my-api.json?id=' + item.id).then(response => {
				axios.get('/data/my-api.json').then(response => {
					// this.api = Object.assign(response.data.myApi, item);
					// this.api = Object.assign({}, item, response.data.myApi);
					this.selectedApi = _.cloneDeep(item);
					this.selectedApiIndex = i;
					// this.api = response.data.myApi;
					this.api = Object.assign(item, response.data.myApi);
					if ( this.rootState != 'preview') {
						$('.list-column').addClass('column-minimize');
					}
				}, error => {
					console.error(error);
				});
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
				this.selectedApiIndex = null;
				this.$emit('set-state', 'init');
				$('.column-maximize').removeClass('column-maximize');
				$('.list-column').removeClass('column-minimize');
			},
			saveApi() {
				// console.log("this.myApiList: ", this.myApiList);
				// console.log("this.api: ", this.api);
				// var index = this.myApiList.indexOf(this.api);
				// console.log("index: ", index);
				// console.log("this.myApiList[index]: ", this.myApiList[index]);
				axios.post(this.ajaxUrl, this.api, this.ajaxHeaders).then(response => {
					console.log("response: ", response);
					// var xxx = this.myApiList.filter((item) => item.id == this.api.id );
					// console.log("xxx: ", xxx);
				}, error => {
					alert(error.code + ': ' + error.message);
				})
			},
			createApi() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						this.api.date = moment().toISOString();
						axios.post(this.ajaxUrl, this.api, this.ajaxHeaders).then(response => {
							this.addItem(this.myApiList, this.api).then(response => {
								// alert('Form Submitted!');
								this.$emit('set-state', 'edit');
								$('.list-column').addClass('column-minimize');
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
				axios.get(this.ajaxApiListUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					console.log("p: ", p);
					this.myApiList = response.data.myApiList;
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
			apiListAction(item) {
				axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
					console.log("response: ", response);
				}, error => {
					alert(error.code + ': ' + error.message);
				})
			},
			checkAuthentication(a, i, e) {
				if (i == 0 && a.enabled == true ) {
					for(var i = 1; i < this.api.authentication.length; i++){
						// console.log("this.api.authentication[i].name: ", this.api.authentication[i].name);
						this.api.authentication[i].enabled = false;
					}
					console.log("e: ", e);
					// e.preventDefault();
					// e.stopPropagation();
				} else if ( i > 0 && a.enabled == true) {
					console.log("else: ", a.name, a.enabled);
					this.api.authentication[0].enabled = false;
				}
				var xxx = this.api.authentication.filter((item) => item.enabled == true );
				console.log("xxx: ", xxx);
			},
			checkAuthorization(a, i, e) {
				// this.api.authorization.forEach((value, key) => {
				// 	console.log("a.enabled: ", a.enabled);
				// 	console.log("value.enabled: ", value.enabled);
				// });
				if (i == 0 && a.enabled == true ) {
					for(var i = 1; i < this.api.authorization.length; i++){
						// console.log("this.api.authorization[i].name: ", this.api.authorization[i].name);
						this.api.authorization[i].enabled = false;
					}
				} else if ( i > 0 && a.enabled == true) {
					this.api.authorization[0].enabled = false;
				}
				var xxx = this.api.authorization.filter((item) => item.enabled == true );
				console.log("xxx: ", xxx);
				// this.api.authorization[0].enabled = false;
				// if (this.api.authorization[1].enabled == false ) {
					// this.api.authorization[0].enabled = true;
				// }
			},
			getApiOptions(search, loading) {
				loading(true)
				axios.get(this.ajaxApiListUrl, {
					params: {
						q: search
					}
				})
				.then(response => {
					console.log(response);
					this.apiOptions = response.data.myApiList;
					loading(false);
				})
			},
			getCategoryOptions(search, loading) {
				loading(true)
				axios.get('/data/api-category-list.json', {
					params: {
						name: search
					}
				})
				.then((response) => {
					console.log(response);
					this.categoryOptions = response.data.categoryList;
					loading(false);
				})
			},
			getTagOptions(search, loading) {
				loading(true)
				axios.get('/data/api-tag-list.json', {
					params: {
						name: search
					}
				})
				.then((response) => {
					console.log(response);
					this.tagOptions = response.data.tagList;
					loading(false);
				})
			},
			getGroupOptions(search, loading) {
				loading(true)
				axios.get('/data/api-group-list.json', {
					params: {
						name: search
					}
				})
				.then((response) => {
					console.log(response);
					this.groupOptions = response.data.groupList;
					loading(false);
				})
			},
		},
		computed: {
		},
		// watch: {
		// 	api: {
		// 		handler(val, oldVal) {
		// 			console.log('Item Changed', oldVal)
		// 			console.log(val)
		// 		},
		// 		deep: true
		// 	}
		// },
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
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