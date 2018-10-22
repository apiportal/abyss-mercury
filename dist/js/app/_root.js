define(['config', 'Vue', 'axios', 'vee-validate', 'vue-cookie', 'moment', 'izitoast', 'sweetalert2', 'vue-izitoast', 'css!sweetalert2-css'], function (abyss, Vue, axios, VeeValidate, VueCookie, moment, iziToast, swal) {
// ■■■■■■■■ AXIOS ■■■■■■■■ //
	axios.defaults.headers.common['Accept'] = 'application/json';
	axios.defaults.headers.common['Content-Type'] = 'application/json';
	axios.defaults.withCredentials = abyss.abyssCredentials;
	axios.defaults.timeout = 10000;
	axios.defaults.responseType = 'json';
	axios.defaults.validateStatus = function (status) {
		// return status >= 200 && status < 300; // default
		return (status >= 200 && status < 300) || status === 404;
	};
	axios.interceptors.response.use((response) => {
		if (response.status === 404) {
			var res = {};
			res.data = [];
			// console.log('404 response', response);
			return res;
		} else if (response.status === 207) {
			var arr = [];
			response.data.forEach((value, key) => {
				if (value.status >= 400) {
					arr.push(value.error.usermessage);
				}
			});
			if (arr.length == 0) {
				return response;
			} else {
				var err = arr.join(', ');
				iziToast.error({title: 'ERROR', message: err, position: 'topRight', timeout: false, color: 'red'});
				throw new axios.Cancel(arr.join(', '));  
			}
		} else {
			return response;
		}
	}, (error) => {
		// console.log("interceptors: ", error);
		if (error.response) {
			// The request was made and the server responded with a status code that falls out of the range of 2xx
			console.log("interceptors error.response", error.response);
			// console.log("error.response.data", error.response.data);
			// console.log("error.response.status", error.response.status);
			// console.log("error.response.headers", error.response.headers);
			if ( error.response.status === 401) {
				window.location.href = '/abyss/login';
			} else {
				if (error.response.data) {
					iziToast.error({title: error.response.status.toString(), message: error.response.data.usermessage, position: 'topRight', timeout: false, color: 'red'});
				} else {
					iziToast.error({title: error.response.status.toString(), message: error.response.statusText, position: 'topRight', timeout: false, color: 'red'});
				}
			}
		} else if (error.request) {
			// The request was made but no response was received `error.request` is an instance of XMLHttpRequest
			console.log("interceptors error.request", error.request);
		} else {
			// Something happened in setting up the request that triggered an Error
			console.log('interceptors error.message', error.message);
		}
		// console.log("error.config", error.config);
		// console.log("error: ", error);
		
		// return error;
		return Promise.reject(error);
	});
// ■■■■■■■■ PLUGINS ■■■■■■■■ //
	// Window.Vue = Vue;
	// Window.Vue.use(VueIziToast);
	// Vue.prototype.$toast = VueIziToast;
	const swalPlugin = {}
	swalPlugin.install = function(Vue){
		Vue.prototype.$swal = swal;
	}

	Vue.use(MyToaster);
	Vue.use(VeeValidate);
	Vue.use(VueCookie);
	Vue.use(swalPlugin);
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
			// return moment(String(value)).format('DD.MM.YYYY HH:mm');
			// return moment(String(value)).format('DD.MM.YYYY HH:mm Z');
			return moment.utc(String(value)).format('DD.MM.YYYY HH:mm');
		}
	});
	Vue.filter('formatDateTimeLocal', function(value) {
		if (value) {
			return moment(String(value)).format('DD.MM.YYYY HH:mm');
		}
	});
	Vue.filter('formatDateTimeSec', function(value) {
		if (value) {
			return moment.utc(String(value)).format('DD.MM.YYYY HH:mm:ss');
		}
	});
	Vue.filter('formatDate', function(value) {
		if (value) {
			return moment.utc(String(value)).format('DD.MM.YYYY');
		}
	});
	Vue.filter('listCommaSeparated', function(item) {
		console.log("listCommaSeparated: ", item);
		if (item.length) {
			return item.map(e => e.name).join(', ');
		}
	});
	Vue.filter('truncate', function (text, stop, clamp) {
		if (text) {
			return text.slice(0, stop) + (stop < text.length ? clamp || '...' : '');
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
				// var count = 0;
				if (obj) {
					var el = Object.keys(obj);
					var count = el.length;
					if (el) {
						return el.length;
					}
				} else {
					return 0;
				}
			},
			preload(bar = '.nicescroll-bar') {
				this.$nextTick(() => {
					$(".preloader-it").fadeOut("slow");
					require(['slimscroll'],function(){
						$(bar).slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible: true});
					});
				});
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
			handleError(error) {
				console.log("handleError: ", error);
			},
			getItem(url, id) {
				return axios.get(url + '/' + id).then(response => {
					// console.log("getItem: ", url, response);
					return response.data[0];
				});
			},
			getList(url) {
				return axios.get(url).then(response => {
					// console.log("getList: ", url, response);
					return response.data;
				});
			},
			addItem(url, item, arr) {
				var itemArr = [];
				// itemArr.push(this.cleanProps(item));
				itemArr.push(item);
				return axios.post(url, itemArr).then(response => {
					console.log("addItem: ", url, response);
					if (response.data[0].status !== 500 && arr) {
						arr.push(response.data[0].response);
					}
					return response.data[0].response;
				});
			},
			addBulkItems(url, items) {
				return axios.post(url, items).then(response => {
					console.log("addBulkItems: ", url, response);
					return response.data[0].response;
				});
			},
			editItem(url, id, item, arr) {
				return axios.put(url + '/' + id, item).then(response => {
					console.log("editItem: ", url, response);
					return response.data[0];
				});
			},
			async deleteConfirm(item) {
				return this.$swal({
					title: 'Are you sure?',
					text: 'You can\'t revert your action',
					type: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Yes Delete it!',
					cancelButtonText: 'No, Keep it!',
					showCloseButton: true,
					// showLoaderOnConfirm: true
				}).then((result) => {
					if (result.value) {
						return result.value;
					} else {
						return false;
					}
				});
			},
			async deleteItem(url, item, conf, arr) {
				if (conf) {
					console.log("confirm true: ", conf);
					var deleteConfirm = await this.deleteConfirm();
					if (deleteConfirm) {
						return await this.deletePost(url, item, conf, arr);
					} else {
						// this.$swal('Cancelled', 'Your file is still intact', 'info');
						return false;
					}
				} else {
					console.log("confirm false: ", conf);
					return await this.deletePost(url, item, conf, arr);
				}
			},
			async deletePost(url, item, conf, arr) {
				return axios.delete(url + '/' + item.uuid, item).then(response => {
					console.log("deleteItem: ", url, response);
					// if (response.status == 204) {
					if (response.status >= 200 && response.status < 300) {
						Vue.set( item, 'isdeleted', true );
						if (arr) {
							var index = arr.indexOf(item);
							arr.splice(index, 1);
						}
						// this.$swal('Deleted', 'Item deleted successfully', 'success');
						this.$toast('success', {title: 'ITEM DELETED', message: 'Item deleted successfully', position: 'topRight'});
						return response;
					} else {
						this.$toast('error', {title: 'ERROR', message: 'Item is not deleted', position: 'topRight'});
					}
				});
			},
			updateItem(url, item, arr) {
				return axios.put(url, item).then(response => {
					return response;
				}, error => {
					this.handleError(error);
				});
			},
			checkDiff(object, base) {
				function changes(object, base) {
					return _.transform(object, (result, value, key) => {
						if (!_.isEqual(value, base[key])) {
							result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
						}
					});
				}
				return changes(object, base);
			},
			sortBy(srt, arr) {
				if (srt.type === String) {
					return _.orderBy(arr, [item => item[srt.key].toLowerCase()], srt.order);
				} else if (srt.type === Array) {
					return _.orderBy(arr, (item) => { return item[srt.key].length; }, srt.order);
				} else {
					return _.orderBy(arr, srt.key, srt.order);
				}
			},
			nestedResolve( path, obj ) {
				return path.split('.').reduce( function( prev, curr ) {
					return prev ? prev[curr] : undefined;
				}, obj || this );
			},
			sortByNested(srt, arr) {
				if (srt.type === String) {
					return _.orderBy(arr, [item => this.nestedResolve(srt.key, item).toLowerCase()], srt.order);
				} else if (srt.type === Array) {
					return _.orderBy(arr, (item) => { return this.nestedResolve(srt.key, item).length; }, srt.order);
				} else {
					return _.orderBy(arr, srt.key, srt.order);
				}
			},
			sortByKeys(obj) {
				var ordered = {};
				Object.keys(obj).sort().forEach((key) => {
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
			},
			// ■■■■■■■■ resource_access_tokens ■■■■■■■■
			async getAccessTokens(id, typ, subs) {
				var res = await this.getItem(abyss.ajax.resource_access_tokens_permission , subs.uuid);
				if (res) {
					Vue.set(subs, 'accessToken', res );
					if (subs.isdeleted) {
						if (!subs.accessToken.isdeleted) {
							await this.deleteItem(abyss.ajax.resource_access_tokens, subs.accessToken, false);
						}
					}
				} else {
					this.createAccessTokens(id, typ, subs);
				}
			},
			async createAccessTokens(id, typ, subs) {
				var resType = this.$root.rootData.resourceTypes.find((e) => e.type === typ );
				var token = {
					"organizationid": this.$root.abyssOrgId,
					"crudsubjectid": this.$root.rootData.user.uuid,
					"subjectpermissionid": subs.uuid,
					"resourcetypeid": resType.uuid,
					"resourcerefid": id,
					"isactive": true
				};
				var res = await this.addItem(abyss.ajax.resource_access_tokens, token);
				Vue.set(subs, 'accessToken', res );
			},
			// ■■■■■■■■ resource ■■■■■■■■ //
			async deleteResource(item) {
				await this.deleteItem(abyss.ajax.resources, item.resource, false);
			},
			async getResources(item, typ, name, desc) {
				var res = await this.getItem(abyss.ajax.resources_reference, item.uuid);
				if (res) {
					Vue.set(item, 'resource', res );
				} else {
					this.createResource(item, typ, name, desc);
				}
			},
			async updateResource(item, typ, name, desc) {
				var resType = this.$root.rootData.resourceTypes.find((e) => e.type === typ );
				var descript = desc || '';
				var resource = {
					"organizationid": item.resource.organizationid,
					"crudsubjectid": item.resource.crudsubjectid,
					"resourcetypeid": item.resource.resourcetypeid,
					"resourcename": name + ' ' + resType.type,
					"description": descript,
					"resourcerefid": item.uuid,
					"isactive": true
				};
				var res = await this.editItem(abyss.ajax.resources, item.resource.uuid, resource);
				Vue.set(item, 'resource', res );
			},
			async createResource(item, typ, name, desc) {
				var resType = this.$root.rootData.resourceTypes.find((e) => e.type === typ );
				var descript = desc || '';
				var resource = {
					"organizationid": this.$root.abyssOrgId,
					"crudsubjectid": this.$root.rootData.user.uuid,
					"resourcetypeid": resType.uuid, //fixed APP
					"resourcename": name + ' ' + resType.type, //api.info.title + API
					"description": descript, //api.info.description + api.info.version
					"resourcerefid": item.uuid, //api.uuid
					"isactive": true
				};
				var res = await this.addItem(abyss.ajax.resources, resource);
				Vue.set(item, 'resource', res );
			},
			// ■■■■■■■■ apiOwner ■■■■■■■■ //
			async apiOwner(item) {
				var res = await this.getItem(abyss.ajax.subjects, item.subjectid);
				Vue.set(item, 'apiOwnerName', res.displayname );
			},
			// ■■■■■■■■ previewApi helpers ■■■■■■■■ //
			apiGetStateName(val) {
				var slcState = this.$root.rootData.apiStateList.find((el) => el.uuid === val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.$root.rootData.apiVisibilityList.find((el) => el.uuid === val );
				return slcVisibility.name;
			},
			myAppsEnvironment(item) {
				if (item.issandbox) {
					return 'SANDBOX';
				} else {
					return 'LIVE';
				}
			},
			async getTax(item) {
				var api_tag_api = this.getList(abyss.ajax.api_tag_api + item.uuid);
				var api_group_api = this.getList(abyss.ajax.api_group_api + item.uuid);
				var api_category_api = this.getList(abyss.ajax.api_category_api + item.uuid);
				var [tags, groups, categories] = await Promise.all([api_tag_api, api_group_api, api_category_api]);
				Vue.set( item, 'tags', tags );
				Vue.set( item, 'groups', groups );
				Vue.set( item, 'categories', categories );
			},
			// ■■■■■■■■ shareApi ■■■■■■■■ //
			async setSharedApis() {
				var myApiPermissions = await this.getList(abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid);
				Vue.set( this.$root.shareApi, 'isMine', true );
				// myApiPermissions = _.orderBy(myApiPermissions, resourceactionid);
				// myApiPermissions = myApiPermissions.filter((el) => el.resourceactionid != abyss.defaultIds.invokeApi && el.resourceid == this.$root.previewedApi.resource.uuid && !el.isdeleted );
				// myApiPermissions = _.uniqBy(myApiPermissions, 'resourceid');
				// Vue.set( this.$root.shareApi, 'permissions', myApiPermissions );
				Vue.set( this.$root.shareApi, 'permissions', myApiPermissions.filter((el) => el.resourceactionid !== abyss.defaultIds.invokeApi && el.resourceid === this.$root.previewedApi.resource.uuid && el.isdeleted !== true ) );
				this.$root.shareApi.permissions.forEach(async (value, key) => {
					var permUser = await this.getItem(abyss.ajax.subjects, value.subjectid);
					Vue.set(value, 'user', permUser);
					if (value.resourceactionid === abyss.defaultIds.editApi) {
						var hasUserView = this.$root.shareApi.permissions.find((e) => e.subjectid === value.subjectid && e.resourceactionid === abyss.defaultIds.viewApi );
						Vue.set(hasUserView, 'view', 'hide');
						Vue.set(value, 'text', 'with read/write permission');
					} else {
						Vue.set(value, 'text', 'with read-only permission');
					}
				});
			},
			// ■■■■■■■■ previewApi ■■■■■■■■ //
			cancelPreviewApp() {
				$('body').removeClass('no-scroll');
				$('.page-wrapper').removeClass('no-scroll');
				this.app = {};
				this.$root.setState('init');
			},
			cancelPreviewApi() {
				$('body').removeClass('no-scroll');
				$('.page-wrapper').removeClass('no-scroll');
				this.$root.previewedApi = {};
				this.hideLegalText();
				this.cancelTestApi();
				Vue.set( this.$root, 'shareApi', {
					isMine: false,
					selectedUser: null,
					permissions: null,
					readonly: true,
				} );
				// console.log("this.$root.pageCurrent: ", this.$root.pageCurrent);
				// console.log("this.$root.rootState: ", this.$root.rootState);
				// console.log("this.$root.$refs.refMyApis.api.uuid: ", this.$root.$refs.refMyApis.api.uuid);
				if (this.$root.pageCurrent === 'my-apis' && this.$root.$refs.refMyApis.api.uuid) {
					this.$root.setState('edit');
				} else {
					this.$root.setState('init');
				}
				// console.log("this.$root.rootState: ", this.$root.rootState);
			},
			async previewApi(item) {
				$('body').addClass('no-scroll');
				$('.page-wrapper').addClass('no-scroll');
				if (item.isproxyapi) {
					// await this.getMyApps();
					Vue.set(this.$root, 'previewedApi', _.cloneDeep(item));
					var apiLic = await this.getList(abyss.ajax.api_licenses_api + item.uuid);
					var apiLicenses = apiLic.filter( (item) => item.isdeleted === false );
					var licenses = [];
					apiLicenses.forEach(async (value, key) => {
						var lic = await this.getItem(abyss.ajax.licenses, value.licenseid);
						licenses.push(lic);
					});
					Vue.set(this.$root.previewedApi, 'licenses', licenses);
					await this.getResources(this.$root.previewedApi, 'API', this.$root.previewedApi.openapidocument.info.title + ' ' + this.$root.previewedApi.openapidocument.info.version, this.$root.previewedApi.openapidocument.info.description);
					Vue.set( this.$root.previewedApi, 'filteredApps', _.reject(this.$root.appList, { contracts: [ { apiid: item.uuid, isdeleted: false } ]}) );
					if (this.$root.rootData.user.uuid === this.$root.previewedApi.subjectid) {
						var apiCon = await this.getList(abyss.ajax.contracts_api + this.$root.previewedApi.uuid);
						if (apiCon.length) {
							await this.getContracts(this.$root.previewedApi, this.$root.previewedApi.licenses, apiCon, true);
						}
						this.setSharedApis(item);
					} else {
						var mySubsApp = _.filter(this.$root.appList, { contracts: [ { apiid: item.uuid } ]});
						var mySubsAppCont = [];
						mySubsApp.forEach((value, key) => {
							var ccc = _.find(value.contracts, { apiid: item.uuid });
							mySubsAppCont.push(ccc);
						});
						await this.getContracts(this.$root.previewedApi, this.$root.previewedApi.licenses, mySubsAppCont, false);
					}
					await this.getTax(this.$root.previewedApi);
					this.$root.setState('preview');
					// require(['slimscroll'],function(){
					// 	$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
					// });
					this.preload('.nicescroll-bar');
				} else {
					Vue.set(this.$root, 'previewedApi', _.cloneDeep(item));
					await this.getTax(this.$root.previewedApi);
					this.$root.setState('preview');
				}
			},
			// ■■■■■■■■ contract ■■■■■■■■ //
			async getContracts(item, licenses, contracts, mine) {
				Vue.set(item, 'contracts', contracts );
				item.contracts.forEach(async (vCon, key) => {
					var contState = this.$root.rootData.contractStates.find( (e) => e.uuid === vCon.contractstateid );
					Vue.set(vCon, 'contractStateName', contState.name );
					var contLicenseName = licenses.find( (e) => e.uuid === vCon.licenseid );
					Vue.set(vCon, 'contractLicenseName', contLicenseName.name );
					var contPerson = await this.getItem(abyss.ajax.subjects, vCon.crudsubjectid);
					Vue.set(vCon, 'contractPerson', contPerson.displayname );
					// Vue.set(vCon, 'contractPerson', contPerson.firstname + ' ' + contPerson.lastname );
					var hasCont = _.find(this.$root.appList, { contracts: [ { uuid: vCon.uuid, isdeleted: false } ]});
					if (hasCont) {
						Vue.set(vCon, 'subscribed', true );
					}
					await this.getResources(vCon, 'CONTRACT', vCon.name, vCon.description);
					var contApp = await this.getItem(abyss.ajax.subjects, vCon.subjectid);
					Vue.set(vCon, 'contractApp', contApp.firstname );
					Vue.set(vCon, 'contractAppId', contApp.uuid );
					var subEnd = abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid;
					if (!mine) {
						subEnd = abyss.ajax.permissions_app + vCon.subjectid;
					}
					var contSubs = await this.getList(subEnd);
					var sub = _.find(contSubs, { 'resourceid': item.resource.uuid });
					// uncreated permission
					if (!sub) {
						var subscription = {
							organizationid: this.$root.abyssOrgId,
							crudsubjectid: this.$root.rootData.user.uuid,
							permission: 'Subscription of ' + contApp.firstname + ' APP to ' + item.openapidocument.info.title + ' API',
							description: 'Subscription of ' + contApp.firstname + ' APP to ' + item.openapidocument.info.title + ' API',
							effectivestartdate: moment.utc().toISOString(),
							effectiveenddate: moment.utc().add(1, 'years').toISOString(),
							subjectid: vCon.subjectid,
							resourceid: item.resource.uuid,
							resourceactionid: abyss.defaultIds.invokeApi,
							accessmanagerid: abyss.defaultIds.accessManager,
							isactive: true,
						};
						var res = await this.addItem(abyss.ajax.permission_list, subscription);
						Vue.set(vCon, 'subscription', res);
						vCon.subscriptions = [];
						vCon.subscriptions.push(res);
						if (hasCont) {
							this.getAccessTokens(item.uuid, 'API', res);
						}
					} else {
						Vue.set(vCon, 'subscriptions', contSubs );
						Vue.set(vCon, 'subscription', sub );
						if (hasCont) {
							this.getAccessTokens(item.uuid, 'API', sub);
						}
					}
				});
			},
			// ■■■■■■■■ my apps ■■■■■■■■ //
			async getMyAppDetail(app, index, modal) {
				for (var vCon of app.contracts) {
					if (!vCon.api) {
						var contState = this.$root.rootData.contractStates.find( (e) => e.uuid === vCon.contractstateid );
						Vue.set(vCon, 'contractStateName', contState.name );
						if (!vCon.isdeleted) {
							Vue.set(vCon, 'subscribed', true);
						}
						var conApi = await this.getItem(abyss.ajax.api_list, vCon.apiid);
						Vue.set(vCon, 'api', conApi );
						var conLicArr = await this.getList(abyss.ajax.licenses + '/' + vCon.licenseid);
						Vue.set(vCon, 'license', conLicArr );
						await this.getResources(vCon.api, 'API', vCon.api.openapidocument.info.title + ' ' + vCon.api.openapidocument.info.version, vCon.api.openapidocument.info.description);
						Vue.set(vCon, 'subscription', _.find(app.subscriptions, { resourceid: vCon.api.resource.uuid }) );
						this.getAccessTokens(vCon.api.uuid, 'API', vCon.subscription);
					}
				}
				if (modal && app.contracts.length > 0) {
					Vue.set(this.$parent.$parent, 'app', app );
					this.$root.setState('previewapp');
					$('body').addClass('no-scroll');
					$('.page-wrapper').addClass('no-scroll');
					// setTimeout(() => {
					// 	require(['slimscroll'],function(){
					// 		$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
					// 	});
					// },100);
					this.preload('.nicescroll-bar');
				}
			},
			async getMyApps(no) {
				var myAppList = await this.getList(abyss.ajax.subject_app_subject_list + this.$root.rootData.user.uuid);
				var appArr = [];
				for (var item of myAppList) {
					var res = await this.getItem(abyss.ajax.subjects, item.appid);
					res.appUser = item;
					await this.getResources(res, 'APP', res.firstname, res.description);
					var permissions_app = this.getList(abyss.ajax.permissions_app + res.uuid);
					var contracts_app = this.getList(abyss.ajax.contracts_app + res.uuid);
					var [subscriptions, contracts] = await Promise.all([permissions_app, contracts_app]);
					subscriptions = subscriptions.filter((el) => el.resourceactionid === abyss.defaultIds.invokeApi && el.isdeleted === false );
					contracts = contracts.filter((el) => el.isdeleted === false );
					Vue.set(res, 'contracts', contracts );
					Vue.set(res, 'subscriptions', subscriptions );
					Vue.set(res, 'subscriptionsCount', res.subscriptions.length );
					if (no) {
						this.mySubscriptions += res.contracts.length;
					}
					// console.log("res.contracts.length: ", res.contracts.length);
					if (res.contracts.length > 0) {
						for (var cont of res.contracts) {
						// res.contracts.forEach(async (cont, k) => {
							// var resource = await this.getItem(abyss.ajax.resources_reference, cont.uuid);
							// Vue.set(cont, 'resource', resource );
							await this.getResources(cont, 'CONTRACT', cont.name, cont.description);
						// });
						}
					}
					// console.log("res.subscriptions.length: ", res.subscriptions.length);
					///////////////////// ?? subs resource
					if (res.subscriptions.length > 0) {
						// res.subscriptions.forEach(async (sub, k) => {
						for (var sub of res.subscriptions) {
							var resource = await this.getItem(abyss.ajax.resources, sub.resourceid);
							Vue.set(sub, 'resource', resource );
							// await this.getResources(api, 'API', api.name, api.description);
							await this.getAccessTokens(sub.resource.resourcerefid, 'API', sub);

							var apiName = await this.getItem(abyss.ajax.api_list, sub.resource.resourcerefid)
							Vue.set(sub, 'apiName', apiName.openapidocument.info.title);
							var apiOwner = await this.getItem(abyss.ajax.subjects, apiName.crudsubjectid)
							Vue.set(sub, 'apiOwner', apiOwner.displayname);
						}
						// });
					}
					if (this.$root.rootData.myPermissions.length > 0) {
						var appPerm = _.find(this.$root.rootData.myPermissions, { 'resourceid': res.resource.uuid });
						if (appPerm) {
							Vue.set(res, 'permission', appPerm );
							await this.getAccessTokens(res.uuid, 'APP', res.permission);
						}
						if (!appPerm) {
							console.log("setAppPermAndToken res: ", res);
							this.setAppPermAndToken(res);
						}
					}
					appArr.push(res);
				}
				Vue.set(this.$root, 'appList', appArr );
				// console.log(this.$options.name + " this.$root.appList: ", this.$root.appList);
			},
			async setAppPermAndToken(item) {
				var subscription = {
					organizationid: this.$root.abyssOrgId,
					crudsubjectid: this.$root.rootData.user.uuid,
					permission: 'Subscription of my own ' + item.firstname + ' APP',
					description: 'Subscription of my own ' + item.firstname + ' APP',
					effectivestartdate: moment.utc().toISOString(),
					effectiveenddate: moment.utc().add(1, 'years').toISOString(),
					subjectid: this.$root.rootData.user.uuid,
					resourceid: item.resource.uuid,
					resourceactionid: abyss.defaultIds.ownApp, // OWN_APP
					accessmanagerid: abyss.defaultIds.accessManager,
					isactive: true,
				};
				var subs = await this.addItem(abyss.ajax.permission_list, subscription);
				Vue.set(item, 'permission', subs);
				this.createAccessTokens(item.uuid, 'APP', subs);

				var consume = _.cloneDeep(subscription);
				Vue.set(consume, 'resourceactionid', abyss.defaultIds.consumeApp);
				await this.addItem(abyss.ajax.permission_list, consume);
			},
			// ■■■■■■■■ subscribe ■■■■■■■■ //
			selectAppToSubscribe(val) {
				if (this.api.issandbox !== val.issandbox) {
					this.$toast('warning', {title: 'ENVIRONMENT DOES NOT MATCH', message: 'Your APP environment and selected API environment should match', position: 'topRight'})
					Vue.delete(this.api, 'selectedApp');
				}
			},
			async unsubscribeConfirm(item) {
				return this.$swal({
					title: 'Are you sure to unsubscribe?',
					type: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Yes Unsubscribe it!',
					cancelButtonText: 'No, Keep it!',
					showCloseButton: true,
					// showLoaderOnConfirm: true
				}).then((result) => {
					if (result.value) {
						return result.value;
					} else {
						return false
					}
				});
			},
			async unsubscribeFromApi(cont) {
				var unsubscribeConfirm = await this.unsubscribeConfirm();
				console.log("unsubscribeConfirm: ", unsubscribeConfirm);
				if (unsubscribeConfirm) {
					var delToken = await this.deleteItem(abyss.ajax.resource_access_tokens, cont.subscription.accessToken, false);
					if (delToken) {
						var delSub = await this.deleteItem(abyss.ajax.permission_list, cont.subscription, false);
					}
					if (delSub) {
						await this.deleteResource(cont);
						var delCon = await this.deleteItem(abyss.ajax.contracts, cont, false);
					}
					if (delCon) {
						this.$toast('success', {title: 'UNNSUBSCRIBED', message: 'You have unnsubscribed from API successfully', position: 'topRight'});
						this.getMyApps();
						this.$root.setState('init');
					}
				}
			},
			async subscribeToApi(val) {
				if (!this.api.selectedApp) {
					this.$toast('warning', {title: 'Please select an APP', message: 'You have to select an APP in order to subscribe to this API', position: 'topRight'});
				} else if (!this.api.selectedLicense) {
					this.$toast('warning', {title: 'Please select a LICENSE', message: 'You have to select an license in order to subscribe to this API', position: 'topRight'});
				} else {
					var subscription = {
						organizationid: this.$root.abyssOrgId,
						crudsubjectid: this.$root.rootData.user.uuid,
						permission: 'Subscription of ' + this.api.selectedApp.firstname + ' APP to ' + this.api.openapidocument.info.title + ' API',
						description: 'Subscription of ' + this.api.selectedApp.firstname + ' APP to ' + this.api.openapidocument.info.title + ' API',
						effectivestartdate: moment.utc().toISOString(),
						effectiveenddate: moment.utc().add(1, 'years').toISOString(),
						subjectid: this.api.selectedApp.uuid,
						resourceid: this.api.resource.uuid,
						resourceactionid: abyss.defaultIds.invokeApi,
						accessmanagerid: abyss.defaultIds.accessManager,
						isactive: true,
					};
					var subs = await this.addItem(abyss.ajax.permission_list, subscription);
					await this.createAccessTokens(this.api.uuid, 'API', subs);
					var contract = {
						organizationid: this.$root.abyssOrgId,
						crudsubjectid: this.$root.rootData.user.uuid,
						name: 'Contract of ' + this.api.selectedApp.firstname + ' APP with ' + this.api.openapidocument.info.title + ' API',
						description: 'Contract of ' + this.api.selectedApp.firstname + ' APP with ' + this.api.openapidocument.info.title + ' API',
						apiid: this.api.uuid,
						subjectid: this.api.selectedApp.uuid,
						environment: this.myAppsEnvironment(this.api.issandbox),
						contractstateid: abyss.defaultIds.contractActivated, //ACTIVATED
						status: 'inforce',
						isrestrictedtosubsetofapi: false,
						licenseid: this.api.selectedLicense,
						subjectpermissionid: subs.uuid,
					};
					var resCont = await this.addItem(abyss.ajax.contracts, contract);
					await this.createResource(resCont, 'CONTRACT', resCont.name, resCont.description);
					this.$toast('success', {title: 'Successful Contract', message: 'Contract of ' + this.api.selectedApp.firstname + ' APP to ' + this.api.openapidocument.info.title + ' API', position: 'topLeft'});
					this.getMyApps();
					this.$root.setState('init');
				}
			},
			// ■■■■■■■■ testapi ■■■■■■■■ //
			hideLegalText() {
				this.$root.isShowLegalText = false;
				$('.column-main-fixed > div').removeClass('no-scroll');
				this.$root.legalText = '';
				Vue.set(this.$root, 'legalText', {});
			},
			showLegalText(val) {
				this.$root.isShowLegalText = true;
				$('.column-main-fixed > div').addClass('no-scroll');
				Vue.set(this.$root.legalText, 'name', val.name);
				Vue.set(this.$root.legalText, 'description', val.description);
				Vue.set(this.$root.legalText, 'documentText', val.documentText);
				// setTimeout(() => {
				// 	$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
				// },100);
				this.preload('.nicescroll-bar');
				console.log("showLegalText: ");
			},
			cancelTestApi() {
				this.$root.isTestApi = false;
			},
			testApi(val) {
				this.$root.isTestApi = true;
				require(['swagger-ui', 'css!swagger-ui-css'],function(SwaggerUIBundle){
					const swUi = SwaggerUIBundle({
						spec: val,
						dom_id: '#swagger-ui',
						deepLinking: true,
						presets: [
							SwaggerUIBundle.presets.apis,
						],
						plugins: [
							SwaggerUIBundle.plugins.DownloadUrl
						],
					});
					window.swUi = swUi;
				});
			},
			// ■■■■■■■■ Props ■■■■■■■■ //
			fillProps(item) {
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
				}
				if (item.organizationid == null) {
					Vue.set(item,'organizationid',this.$root.abyssOrgId);
				}
			},
			cleanProps(obj, typ) {
				var item = _.cloneDeep(obj);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				if (typ === 'user') {
					Vue.delete(item, 'isactivated');
					Vue.delete(item, 'totallogincount');
					Vue.delete(item, 'failedlogincount');
					Vue.delete(item, 'invalidpasswordattemptcount');
					Vue.delete(item, 'ispasswordchangerequired');
					Vue.delete(item, 'passwordexpiresat');
					Vue.delete(item, 'lastloginat');
					Vue.delete(item, 'lastpasswordchangeat');
					Vue.delete(item, 'lastauthenticatedat');
					Vue.delete(item, 'lastfailedloginat');
					// profile
					Vue.delete(item, 'groups');
					Vue.delete(item, 'memberships');
					Vue.delete(item, 'organizations');
					Vue.delete(item, 'isAdmin');
					Vue.delete(item, 'permission');
					if (item.effectiveenddate == null) {
						item.effectiveenddate = moment.utc(item.effectivestartdate).add(6, 'months').toISOString();
					}
					if (item.secondaryemail == null) {
						Vue.set(item, 'secondaryemail', item.email);
					}
					if (item.picture == null) {
						Vue.set(item, 'picture', '');
					}
				}
				if (typ === 'organization') {
					Vue.delete(item, 'organizationUser');
				}
				return item;
			},
		},
	});
