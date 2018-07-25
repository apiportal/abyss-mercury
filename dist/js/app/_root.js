// define(['Vue', 'axios', 'vee-validate', 'moment'], function (Vue, axios, VeeValidate, moment) {
// define(['config', 'Vue', 'axios', 'vee-validate', 'tiny-cookie', 'vue-cookie', 'moment', 'izitoast', 'vue-izitoast'], function (abyss, Vue, axios, VeeValidate, Cookie, VueCookie, moment, iziToast) {
define(['config', 'Vue', 'axios', 'vee-validate', 'vue-cookie', 'moment', 'izitoast', 'vue-izitoast'], function (abyss, Vue, axios, VeeValidate, VueCookie, moment, iziToast) {
// ■■■■■■■■ AXIOS ■■■■■■■■ //
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
		} else if (response.status == 207) {
			var arr = [];
			response.data.forEach((value, key) => {
				if (value.status >= 400) {
					arr.push(value.error.usermessage);
				}
			});
			if (arr.length == 0) {
				return response;
			} else {
				alert(arr.join(', '));
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
			if ( error.response.status == 401) {
				// alert('Your session has expired');
				window.location.href = '/abyss/login';
			} else {
				if (error.response.data) {
					alert(error.response.status + '\n' + error.response.data.usermessage);
				} else {
					alert(error.response.status + '\n' + error.response.statusText);
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
			handleError(error) {
				console.log("handleError: ", error);
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
			/*deleteItem(url, item, head) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					return axios.delete(url, item, head).then(response => {
						console.log("DELETE response: ", response);
						item.isdeleted = true;
						return response;
					}, error => {
						this.handleError(error);
					});
				} else {
					console.log("CANCEL DELETE: ");
					return false;
				}
			},*/
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
					console.log("CANCEL DELETE: ");
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
			// ■■■■■■■■ resource_access_tokens ■■■■■■■■
			getAccessTokens(item, typ, subs) {
				// console.log("subjectpermissionid: ", subs.subscription.uuid);
				// console.log("resourcetypeid: ", item.resource);
				// console.log("resourcerefid: ", item.uuid);
				axios.get(abyss.ajax.resource_access_tokens_permission + subs.uuid, this.ajaxHeaders)
				.then(response => {
					var res = response.data[0];
					// console.log("resource_access_tokens_permission response: ", res);
					if (res) {
						Vue.set(subs, 'accessToken', res );
						// console.log("subs: ", subs);
						if (subs.isdeleted) {
							console.log("subs.accessToken.isdeleted: ", subs.accessToken.isdeleted);
							if (!subs.accessToken.isdeleted) {
								console.log("deleted: ", subs.accessToken);
								this.deleteAccessTokens(subs);
								axios.delete(abyss.ajax.resource_access_tokens + subs.accessToken.uuid, subs.accessToken, this.ajaxHeaders).then(response => {
									console.log("deleteAccessTokens response: ", response);
								}, error => {
									this.handleError(error);
								});
							}
						}
					} else {
						this.createAccessTokens(item.uuid, typ, subs);
					}
				}, error => {
					this.handleError(error);
				});
			},
			createAccessTokens(id, typ, subs) {
				var resType = this.$root.rootData.resourceTypes.find((e) => e.type == typ );
				var token = {
					"organizationid": this.$root.abyssOrgId,
					"crudsubjectid": this.$root.rootData.user.uuid,
					"subjectpermissionid": subs.uuid,
					"resourcetypeid": resType.uuid,
					"resourcerefid": id,
					"isactive": true
				};
				var itemArr = [];
				itemArr.push(token);
				axios.post(abyss.ajax.resource_access_tokens, itemArr, this.ajaxHeaders).then(response => {
					console.log("!! POST resource_access_tokens response: ", response);
					if (response.data[0].status != 500 ) {
						var res = response.data[0].response;
						Vue.set(subs, 'accessToken', res );
					}
				}, error => {
					this.handleError(error);
				});
			},
			// unused
			updateAccessTokens(item, typ, subs) {
				axios.delete(abyss.ajax.resource_access_tokens + item.accessToken.uuid, item.accessToken, this.ajaxHeaders).then(response => {
					console.log("DELETE response: ", response);
					this.createAccessTokens(item.uuid, typ, subs);
				}, error => {
					this.handleError(error);
				});
			},
			// ■■■■■■■■ resource ■■■■■■■■ //
			deleteResource(item) {
				axios.delete(abyss.ajax.resources + item.resource.uuid, item.resource, this.ajaxHeaders).then(response => {
					console.log("DELETE resource response: ", response);
				}, error => {
					this.handleError(error);
				});
			},
			getResources2(item, typ, name, desc) {
				return axios.get(abyss.ajax.resources_reference + item.uuid, this.ajaxHeaders)
				.then(response => {
					var res = response.data[0];
					if (res) {
						Vue.set(item, 'resource', res );
					} else {
						this.createResource(item, typ, name, desc);
					}
				}, error => {
					this.handleError(error);
				});
			},
			getResources(item, typ, name, desc) {
				axios.get(abyss.ajax.resources_reference + item.uuid, this.ajaxHeaders)
				.then(response => {
					var res = response.data[0];
					if (res) {
						Vue.set(item, 'resource', res );
					} else {
						this.createResource(item, typ, name, desc);
					}
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
					"resourcerefid": item.uuid,
					"isactive": true
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
					"resourcerefid": item.uuid, //api.uuid
					"isactive": true
				};
				var itemArr = [];
				itemArr.push(resource);
				// console.log("itemArr: ", itemArr);
				axios.post(abyss.ajax.resources, itemArr, this.ajaxHeaders).then(response => {
					console.log("!! POST resources response: ", response);
					if (response.data[0].status != 500 ) {
						var res = response.data[0].response;
						Vue.set(item, 'resource', res );
					}
				}, error => {
					this.handleError(error);
				});
			},
			// ■■■■■■■■ apiOwner ■■■■■■■■ //
			apiOwner(item) {
				axios.get(abyss.ajax.subjects + '/' + item.subjectid, this.ajaxHeaders)
				.then(response => {
					var res = response.data[0];
					if (res) {
						Vue.set(item, 'apiOwnerName', res.firstname + ' ' + res.lastname );
					}
				}, error => {
					this.handleError(error);
				});
			},
			// ■■■■■■■■ contract ■■■■■■■■ //
			getContracts(item, licenses, res, mine) {
				console.log("getContracts(): ", item);
				Vue.set(item, 'contracts', res );
				item.contracts.forEach((vCon, key) => {
					var contState = this.$root.rootData.contractStates.find( (e) => e.uuid == vCon.contractstateid );
					Vue.set(vCon, 'contractStateName', contState.name );
					var contLicenseName = licenses.find( (e) => e.uuid == vCon.licenseid );
					Vue.set(vCon, 'contractLicenseName', contLicenseName.name );
					axios.get(abyss.ajax.subjects + '/' + vCon.crudsubjectid)
					.then(response => {
						var contPerson = response.data[0];
						Vue.set(vCon, 'contractPerson', contPerson.firstname + ' ' + contPerson.lastname );
					}, error => {
						this.handleError(error);
					});
					// var hasCont = _.find(this.$root.appList, { contracts: [ { uuid: vCon.uuid } ]});
					var hasCont = _.find(this.$root.appList, { contracts: [ { uuid: vCon.uuid, isdeleted: false } ]});
					if (hasCont) {
						Vue.set(vCon, 'subscribed', true );
					}
					this.getResources(vCon, 'CONTRACT', vCon.name, vCon.description);
					setTimeout(() => {
						axios.get(abyss.ajax.subjects + '/' + vCon.subjectid)
						.then(response => {
							var contApp = response.data[0];
							Vue.set(vCon, 'contractApp', contApp.firstname );
							Vue.set(vCon, 'contractAppId', contApp.uuid );
							var subEnd = abyss.ajax.permission_my_apis + this.$root.rootData.user.uuid;
							if (!mine) {
								subEnd = abyss.ajax.permissions_app + vCon.subjectid;
							}
							axios.get(subEnd).then(response => {
								var contSubs = response.data;
								var sub = _.find(contSubs, { 'resourceid': item.resource.uuid });
								// uncreated permission
								if (!sub) {
									var subscription = {
										organizationid: this.$root.abyssOrgId,
										crudsubjectid: this.$root.rootData.user.uuid,
										permission: 'Subscription of ' + contApp.firstname + ' APP to ' + item.openapidocument.info.title + ' API',
										description: 'Subscription of ' + contApp.firstname + ' APP to ' + item.openapidocument.info.title + ' API',
										effectivestartdate: moment().toISOString(),
										effectiveenddate: moment().add(1, 'years').toISOString(),
										subjectid: vCon.subjectid,
										resourceid: item.resource.uuid,
										resourceactionid: 'c5639f00-94c9-4cc9-8ad9-df76f9d162a8',
										accessmanagerid: '6223ebbe-b30f-4976-bcf9-364003142379',
										isactive: true,
									};
									/*alert('subscription unavailable');
									console.log("NO subscription: ", subscription);
									Vue.set(vCon, 'subscription', subscription);
									vCon.subscriptions = [];
									vCon.subscriptions.push(subscription);*/
									var subsArr = [];
									subsArr.push(subscription);
									axios.post(abyss.ajax.permission_list, subsArr, this.ajaxHeaders).then(response => {
										console.log("POST NO permission subscription response: ", response);
										var res = response.data[0].response;
										if (res) {
											Vue.set(vCon, 'subscription', res);
											vCon.subscriptions = [];
											vCon.subscriptions.push(res);
											if (hasCont) {
												this.getAccessTokens(item, 'API', res);
											}
										}
									}, error => {
										this.handleError(error);
									});
								} else {
									Vue.set(vCon, 'subscriptions', contSubs );
									Vue.set(vCon, 'subscription', sub );
									if (hasCont) {
										this.getAccessTokens(item, 'API', sub);
									}
								}
							}, error => {
								this.handleError(error);
							});
						}, error => {
							this.handleError(error);
						});
					},100);
				});
			},
			// ■■■■■■■■ my apps ■■■■■■■■ //
			getMyAppDetail(app, index, modal) {
				// $(document).on('show.bs.collapse', '.app-collapse', function (e) {});
				app.contracts.forEach((vCon, key) => {
					if (!vCon.api) {
						console.log("load: ");
						var contState = this.$root.rootData.contractStates.find( (e) => e.uuid == vCon.contractstateid );
						Vue.set(vCon, 'contractStateName', contState.name );
						if (!vCon.isdeleted) {
							Vue.set(vCon, 'subscribed', true);
						}
						axios.get(abyss.ajax.api_list + vCon.apiid, this.ajaxHeaders)
						.then(response => {
							Vue.set(vCon, 'api', response.data[0] );
							// this.getResources(vCon.api, 'API', vCon.api.openapidocument.info.title + ' ' + vCon.api.openapidocument.info.version, vCon.api.openapidocument.info.description);
							axios.get(abyss.ajax.licenses_list + vCon.licenseid)
							.then(response => {
								Vue.set(vCon, 'license', response.data );
								// this.isLoading = false;
							}, error => {
								this.handleError(error);
							});
							this.getResources2(vCon.api, 'API', vCon.api.openapidocument.info.title + ' ' + vCon.api.openapidocument.info.version, vCon.api.openapidocument.info.description)
							.then(response => {
								Vue.set(vCon, 'subscription', _.find(app.subscriptions, { resourceid: vCon.api.resource.uuid }) );
								this.getAccessTokens(vCon.api, 'API', vCon.subscription);
							}, error => {
								this.handleError(error);
							});
							/*setTimeout(() => {
								Vue.set(vCon, 'subscription', _.find(app.subscriptions, { resourceid: vCon.api.resource.uuid }) );
								this.getAccessTokens(vCon.api, 'API', vCon.subscription);
							},100);*/
						}, error => {
							this.handleError(error);
						});
					}
				});
				if (modal && app.contracts.length > 0) {
					Vue.set(this, 'app', app );
					this.$root.setState('previewapp');
					$('body').addClass('no-scroll');
					$('.page-wrapper').addClass('no-scroll');
					setTimeout(() => {
						require(['slimscroll'],function(){
							$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
						});
					},100);
				}
			},
			setAppPermAndToken(item) {
				var subscription = {
					organizationid: this.$root.abyssOrgId,
					crudsubjectid: this.$root.rootData.user.uuid,
					permission: 'Subscription of my own ' + item.firstname + ' APP',
					description: 'Subscription of my own ' + item.firstname + ' APP',
					effectivestartdate: moment().toISOString(),
					effectiveenddate: moment().add(1, 'years').toISOString(),
					subjectid: this.$root.rootData.user.uuid,
					resourceid: item.resource.uuid,
					resourceactionid: 'e085cb50-8a98-4511-bc8a-00edabbae8a9', // OWN_APP
					accessmanagerid: '6223ebbe-b30f-4976-bcf9-364003142379',
					isactive: true,
				};
				var subsArr = [];
				subsArr.push(subscription);
				console.log("subsArr: ", subsArr);
				axios.post(abyss.ajax.permission_list, subsArr).then(response => {
					console.log("POST user to app subscription response: ", response);
					var subs = response.data[0].response;
					Vue.set(item, 'permission', subs);
					this.createAccessTokens(item.uuid, 'APP', subs);
				}, error => {
					this.handleError(error);
				});
				var consume = _.cloneDeep(subscription);
				Vue.set(consume, 'resourceactionid', '761c8386-4624-416e-b9e4-b59ea2c597fc');
				var consumeArr = [];
				consumeArr.push(subscription);
				console.log("consumeArr: ", consumeArr);
				axios.post(abyss.ajax.permission_list, consumeArr).then(response => {
					console.log("POST user to app consume subscription response: ", response);
				}, error => {
					this.handleError(error);
				});
			},
			getMyApps(no) { // @explore.js - refactor apps.js getpage
				axios.get(abyss.ajax.subject_app_subject_list + this.$root.rootData.user.uuid, this.ajaxHeaders)
				.then(response => {
					// var myAppList = response.data.filter( (item) => !item.isdeleted && !item.islocked && item.isactivated );
					// var myAppList = response.data.filter( (item) => !item.isdeleted );
					var myAppList = response.data;
					var appArr = [];
					myAppList.forEach((value, key) => {
						axios.get(abyss.ajax.subjects + '/' + value.appid, this.ajaxHeaders).then(response => {
							var res = response.data[0];
							res.appUser = value;
							// this.getResources(res, 'APP', res.firstname, res.lastname);
							this.getResources2(res, 'APP', res.firstname, res.lastname).then(response => {
								axios.all([
									axios.get(abyss.ajax.permissions_app + res.uuid, this.ajaxHeaders),
									axios.get(abyss.ajax.contracts_app + res.uuid, this.ajaxHeaders),
								]).then(
									axios.spread((permissions_app, contracts_app) => {
										Vue.set(res, 'contracts', contracts_app.data );
										if (no) {
											this.mySubscriptions += res.contracts.length;
										}
										if (res.contracts.length > 0) {
											res.contracts.forEach((cont, k) => {
												axios.get(abyss.ajax.resources_reference + cont.uuid, this.ajaxHeaders)
												.then(response => {
													Vue.set(cont, 'resource', response.data[0] );
												}, error => {
													this.handleError(error);
												});
											});
										}
										Vue.set(res, 'subscriptions', permissions_app.data );
										if (res.subscriptions.length > 0) {
											res.subscriptions.forEach((sub, k) => {
												axios.get(abyss.ajax.resources + sub.resourceid, this.ajaxHeaders)
												.then(response => {
													Vue.set(sub, 'resource', response.data[0] );
													this.getAccessTokens(sub.resource.resourcerefid, 'API', sub);
												}, error => {
													this.handleError(error);
												});
											});
										}
										///////////////////// 2DO
										if (this.$root.rootData.myPermissions.length > 0) {
											// var appPerm = _.find(this.$root.rootData.myPermissions, { 'resourceid': res.resource.uuid, 'isdeleted': false });
											var appPerm = _.find(this.$root.rootData.myPermissions, { 'resourceid': res.resource.uuid });
											console.log("appPerm: ", res.firstname, appPerm);
											if (appPerm) {
												Vue.set(res, 'permission', appPerm );
												// console.log("res.permission: ", res.permission);
												this.getAccessTokens(res, 'APP', res.permission);
											}
											if (!appPerm) {
												console.log("setAppPermAndToken res: ", res);
												// this.setAppPermAndToken(res);
											}
										}
										appArr.push(res);
									})
								).catch(error => {
									this.handleError(error);
								});
							});
							// appArr.push(res);
						}, error => {
							this.handleError(error);
						});
					});
					Vue.set(this.$root, 'appList', appArr );
					setTimeout(() => {
						this.preload(); //difff
						// console.log("this: ", this.$options.name);
						console.log("this.$root.appList: ", this.$root.appList);
					},100);
				}, error => {
					this.handleError(error);
				});
			},
			// ■■■■■■■■ previewApi helpers ■■■■■■■■ //
			apiGetStateName(val) {
				var slcState = this.$root.rootData.apiStateList.find((el) => el.uuid == val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.$root.rootData.apiVisibilityList.find((el) => el.uuid == val );
				return slcVisibility.name;
			},
			myAppsEnvironment(item) {
				if (item.issandbox) {
					return 'SANDBOX';
				} else {
					return 'LIVE';
				}
			},
			getTax(item) {
				axios.all([
					axios.get(abyss.ajax.api_tag_api + item.uuid),
					axios.get(abyss.ajax.api_group_api + item.uuid),
					axios.get(abyss.ajax.api_category_api + item.uuid),
				]).then(
					axios.spread((api_tag, api_group, api_category) => {
						Vue.set(item, 'tags', api_tag.data );
						Vue.set(item, 'groups', api_group.data );
						Vue.set(item, 'categories', api_category.data );
					})
				).catch(error => {
					this.handleError(error);
				});
			},
			// ■■■■■■■■ previewApi ■■■■■■■■ //
			setProxyLicense(i) {
				console.log("i: ", i);
			},
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
				// console.log("this.$root.pageCurrent: ", this.$root.pageCurrent);
				// console.log("this.$root.rootState: ", this.$root.rootState);
				// console.log("this.$root.$refs.refMyApis.api.uuid: ", this.$root.$refs.refMyApis.api.uuid);
				if (this.$root.pageCurrent == 'my-apis' && this.$root.$refs.refMyApis.api.uuid) {
					this.$root.setState('edit');
				} else {
					this.$root.setState('init');
				}
				// console.log("this.$root.rootState: ", this.$root.rootState);
			},
			previewApi(item) {
				// console.log("previewApi item: : ", JSON.stringify(item, null, 2));
				$('body').addClass('no-scroll');
				$('.page-wrapper').addClass('no-scroll');
				// console.log("previewApi: ", item);
				if (item.isproxyapi) {
					Vue.set(this.$root, 'previewedApi', _.cloneDeep(item));
					this.getTax(this.$root.previewedApi);
					axios.get(abyss.ajax.api_licenses_api + item.uuid, this.ajaxHeaders).then(response => {
						if (response.data != null) {
							var apiLicenses = response.data.filter( (item) => item.isdeleted == false );
							// var apiLicenses = response.data;
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
								Vue.set(this.$root.previewedApi, 'licenses', licenses);
								this.getResources(this.$root.previewedApi, 'API', this.$root.previewedApi.openapidocument.info.title + ' ' + this.$root.previewedApi.openapidocument.info.version, this.$root.previewedApi.openapidocument.info.description);
								console.log("this.$root.appList: ", this.$root.appList);
								// Vue.set( this.$root.previewedApi, 'filteredApps', _.reject(this.$root.appList, { contracts: [ { apiid: item.uuid } ]}) );
								Vue.set( this.$root.previewedApi, 'filteredApps', _.reject(this.$root.appList, { contracts: [ { apiid: item.uuid, isdeleted: false } ]}) );
								if (this.$root.rootData.user.uuid == this.$root.previewedApi.subjectid) {
									axios.get(abyss.ajax.contracts_api + this.$root.previewedApi.uuid, this.ajaxHeaders)
									.then(response => {
										var res = response.data;
										console.log("My Contracts response: ", res);
										if (res) {
											this.getContracts(this.$root.previewedApi, this.$root.previewedApi.licenses, res, true);
										}
									}, error => {
										this.handleError(error);
									});
								} else {
									console.log("item.uuid: ", item.uuid);
									var mySubsApp = _.filter(this.$root.appList, { contracts: [ { apiid: item.uuid } ]});
									var mySubsAppCont = [];
									mySubsApp.forEach((value, key) => {
										var ccc = _.find(value.contracts, { apiid: item.uuid });
										mySubsAppCont.push(ccc);
									});
									console.log("mySubsApp: ", mySubsApp);
									console.log("mySubsAppCont: ", mySubsAppCont);
									// var xxx = _.filter(myRes, { 'subjectid': this.user.uuid });
									this.getContracts(this.$root.previewedApi, this.$root.previewedApi.licenses, mySubsAppCont, false);
								}
								setTimeout(() => {
									this.$root.setState('preview');
									require(['slimscroll'],function(){
										$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
									});
								},1000);
							},100);	
						}
					}, error => {
						this.handleError(error);
					});
				} else {
					Vue.set(this.$root, 'previewedApi', _.cloneDeep(item));
					this.getTax(this.$root.previewedApi);
					this.$root.setState('preview');
				}
			},
			// ■■■■■■■■ subscribe ■■■■■■■■ //
			selectAppToSubscribe(val) {
				if (this.api.issandbox != val.issandbox) {
					alert('Your APP environment and selected API environment should match');
					Vue.delete(this.api, 'selectedApp');
				}
			},
			unsubscribeFromApi(cont) {
				console.log("cont.uuid: ", cont.uuid);
				console.log("cont.subscription: ", cont.subscription);
				console.log("cont.subscription.uuid: ", cont.subscription.uuid);
				var r = confirm('Are you sure to unsubscribe?');
				if (r == true) {
					axios.delete(abyss.ajax.resource_access_tokens + cont.subscription.accessToken.uuid, cont.subscription.accessToken, this.ajaxHeaders).then(response => {
						console.log("delete Access Tokens response: ", response);
						axios.delete(abyss.ajax.permission_list + '/' + cont.subscription.uuid, cont.subscription, this.ajaxHeaders).then(response => {
							cont.subscription.isdeleted = true;
							console.log("DELETE subscription response: ", response);
							this.deleteResource(cont);
							axios.delete(abyss.ajax.contracts + '/' + cont.uuid, cont, this.ajaxHeaders).then(response => {
								cont.isdeleted = true;
								console.log("DELETE contracts response: ", response);
								this.getMyApps();
								this.$root.setState('init');
							}, error => {
								this.handleError(error);
							});
						}, error => {
							this.handleError(error);
						});
					}, error => {
						this.handleError(error);
					});
				}
			},
			subscribeToApi(val) {
				if (!this.api.selectedApp) {
					alert('Please select an APP');
				} else if (!this.api.selectedLicense) {
					alert('Please select a License');
				} else {
					var subscription = {
						organizationid: this.$root.abyssOrgId,
						crudsubjectid: this.$root.rootData.user.uuid,
						permission: 'Subscription of ' + this.api.selectedApp.firstname + ' APP to ' + this.api.openapidocument.info.title + ' API',
						description: 'Subscription of ' + this.api.selectedApp.firstname + ' APP to ' + this.api.openapidocument.info.title + ' API',
						effectivestartdate: moment().toISOString(),
						effectiveenddate: moment().add(1, 'years').toISOString(),
						subjectid: this.api.selectedApp.uuid,
						resourceid: this.api.resource.uuid,
						resourceactionid: 'c5639f00-94c9-4cc9-8ad9-df76f9d162a8',
						accessmanagerid: '6223ebbe-b30f-4976-bcf9-364003142379',
						isactive: true,
					};
					// subscription
					var subsArr = [];
					subsArr.push(subscription);
					axios.post(abyss.ajax.permission_list, subsArr, this.ajaxHeaders).then(response => {
						console.log("!!!! POST permission subscription response: ", response);
						if (response.data[0].status != 500 ) {
							var subs = response.data[0].response;
							this.createAccessTokens(this.api.uuid, 'API', subs);
							var contract = {
								organizationid: this.$root.abyssOrgId,
								crudsubjectid: this.$root.rootData.user.uuid,
								name: 'Contract of ' + this.api.selectedApp.firstname + ' APP with ' + this.api.openapidocument.info.title + ' API',
								description: 'Contract of ' + this.api.selectedApp.firstname + ' APP with ' + this.api.openapidocument.info.title + ' API',
								apiid: this.api.uuid,
								subjectid: this.api.selectedApp.uuid,
								environment: this.myAppsEnvironment(this.api.issandbox),
								contractstateid: '846282ec-1329-4a3c-908b-672b4de3ade2', //ACTIVATED
								status: 'inforce',
								isrestrictedtosubsetofapi: false,
								licenseid: this.api.selectedLicense,
								subjectpermissionid: subs.uuid,
							};
							// contract
							var contArr = [];
							contArr.push(contract);
							axios.post(abyss.ajax.contracts, contArr, this.ajaxHeaders).then(response => {
								console.log("!!!! POST contracts response: ", response);
								if (response.data[0].status != 500 ) {
									var resCont = response.data[0].response;
									// this.$root.previewedApi.contracts.push(resCont);
									this.createResource(resCont, 'CONTRACT', resCont.name, resCont.description);
									setTimeout(() => {
										this.$toast('success', {title: 'Successful Contract', message: 'Contract of ' + this.api.selectedApp.firstname + ' APP to ' + this.api.openapidocument.info.title + ' API', position: 'topLeft'});
										this.getMyApps();
										this.$root.setState('init');
									},100);
								}
							}, error => {
								this.handleError(error);
							});
						}
					}, error => {
						this.handleError(error);
					});
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
				setTimeout(() => {
					$('.nicescroll-bar').slimscroll({height:'100%',color: '#878787', disableFadeOut : true,borderRadius:0,size:'4px',alwaysVisible:false});
				},100);
				console.log("showLegalText: ");
			},
			cancelTestApi() {
				this.$root.isTestApi = false;
			},
			testApi(val) {
				this.$root.isTestApi = true;
				// require(['swagger-ui'],function(){
				// define(['swagger-ui'],function(SwaggerUIBundle){
				var vm = this;
				require(['swagger-ui', 'css!swagger-ui-css'],function(SwaggerUIBundle){
					const swUi = SwaggerUIBundle({
						// url: "https://petstore.swagger.io/v2/swagger.json",
						spec: val,
						dom_id: '#swagger-ui',
						deepLinking: true,
						presets: [
							SwaggerUIBundle.presets.apis,
							// SwaggerUIStandalonePreset
						],
						plugins: [
							SwaggerUIBundle.plugins.DownloadUrl
						],
						// layout: "StandaloneLayout"
					});
					window.swUi = swUi;
				});
			},
			// ■■■■■■■■ cleanProps ■■■■■■■■ //
			cleanProps(obj, typ) {
				var item = _.cloneDeep(obj);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				if (typ == 'user') {
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
						item.effectiveenddate = moment(item.effectivestartdate).add(6, 'months').toISOString();
					}
					if (item.secondaryemail == null) {
						Vue.set(item, 'secondaryemail', item.email);
					}
					if (item.picture == null) {
						Vue.set(item, 'picture', '');
					}
				}
				if (typ == 'organization') {
					Vue.delete(item, 'organizationUser');
				}
				return item;
			},
		},
		computed: {
			apiEnvironment : {
				get() {
					if (this.api.issandbox) {
						return 'SANDBOX';
					} else {
						return 'LIVE';
					}
				}
			},
			apiGateway : {
				get() {
					return this.$root.abyssGatewayUrl + '/' + this.api.uuid;
				}
			},
			compCategoriesToList : {
				get() {
					if (this.api.categories != null) {
						// this.api.categories = [];
						return this.api.categories.map(e => e.name).join(', ');
					}
				},
			},
			compTagsToList : {
				get() {
					if (this.api.tags != null) {
						// this.api.tags = [];
						return this.api.tags.map(e => e.name).join(', ');
					}
				},
			},
			compGroupsToList : {
				get() {
					if (this.api.groups != null) {
						// this.api.groups = [];
						return this.api.groups.map(e => e.name).join(', ');
					}
				},
			},
		},
	});
// ■■■■■■■■ COMPONENTS ■■■■■■■■ //
	Vue.component('api-nav', {
		props: ['name', 'pagecurrent', 'mygroups', 'mycategories', 'mytags'],
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
					console.log("result: ", result);
					if (result) {
						this.$root.organizationAction(act, org);
						return;
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
			now: moment().toISOString(),
			pageCurrent: '',
			rootState: 'init',
			pageClassPrefix: 'vs',
			pageClass: '',
			ajaxHeaders: {},
			abyssEndpoint: abyss.abyssLocation,
			abyssSandbox: abyss.isAbyssSandbox,
			abyssVersion: abyss.abyssVersion,
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
			end: []
		},
		methods: {
			// ■■■■■■■■ taxonomies ■■■■■■■■ //
			filterApis(i, p) {
				var bsEnd = abyss.abyssLocation + '/apis/businesses/' + p + '/' + i.uuid + '/subject/' + this.rootData.user.uuid + '/';
				var pxEnd = abyss.abyssLocation + '/apis/proxies/' + p + '/' + i.uuid + '/subject/' + this.rootData.user.uuid + '/';
				if (this.$root.pageCurrent == 'my-apis') {
					this.$refs.refMyApis.getPage(1, bsEnd, pxEnd, i.name);
				} else if (this.$root.pageCurrent == 'explore') {
					this.$refs.refPage.getPage(1, pxEnd, i.name);
				}
			},
			fixTax(item) {
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
			deleteTax(list, arrlist, item) {
				this.$root.setState('init');
				console.log("deleteTax list, arrlist, item: ", list, this.rootData[arrlist], item);
				console.log("this.getEndpoint(list) + '/' + item.uuid: ", this.getEndpoint(list) + '/' + item.uuid);
				/*this.removeItem(this.getEndpoint(list) + '/' + item.uuid, item, this.ajaxHeaders, this.rootData[arrlist]).then(response => {
					console.log("delete response: ", response );
					// 2DO 2ASK how to delete api-api-xxx
				}, error => {
					this.handleError(error);
				});*/
			},
			// 2DO 2ASK added group/tag/category not existing in my /api-api-groups/subject/{uuid}
			// https://dev2.apiportal.com/abyss/oapi/api-api-groups // apiid, apigroupid
			// https://dev2.apiportal.com/abyss/oapi/api-api-groups/subject/9820d2aa-eb02-4a58-8cc5-8b9a89504df9 MD Group not exists
			// https://dev2.apiportal.com/abyss/oapi/api-groups MD Group exists
			addTax() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						var itemArr = [];
						itemArr.push(this.cleanProps(this.tax));
						console.log("addTax: ", itemArr);
						console.log("this.getEndpoint(): ", this.getEndpoint());
						this.addItem(this.getEndpoint(), itemArr, this.ajaxHeaders, this.rootData[this.taxList]).then(response => {
							console.log("addTax addItem-push response: ", response);
							this.cancelTax();
							$('#taxModal').modal("hide");
						});
					}
				});
			},
			editTax() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						console.log("editTax", this.cleanProps(this.tax));
						console.log("this.getEndpoint() + '/' + this.tax.uuid: ", this.getEndpoint() + '/' + this.tax.uuid);
						this.updateItem(this.getEndpoint() + '/' + this.tax.uuid, this.cleanProps(this.tax), this.ajaxHeaders, this.rootData[this.taxList]).then(response => {
							console.log("editTax response: ", response);
							this.cancelTax();
							$('#taxModal').modal("hide");
						});
					}
				});
			},
			setTax(action, title, list, item) {
				this.$root.setState('init');
				this.taxAction = action;
				this.taxTitle = title;
				this.taxList = list;
				console.log("this.taxList: ", this.taxList);
				if (action == 'edit') {
					this.fixTax(item);
					this.tax = item;
				}
				if (action == 'add') {
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
				if ( list == 'apiVisibilityList') {
					return abyss.ajax.api_visibility_list;
				}
				if ( list == 'apiStateList') {
					return abyss.ajax.api_states_list;
				}
				if ( list == 'apiGroupList') {
					return abyss.ajax.api_group_list;
				}
				if ( list == 'apiCategoryList') {
					return abyss.ajax.api_category_list;
				}
				if ( list == 'apiTagList') {
					return abyss.ajax.api_tag_list;
				}
			},
			// ■■■■■■■■ profile ■■■■■■■■ //
			editProfile() {
				this.showProfile = true;
				this.setState('init');
			},
			saveProfile() {
				console.log("saveProfile cleanProps: ", this.cleanProps(this.$root.rootData.user, 'user'));
				this.updateItem(abyss.ajax.subjects + '/' + this.$root.rootData.user.uuid, this.cleanProps(this.$root.rootData.user, 'user')).then(response => {
					console.log("edit profile response: ", response);
					this.showProfile = false;
					this.setState('init');
				}, error => {
					this.handleError(error);
				});
			},
			recreateUserPermAndToken() {
				// console.log("this.$root.rootData.user.permission: ", this.$root.rootData.user.permission);
				// console.log("this.$root.rootData.user.permission.accessToken: ", this.$root.rootData.user.permission.accessToken);
				axios.delete(abyss.ajax.resource_access_tokens + this.$root.rootData.user.permission.accessToken.uuid, this.$root.rootData.user.permission.accessToken, this.ajaxHeaders).then(response => {
					console.log("recreateUserPermAndToken DELETE token response: ", response);
					this.createAccessTokens(this.$root.rootData.user.uuid, 'PLATFORM', this.$root.rootData.user.permission);
					/*axios.delete(abyss.ajax.permission_list + '/' + this.$root.rootData.user.permission.uuid, this.$root.rootData.user.permission, this.ajaxHeaders).then(response => {
						console.log("recreateUserPermAndToken DELETE permission response: ", response);
						this.createUserPermAndToken();
					}, error => {
						this.handleError(error);
					});*/
				}, error => {
					this.handleError(error);
				});
			},
			createUserPermAndToken() {
				// this.createResource(item, 'APP', item.firstname, item.lastname);
				// Resource Type: 12947d53-022a-4dcf-bb06-ffa81dab4c16 PLATFORM
				// Resource Action: 2318f036-10e5-41b0-8b51-24adbffd2a2e USE_PLATFORM
				// Resource: ebe1ca8b-a891-42e9-b053-f4ac3829653c Abyss Platform
				var permission = {
					organizationid: this.$root.abyssOrgId,
					crudsubjectid: this.$root.rootData.user.uuid,
					permission: 'Token Permission of ' + this.$root.rootData.user.subjectname + ' USER',
					description: 'Token Permission of ' + this.$root.rootData.user.subjectname + ' USER',
					effectivestartdate: moment().toISOString(),
					effectiveenddate: moment().add(1, 'years').toISOString(),
					subjectid: this.$root.rootData.user.uuid,
					resourceid: 'ebe1ca8b-a891-42e9-b053-f4ac3829653c', // Abyss Platform
					resourceactionid: '2318f036-10e5-41b0-8b51-24adbffd2a2e', // USE_PLATFORM
					accessmanagerid: '6223ebbe-b30f-4976-bcf9-364003142379',
					isactive: true,
				};
				var permArr = [];
				permArr.push(permission);
				console.log("permArr: ", permArr);
				axios.post(abyss.ajax.permission_list, permArr).then(response => {
					console.log("POST user permission response: ", response);
					var perm = response.data[0].response;
					Vue.set(this.$root.rootData.user, 'permission', perm);
					this.createAccessTokens(this.$root.rootData.user.uuid, 'PLATFORM', this.$root.rootData.user.permission);
				}, error => {
					this.handleError(error);
				});
			},
			// ■■■■■■■■ organizations ■■■■■■■■ //
			listOrganizations() {
				this.showOrganizations = true;
				this.setState('init');
			},
			deleteOrganization(item) {
				var r = confirm('Are you sure to delete?');
				if (r == true) {
					var orgUser = item.organizationUser;
					console.log("orgUser: ", orgUser);
					axios.delete(abyss.ajax.organizations_list + item.uuid, item).then(response => {
						item.isdeleted = true;
						console.log("DELETE organizations response: ", response);
						axios.delete(abyss.ajax.subject_organizations + orgUser.uuid, item).then(response => {
							item.isdeleted = true;
							console.log("DELETE organization user response: ", response);
						}, error => {
							this.handleError(error);
						});
					}, error => {
						this.handleError(error);
					});
				}
			},
			organizationAction(act, org) {
				if (act == 'add') {
					Vue.set(org,'crudsubjectid',this.$root.rootData.user.uuid);
					var itemArr = [];
					itemArr.push(org);
					console.log("itemArr: ", itemArr);
					// console.log("this.$root.abyssOrgId: ", this.$root.abyssOrgId);
					// var subjectArr = [{
					// 	"organizationid": org.organizationid,
					// 	"crudsubjectid": this.$root.rootData.user.uuid,
					// 	"subjectid": this.$root.rootData.user.uuid,
					// 	"organizationrefid": org.uuid,
					// }];
					// console.log("subjectArr: ", subjectArr);
					axios.post(abyss.ajax.organizations_list, itemArr, this.ajaxHeaders).then(response => {
						console.log("addOrganization response: ", response);
						var item = response.data[0].response;
						var subjectArr = [{
							// "organizationid": this.$root.abyssOrgId,
							// "organizationid": item.organizationid,
							"organizationid": item.uuid,
							"crudsubjectid": this.$root.rootData.user.uuid,
							"subjectid": this.$root.rootData.user.uuid,
							"organizationrefid": item.uuid,
						}];
						axios.post(abyss.ajax.subject_organizations, subjectArr, this.ajaxHeaders).then(response => {
							console.log("addSubjectOrganization response: ", response);
							this.getOrganizations(this.$root.rootData.user.uuid);
							this.newOrganization = [{
								"organizationid": null,
								"crudsubjectid": null,
								"name": null,
								"description": "",
								"url": "",
							}];
						}, error => {
							this.handleError(error);
						});
					}, error => {
						this.handleError(error);
					});
				}
				if (act == 'edit') {
					var orgUser = org.organizationUser;
					Vue.set(orgUser, 'organizationid',orgUser.organizationrefid );
					this.updateItem(abyss.ajax.organizations_list + org.uuid, this.cleanProps(org, 'organization'), this.ajaxHeaders).then(response => {
						console.log("editOrganization response: ", response);
						// this.updateItem(abyss.ajax.subject_organizations + orgUser.uuid, this.cleanProps(orgUser), this.ajaxHeaders).then(response => {
						// 	console.log("editOrganizationUser response: ", response);
						// 	this.getOrganizations(this.$root.rootData.user.uuid);
						// });
						this.getOrganizations(this.$root.rootData.user.uuid);
					});
				}
			},
			getOrganizations(id) {
				axios.get(abyss.ajax.organizations_list + '3c65fafc-8f3a-4243-9c4e-2821aa32d293', this.ajaxHeaders)
				.then(response => {
					Vue.set(this, 'defaultOrganization', response.data[0] );
						var orgs = [];
						axios.get(abyss.ajax.subject_organizations_list + id, this.ajaxHeaders)
						.then(response => {
							Vue.set(this.rootData, 'subjectOrganizations', response.data );
							this.rootData.subjectOrganizations.forEach((value, key) => {
								axios.get(abyss.ajax.organizations_list + value.organizationrefid, this.ajaxHeaders)
								.then(response => {
									var res = response.data[0];
									res.organizationUser = value;
									orgs.push(res);
								}, error => {
									this.handleError(error);
								});
							});
							Vue.set(this.rootData.user, 'organizations', orgs );
							this.isLoading = false;
						}, error => {
							this.handleError(error);
						});
					}, error => {
					this.handleError(error);
				});
			},
			// ■■■■■■■■ getRootData-rootFunc ■■■■■■■■ //
			setPage(page, state) {
				this.pageCurrent = page;
				this.rootState = state;
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
			getRootData(id) {
				axios.all([
					axios.get(abyss.ajax.subjects + '/' + id),
					axios.get(abyss.ajax.subject_memberships_subject + id),
					axios.get(abyss.ajax.user_group_list),
					axios.get(abyss.ajax.api_visibility_list),
					axios.get(abyss.ajax.api_states_list),
					axios.get(abyss.ajax.api_group_list),
					axios.get(abyss.ajax.api_category_list),
					axios.get(abyss.ajax.api_tag_list),
					axios.get(abyss.ajax.resource_types),
					axios.get(abyss.ajax.resource_actions),
					axios.get(abyss.ajax.contract_states),
					axios.get(abyss.ajax.permissions_subject + id),
					//
					axios.get(abyss.ajax.api_tag_subject + id),
					axios.get(abyss.ajax.api_group_subject + id),
					axios.get(abyss.ajax.api_category_subject + id),
					//
					// axios.get(abyss.ajax.api_tag_proxies_subject + id),
					// axios.get(abyss.ajax.api_tag_businesses_subject + id),
					// axios.get(abyss.ajax.api_group_proxies_subject + id),
					// axios.get(abyss.ajax.api_group_businesses_subject + id),
					// axios.get(abyss.ajax.api_category_proxies_subject + id),
					// axios.get(abyss.ajax.api_category_businesses_subject + id),
				]).then(
					axios.spread((user, memberships, user_group_list, api_visibility_list, api_states_list, api_group_list, api_category_list, api_tag_list, resource_types, resource_actions, contract_states, permissions_subject, api_tag_subject, api_group_subject, api_category_subject) => {
					// axios.spread((user, memberships, user_group_list, api_visibility_list, api_states_list, api_group_list, api_category_list, api_tag_list, resource_types, resource_actions, contract_states, api_tag_subject, api_group_subject, api_category_subject, api_tag_proxies_subject, api_tag_businesses_subject, api_group_proxies_subject, api_group_businesses_subject, api_category_proxies_subject, api_category_businesses_subject) => {
						Vue.set(this.rootData, 'user', user.data[0] );
						Vue.set(this.rootData.user, 'memberships', memberships.data );
						Vue.set(this.rootData, 'userGroupList', user_group_list.data );
						
						Vue.set(this.rootData, 'myApiGroupList', api_group_subject.data );
						Vue.set(this.rootData, 'myApiCategoryList', api_category_subject.data );
						Vue.set(this.rootData, 'myApiTagList', api_tag_subject.data );

						// Vue.set(this.rootData, 'myProxyTags', api_tag_proxies_subject.data );
						// Vue.set(this.rootData, 'myBusinessTags', api_tag_businesses_subject.data );
						// Vue.set(this.rootData, 'myProxyGroups', api_group_proxies_subject.data );
						// Vue.set(this.rootData, 'myBusinessGroups', api_group_businesses_subject.data );
						// Vue.set(this.rootData, 'myProxyCategories', api_category_proxies_subject.data );
						// Vue.set(this.rootData, 'myBusinessCategories', api_category_businesses_subject.data );

						Vue.set(this.rootData, 'apiVisibilityList', api_visibility_list.data );
						Vue.set(this.rootData, 'apiStateList', api_states_list.data );
						Vue.set(this.rootData, 'apiGroupList', api_group_list.data );
						Vue.set(this.rootData, 'apiCategoryList', api_category_list.data );
						Vue.set(this.rootData, 'apiTagList', api_tag_list.data );
						Vue.set(this.rootData, 'resourceTypes', resource_types.data );
						Vue.set(this.rootData, 'resourceActions', resource_actions.data );
						Vue.set(this.rootData, 'contractStates', contract_states.data );
						Vue.set(this.rootData, 'myPermissions', permissions_subject.data );
						Vue.set(this.rootData.user, 'groups', [] );
						if (this.rootData.user.memberships.length > 0) {
							this.rootData.user.memberships.forEach((value, key) => {
								var grp = _.find(this.rootData.userGroupList, { 'uuid': value.subjectgroupid });
								// console.log("grp: ", grp);
								this.rootData.user.groups.push(grp);
							});
							var isAdmin = _.find(this.$root.rootData.user.groups, { uuid: 'd911bf07-7ae8-46dd-9039-295f79575a90'});
							// console.log("isAdmin: ", isAdmin);
							if (isAdmin) {
								Vue.set(this.rootData.user, 'isAdmin', true );
							}
						}
						if (this.rootData.myPermissions.length > 0) {
							var userPerm = _.find(this.rootData.myPermissions, { 'resourceid': 'ebe1ca8b-a891-42e9-b053-f4ac3829653c', 'resourceactionid': '2318f036-10e5-41b0-8b51-24adbffd2a2e', 'isdeleted': false });
							console.log("userPerm: ", userPerm);
							if (userPerm) {
								Vue.set(this.rootData.user, 'permission', userPerm );
								this.getAccessTokens(this.rootData.user, 'USER', this.rootData.user.permission);
							}
						}
						this.getOrganizations(id);
					})
				).catch(error => {
					this.handleError(error);
				});
			},
			cancelRightSidebar() {
				console.log("cancelRightSidebar: ");
				this.showOrganizations = false;
				this.showProfile = false;
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
				$('body').addClass('is-sandbox');
				this.$cookie.set('abyss.session', abyss.session, 10);
				this.$cookie.set('abyss.login.organization.name', 'monasdyas', 10); //ten day
				this.$cookie.set('abyss.login.organization.uuid', '89db8aca-51b3-435b-a79d-e1f4067d2076', 10); //day
				// this.$cookie.set('abyss.login.organization.uuid', '3c65fafc-8f3a-4243-9c4e-2821aa32d293', 10); //ten day
				this.$cookie.set('abyss.principal.uuid', '9820d2aa-eb02-4a58-8cc5-8b9a89504df9', 10); //day
				// this.$cookie.set('abyss.principal.uuid', '32c9c734-11cb-44c9-b06f-0b52e076672d', 1); //day
				// this.$cookie.set('abyss.principal.uuid', 'd6bba21e-6d4c-4f87-897e-436bd97d41c0', 1); //day
				// this.$cookie.set('abyss.principal.uuid', 'c053c421-cb53-4ceb-acd0-a77c1f65438b', 10); //day
			}
			this.abyssOrgName = this.$cookie.get('abyss.login.organization.name');
			this.abyssOrgId = this.$cookie.get('abyss.login.organization.uuid');
			var principal = this.$cookie.get('abyss.principal.uuid');
			var session = this.$cookie.get('abyss.session');
			// console.log("this.abyssOrgName: ", this.abyssOrgName);
			// console.log("this.abyssOrgId: ", this.abyssOrgId);
			// console.log("principal: ", principal);
			if (!this.abyssOrgName || !this.abyssOrgId || !principal || !session) {
				alert('COOKIE EXPIRED');
				window.location.href = '/abyss/logout';
			}
			// this.$cookie.delete('abyss.principal.uuid');
			// this.log(this.$options.name);
			this.newTax = _.cloneDeep(this.tax);
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
