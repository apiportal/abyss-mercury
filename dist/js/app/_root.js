// define(['Vue', 'axios', 'vee-validate', 'moment'], function (Vue, axios, VeeValidate, moment) {
define(['config', 'Vue', 'axios', 'vee-validate', 'moment', 'izitoast', 'vue-izitoast'], function (abyss, Vue, axios, VeeValidate, moment, iziToast) {
	// Window.Vue = Vue;
	// Window.Vue.use(VueIziToast);
	// Vue.prototype.$toast = VueIziToast;
	Vue.use(MyToaster);
	Vue.use(VeeValidate);
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
				)
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
				}
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
				return axios.post(url, item, head).then(response => {
					return response;
				}, error => {
					console.error(error);
					alert(error.code + ': ' + error.message);
				})
			},
			addItem(url, item, head, arr) {
				return axios.post(url, item, head).then(response => {
					arr.push(item);
					return response;
				}, error => {
					console.error(error);
				});
			},
			removeItem(url, item, head, arr) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.post(url, item, head).then(response => {
						var index = arr.indexOf(item);
						arr.splice(index, 1);
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
			ajaxHeaders: {
				contentType: 'application/json',
				datatype: 'json',
				headers: {'Content-Type': 'application/json'}
			},
			user: {
				name: null,
				surname: null,
				avatar: null,
				status: null,
				settings: {
					darkSidebar: false
				},
				notifications: []
			},
			rootCategories: [],
			taxAction: '',
			taxTitle: '',
			taxList: '',
			tax: {},
			selectedTax: {},
			menu: {
				api: {
					groups: [],
					tags: [],
					categories: [],
					states: [],
					visibility: [],
				},
				proxy: {
					groups: [],
					tags: [],
					categories: [],
					states: [],
					visibility: [],
				}
			},
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
			deleteTax(list, item) {
				this.removeItem(abyss.ajax.index, item, this.ajaxHeaders, this.menu.api[list]);
			},
			restoreTax(item) {
				var index = this.menu.api[this.taxList].indexOf(item);
				this.menu.api[this.taxList][index] = this.selectedTax;
				this.cancelTax();
			},
			addTax() {
				var item = _.cloneDeep(this.tax);
				item.uuid = this.uuidv4();
				item.count = 0;
				this.addItem(abyss.ajax.index, item, this.ajaxHeaders, this.menu.api[this.taxList]).then(response => {
					console.log("response: ", response);
					this.cancelTax();
				});
			},
			editTax() {
				var item = _.cloneDeep(this.tax);
				this.updateItem(abyss.ajax.index, item, this.ajaxHeaders, this.menu.api[this.taxList]).then(response => {
					console.log("response: ", response);
					this.cancelTax();
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
			getMenu(data) {
				// this.categoryOptions = data.myApiCategoryList;
				// this.tagOptions = data.myApiTagList;
				// this.groupOptions = data.myApiGroupList;
				// this.stateOptions = data.myApiStateList;
				this.menu.api.groups = data.myApiGroupList;
				this.menu.api.tags = data.myApiTagList;
				this.menu.api.categories = data.myApiCategoryList;
				this.menu.api.states = Object.assign(data.defaultStates, data.myApiStateList);
				this.menu.api.visibility = Object.assign(data.defaultVisibility, data.myApiVisibility);
			},
			setMenu(categories, tags, groups, states) {
				this.menu.api.groups = groups;
				this.menu.api.tags = tags;
				this.menu.api.categories = categories;
				this.menu.api.states = states;
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
		},
		computed: {
		},
		mounted() {
			this.setState('init');
			// this.setChildState('child');
		},
		created() {
			// this.log(this.$options.name);
			axios.get(abyss.ajax.index, this.ajaxHeaders)
			.then((response) => {
				this.getMenu(response.data);
			});
		}
	});
});
