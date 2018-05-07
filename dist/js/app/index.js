define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('index', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'fullName',
					type: String,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				//ajaxUrl: '/data/my-api-list.json',
				ajaxUrl: abyss.ajax.index,
				testUrl: 'http://local.doodle.com/api',
				ajaxHeaders: {},
				selected: null,
				resetPassword: false,
				user: {
					"id": 0,
					"fullName": "",
					"userName": "",
					"email": "",
					"notify": true,
					"loginCount": 0,
					"lastLogin": "",
					"failedLoginCount": 0,
					"lastFailedLogin": "",
					"directory": "Internal Directory",
					"groups": [],
					"permissions": []
				},
				selectedUser: {},
				newUser: {},
				userList: [],

				userOptions: [],
				groupOptions: [],
				permissionOptions: [],

				end: []
			}
		},
		methods: {
			getPage(p, d) {
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param)
				.then(response => {
					// console.log("p: ", p);
					this.userList = response.data.userList;
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
		},
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'index', 'init');
			// this.newUser = _.cloneDeep(this.user);
			// this.getPage(1);
		}
	});
});