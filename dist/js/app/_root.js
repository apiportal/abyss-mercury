// define(['Vue', 'axios', 'vee-validate', 'moment'], function (Vue, axios, VeeValidate, moment) {
// define(['config', 'Vue', 'axios', 'vee-validate', 'tiny-cookie', 'vue-cookie', 'moment', 'izitoast', 'vue-izitoast'], function (abyss, Vue, axios, VeeValidate, Cookie, VueCookie, moment, iziToast) {
define(['config', 'Vue', 'axios', 'vee-validate', 'vue-cookie', 'moment', 'izitoast', 'vue-izitoast'], function (abyss, Vue, axios, VeeValidate, VueCookie, moment, iziToast) {

	axios.defaults.headers.common['Accept'] = 'application/json';
	axios.defaults.headers.common['Content-Type'] = 'application/json';
	axios.defaults.withCredentials = abyss.abyssCredentials;
	axios.defaults.timeout = 10000;
	axios.defaults.responseType = 'json';
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
		getMessage: field => 'The password must contain at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (*,._&?)',
		validate: value => {
			var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
			return strongRegex.test(value);
		}
	});
	Vue.filter('formatDateTime', function(value) {
		if (value) {
			return moment(String(value)).format('DD.MM.YYYY hh:mm')
		}
	});
	Vue.filter('formatDate', function(value) {
		if (value) {
			return moment(String(value)).format('DD.MM.YYYY')
		}
	});
	Vue.filter('listCommaSeparated', function(item) {
		console.log("listCommaSeparated: ", item);
		if (item.length) {
			return item.map(e => e.name).join(', ');
		}
	});
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
				$('.preloader-it > .la-anim-1').addClass('la-animate');
				$(document).ready(function() {
					$(".preloader-it").fadeOut("slow");
				});
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
			// resetItem(obj, blank) {
			// 	obj = _.cloneDeep(blank);
			// 	// obj = Vue.util.extend({}, blank);
			// 	// return obj;
			// },
			updateItem(url, item, head, arr) {
				return axios.put(url, item, head).then(response => {
				// return axios.post(url, item, head).then(response => {
					console.log("PUT response: ", response);
					return response;
				}, error => {
					console.error(error);
					alert(error.code + ': ' + error.message);
				});
			},
			addItem(url, item, head, arr) {
				return axios.post(url, item, head).then(response => {
					console.log("POST response: ", response);
					// arr.push(item);
					arr.push(response.data);
					return response;
				}, error => {
					console.error(error);
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
						console.error(error);
					});
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
		}
	});
	new Vue({
		el: '#portal',
		name: 'portal',
		data: {
			isLoading: true,
			pageCurrent: '',
			rootState: 'init',
			childState: '',
			pageClassPrefix: 'vs',
			pageClass: '',
			ajaxHeaders: {},
			// ajax_user_list: abyss.ajax.user_list,
			// ajax_api_visibility_list: abyss.ajax.api_visibility_list,
			// ajax_api_states_list: abyss.ajax.api_states_list,
			// ajax_api_group_list: abyss.ajax.api_group_list,
			// ajax_api_category_list: abyss.ajax.api_category_list,
			// ajax_api_tag_list: abyss.ajax.api_tag_list,
			rootData: {},
			taxAction: '',
			taxTitle: '',
			taxList: '',
			tax: {},
			selectedTax: {},
			end: []
		},
		methods: {
			cancelTax() {
				this.tax = {};
				this.selectedTax = {},
				this.taxAction = '';
				this.taxTitle = '';
				this.taxList = '';
			},
			deleteTax(list, editing, item) {
				console.log("this.rootData[list]: ", this.rootData[list]);
				this.removeItem(this.getEndpoint() + '/' + item.uuid, item, this.ajaxHeaders, this.rootData[list]).then(response => {
					console.log("response: ", response );
					// ■■ update user's api groups, tags, categories and reload my api list
					this.$refs.refMyApis.getPage(1);
					if (this.rootState == 'edit' || this.rootState == 'create') {
						// ?????
						// var index = this.$refs.refMyApis.api[editing].indexOf(item);
						var index = this.$refs.refMyApis.api[editing].findIndex(el => el.uuid == item.uuid);
						this.$refs.refMyApis.api[editing].splice(index, 1);
						// this.$refs.refMyApis.selectApi(this.$refs.refMyApis.api, 'edit');
					}
				});
			},
			restoreTax(item) {
				var index = this.rootData[this.taxList].indexOf(item);
				this.rootData[this.taxList][index] = this.selectedTax;
				this.cancelTax();
			},
			addTax() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						var item = _.cloneDeep(this.tax);
						item.uuid = this.uuidv4();
						item.count = 0;
						this.addItem(this.getEndpoint(), item, this.ajaxHeaders, this.rootData[this.taxList]).then(response => {
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
						this.updateItem(this.getEndpoint() + '/' + item.uuid, item, this.ajaxHeaders, this.rootData[this.taxList]).then(response => {
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
					this.selectedTax = _.cloneDeep(item);
					this.tax = item;
				}
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
					console.error(error);
				});
			},
			getEndpoint() {
				if ( this.taxList == 'myApiVisibilityList') {
					return abyss.ajax.api_visibility_list;
				}
				if ( this.taxList == 'myApiStateList') {
					return abyss.ajax.api_states_list;
				}
				if ( this.taxList == 'myApiGroupList') {
					return abyss.ajax.api_group_list;
				}
				if ( this.taxList == 'myApiCategoryList') {
					return abyss.ajax.api_category_list;
				}
				if ( this.taxList == 'myApiTagList') {
					return abyss.ajax.api_tag_list;
				}
			},
			getRootData(id) {
				axios.all([
					axios.get(abyss.ajax.user_list + '/' + id),
					axios.get(abyss.ajax.api_visibility_list),
					axios.get(abyss.ajax.api_states_list),
					axios.get(abyss.ajax.api_group_list),
					axios.get(abyss.ajax.api_category_list),
					axios.get(abyss.ajax.api_tag_list),
					// axios.get('/data/create-api.json')
				]).then(
					axios.spread((user_list, api_visibility_list, api_states_list, api_group_list, api_category_list, api_tag_list) => {
						Vue.set(this.rootData, 'user', user_list.data[0] );
						Vue.set(this.rootData, 'myApiVisibilityList', api_visibility_list.data );
						Vue.set(this.rootData, 'myApiStateList', api_states_list.data );
						Vue.set(this.rootData, 'myApiGroupList', api_group_list.data );
						Vue.set(this.rootData, 'myApiCategoryList', api_category_list.data );
						Vue.set(this.rootData, 'myApiTagList', api_tag_list.data );
						console.log("this.rootData: ", this.rootData);
						// console.log("this.rootData: ", JSON.stringify(this.rootData, null, '\t') );
					})
				).catch(error => {
					console.log(error.response)
				});
			},
			getRootData222(id) {
				return axios.get(abyss.ajax.index + '?q=' + id, this.ajaxHeaders).then(response => {
					this.rootData = response.data;
					console.log("this.rootData: ", this.rootData);
					return response;
				}, error => {
					console.error(error);
				});
			},
		},
		computed: {
		},
		mounted() {
			this.setState('init');
			// this.setChildState('child');
		},
		created() {
			// this.$cookie.set('abyss.principal.uuid', '9820d2aa-eb02-4a58-8cc5-8b9a89504df9', 1); //one day
			// this.$cookie.set('abyss.principal.uuid', '32c9c734-11cb-44c9-b06f-0b52e076672d', 1); //one day
			var principal = this.$cookie.get('abyss.principal.uuid');
			console.log("principal: ", principal);
			// this.$cookie.delete('abyss.principal.uuid');
			// this.log(this.$options.name);
			this.getRootData(principal);
		}
	});
});
