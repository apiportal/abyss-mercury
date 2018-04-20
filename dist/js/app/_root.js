// define(['Vue', 'axios', 'vee-validate', 'moment'], function (Vue, axios, VeeValidate, moment) {
define(['Vue', 'axios', 'vee-validate', 'moment'], function (Vue, axios, VeeValidate, moment) {
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
			preload() {
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
			resetItem(obj, blank) {
				obj = _.cloneDeep(blank);
				// obj = Vue.util.extend({}, blank);
				// return obj;
			},
			updateItem(arr, item) {
				return axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
					return response;
				}, error => {
					console.error(error);
					alert(error.code + ': ' + error.message);
				})
			},
			addItem(arr, item) {
				// console.log("this.ajaxHeaders: ", this.ajaxHeaders);
				return axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
					arr.push(item);
					return response;
				}, error => {
					console.error(error);
				});
			},
			removeItem(arr, item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
						var index = arr.indexOf(item);
						arr.splice(index, 1);
					}, error => {
						console.error(error);
					});
				}
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
			pageCurrent: 'my-apisssssssssssssss',
			rootState: 'initttttttttttttt',
			childState: 'chhhhhh',
			pageClassPrefix: 'vs',
			pageClass: '',
			ajaxHeaders: {
				contentType: 'application/json',
				datatype: 'json',
				headers: {'Content-Type': 'application/json'}
			},
			end: []
		},
		methods: {
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
			this.log(this.$options.name);
		}
	});
});
