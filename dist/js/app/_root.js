// define(['Vue', 'axios', 'vee-validate', 'moment'], function (Vue, axios, VeeValidate, moment) {
// define(['config', 'Vue', 'axios', 'vee-validate', 'tiny-cookie', 'vue-cookie', 'moment', 'izitoast', 'vue-izitoast'], function (abyss, Vue, axios, VeeValidate, Cookie, VueCookie, moment, iziToast) {
define(['config', 'Vue', 'axios', 'vee-validate', 'vue-cookie', 'moment', 'izitoast', 'vue-izitoast'], function (abyss, Vue, axios, VeeValidate, VueCookie, moment, iziToast) {

	axios.defaults.headers.common['Accept'] = 'application/json';
	axios.defaults.headers.common['Content-Type'] = 'application/json';
	// if (abyss.isAbyssSandbox) {
	// 	axios.defaults.headers.common['Cookie'] = 'abyss.session='+abyss.session;
	// }
	axios.defaults.withCredentials = abyss.abyssCredentials;
	axios.defaults.timeout = 10000;
	axios.defaults.responseType = 'json';
	axios.defaults.validateStatus = function (status) {
		// return status >= 200 && status < 300; // default
		return (status >= 200 && status < 300) || status == 404;
	};
	axios.interceptors.response.use((response) => {
		if (response.status == 404) {
			var res = {};
			res.data = [];
			// console.log('404 response', response);
			return res;
		} else{
			// console.log(response.status + ": ", response);
			return response;
		}
	}, (error) => {
		console.log("interceptors: ", error);
		if ( error.response.status == 401) {
			// alert('Your session has expired');
			window.location.href = '/abyss/login';
		}
		return error;
		// return Promise.reject(error);
	});
	// Window.Vue = Vue;
	// Window.Vue.use(VueIziToast);
	// Vue.prototype.$toast = VueIziToast;
	Vue.use(MyToaster);
	Vue.use(VeeValidate);
	Vue.use(VueCookie);
	const dictionary = {
		en: {
			attributes: {
				username: 'Username',
				oldPassword: 'Old Password',
				newPassword: 'Password',
				confirmPassword: 'Confirm Password',
				password: 'Password',
				first_name: 'First Name', 
				last_name: 'Last Name', 
				subject_name: 'Subject Name', 
				display_name: 'Display Name', 
				email: 'Email', 
				group_name: 'Group Name', 
				description: 'Description', 
				effective_start_date: 'Effective Start Date', 
				effective_end_date: 'Effective End Date', 
			}
		}
	};
	VeeValidate.Validator.localize(dictionary);
	VeeValidate.Validator.extend('password_strength', {
		getMessage: field => 'The password must contain at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (!?=#*$@+-.,)',
		validate: value => {
			// var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
			// !?=#*$@+-.
			var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!\?@,=#\$%\^\+\-\.&\*])(?=.{8,})");
			return strongRegex.test(value);
			// !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
			// . ^ $ * + - ? ( ) [ ] { } \ |
			// !#%&'/:;<=>\$\(\)\*\+,\-\.\\?\[\]\^\{\|\}_`~@
		}
	});
// ■■■■■■■■ FILTERS ■■■■■■■■ //
	Vue.filter('formatDateTime', function(value) {
		if (value) {
			return moment(String(value)).format('DD.MM.YYYY hh:mm');
		}
	});
	Vue.filter('formatDate', function(value) {
		if (value) {
			return moment(String(value)).format('DD.MM.YYYY');
		}
	});
	Vue.filter('listCommaSeparated', function(item) {
		console.log("listCommaSeparated: ", item);
		if (item.length) {
			return item.map(e => e.name).join(', ');
		}
	});
// ■■■■■■■■ MIXINS ■■■■■■■■ //
	Vue.mixin({
		methods: {
			log(name) {
				console.log(name , this);
			},
			uuidv4() {
				return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
					(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
				);
			},
			generatePassword(numLc, numUc, numDigits, numSpecial) {
				numLc = numLc || 4;
				numUc = numUc || 2;
				numDigits = numDigits || 2;
				numSpecial = numSpecial || 2;
				var lcLetters = 'abcdefghijklmnopqrstuvwxyz';
				var ucLetters = lcLetters.toUpperCase();
				var numbers = '0123456789';
				var special = '!?=#*$@+-.,';
				var getRand = function(values) {
					return values.charAt(Math.floor(Math.random() * values.length));
				};
				function shuffle(o){ //v1.0
					for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
					return o;
				}
				var pass = [];
				for(var i = 0; i < numLc; ++i) { pass.push(getRand(lcLetters)) }
				for(var i = 0; i < numUc; ++i) { pass.push(getRand(ucLetters)) }
				for(var i = 0; i < numDigits; ++i) { pass.push(getRand(numbers)) }
				for(var i = 0; i < numSpecial; ++i) { pass.push(getRand(special)) }
				return shuffle(pass).join('');
			},
			getObjCount(obj) {
				var count = 0;
				if (obj) {
					var el = Object.keys(obj);
					count = el.length;
					if (el) {
						return el.length;
					}
				} else {
					return 0;
				}
			},
			preload() {
				// $(document).ready(function() {
					$(".preloader-it").fadeOut("slow");
					$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
					// this.isLoading = false;
				// });
			},
			preloadInit() {
				$('.preloader-it > .la-anim-1').addClass('la-animate');
			},
			makePaginate(data) {
				let paginate = {
					pages: [],
					first: data.first,
					last: data.last,
					pageSize: data.pageSize,
					totalPages: data.totalPages,
					totalItems: data.totalItems,
					currentPage: data.currentPage
				};
				for (var i = 1; i < paginate.totalPages; i++) {
					paginate.pages.push(i);
				}
				// console.log("paginate: ", paginate);
				return paginate;
			},
			//2DO
			handleErrorStatus(status) {
				return status < 500; // Reject only if the status code is greater than or equal to 500
			},
			handleError(error) {
				/*if (error.response) {
					// The request was made and the server responded with a status code
					// that falls out of the range of 2xx
					console.log("error.response.data", error.response.data);
					console.log("error.response.status", error.response.status);
					console.log("error.response.headers", error.response.headers);
				}
				else if (error.request) {
					// The request was made but no response was received
					// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
					// http.ClientRequest in node.js
					console.log("error.request", error.request);
				}
				else {
					// Something happened in setting up the request that triggered an Error
					console.log('error.message', error.message);
				}
				console.log("error.config", error.config);*/
				console.log("error: ", error);
				// console.log("error.response.status: ", error.response.status);
				/*if ( error.response.status == 401) {
					alert('Your session has expired');
					window.location.href = '/abyss/login';
				}*/
			},
			getItem(url, item) {
				return axios.get(url + item, this.ajaxHeaders).then(response => {
					return response;
				}, error => {
					this.handleError(error);
				});
			},
			updateItem(url, item, head, arr) {
				return axios.put(url, item, head).then(response => {
				// return axios.post(url, item, head).then(response => {
					// console.log("PUT item: ", item);
					// console.log("PUT response: ", response);
					return response;
				}, error => {
					this.handleError(error);
				});
			},
			addItem(url, item, head, arr) {
				return axios.post(url, item, head).then(response => {
					console.log("POST item: ", item);
					console.log("POST response: ", response);
					// arr.push(item);
					if (response.data[0].status != 500 ) {
						arr.push(response.data[0].response);
					}
					// if (_.isArray(arr)) {
					// 	if (response.data[0].status != 500 ) {
					// 		arr.push(response.data[0]);
					// 	}
					// } else {
					// 	arr.push(response.data);
					// }
					console.log("arr: ", arr);
					return response;
				}, error => {
					this.handleError(error);
				});
			},
			removeItem(url, item, head, arr) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					return axios.delete(url, item, head).then(response => {
						console.log("DELETE response: ", response);
						var index = arr.indexOf(item);
						arr.splice(index, 1);
						return response;
					}, error => {
						this.handleError(error);
					});
				} else {
					console.log("CANCEL: ");
					return false;
				}
			},
			checkDiff(object, base) {
				function changes(object, base) {
					// return _.transform(object, function(result, value, key) {
					return _.transform(object, (result, value, key) => {
						if (!_.isEqual(value, base[key])) {
							result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
						}
					});
				}
				return changes(object, base);
			},
			sortBy(srt, arr) {
				if (srt.type == String) {
					return _.orderBy(arr, [item => item[srt.key].toLowerCase()], srt.order);
				} else if (srt.type == Array) {
					return _.orderBy(arr, (item) => { return item[srt.key].length; }, srt.order);
				} else {
					// console.log("---------", arr, srt.key, srt.order, srt.type);
					return _.orderBy(arr, srt.key, srt.order);
				}
				// _.orderBy(users, ['user', function (o) {
				//    return o.likes.length;
				// }], ["asc", "asc"]);
				// _.orderBy(data, [
				//   function (item) { return item.sortData.a; },
				//   function (item) { return item.sortData.b; }
				// ], ["asc", "desc"]);
			},
			nestedResolve( path, obj ) {
				return path.split('.').reduce( function( prev, curr ) {
					return prev ? prev[curr] : undefined;
				}, obj || this );
			},
			sortByNested(srt, arr) {
				if (srt.type == String) {
					return _.orderBy(arr, [item => this.nestedResolve(srt.key, item).toLowerCase()], srt.order);
				} else if (srt.type == Array) {
					return _.orderBy(arr, (item) => { return this.nestedResolve(srt.key, item).length; }, srt.order);
				} else {
					return _.orderBy(arr, srt.key, srt.order);
				}
			},
			sortByKeys(obj) {
				var ordered = {};
				Object.keys(obj).sort().forEach(function(key) {
					ordered[key] = obj[key];
				});
				return ordered;
			},
			sortList(srt, key, typ, ord) {
				if (key === srt.key) {
					srt.order = srt.order === 'asc' ? 'desc' : 'asc';
				}
				srt.key = key;
				if (typ) {
					srt.type = typ;
				}
				if (ord) {
					srt.order = ord;
				}
				// event.target.classList.remove('asc', 'desc')
				// event.target.classList.add(srt.order)
				// $event
			},
			selectProxy(item, state) {
				axios.get(abyss.ajax.api_licenses_api + item.uuid, this.ajaxHeaders).then(response => {
					if (response.data != null) {
						var apiLicenses = response.data.filter( (item) => item.isdeleted == false );
						var licenses = [];
						apiLicenses.forEach((value, key) => {
							axios.get(abyss.ajax.licenses_list + value.licenseid)
							.then(response => {
								licenses.push(response.data[0]);
							}, error => {
								this.handleError(error);
							});
						});
						setTimeout(() => {
							this.api = _.cloneDeep(item);
							this.$root.setState(state);
							this.selectedApi = _.cloneDeep(this.api);
							Vue.set(this.api, 'licenses', licenses);
							require(['slimscroll'],function(){
								$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
							});
							axios.get(abyss.ajax.contracts_api + this.api.uuid)
							.then(response => {
								var allApiContracts = response.data.filter( (item) => item.isdeleted == false );
								var allMyApiContracts = response.data.filter( (item) => item.isdeleted == false && item.crudsubjectid == this.$root.rootData.user.uuid );
								console.log("allApiContracts: ", allApiContracts);
								console.log("this.api.licenses: ", this.api.licenses);
								// var ddd = _.filter(response.data, { 'apiid': this.api.uuid, 'licenseid': this.api.licenses.uuid });
								// var ddd = _.filter(cont, (item) => _.find(this.api.licenses, { uuid: item.uuid }));
								//2DO
								// var ddd = _.filter(this.api.licenses, { 'apiid': this.api.uuid });
								var actLcs = _.find(this.api.licenses, (v) => _.includes(allApiContracts.map(e => e.licenseid), v.uuid));
								Vue.set(actLcs, 'isactive', true);
								// Vue.set(allApiContracts, 'activelicense', actLcs.uuid);
								console.log("actLcs: ", actLcs);
							}, error => {
								this.handleError(error);
							});
						},100);	
					}
				}, error => {
					this.handleError(error);
				});
			},
			setProxyLicense(i) {
				console.log("i: ", i);
			},
			deleteResource(item) {
				axios.delete(abyss.ajax.resources, item, this.ajaxHeaders).then(response => {
					console.log("DELETE response: ", response);
				}, error => {
					this.handleError(error);
				});
			},
			getResources(item, typ, name, desc) {
				axios.get(abyss.ajax.resources, this.ajaxHeaders)
				// axios.get(abyss.ajax.resources_ref + item.uuid, this.ajaxHeaders)
				.then(response => {
					var res = response.data.find( (e) => e.resourcerefid == item.uuid );
					if (res) {
						Vue.set(item, 'resource', res );
					} else {
						this.createResource(item, typ, name, desc);
					}
					// Vue.set(item, 'resource', response.data );
					// !! remove
				}, error => {
					this.handleError(error);
				});
			},
			updateResource(item, typ, name, desc) {
				var resType = this.$root.rootData.resourceTypes.find((e) => e.type == typ );
				var descript = desc || '';
				var resource = {
					"organizationid": item.resource.organizationid,
					"crudsubjectid": item.resource.crudsubjectid,
					"resourcetypeid": item.resource.resourcetypeid,
					"resourcename": name + ' ' + resType.type,
					"description": descript,
					"resourcerefid": item.uuid
				};
				console.log("resource: ", resource);
				this.updateItem(abyss.ajax.resources + item.resource.uuid, resource, this.ajaxHeaders).then(response => {
					var res = response.data[0];
					console.log("updateResource response: ", response);
					Vue.set(item, 'resource', res );
				});
			},
			createResource(item, typ, name, desc) {
				var resType = this.$root.rootData.resourceTypes.find((e) => e.type == typ );
				var descript = desc || '';
				var resource = {
					"organizationid": this.$root.abyssOrgId,
					"crudsubjectid": this.$root.rootData.user.uuid,
					"resourcetypeid": resType.uuid, //fixed APP
					"resourcename": name + ' ' + resType.type, //api.info.title + API
					"description": descript, //api.info.description + api.info.version
					"resourcerefid": item.uuid //api.uuid
				};
				var itemArr = [];
				itemArr.push(resource);
				console.log("RESOURCE!!!!: ", itemArr);
				axios.post(abyss.ajax.resources, itemArr, this.ajaxHeaders).then(response => {
					console.log("resources response: ", response);
					var res = response.data[0];
					if (response.data[0].status != 500 ) {
						Vue.set(item, 'resource', res );
					}
				}, error => {
					this.handleError(error);
				});
			},
			isSelectedProxy(i) {
				return i === this.api.uuid;
			},
			cancelProxy() {
				// console.log("cancelProxy: ",);
				this.api = {};
				this.selectedApi = {};
				if (this.$root.pageCurrent == 'my-apps') {
					this.$root.setState('edit');
				} else {
					this.$root.setState('init');
				}
			},
			apiGetStateName(val) {
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.uuid == val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == val );
				return slcVisibility.name;
			},
		},
		computed: {
			compCategoriesToList : {
				get() {
					if (this.api.categories == null) {
						this.api.categories = [];
					}
					// console.log("this.index: ", this.lindex);
					return this.api.categories.map(e => e.name).join(', ');
				},
			},
			compTagsToList : {
				get() {
					if (this.api.tags == null) {
						this.api.tags = [];
					}
					return this.api.tags.map(e => e.name).join(', ');
				},
			},
			compGroupsToList : {
				get() {
					if (this.api.groups == null) {
						this.api.groups = [];
					}
					return this.api.groups.map(e => e.name).join(', ');
				},
			},
		},
	});
