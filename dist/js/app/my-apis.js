define(['Vue', 'axios', 'vee-validate', 'vue-select'], function(Vue, axios, VeeValidate, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('apiMethods', {
		data() {
			return {
				checked: false,
				title: 'Check me'
			}
		},
		props: {
			method: { type: Object },
			mindex: { type: Number },
			name: { type: String }
		},
		methods: {
			
		}
	});
	Vue.component('apiMethodParams', {
		// mixins: [myMixin],
		data() {
			return {
				checked: false,
				title: 'Check me'
			}
		},
		props: {
			method: { type: Object },
			item: { type: Object },
			mindex: { type: Number },
			pindex: { type: Number },
			name: { type: String }
		},
		methods: {
			addParam(e) {
				// console.log("this: ", this);
				// console.log("this.param: ", this.param);
				// console.log("this.method: ", this.method);
				// console.log("this.parameters: ", this.parameters);
				this.addItem(this.method.parameters, this.param);
				// this.$parent.resetItem(this.param);
				this.resetItem(this.param);
				// this.param.key = '';
				// this.param.description = '';
				// this.param.dataType = '';
				// this.param.condition = '';
				// this.param.caching = false;
			},
			removeParam(e) {
				// console.log("this.param: ", this.param);
				this.removeItem(this.method.parameters, this.index);
			}
		}
	});
	Vue.component('my-apis', {
		// template: template,
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'date',
					type: Date,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: '/data/my-api-list.json',
				testUrl: 'http://www.monasdyas.com/api/api',
				ajaxHeaders: {
					contentType: 'application/json',
					datatype: 'json',
					headers: {'Content-Type': 'application/json'}
				},
				selected: null,
				api: {
					id: 0,
					specs: '',
					name: '',
					version: '',
					date: '',
					status: '',
					context: '',
					baseUrl: '',
					qosPolicy: '',
					description: '',
					tags: [],
					group: [],
					categories: [],
					authentication: {
						"noAuth": {
							"enabled": true,
							"name": "No Authentication"
						},
						"basic": {
							"enabled": false,
							"name": "Basic Authentication"
						},
						"apiKey": {
							"enabled": false,
							"name": "API Key Authentication",
							"provider": "Verapi Key",
							"verapiName": "string",
							"verapiType": "verapiKey"
						},
						"oAuth": {
							"enabled": false,
							"name": "oAuth 2.0"
						},
						"ldap": {
							"enabled": false,
							"name": "LDAP Authentication"
						},
						"saml": {
							"enabled": false,
							"name": "SAML Authentication"
						}
					},
					authorization: {
						"noAuthz": {
							"enabled": true,
							"name": "No Authorization"
						},
						"apiKey": {
							"enabled": false,
							"name": "API Key Authorization",
						}
					},
					methods: [],
					proxies: []
				},
				"newMethod": [
					{
						"verb": "GET",
						"resourcePath": "",
						"operationId": "",
						"summary": "",
						"description": "",
						"parameters": [
							{
								"id": 0,
								"name": "",
								"description": "",
								"dataType": "",
								"required": false,
								"defaultValue": "",
								"minLength": "",
								"maxLength": "",
								"pattern": ""
							}
						],
						"headers": [
							{
								"id": 0,
								"name": "",
								"description": "",
								"dataType": "",
								"required": false,
								"defaultValue": "",
								"minLength": "",
								"maxLength": "",
								"pattern": ""
							}
						]
					},
				],
				selectedApi: {},
				newApi: {},
				myApiList: [],

				apiOptions: [],
				categoryOptions: [],
				tagOptions: [],
				groupOptions: [],

				end: []
			}
		},
		watch: {
			api: {
				handler(val, oldVal) {
					console.log('Item Changed', oldVal)
					console.log(val)
				},
				deep: true
			}
		},
		methods: {
			selectApi(item, i) {
				// axios.get('/data/my-api.json?id=' + item.id).then(response => {
				axios.get('/data/my-api.json').then(response => {
					console.log("response: ", response);
					this.api = response.data.myApi;
					console.log("this.api: ", this.api);
					this.selectedApi = _.cloneDeep(item);
					this.selected = i;
				}, error => {
					console.error(error);
				});
			},
			cancelApi() {
				this.$emit('set-state', 'init');
				this.api = _.cloneDeep(this.newApi);
				this.selectedApi = _.cloneDeep(this.newApi);
				this.selected = null;
				$('.column-maximize').removeClass('column-maximize');
				$('.list-column').removeClass('column-minimize');
			},
			createApi() {
				$('.list-column').addClass('column-minimize');
			},
			filterApi(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&id='+filter.id);
				}
			},
			getApiOptions(search, loading) {
				loading(true)
				axios.get(this.ajaxUrl, {
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
			getPage(p, d) {
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					console.log("p: ", p);
					this.myApiList = response.data.myApiList;
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
			checkAuthentications() {
				this.api.authentication.noAuth.enabled = false;
				if (this.api.authentication.apiKey.enabled == false && this.api.authentication.oAuth.enabled == false && this.api.authentication.basic.enabled == false && this.api.authentication.ldap.enabled == false && this.api.authentication.saml.enabled == false ) {
					this.api.authentication.noAuth.enabled = true;
				}
			},
			checkNoAuthentication() {
				this.api.authentication.apiKey.enabled = false;
				this.api.authentication.oAuth.enabled = false;
				this.api.authentication.basic.enabled = false;
				this.api.authentication.ldap.enabled = false;
				this.api.authentication.saml.enabled = false
			},
			checkAuthorizations() {
				this.api.authorization.noAuthz.enabled = false;
				if (this.api.authorization.apiKey.enabled == false && this.api.authorization.oAuth.enabled == false && this.api.authorization.basic.enabled == false && this.api.authorization.ldap.enabled == false && this.api.authorization.saml.enabled == false ) {
					this.api.authorization.noAuthz.enabled = true;
				}
			},
			checkNoAuthorization() {
				this.api.authorization.apiKey.enabled = false;
				this.api.authorization.oAuth.enabled = false;
				this.api.authorization.basic.enabled = false;
				this.api.authorization.ldap.enabled = false;
				this.api.authorization.saml.enabled = false
			},
			methodBadge(item) {
				if (item == 'GET') {
					return 'badge-info'
				} else if (item == 'PUT') {
					return 'badge-warning'
				} else if (item == 'POST') {
					return 'badge-success'
				} else if (item == 'DELETE') {
					return 'badge-danger'
				}
			},
			validateBeforeSubmit() {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						// alert('Form Submitted!');
						// this.setState('edit');
						this.$emit('set-state', 'edit');
						return;
					}
					// alert('Correct them errors!');
				});
			},
		},
		computed: {
		},
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'my-apis', 'init');
			this.newApi = _.cloneDeep(this.api);
			this.getPage(1);
		}
	});
});