// ■■■■■■■■ COMPONENTS ■■■■■■■■ //
	Vue.component('api-nav', {
		props: ['name', 'pagecurrent', 'mygroups', 'mycategories', 'mytags'],
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
				this.$root.deleteTax(list, editing, item);
			},
			setTax(action, title, list, item) {
				this.$root.setTax(action, title, list, item);
			},
		}
	});
	Vue.component('my-organizations', {
		template: '#tree-menu',
		props: ['org', 'index', 'orgs', 'title', 'deforg', 'col'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {
		},
		methods : {
			organizationAction(act, org) {
				this.$validator.validateAll().then((result) => {
					if (result) {
						this.$root.organizationAction(act, org);
					}
				});
			},
			deleteOrganization(item) {
				this.$root.deleteOrganization(item);
			},
		},
		created() {
		},
	});
// ■■■■■■■■ vue ■■■■■■■■ //
	new Vue({
		el: '#portal',
		name: 'portal',
		data: {
			isLoading: true,
			searchAll: "",
			searchResults: null,
			searchPaginate: null,
			sort: {
				key: 'name',
				type: String,
				order: 'asc'
			},
			sortOrg: {
				key: 'organizationid',
				type: String,
				order: 'asc'
			},
			now: moment.utc().toISOString(),
			pageCurrent: '',
			rootState: 'init',
			pageClassPrefix: 'vs',
			pageClass: '',
			abyssUrl: abyss.abyssUrl,
			abyssEndpoint: abyss.abyssLocation,
			abyssSandbox: abyss.isAbyssSandbox,
			abyssVersion: abyss.abyssVersion,
			abyssSubjectTypeIds: {
				app: abyss.defaultIds.subjectTypeApp,
				user: abyss.defaultIds.subjectTypeUser,
				group: abyss.defaultIds.subjectTypeGroup,
			},
			abyssOrgName: null,
			abyssOrgId: null,
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
			abyssGatewayUrl : abyss.abyssGatewayUrl,
			abyssYamlList : [],
			previewedApi: {},
			isTestApi: false,
			isShowLegalText: false,
			legalText: {},
			appList: [],
			defaultOrganization: null,
			showOrganizations: false,
			showProfile: false,
			newOrganization: [{
				"organizationid": null,
				"crudsubjectid": null,
				"name": null,
				"description": "",
				"url": "",
			}],
			userOptions: [],
			shareApi: {
				isMine: false,
				selectedUser: null,
				permissions: null,
				readonly: true,
			},
			end: []
		},
		methods: {
			// ■■■■■■■■ search ■■■■■■■■ //
			setSearchPaginate(data, p) {
				console.log("data: ", data);
				let total = data.hits.total;
				let size = 100;
				// let pages = total / size;
				let pages = Math.ceil(total / size);
				let first = p === 0;
				let last = p === pages - 1;
				console.log("p, pages: ", p, pages);
				let paginate = {
					pages: [],
					first: first,
					last: last,
					pageSize: size,
					totalPages: pages,
					currentPage: p
				};
				for (var i = 0; i < paginate.totalPages; i++) {
					paginate.pages.push(i);
				}
				// console.log("paginate: ", paginate);
				return paginate;
			},
			gatSearchAll(data) {
				return axios.post(abyss.abyssSearch, data).then(response => {
					console.log("response: ", response);
					return response;
				});
			},
			onSearchAll(p) {
				var vm = this;
				var searchAll = {
					"query": {
						"query_string": {
							"query": this.searchAll
						}
					},
					"from": p,
					"size": 100
				};
				$.ajax({
					url: abyss.abyssSearch,
					type:"POST",
					contentType: 'application/json',
					// accept: 'application/json',
					// responseType: 'json',
					// data: this.searchAll,
					data: JSON.stringify(searchAll),
					success(result) {
						// console.log("result: ", result);
						vm.searchResults = result;
						vm.searchPaginate = vm.setSearchPaginate(vm.searchResults, p);
						vm.preload();
						
						vm.$nextTick(() => {
							UI.navhorz.init();
						});
					}
				});
			},
			// ■■■■■■■■ searchUsers ■■■■■■■■ //
			async getUserOptions(search, loading) {
				loading(true);
				this.$root.userOptions = await this.getList(abyss.ajax.user_list + '?likename=' + search);
				loading(false);
			},
			async deleteSharedApi(item, conf, list){
				/*var hasUserView = this.$root.shareApi.permissions.find((e) => e.subjectid == item.subjectid && e.resourceactionid == abyss.defaultIds.viewApi );
				var hasUserEdit = this.$root.shareApi.permissions.find((e) => e.subjectid == item.subjectid && e.resourceactionid == abyss.defaultIds.editApi );
				if (item.resourceactionid == abyss.defaultIds.viewApi && !hasUserEdit) {
					// var delView = await this.deleteItem(abyss.ajax.permission_list, item, conf, list);
					console.log("delete hasUserView: ", item);
					// if (delView) {
					if (true) {
						await this.setSharedApis();
					}
				} else if (item.resourceactionid == abyss.defaultIds.editApi && hasUserView) {
					// var delEdit = await this.deleteItem(abyss.ajax.permission_list, item, conf, list);
					// console.log("delete hasUserEdit: ", hasUserView,);
					console.log("delete hasUserEdit: ", item);
					// if (delEdit) {
					if (true) {
						Vue.delete(hasUserView, 'view');
						// await this.setSharedApis();
					}
				}*/
				var del = await this.deleteItem(abyss.ajax.permission_list, item, conf, list);
				if (del) {
					await this.setSharedApis();
					// setTimeout(() => {
					// 	this.$refs.refIndex.getApisSharedByMe();
					// 	// this.$refs.refIndex.getApisSharedWithMe();
					// },5000);
				}
			},
			async shareMyApi() {
				if (this.$root.shareApi.selectedUser) {
					var hasUserView = this.$root.shareApi.permissions.find((e) => e.subjectid === this.$root.shareApi.selectedUser.uuid && e.resourceactionid === abyss.defaultIds.viewApi );
					var hasUserEdit = this.$root.shareApi.permissions.find((e) => e.subjectid === this.$root.shareApi.selectedUser.uuid && e.resourceactionid === abyss.defaultIds.editApi );
					if (this.$root.shareApi.readonly && hasUserView && !hasUserEdit) {
						this.$toast('warning', {title: 'Already Shared', message: 'with read-only permission', position: 'topRight'});
					} else if (this.$root.shareApi.readonly && hasUserView && hasUserEdit) {
						this.$toast('warning', {title: 'Already Shared', message: 'with read/write permission', position: 'topRight'});
					} else if (!this.$root.shareApi.readonly && hasUserEdit) {
						this.$toast('warning', {title: 'Already Shared', message: 'with read/write permission', position: 'topRight'});
					} else {
						var shareView = {
							organizationid: this.$root.abyssOrgId,
							crudsubjectid: this.$root.rootData.user.uuid,
							permission: 'Shared ' + this.$root.previewedApi.openapidocument.info.title + ' API by ' + this.$root.rootData.user.displayname + ' with ' + this.$root.shareApi.selectedUser.displayname + ', with read-only permission',
							description: this.$root.rootData.user.displayname + ' has shared ' + this.$root.previewedApi.openapidocument.info.title + ' API with ' + this.$root.shareApi.selectedUser.displayname + ', with read-only permission',
							effectivestartdate: moment.utc().toISOString(),
							effectiveenddate: moment.utc().add(1, 'years').toISOString(),
							subjectid: this.$root.shareApi.selectedUser.uuid,
							resourceid: this.$root.previewedApi.resource.uuid,
							resourceactionid: abyss.defaultIds.viewApi, // VIEW_API
							accessmanagerid: abyss.defaultIds.accessManager,
							isactive: true,
						};
						var shareEdit = _.cloneDeep(shareView);
						Vue.set(shareEdit, 'resourceactionid', abyss.defaultIds.editApi);
						Vue.set(shareEdit, 'permission', 'Shared ' + this.$root.previewedApi.openapidocument.info.title + ' API by ' + this.$root.rootData.user.displayname + ' with ' + this.$root.shareApi.selectedUser.displayname + ', with read/write permission');
						Vue.set(shareEdit, 'description', this.$root.rootData.user.displayname + ' has shared ' + this.$root.previewedApi.openapidocument.info.title + ' API with ' + this.$root.shareApi.selectedUser.displayname + ', with read/write permission');
						if (this.$root.shareApi.readonly && !hasUserView && !hasUserEdit) {
							console.log("shareView: ", shareView);
							var shView = await this.addItem(abyss.ajax.permission_list, shareView);
							if (shView) {
								this.$toast('info', {message: 'API shared successfully', title: 'API SHARED with read-only permission', position: 'topRight'});
								await this.setSharedApis();
								// setTimeout(() => {
								// 	this.$refs.refIndex.getApisSharedByMe();
								// 	// this.$refs.refIndex.getApisSharedWithMe();
								// },5000);
							}
						} else if (!this.$root.shareApi.readonly && hasUserView) {
							console.log("shareEdit: ", shareEdit);
							var shEdit = await this.addItem(abyss.ajax.permission_list, shareEdit);
							if (shEdit) {
							// if (true) {
								this.$toast('info', {message: 'API shared successfully', title: 'API SHARED with read/write permission', position: 'topRight'});
								await this.setSharedApis();
								// setTimeout(() => {
								// 	this.$refs.refIndex.getApisSharedByMe();
								// 	// this.$refs.refIndex.getApisSharedWithMe();
								// },5000);
							}
						} else if (!this.$root.shareApi.readonly && !hasUserView && !hasUserEdit) {
							// var shareArr = [];
							// shareArr.push(shareView);
							// shareArr.push(shareEdit);
							// console.log("shareArr: ", shareArr);
							// await this.addBulkItems(abyss.ajax.permission_list, shareArr);
							///////////
							/*var share_1 = this.addItem(abyss.ajax.permission_list, shareView);
							var share_2 = this.addItem(abyss.ajax.permission_list, shareEdit);
							var [share1, share2] = await Promise.all([share_1, share_2]);*/
							var share1 = await this.addItem(abyss.ajax.permission_list, shareView);
							if (share1) {
								var share2 = await this.addItem(abyss.ajax.permission_list, shareEdit);
							}
							console.log("shareView: ", shareView);
							console.log("shareEdit: ", shareEdit);
							if (share2) {
							// if (true) {
								this.$toast('info', {message: 'API shared successfully', title: 'API SHARED with read/write permission', position: 'topRight'});
								await this.setSharedApis();
								// setTimeout(() => {
								// 	this.$refs.refIndex.getApisSharedByMe();
								// 	// this.$refs.refIndex.getApisSharedWithMe();
								// },5000);
							}
						}
					}
				} else {
					this.$toast('warning', {title: 'Please select a USER', message: 'You have to select a USER in order to share this API', position: 'topRight'});
				}
			},
			// ■■■■■■■■ taxonomies ■■■■■■■■ //
			filterApis(i, p) {
				var bsEnd = abyss.abyssLocation + '/apis/businesses/' + p + '/' + i.uuid + '/subject/' + this.rootData.user.uuid + '/';
				var pxEnd = abyss.abyssLocation + '/apis/proxies/' + p + '/' + i.uuid + '/subject/' + this.rootData.user.uuid + '/';
				if (this.$root.pageCurrent === 'my-apis') {
					this.$refs.refMyApis.getPage(1, bsEnd, pxEnd, i.name);
				} else if (this.$root.pageCurrent === 'explore') {
					this.$refs.refPage.getPage(1, pxEnd, i.name);
				}
			},
			fixTax(item) {
				if (this.taxTitle === 'Tag') {
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
				if (this.taxTitle === 'Group') {
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
			cancelTax() {
				this.tax = _.cloneDeep(this.newTax);
				this.selectedTax = _.cloneDeep(this.newTax);
				this.taxAction = '';
				this.taxTitle = '';
				this.taxList = '';
			},
			restoreTax(item) {
				var index = this.rootData[this.taxList].indexOf(item);
				this.rootData[this.taxList][index] = this.selectedTax;
				this.cancelTax();
			},
			async deleteTax(list, arrlist, item) {
				this.$root.setState('init');
			},
			async addTax() {
				var result = await this.$validator.validateAll();
				if (result) {
					await this.addItem(this.getEndpoint(), this.cleanProps(this.tax), this.rootData[this.taxList]);
					this.cancelTax();
					$('#taxModal').modal("hide");
				}
			},
			async editTax() {
				var result = await this.$validator.validateAll();
				if (result) {
					await this.editItem(this.getEndpoint(), this.tax.uuid, this.cleanProps(this.tax), this.rootData[this.taxList]);
					this.cancelTax();
					$('#taxModal').modal("hide");
				}
			},
			setTax(action, title, list, item) {
				this.$root.setState('init');
				this.taxAction = action;
				this.taxTitle = title;
				this.taxList = list;
				console.log("this.taxList: ", this.taxList);
				if (action === 'edit') {
					this.fixTax(item);
					this.tax = item;
				}
				if (action === 'add') {
					this.fixTax(this.tax);
				}
				this.selectedTax = _.cloneDeep(this.tax);
			},
			getEndpoint(lst) {
				var list = this.taxList;
				console.log("getEndpoint list: ", list);
				if (lst) {
					list = lst;
				}
				if ( list === 'apiVisibilityList') {
					return abyss.ajax.api_visibility_list;
				}
				if ( list === 'apiStateList') {
					return abyss.ajax.api_states_list;
				}
				if ( list === 'apiGroupList') {
					return abyss.ajax.api_group_list;
				}
				if ( list === 'apiCategoryList') {
					return abyss.ajax.api_category_list;
				}
				if ( list === 'apiTagList') {
					return abyss.ajax.api_tag_list;
				}
			},
			// ■■■■■■■■ profile ■■■■■■■■ //
			editProfile() {
				this.showProfile = true;
			},
			async saveProfile() {
				await this.editItem(abyss.ajax.subjects, this.$root.rootData.user.uuid, this.cleanProps(this.$root.rootData.user, 'user') );
				this.showProfile = false;
			},
			async recreateUserPermAndToken() {
				var del = await this.deleteItem(abyss.ajax.resource_access_tokens, this.$root.rootData.user.permission.accessToken, false);
				if (del) {
					await this.createAccessTokens(this.$root.rootData.user.uuid, 'PLATFORM', this.$root.rootData.user.permission);
					this.$toast('success', {title: 'ACCESS TOKEN REGENERATED', message: 'Your Access Token successfully', position: 'topRight'});
				}
			},
			async createUserPermAndToken() {
				var permission = {
					organizationid: this.$root.abyssOrgId,
					crudsubjectid: this.$root.rootData.user.uuid,
					permission: 'Token Permission of ' + this.$root.rootData.user.subjectname + ' USER',
					description: 'Token Permission of ' + this.$root.rootData.user.subjectname + ' USER',
					effectivestartdate: moment.utc().toISOString(),
					effectiveenddate: moment.utc().add(1, 'years').toISOString(),
					subjectid: this.$root.rootData.user.uuid,
					resourceid: abyss.defaultIds.abyssPlatform, // Abyss Platform
					resourceactionid: abyss.defaultIds.usePlatform, // USE_PLATFORM
					accessmanagerid: abyss.defaultIds.accessManager,
					isactive: true,
				};
				var perm = await this.addItem(abyss.ajax.permission_list, permission);
				Vue.set(this.$root.rootData.user, 'permission', perm);
				this.createAccessTokens(this.$root.rootData.user.uuid, 'PLATFORM', this.$root.rootData.user.permission);
			},
			// ■■■■■■■■ organizations ■■■■■■■■ //
			listOrganizations() {
				this.showOrganizations = true;
			},
			async deleteOrganization(item) {
				var delOrgUser = await this.deleteItem(abyss.ajax.subject_organizations, item.organizationUser, true);
				console.log("delOrgUser: ", delOrgUser);
				if (delOrgUser) {
					await this.deleteItem(abyss.ajax.organizations_list, item, false);
				}
			},
			async organizationAction(act, org) {
				if (act === 'add') {
					Vue.set(org, 'crudsubjectid', this.$root.rootData.user.uuid);
					var item = await this.addItem(abyss.ajax.organizations_list, org);
					var subject = {
						"organizationid": item.uuid,
						"crudsubjectid": this.$root.rootData.user.uuid,
						"subjectid": this.$root.rootData.user.uuid,
						"organizationrefid": item.uuid,
					};
					await this.addItem(abyss.ajax.subject_organizations, subject);
					this.getOrganizations(this.$root.rootData.user.uuid);
					this.newOrganization = [{
						"organizationid": null,
						"crudsubjectid": null,
						"name": null,
						"description": "",
						"url": "",
					}];
				}
				if (act === 'edit') {
					Vue.set(org.organizationUser, 'organizationid', org.organizationUser.organizationrefid ); // ??
					await this.editItem(abyss.ajax.organizations_list, org.uuid, this.cleanProps(org, 'organization'))
					this.getOrganizations(this.$root.rootData.user.uuid);
				}
			},
			async getOrganizations(id) {
				var defaultOrganization = await this.getItem(abyss.ajax.organizations_list, abyss.defaultIds.organization);
				Vue.set(this, 'defaultOrganization', defaultOrganization );
				var orgs = [];
				var subjectOrganizations = await this.getList(abyss.ajax.subject_organizations_list + '/' + id);
				Vue.set(this.rootData, 'subjectOrganizations', subjectOrganizations );
				this.rootData.subjectOrganizations.forEach(async (value, key) => {
					var res = await this.getItem(abyss.ajax.organizations_list, value.organizationrefid);
					res.organizationUser = value;
					orgs.push(res);
				});
				Vue.set(this.rootData.user, 'organizations', orgs );
			},
			// ■■■■■■■■ getRootData-rootFunc ■■■■■■■■ //
			setPage(page, state) {
				this.pageCurrent = page;
				this.rootState = state;
			},
			setState(state, toggle) {
				if (this.rootState !== 'init' && toggle && this.rootState === state) {
					console.log("state: ", state);
					this.rootState = toggle;
					this.pageClass = this.pageClassPrefix + '-' + toggle;
				} else{
					this.rootState = state;
					this.pageClass = this.pageClassPrefix + '-' + state;
				}
				// require(['slimscroll'],function(){
				// 	$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
				// });
				this.preload('.nicescroll-bar');
			},
			async getTaxData() {
				var api_tag_subject = this.getList(abyss.ajax.api_tag_subject + this.$root.rootData.user.uuid);
				var api_group_subject = this.getList(abyss.ajax.api_group_subject + this.$root.rootData.user.uuid);
				var api_category_subject = this.getList(abyss.ajax.api_category_subject + this.$root.rootData.user.uuid);
				var [myApiTagList, myApiGroupList, myApiCategoryList] = await Promise.all([api_tag_subject, api_group_subject, api_category_subject]);
				Vue.set(this.rootData, 'myApiTagList', myApiTagList );
				Vue.set(this.rootData, 'myApiGroupList', myApiGroupList );
				Vue.set(this.rootData, 'myApiCategoryList', myApiCategoryList );
			},
			async getRootData(id) {
				var user_obj = this.getItem(abyss.ajax.subjects, id);
				var memberships_list = this.getList(abyss.ajax.subject_memberships_subject + id);
				var user_group_list = this.getList(abyss.ajax.user_group_list);
				var api_visibility_list = this.getList(abyss.ajax.api_visibility_list);
				var api_states_list = this.getList(abyss.ajax.api_states_list);
				var api_group_list = this.getList(abyss.ajax.api_group_list);
				var api_category_list = this.getList(abyss.ajax.api_category_list);
				var api_tag_list = this.getList(abyss.ajax.api_tag_list);
				var resource_types = this.getList(abyss.ajax.resource_types);
				var resource_actions = this.getList(abyss.ajax.resource_actions);
				var contract_states = this.getList(abyss.ajax.contract_states);
				var permissions_subject = this.getList(abyss.ajax.permissions_subject + id);
				var api_tag_subject = this.getList(abyss.ajax.api_tag_subject + id);
				var api_group_subject = this.getList(abyss.ajax.api_group_subject + id);
				var api_category_subject = this.getList(abyss.ajax.api_category_subject + id);
				var [user, memberships, userGroupList, apiVisibilityList, apiStateList, apiGroupList, apiCategoryList, apiTagList, resourceTypes, resourceActions, contractStates, myPermissions, myApiTagList, myApiGroupList, myApiCategoryList] = await Promise.all([user_obj, memberships_list, user_group_list, api_visibility_list, api_states_list, api_group_list, api_category_list, api_tag_list, resource_types, resource_actions, contract_states, permissions_subject, api_tag_subject, api_group_subject, api_category_subject]);
				Vue.set(this.rootData, 'user', user );
				Vue.set(this.rootData.user, 'memberships', memberships );
				Vue.set(this.rootData, 'userGroupList', userGroupList );
				Vue.set(this.rootData, 'myApiGroupList', myApiGroupList );
				Vue.set(this.rootData, 'myApiCategoryList', myApiCategoryList );
				Vue.set(this.rootData, 'myApiTagList', myApiTagList );
				Vue.set(this.rootData, 'apiVisibilityList', apiVisibilityList );
				Vue.set(this.rootData, 'apiStateList', apiStateList );
				Vue.set(this.rootData, 'apiGroupList', apiGroupList );
				Vue.set(this.rootData, 'apiCategoryList', apiCategoryList );
				Vue.set(this.rootData, 'apiTagList', apiTagList );
				Vue.set(this.rootData, 'resourceTypes', resourceTypes );
				Vue.set(this.rootData, 'resourceActions', resourceActions );
				Vue.set(this.rootData, 'contractStates', contractStates );
				Vue.set(this.rootData, 'myPermissions', myPermissions );
				await this.getMyUserGroup(id);
				await this.getMyUserPerm(id);
				await this.getOrganizations(id);
			},
			async getMyUserGroup() {
				Vue.set(this.rootData.user, 'groups', [] );
				if (this.rootData.user.memberships.length > 0) {
					this.rootData.user.memberships.forEach((value, key) => {
						var grp = _.find(this.rootData.userGroupList, { 'uuid': value.subjectgroupid });
						this.rootData.user.groups.push(grp);
					});
					var isAdmin = _.find(this.$root.rootData.user.groups, { uuid: abyss.defaultIds.groupAdmin});
					if (isAdmin) {
						Vue.set(this.rootData.user, 'isAdmin', true );
					}
				}
			},
			async getMyUserPerm() {
				if (this.rootData.myPermissions.length > 0) {
					var userPerm = _.find(this.rootData.myPermissions, { 'resourceid': abyss.defaultIds.abyssPlatform, 'resourceactionid': abyss.defaultIds.usePlatform, 'isdeleted': false });
					if (userPerm) {
						Vue.set(this.rootData.user, 'permission', userPerm );
						// this.getAccessTokens(this.rootData.user.uuid, 'USER', this.rootData.user.permission);
						var myTokens = await this.getList(abyss.ajax.resource_access_tokens_permission + '/' + this.$root.rootData.user.permission.uuid) ;
						if (myTokens.length > 0) {
							// console.log("myTokens: ", myTokens);
							var fixToken = myTokens.filter( (item) => item.isdeleted === false );
							// console.log("fixToken: ", fixToken);
							var sortToken = _.orderBy(fixToken, 'created', 'desc');
							// console.log("sortToken: ", sortToken);
							Vue.set( this.rootData.user.permission, 'accessToken', sortToken[0] );
							for (var i = 1; i < sortToken.length; i++) {
								// console.log("sortToken[i].created: ", sortToken[i].created);
								await this.deleteItem(abyss.ajax.resource_access_tokens, sortToken[i], false);
								// var del = await this.deleteItem(abyss.ajax.resource_access_tokens, sortToken[i], false);
								// console.log("del: ", del);
							}
						}
					}
				}
			},
			cancelRightSidebar() {
				console.log("cancelRightSidebar: ");
				this.showOrganizations = false;
				this.showProfile = false;
			},
			async getYamls() {
				var abyssYamlList = await this.getList(abyss.ajax.api_yaml_list);
				Vue.set(this.$root, 'abyssYamlList', _.sortBy(abyssYamlList));
			},
		},
		computed: {
		},
		mounted() {
			this.setState('init');
		},
		beforeMount() {
		},
		async created() {
			this.preloadInit();
			if (abyss.isAbyssSandbox) {
				$('body').addClass('is-sandbox');
				this.$cookie.set('abyss.session', abyss.sandbox.session, 10);
				this.$cookie.set('abyss.login.organization.name', abyss.sandbox.orgName, 10);
				this.$cookie.set('abyss.login.organization.uuid', abyss.sandbox.orgId, 10);
				this.$cookie.set('abyss.principal.uuid', abyss.sandbox.userId, 10);
			}
			this.abyssOrgName = this.$cookie.get('abyss.login.organization.name');
			this.abyssOrgId = this.$cookie.get('abyss.login.organization.uuid');
			var principal = this.$cookie.get('abyss.principal.uuid');
			var session = this.$cookie.get('abyss.session');
			if (!this.abyssOrgName || !this.abyssOrgId || !principal || !session) {
				this.$toast('error', {title: 'COOKIE EXPIRED', message: 'You have to login again', position: 'topRight'});
				window.location.href = '/abyss/logout';
			}
			// this.$cookie.delete('abyss.principal.uuid');
			this.newTax = _.cloneDeep(this.tax);
			await this.getRootData(principal);
			this.isLoading = false;
		}
	});
});