// ■■■■■■■■ api-nav ■■■■■■■■ //
	Vue.component('api-nav', {
		// mixins: [mixIndex],
		// template: '#template-list',
		props: ['name','groupname', 'categoryname', 'tagname', 'visibilityname', 'statename', 'pagecurrent'],
		computed: {
			
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'name',
					type: String,
					order: 'asc'
				},
			};
		},
		methods : {
			deleteTax(list, editing, item) {
				console.log("list, editing, item: ", list, editing, item);
				this.$root.deleteTax(list, editing, item);
			},
			setTax(action, title, list, item) {
				console.log("action, title, list, item: ", action, title, list, item);
				this.$root.setTax(action, title, list, item);
			},
		}
	});
// ■■■■■■■■ vue ■■■■■■■■ //
	new Vue({
		el: '#portal',
		name: 'portal',
		data: {
			isLoading: true,
			sort: {
				key: 'name',
				type: String,
				order: 'asc'
			},
			pageCurrent: '',
			rootState: 'init',
			childState: '',
			pageClassPrefix: 'vs',
			pageClass: '',
			ajaxHeaders: {},
			abyssEndpoint: abyss.abyssLocation,
			abyssSandbox: abyss.isAbyssSandbox,
			abyssVersion: abyss.abyssVersion,
			abyssOrgName: '',
			abyssOrgId: '',
			rootData: {},
			taxAction: '',
			taxTitle: '',
			taxList: '',
			tax: {
				uuid: null,
				organizationid: null,
				created: null,
				updated: null,
				deleted: null,
				isdeleted: null,
				crudsubjectid: null,
				name: null,
				description: null,
				externaldescription: null,
				externalurl: null,
				subjectid: null,
			},
			selectedTax: {},
			filterTax: '',
			abyssYamlLocation : abyss.abyssYamlLocation,
			// abyssYamlList : abyss.abyssYamlList,
			abyssYamlList : [],
			end: []
		},
		methods: {
			cancelTax() {
				this.tax = _.cloneDeep(this.newTax);
				this.selectedTax = _.cloneDeep(this.newTax);
				this.taxAction = '';
				this.taxTitle = '';
				this.taxList = '';
			},
			deleteTax(list, editing, item) {
				// var itemArr = [];
				// itemArr.push(item);
				// this.removeItem(this.getEndpoint(list) + '/' + item.uuid, item, this.ajaxHeaders, this.rootData[list]).then(response => {
				axios.delete(this.getEndpoint(list) + '/' + item.uuid, item, this.ajaxHeaders).then(response => {
				// axios.delete(this.getEndpoint(list) + '/' + item.uuid, item, this.ajaxHeaders).then(response => {
					console.log("response: ", response );
					if (response) {
						// ■■ update user's api groups, tags, categories and reload my api list
						// this.rootData[list].push(response.data[0].response);
						this.$refs.refMyApis.getPage(1);
						if (this.rootState == 'edit' || this.rootState == 'create') {
							// ?????
							// var index = this.$refs.refMyApis.api[editing].indexOf(item);
							var index = this.$refs.refMyApis.api.openapidocument[editing].findIndex(el => el.uuid == item.uuid);
							this.$refs.refMyApis.api.openapidocument[editing].splice(index, 1);
							// this.$refs.refMyApis.selectApi(this.$refs.refMyApis.api, 'edit');
						}
					}
				}, error => {
					this.handleError(error);
				});
			},
			restoreTax(item) {
				var index = this.rootData[this.taxList].indexOf(item);
				this.rootData[this.taxList][index] = this.selectedTax;
				this.cancelTax();
			},
			cleanTax() {
				var item = _.cloneDeep(this.tax);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				return item;
			},
			fixTax(item) {
				console.log("item: ", item);
				if (this.taxTitle == 'Tag') {
					if (item.externalurl == null) {
						Vue.set(item, 'externalurl', '' );
					}
					if (item.externaldescription == null) {
						Vue.set(item, 'externaldescription', '' );
					}
				} else {
					Vue.delete(item, 'externalurl');
					Vue.delete(item, 'externaldescription');
				}
				if (item.description == null) {
					Vue.set(item, 'description', '' );
				}
				if (this.taxTitle == 'Group') {
					if (item.subjectid == null) {
						Vue.set(item,'subjectid',this.rootData.user.uuid);
					}
				} else {
					Vue.delete(item, 'subjectid');
				}
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid',this.rootData.user.uuid);
				}
				if (item.organizationid == null) {
					Vue.set(item,'organizationid',this.abyssOrgId);
				}
			},
			addTax() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						var itemArr = [];
						itemArr.push(this.cleanTax());
						console.log("itemArr: ", itemArr);
						this.addItem(this.getEndpoint(), itemArr, this.ajaxHeaders, this.rootData[this.taxList]).then(response => {
							console.log("response: ", response);
							this.cancelTax();
							$('#taxModal').modal("hide");
						});
					}
				});
			},
			editTax() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						var item = _.cloneDeep(this.tax);
						console.log("this.tax.uuid: ", this.tax.uuid);
						this.updateItem(this.getEndpoint() + '/' + this.tax.uuid, this.cleanTax(), this.ajaxHeaders, this.rootData[this.taxList]).then(response => {
							console.log("response: ", response);
							this.cancelTax();
							$('#taxModal').modal("hide");
						});
					}
				});
			},
			setTax(action, title, list, item) {
				this.taxAction = action;
				this.taxTitle = title;
				this.taxList = list;
				if (action == 'edit') {
					this.fixTax(item);
					this.tax = item;
				}
				if (action == 'add') {
					this.fixTax(this.tax);
				}
				this.selectedTax = _.cloneDeep(this.tax);
			},
			setPage(page, state) {
				this.pageCurrent = page;
				this.rootState = state;
				// this.childState = state;
			},
			setState(state, toggle) {
				if (this.rootState != 'init' && toggle && this.rootState == state) {
					console.log("state: ", state);
					this.rootState = toggle;
					this.pageClass = this.pageClassPrefix + '-' + toggle;
				} else{
					this.rootState = state;
					this.pageClass = this.pageClassPrefix + '-' + state;
				}
				require(['slimscroll'],function(){
					$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
				});
			},
			setChildState(state, toggle) {
				if (this.childState != 'init' && toggle && this.childState == state) {
					console.log("state: ", state);
					this.childState = toggle;
					this.pageClass = this.pageClassPrefix + '-' + this.rootState + ' ' + this.pageClassPrefix + '-' + toggle;
				} else if (state == '') {
					this.childState = state;
					this.pageClass = this.pageClassPrefix + '-' + this.rootState;
				} else {
					this.childState = state;
					this.pageClass = this.pageClassPrefix + '-' + this.rootState + ' ' + this.pageClassPrefix + '-' + state;
				}
			},
			validateBeforeSubmit() {
				this.$validator.validateAll().then((result) => {
					console.log("result: ", result);
					if (result) {
						// alert('Form Submitted!');
						this.setState('edit');
						return;
					}
					// alert('Correct them errors!');
				});
			},
			getRootData333(id) {
				axios.get(abyss.ajax.index + '?q=' + id, this.ajaxHeaders).then(response => {
					this.rootData = response.data;
					// console.log("this.rootData: ", JSON.stringify(this.rootData, null, '\t'));
					console.log("this.rootData: ", this.rootData);
				}, error => {
					this.handleError(error);
				});
			},
			getEndpoint(lst) {
				var list = this.taxList;
				if (lst) {
					list = lst;
				}
				if ( list == 'myApiVisibilityList') {
					return abyss.ajax.api_visibility_list;
				}
				if ( list == 'myApiStateList') {
					return abyss.ajax.api_states_list;
				}
				if ( list == 'myApiGroupList') {
					return abyss.ajax.api_group_list;
				}
				if ( list == 'myApiCategoryList') {
					return abyss.ajax.api_category_list;
				}
				if ( list == 'myApiTagList') {
					return abyss.ajax.api_tag_list;
				}
			},
			getRootData(id) {
				axios.all([
					axios.get(abyss.ajax.subjects + '/' + id),
					axios.get(abyss.ajax.api_visibility_list),
					axios.get(abyss.ajax.api_states_list),
					axios.get(abyss.ajax.api_group_list),
					axios.get(abyss.ajax.api_category_list),
					axios.get(abyss.ajax.api_tag_list),
					axios.get(abyss.ajax.contract_states),
					axios.get(abyss.ajax.resource_types),
					axios.get(abyss.ajax.resource_actions),
					axios.get(abyss.ajax.subject_organizations_list + id),
					// axios.get('/data/create-api.json')
				]).then(
					axios.spread((user, api_visibility_list, api_states_list, api_group_list, api_category_list, api_tag_list, contract_states, resource_types, resource_actions, subject_organizations_list) => {
						Vue.set(this.rootData, 'user', user.data[0] );
						Vue.set(this.rootData, 'myApiVisibilityList', api_visibility_list.data );
						Vue.set(this.rootData, 'myApiStateList', api_states_list.data );
						Vue.set(this.rootData, 'myApiGroupList', api_group_list.data );
						Vue.set(this.rootData, 'myApiCategoryList', api_category_list.data );
						Vue.set(this.rootData, 'myApiTagList', api_tag_list.data );
						Vue.set(this.rootData, 'apiVisibilityList', api_visibility_list.data );
						Vue.set(this.rootData, 'apiStateList', api_states_list.data );
						Vue.set(this.rootData, 'apiGroupList', api_group_list.data );
						Vue.set(this.rootData, 'apiCategoryList', api_category_list.data );
						Vue.set(this.rootData, 'apiTagList', api_tag_list.data );
						Vue.set(this.rootData, 'contractStates', contract_states.data );
						Vue.set(this.rootData, 'resourceTypes', resource_types.data );
						Vue.set(this.rootData, 'resourceActions', resource_actions.data );
						Vue.set(this.rootData, 'subjectOrganizations', subject_organizations_list.data );
						var orgs = [];
						if (this.rootData.subjectOrganizations.length > 0) {
							this.rootData.subjectOrganizations.forEach((value, key) => {
								axios.get(abyss.ajax.organizations_list + value.organizationrefid, this.ajaxHeaders)
								.then(response => {
									var res = response.data;
									orgs.push(response.data[0]);
								}, error => {
									this.handleError(error);
								});
							});
							Vue.set(this.rootData.user, 'organizations', orgs );
						} else {
							axios.get(abyss.ajax.organizations_list + id, this.ajaxHeaders)
							.then(response => {
								var res = response.data;
								console.log("res: ", res);
								Vue.set(this.rootData.user, 'organizations', res );
							}, error => {
								this.handleError(error);
							});
						}
						// console.log("ROOT this.rootData: ", this.rootData);
						this.isLoading = false;
					})
				).catch(error => {
					this.handleError(error);
				});
			},
		},
		computed: {
		},
		mounted() {
			this.setState('init');
		},
		beforeMount() {
		},
		created() {
			this.preloadInit();
			if (abyss.isAbyssSandbox) {
				this.$cookie.set('abyss.session', abyss.session, 10);
				this.$cookie.set('abyss.login.organization.name', 'monasdyas', 10); //ten day
				this.$cookie.set('abyss.login.organization.uuid', '89db8aca-51b3-435b-a79d-e1f4067d2076', 10); //ten day
				// this.$cookie.set('abyss.login.organization.uuid', '3c65fafc-8f3a-4243-9c4e-2821aa32d293', 10); //ten day
				this.$cookie.set('abyss.principal.uuid', '9820d2aa-eb02-4a58-8cc5-8b9a89504df9', 10); //ten day
				// this.$cookie.set('abyss.principal.uuid', '32c9c734-11cb-44c9-b06f-0b52e076672d', 1); //one day
				// this.$cookie.set('abyss.principal.uuid', 'd6bba21e-6d4c-4f87-897e-436bd97d41c0', 1); //one day
			}
			this.abyssOrgName = this.$cookie.get('abyss.login.organization.name');
			this.abyssOrgId = this.$cookie.get('abyss.login.organization.uuid');
			var principal = this.$cookie.get('abyss.principal.uuid');
			this.newTax = _.cloneDeep(this.tax);
			// console.log("principal: ", principal);
			// this.$cookie.delete('abyss.principal.uuid');
			// this.log(this.$options.name);
			this.getRootData(principal);
			// if (!this.$root.isLoading) {
				axios.get(abyss.ajax.api_yaml_list, this.ajaxHeaders)
				.then(response => {
					// this.$root.abyssYamlList = _.sortBy(response.data);
					Vue.set(this.$root, 'abyssYamlList', _.sortBy(response.data));
				}, error => {
					this.handleError(error);
				});
			// }
		}
	});
});
