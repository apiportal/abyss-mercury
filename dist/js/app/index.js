define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
// ■■■■■■■■ api-list ■■■■■■■■ //
	Vue.component('api-list', {
		props: ['api', 'index'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {},
		methods : {},
		created() {
			this.apiOwner(this.api);
		},
	});
	Vue.component('api-preview', {
		props: ['api'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {},
		methods : {},
		created() {
			this.apiOwner(this.api);
		},
	});
// ■■■■■■■■ index ■■■■■■■■ //
	Vue.component('index', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'name',
					type: String,
					order: 'asc'
				},
				sortApi: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.index,
				ajaxHeaders: {},
				dashboardList: [],
				apiList: [],
				subjectPermissionList: [],

				end: []
			};
		},
		methods: {
			getPage(p, d) {
				axios.all([
					axios.get(abyss.ajax.api_list, this.ajaxHeaders),
					axios.get(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid, this.ajaxHeaders),
				]).then(
					axios.spread((app_list, subject_permission_list) => {
						this.subjectPermissionList = subject_permission_list.data.filter( (item) => item.isdeleted == false );
						this.apiList = app_list.data;
						this.paginate = this.makePaginate(this.apiList);
						this.preload();
					})
				).catch(error => {
					this.handleError(error);
				});
			},
			////////////////
		},
		mounted() {
			// this.preload();
		},
		created() {
			// this.log(this.$options.name);
			this.$emit('set-page', 'index', 'init');
			this.getMyApps();
			this.getPage(1);
		}
	});
});