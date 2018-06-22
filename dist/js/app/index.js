define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
// ■■■■■■■■ MIXINS ■■■■■■■■ //
	const mixIndex = {
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
		methods: {
			apiGetStateName(val) {
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.uuid == val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == val );
				return slcVisibility.name;
			},
		}
	};
// ■■■■■■■■ api-list ■■■■■■■■ //
	Vue.component('api-list', {
		mixins: [mixIndex],
		// template: '#template-list',
		props: ['api', 'lindex'],
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
			};
		},
		computed: {
			/*compCategoriesToList : {
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
			},*/
		},
		methods : {
			/*apiGetStateName(val) {
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.uuid == val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == val );
				return slcVisibility.name;
			},*/
		}
	});
// ■■■■■■■■ index ■■■■■■■■ //
	Vue.component('index', {
		mixins: [mixIndex],
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
				selectedApi: {},
				api: {},

				end: []
			};
		},
		methods: {
			getPage(p, d) {
				var param = d || '';
				axios.get(abyss.ajax.api_list + '?page=' + p + param)
				.then(response => {
					// console.log("p: ", p);
					this.apiList = response.data;
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
			selectApi(item, state) {
				// this.api = item;
				this.api = _.cloneDeep(item);
				this.$root.setState(state);
				this.selectedApi = _.cloneDeep(this.api);
				// $('#api'+this.api.uuid).collapse('show');
			},
			isSelectedApi(i) {
				return i === this.api.uuid;
			},
			cancelApi() {
				this.api = {};
				this.selectedApi = {};
				this.$root.setState('init');
				// this.selected = null;
			},
		},
		mounted() {
			this.preload();
		},
		created() {
			this.log(this.$options.name);
			this.$emit('set-page', 'index', 'init');
			this.getPage(1);
		}
	});
});