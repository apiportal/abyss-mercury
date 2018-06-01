define(['config', 'Vue', 'axios', 'vee-validate', 'vue-select', 'moment', 'vue-dropzone', 'dropzone', 'css!vue-dropzone-css'], function(abyss, Vue, axios, VeeValidate, VueSelect, moment, vue2Dropzone, dropzone) {
// ■■■■■■■■ INIT ■■■■■■■■ //
	// ■■■■ functions ■■■■ //
		function clone(obj) {
			try {
				return JSON.parse(JSON.stringify(obj));
			}
			catch (ex) {
				console.log(ex.message);
				console.log(typeof obj);
				return obj;
			}
		}
		function getParameterByName(name, url) {
			if (!url) url = window.location.href;
			name = name.replace(/[\[\]]/g, "\\$&");
			var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, " "));
		}
		function recurse(obj,path,cache,callback) {
			if (typeof obj == 'object') {
				callback(obj,path);
				for (var p in obj){
					if (cache.indexOf(obj[p])<0) {
						//cache.push(obj[p]);
						recurse(obj[p],path+p+'/',cache,callback);
						//cache.pop();
					}
				}
			}
		}
		function deref(obj,defs) {
			var result = clone(obj);
			var changes = 1;
			while (changes>0) {
				changes = 0;
				var cache = [];
				recurse(result,'#/',cache,function(o,path){
					cache.push(o);
					if ((typeof o == 'object') && (o["$ref"])) {
						var ptr = o["$ref"];
						//console.log(' '+ptr+' @ '+path);
						var target = (ptr.indexOf('#/components/') === 0) ? defs : result;
						try {
							var def = new JSONPointer(ptr.substr(1)).get(target);
							changes++;
							// rewrite local $refs
							recurse(def,'#/',cache,function(o,dpath){
								if (o["$ref"]) {
									var newPtr = o["$ref"];
									if ((ptr+'/').indexOf(newPtr+'/')>=0) {
										var fixPtr = (newPtr+'/').replace(ptr+'/',path);
										fixPtr = fixPtr.substr(0,fixPtr.length-1);
										o["$ref"] = fixPtr;
									}
								}
							});
							for (var p in def) {
								o[p] = def[p];
							}
							delete o["$ref"];
						}
						catch (ex) {
							console.log(ex.message);
							console.log('Could not find $ref '+o["$ref"]);
						}
					}
				});
			}
			return result;
		}
		function preProcessDefinition(openapi) {
			if (!openapi) openapi = {};
			for (var t in openapi.tags) {
				var tag = openapi.tags[t];
				if (!tag.externalDocs) tag.externalDocs = {};
			}
			if (!openapi.info) {
				openapi.info = {version:"1.0.0",title:"Untitled"};
			}
			/*if (!openapi['x-abyss-platform']) {
				openapi['x-abyss-platform'] = {
					apistateid: null,
					apivisibilityid: null,
					businessapiid: null,
					changelog: null,
					color: null,
					created: null,
					dataformat: null,
					deleted: null,
					deployed: null,
					image: null,
					isdeleted: null,
					isproxyapi: false,
					languagename: null,
					languageversion: null,
					updated: null,
					uuid: "00000000-0000-0000-0000-000000000000",
					tags: [],
					groups: [],
					categories: [],
					proxies_summary: [],
					tagList: "",
					groupList: "",
					categoryList: "",
					qosPolicy: "",
					specs: null
				};
			}*/
			if (!openapi.info.contact) {
				openapi.info.contact = {};
			}
			if (!openapi.info.license) {
				openapi.info.license = {};
			}
			if (!openapi.externalDocs) {
				openapi.externalDocs = {};
			}
			if (!openapi.security) openapi.security = [];
			if (!openapi.servers) openapi.servers = [];
			if (!openapi.tags) openapi.tags = [];
			if (!openapi.paths) {
				openapi.paths = {};
			}
			if (!openapi.components) {
				openapi.components = {};
			}
			if (!openapi.components.links) {
				openapi.components.links = {};
			}
			if (!openapi.components.callbacks) {
				openapi.components.callbacks = {};
			}
			if (!openapi.components.schemas) {
				openapi.components.schemas = {};
			}
			if (!openapi.components.responses) {
				openapi.components.responses = {};
			}
			if (!openapi.components.requestBodies) {
				openapi.components.requestBodies = {};
			}
			for (var p in openapi.paths) {
				var path = openapi.paths[p];
				for (var o in path) {
					if ('get.post.put.patch.delete.options.head.trace'.indexOf(o)>=0) {
					var op = path[o];
					if (!op.tags) op.tags = [];
					if (!op.parameters) op.parameters = [];
					if (!op.externalDocs) op.externalDocs = {};
					if (!op.responses) op.responses = {};
					if (path.parameters && path.parameters.length > 0) {
						for (var pp in path.parameters) {
							var shared = path.parameters[pp];
							var seen = false;
							for (var cp in op.parameters) {
								var child = op.parameters[cp];
								if (child && child.name == shared.name && child.in == shared.in) {
									seen = true;
									break;
								}
							}
							if (!seen) {
								op.parameters.push(shared); // TODO resolve whether we should clone it?
							}
						}
					}
				}
				}
				delete path.parameters; // other non-HTTP verb properties are excluded from the nav menu
			}
			return openapi;
		}
		function postProcessPathItem(pi) {
			for (var o in pi) {
				var op = pi[o];
				if (op.externalDocs && !op.externalDocs.url) {
					Vue.delete(op, 'externalDocs');
				}
				if (op.tags) {
					if (op.tags.length === 0) {
						Vue.delete(op, 'tags');
					}
					else {
						Vue.set(op, 'tags', op.tags.filter(onlyUnique));
					}
				}
				if (op.callbacks) {
					for (var c in op.callbacks) {
						var callback = op.callbacks[c];
						for (var e in callback) {
							var exp = callback[e];
							postProcessPathItem(exp);
						}
					}
				}
				/*if (op.parameters) {
					for (var p in op.parameters) {
						var sch = op.parameters[p];
						console.log("sssssssssssssssssssssssch: ", sch.schema);
						// if (sch.schema && sch.schema.$ref && sch.schema.$ref == '') {
						if (sch.schema.$ref != '') {
							console.log("jjjjjjjjjj: ", this);
							Vue.set(sch, 'schema', sch.schema );
						} 
						else {
							Vue.delete(sch.schema, '$ref');
						}
					}
				}*/
			}
			return pi;
		}
		function postProcessDefinition(openapi) {
			var def = clone(openapi);
			Vue.delete(def, 'x-abyss-platform');
			for (var p in def.paths) {
				postProcessPathItem(def.paths[p]);
			}
			for (var t in def.tags) {
				var tag = def.tags[t];
				if (tag.externalDocs && !tag.externalDocs.url) {
					Vue.delete(tag, 'externalDocs');
				}
			}
			if (def.externalDocs && !def.externalDocs.url) {
				Vue.delete(def, 'externalDocs');
			}
			if (def.info && def.info.license && !def.info.license.name) {
				Vue.delete(def.info, 'license');
			}
			return def;
		}
		function onlyUnique(value, index, self) {
			return self.indexOf(value) === index;
		}
		window.intelligentBackend = false;
// ■■■■■■■■ api-resource ■■■■■■■■ //
	Vue.component('api-resource', {
		props: ['openapi', 'path', 'index', 'maintags', 'iii'],
		computed: {
			pathEntry : {
				get : function() {
					return this.index;
				},
				set : function(newVal) {
					Vue.set(this.openapi.paths, newVal, this.openapi.paths[this.index]);
					Vue.delete(this.openapi.paths, this.index);
				}
			},
			httpMethods : function() {
				var result = {};
				for (var m in this.methods) {
					if (this.path[this.methods[m]]) {
						result[this.methods[m]] = this.path[this.methods[m]];
					}
				}
				return result;
			}
		},
		data: function() {
			return {
				methods : ['get','post','put','delete','patch','head','options','trace']
			};
		},
		methods : {
			sanitisePath : function() {
				return 'resource_'+this.index.split('/').join('').split('{').join('').split('}').join('');
			},
			addResource : function () {
				this.$parent.addResource();
			},
			duplicateResource : function (index) {
				if (!this.openapi.paths['newPath']) {
					Vue.set(this.openapi.paths,'/newPath',this.openapi.paths[index]);
				}
			},
			removePath: function (target) {
				this.saveApi(this.openapi);
				Vue.delete(this.openapi.paths, target);
			},
			// editPathDesc: function() {
			// 	$('#pathDesc'+this.sanitisePath()).toggleClass('hide');
			// },
			// hidePathDesc: function() {
				// $('#pathDesc'+this.sanitisePath()).addClass('hide');
			// },
			addOperation : function(template) {
				var index = 0;
				while (this.path[this.methods[index]] && index<this.methods.length) {
					index++;
				}
				if (index<this.methods.length) {
					var responses = {};
					responses.default = {
						description: "Default response"
					};
					var op = {};
					op.summary = template && template.summary || '';
					op.description = template && template.description || '';
					op.externalDocs = template && template.externalDocs || {};
					op.parameters = template && template.parameters || [];
					op.operationId = template && template.operationId || '';
					op.responses = template && template.responses || responses;
					Vue.set(this.path, this.methods[index], op);
				}
			},
			removeOperation : function(target) {
				this.saveApi(this.openapi);
				Vue.delete(this.path, target);
			},
			renameOperation : function(oldMethod, newMethod) {
				if (this.path[newMethod]) {
					Vue.set(this.path, 'x-temp', this.path[newMethod]);
					Vue.delete(this.path, newMethod);
				}
				Vue.set(this.path, newMethod, this.path[oldMethod]);
				Vue.delete(this.path, oldMethod);
				if (this.path.temp) {
					Vue.set(this.path, oldMethod, this.path.temp);
					Vue.delete(this.path, 'x-temp');
				}
			}
		}
	});
	// ■■■■ api-method: IN: template-method, IN: api-response ■■■■ //
		Vue.component('api-method', {
			props: ['openapi', 'method', 'index', 'maintags', 'path'],
			data: function() {
				return {
					// visible: false,
					schemaEditor: undefined,
					cbName: undefined,
					expName: undefined
				};
			},
			methods: {
				specLink: function(fragment) {
					return this.mixSpecLink(fragment);
				},
				markdownPreview: function() {
					this.$parent.$parent.markdownPreview('#'+this.descId);
				},
				// toggleBody : function() {
				// 	this.visible = !this.visible;
				// },
				selectTab: function (name, $event) {
					$('.method-tab').removeClass('is-active');
					$('.tabItem-method-'+name).addClass('is-active');
					$('.method-pane').addClass('hide');
					$('.method-pane-'+name).removeClass('hide');
					$event.preventDefault();
				},
				addOperation : function() {
					this.$parent.addOperation();
				},
				duplicateOperation : function(method) {
					this.$parent.addOperation(method);
				},
				removeOperation : function(target) {
					this.$parent.removeOperation(target);
				},
				addParameter : function() {
					var newParam = {};
					newParam.name = 'newParam';
					newParam.in = 'query';
					newParam.required = false;
					newParam.schema = {};
					newParam.schema.type = 'string';
					this.method.parameters.push(newParam);
				},
				removeParameter : function(index) {
					this.saveApi(this.openapi);
					this.method.parameters.splice(index,1);
				},
				duplicateParameter : function(param) {
					this.method.parameters.push(param);
				},
				addRequestBody : function() {
					if (!this.method.requestBody) {
						var rb = {};
						rb.required = false;
						rb.content = {
							'*/*': {
								schema: {}
							}
						};
						Vue.set(this.method,'requestBody',rb);
						$('#requestBodies').collapse('show');
					}
				},
				removeRequestBody : function(cbname) {
					Vue.delete(this.method,'requestBody');
				},
				addResponse : function() {
					var status = 200;
					while (this.method.responses[status]) {
						status++;
					}
					var response = {};
					response.description = 'Description';
					// response.content = {};
					// response.content['application/json'] = {};
					// response.content['application/json'].schema = {};
					Vue.set(this.method.responses, status, response);
				},
				addMediaType : function() {
					var rb = this.effectiveRequestBody;
					if (rb && rb.content && !rb.content['change/me']) {
						Vue.set(rb.content,'change/me',{schema:{}});
					}
				},
				addCallback : function() {
					if (!this.method.callbacks) {
						Vue.set(this.method,'callbacks',{});
					}
					if (!this.method.callbacks.newCallback) {
						Vue.set(this.method.callbacks,'newCallback',{newExpression:{}});
					}
				},
				duplicateCallback : function(cbname) {
					if (!this.method.callbacks.newCallback) {
						Vue.set(this.method.callbacks,'newCallback',clone(this.method.callbacks[cbname]));
					}
				},
				removeCallback : function(cbname) {
					Vue.delete(this.method.callbacks,cbname);
				},
				storeCallbackName : function(oldName) {
					this.cbName = oldName;
				},
				renameCallback : function(newName) {
					Vue.set(this.method.callbacks,newName,this.method.callbacks[this.cbName]);
					Vue.delete(this.method.callbacks,this.cbName);
				},
				addCallbackURL : function(cbname) {
					if (!this.method.callbacks[cbname].newExpression) {
						Vue.set(this.method.callbacks[cbname],'newExpression',{});
					}
				},
				duplicateExpression : function(cbname, expname) {
					if (!this.method.callbacks[cbname].newExpression) {
						Vue.set(this.method.callbacks[cbname],'newExpression',clone(this.method.callbacks[cbname][expname]));
					}
				},
				removeExpression : function(cbname, expname) {
					Vue.delete(this.method.callbacks[cbname],expname);
				},
				storeExpressionName : function(oldName) {
					this.expName = oldName;
				},
				renameExpression : function(cbName, newName) {
					Vue.set(this.method.callbacks[cbName],newName,this.method.callbacks[cbName][this.expName]);
					Vue.delete(this.method.callbacks[cbName],this.expName);
				},
				addExpressionOperation : function(exp) {
					if (!exp.get) {
						Vue.set(exp,'get',{parameters:[],responses:{default:{description:'Default response'}}});
					}
				},
				removeSecScheme : function(index) {
					this.method.security.splice(index,1);
					Vue.set(this.method,'security',this.method.security);
				}
			},
			computed: {
				numResponses : {
					get : function() {
						return this.getObjCount(this.method.responses);
					}
				},
				numRequestBodies : {
					get : function() {
						return this.getObjCount(this.method.requestBody);
					}
				},
				numCallbacks : {
					get : function() {
						return this.getObjCount(this.method.callbacks);
					}
				},
				numLinks : {
					get : function() {
						return this.getObjCount(this.method.links);
					}
				},
				httpMethod : {
					get : function() {
						return this.index.toUpperCase();
					},
					set : function(newVal) {
						this.$parent.renameOperation(this.index, newVal.toLowerCase());
					}
				},
				hashUid : function() {
					return '#'+this._uid;
				},
				descId : function() {
					return 'txtOpDesc'+this._uid;
				},
				tagId : function() {
					return 'tags-input'+this._uid;
				},
				hashTagId : function() {
					return '#'+this.tagId;
				},
				vtags : {
					get : function() {
						if (!this.method.tags) Vue.set(this.method, 'tags', []);
						return this.method.tags;
					},
					set : function(newVal) {
						this.method.tags = newVal;
					}
				},
				mtags : {
					get: function() {
						var result = [];
						if (this.maintags) {
							// console.log("this.maintags: ", this.maintags);
							for (var i=0;i<this.maintags.length;i++) {
								result.push(this.maintags[i].name);
							}
						}
						return result;
					}
				},
				effectiveRequestBody : {
					get : function() {
						if (!this.method.requestBody) return null;
						if (!this.method.requestBody.$ref) return this.method.requestBody;
						return deref(this.method.requestBody, this.openapi);
					}
				},
				secType : {
					get : function() {
						if (!this.method.security) return 'default';
						if (this.method.security && this.method.security.length === 0) return 'none';
						return 'custom';
					},
					set : function(newVal) {
						if (newVal == 'default') {
							Vue.delete(this.method, 'security');
						}
						else if (newVal == 'none') {
							Vue.set(this.method, 'security', []);
						}
						else {
							var newSec = clone(this.openapi.security);
							if (!newSec || newSec.length === 0) {
								newSec = [];
								for (s in this.openapi.components.securitySchemes) {
									var scheme = this.openapi.components.securitySchemes[s];
									var scopes = [];
									if (scheme.type === 'oauth2') {
										for (var f in scheme.flows) {
											var flow = scheme.flows[f];
											if (flow.scopes) {
												for (sc in flow.scopes) {
													if (scopes.indexOf(s) < 0) scopes.push(sc);
												}
											}
										}
									}
									var entry = {};
									entry[s] = scopes;
									newSec.push(entry);
								}
							}
							Vue.set(this.method, 'security', newSec);
						}
					}
				}
			},
			beforeUpdate : function() {
				if (!this.method.externalDocs) {
					Vue.set(this.method, 'externalDocs', {});
				}
			},
			created() {
				// console.log("this.openapi: ", this.openapi);
				// console.log("this.$parent.openapi: ", this.$parent.openapi);
			},
			beforeMount : this.beforeUpdate,
			template: '#template-method'
		});
	// ■■■■ api-response: IN: template-method ■■■■ //
		Vue.component('api-response', {
			props: ["openapi", "response", "status", "method"],
			computed: {
				statusCode: {
					get: function () {
						return this.status;
					},
					set: function (newVal) {
						this.renameResponse(this.status, newVal);
					}
				}
			},
			methods: {
				addResponse: function () {
					this.$parent.addResponse();
				},
				removeResponse: function () {
					console.log("this.response: ", this.response);
					console.log("this.method: ", this.method);
					this.saveApi(this.$parent.openapi);
					Vue.delete(this.method, this.status);
					if (Object.keys(this.method).length==0) {
						Vue.set(this.method,'default',{description:'Default response'});
					}
				},
				renameResponse : function(oldName, newName) {
					console.log("this.response: ", this.response);
					console.log("this.method: ", this.method);
					Vue.set(this.method, newName, this.method[oldName]);
					Vue.delete(this.method, oldName);
				},
				addMediaType: function() {
					if (!this.response.content) {
						Vue.set(this.response,'content',{});
						Vue.set(this.response.content,'change/me',{schema:{}});
					}
					if (!this.response.content['change/me']) {
						Vue.set(this.response.content,'change/me',{schema:{}});
					}
				},
				renameMediaType: function(oldName, newName) {
					Vue.set(this.response.content, newName, this.response.content[oldName]);
					Vue.delete(this.response.content, oldName);
				},
				selectRefResponse: function(e, s) {
					console.log("e: ", e);
					console.log("s: ", s);
					if (e == 'None') {
						Vue.delete(s, '$ref');
						Vue.set(s, 'description', 'description');
					} else {
						for (var p in s) {
							console.log("p: ", p);
							if (p != '$ref') {
								delete s[p];
							}
						}
					}
				},
			},
			data: function () {
				return {};
			},
			template: '#template-responses'
		});
	// ■■■■ api-response: IN: template-method ■■■■ //
		Vue.component('api-requestbody', {
			props: ["openapi", "response", "status", "method"],
			computed: {
				effectiveRequestBody : {
					get : function() {
						if (!this.method.requestBody) return null;
						if (!this.method.requestBody.$ref) return this.method.requestBody;
						return deref(this.method.requestBody, this.openapi);
					}
				},
				requestName: {
					get: function () {
						console.log("this.status: ", this.status);
						return this.status;
					},
					set: function (newVal) {
						this.renameRequestBodies(this.status, newVal);
					}
				}
			},
			methods: {
				renameRequestBodies : function(oldName, newName) {
					console.log("oldName, newName: ", oldName, newName);
					Vue.set(this.method, newName, this.method[oldName]);
					Vue.delete(this.method, oldName);
				},
				removeRequestBody : function(key) {
					Vue.delete(this.openapi.components.requestBodies,key);
				},
				addRequestBody : function() {
					if (!this.method.newRequestBody) {
						// Vue.set(this.openapi.components, 'requestBodies', {});
						console.log("this.method: ", this.method);
						Vue.set(this.method, 'newRequestBody', {
							content: {
								'*/*': {
									schema: {}
								}
							},
							description: 'Description',
							required: false
						});
						// var rb = {};
						// rb.required = false;
						// rb.content = {
						// 	'*/*': {
						// 		schema: {}
						// 	}
						// };
						// Vue.set(this.method,'requestBody',rb);
						$('#requestBodies').collapse('show');
					}
				},
				addMediaType: function() {
					if (!this.response.content) {
						Vue.set(this.response,'content',{});
						Vue.set(this.response.content,'change/me',{schema:{}});
					}
					if (!this.response.content['change/me']) {
						Vue.set(this.response.content,'change/me',{schema:{}});
					}
				},
				renameMediaType: function(oldName, newName) {
					Vue.set(this.response.content, newName, this.response.content[oldName]);
					Vue.delete(this.response.content, oldName);
				},
			},
			data: function () {
				return {};
			},
			template: '#template-requestbody'
		});
	// ■■■■ api-mediatype: IN: template-method, IN: api-response ■■■■ //
		Vue.component('api-mediatype', {
			props: ["openapi","content", "mediatype", "container"],
			computed: {
				mediaTypeName: {
					get: function () {
						return this.mediatype;
					},
					set: function (newVal) {
						// if (!this.content.schema || !this.content.schema.$ref) {
						// 	Vue.set(this.content,{});
						// 	Vue.set(this.content,'schema',{});
						// 	Vue.set(this.content.schema,'$ref','');
						// }
						this.$parent.renameMediaType(this.mediatype, newVal);
					}
				},
				schemaTooltip : {
					get : function() {
						// TODO for a $ref'd requestBody, $ref'd schemas may appear inline - set depth on deref?
						// console.log("this.content.schema: ", this.content.schema);
						// console.log("this.content.schema.$ref: ", this.content.schema.$ref);
						// if (!this.content.schema || !this.content.schema.$ref) {
						// 	// Vue.set(this.content,{});
						// 	// Vue.set(this.content,'schema',{});
						// 	// Vue.set(this.content.schema,'$ref',{});
						// 	return 'Edit inline schema';
						// }
						// if (!this.content) {
						// 	Vue.set(this.content,{});
						// }
						if (!this.content.schema) {
							Vue.set(this.content,'schema',{});
						}
						// console.log("this.content.schema, this.content: ", this.content.schema, this.content);
						if (this.content && this.content.schema && this.content.schema.$ref) {
							var schemaName = this.content.schema.$ref.replace('#/components/schemas/','');
							return 'Edit shared schema ('+schemaName+')';
						} else {
							return 'Edit inline schema';
						}
					}
				}
			},
			methods: {
				addMediaType: function () {
					this.$parent.addMediaType();
				},
				duplicateMediaType: function() {
					if (!this.container.content['change/me']) {
						var newContent = clone(this.content);
						Vue.set(this.container.content,'change/me',newContent);
					}
				},
				editMediaType: function (mediatype) {
					var initial = deref(this.container.content[mediatype].schema,this.openapi);
					var editorOptions = {};
					var element = document.getElementById('schemaContainer');
					try {
						this.schemaEditor = new JSONEditor(element, editorOptions);
						this.schemaEditor.set(initial);
						this.schemaEditor.expandAll();
						schemaEditorClose = function() {
							this.schemaEditor.destroy();
							// $('#schemaModal').removeClass('is-active');
							$('#schemaModal').modal('hide');
						}.bind(this);
						schemaEditorSave = function() {
							// TODO saving back to shared schema
							this.container.content[mediatype].schema = this.schemaEditor.get();
							schemaEditorClose();
						}.bind(this);
						// $('#schemaModal').addClass('is-active');
						$('#schemaModal').modal({backdrop: 'static', keyboard: false});
					}
					catch (ex) {
						this.$parent.$parent.showAlert('The editor could not be instantiated (circular schemas are not yet supported): '+ex.message);
					}
				},
				removeMediaType: function () {
					this.saveApi(this.openapi);
					Vue.delete(this.container.content, this.mediatype);
					if (Object.keys(this.container.content).length==0) {
						Vue.set(this.container.content,'application/json',{schema:{}});
					}
				}
			},
			data: function () {
				return {};
			},
			template: '#template-mediatype'
		});
// ■■■■■■■■ api-parameter: #template-parameter, IN: #template-method ■■■■■■■■ //
	Vue.component('api-parameter', {
		props: ['parameter', 'index', 'openapi'],
		computed: {
			hashUid : function() {
				return '#'+this._uid;
			},
			formatListId : function() {
				return 'listFormats'+this._uid;
			},
			descId: function() {
				return 'txtParmDesc'+this._uid;
			},
			/*effectiveType : {
				get : function() {
					if (!(this.parameter.schema && this.parameter.schema.type)) return 'object';
					return this.parameter.schema.type;
				},
				set : function(newVal) {
					if (newVal == 'array') {
						var items = {};
						items = clone(this.parameter.schema);
						// items.type = 'array';
						// Vue.set(this.parameter, 'schema', items);
						Vue.set(this.parameter.schema, 'items', items);
					}
					else {
						if (this.parameter.schema.items) {
							Vue.set(this.parameter, 'schema', this.parameter.schema.items);
						} else {

						}
						Vue.delete(this.parameter.schema, 'items');
					}
					this.parameter.schema.type = newVal;
				}
			},*/
			effectiveIn : {
				get : function() {
					if (!this.parameter.in) return 'body';
					return this.parameter.in;
				},
				set : function(newVal) {
					this.parameter.in = newVal;
					if (newVal == 'path') Vue.set(this.parameter, 'required', true);
				}
			},
			effectiveRequired : {
				get : function() {
					if (typeof this.parameter.required === 'undefined') return false;
					return this.parameter.required;
				},
				set : function(newVal) {
					this.parameter.required = newVal;
				}
			},
			/*effectiveFormats : {
				get : function() {
					if (this.parameter.schema.type == 'integer') return ['int32','int64'];
					if (this.parameter.schema.type == 'number') return ['float','double'];
					if (this.parameter.schema.type == 'string') return ['date','date-time','byte','binary','password'];
					return [];
				},
				set : function(newVal) {}
			},*/
			schemaTooltip : {
				get : function() {
					if (!this.parameter.schema || !this.parameter.schema.$ref) {
						return 'Edit inline schema';
					}
					else {
						var schemaName = this.parameter.schema.$ref.replace('#/components/schemas/','');
						return 'Edit shared schema ('+schemaName+')';
					}
				}
			}
		},
		data: function() {
			return {
				// visible: false,
				schemaEditor: undefined
			};
		},
		methods : {
			markdownPreview: function() {
				this.$parent.$parent.$parent.markdownPreview('#'+this.descId);
			},
			// toggleBody : function() {
			// 	this.visible = !this.visible;
			// },
			isComplex : function() {
				if (this.effectiveType === 'object' ||
					this.effectiveType === 'array' ||
					this.effectiveType === 'file') {
					return true;
				}
				return false;
			},
			addParameter : function() {
				this.$parent.addParameter();
			},
			removeParameter : function() {
				this.$parent.removeParameter(this.index);
			},
			duplicateParameter : function(param) {
				this.$parent.duplicateParameter(param);
			},
			editSchema : function() {
				if (!this.parameter.schema) {
					Vue.set(this.parameter, 'schema', {});
				}
				var initial = deref(this.parameter.schema, this.$parent.openapi);
				var editorOptions = {};
				var element = document.getElementById('schemaContainer');
				this.schemaEditor = new JSONEditor(element, editorOptions, initial);
				schemaEditorClose = function() {
					this.schemaEditor.destroy();
					// $('#schemaModal').removeClass('is-active');
					$('#schemaModal').modal('hide');
				}.bind(this);
				schemaEditorSave = function() {
					this.parameter.schema = this.schemaEditor.get();
					schemaEditorClose();
				}.bind(this);
				$('#schemaModalTitle').text('Schema Editor - '+this.parameter.name);
				// $('#schemaModal').addClass('is-active');
				$('#schemaModal').modal({backdrop: 'static', keyboard: false});
			},
			addEnum : function() {
				if (!this.parameter.schema.enum) {
					Vue.set(this.parameter.schema, 'enum', []);
				}
				this.parameter.schema.enum.push('newValue');
			},
			removeEnum : function(index) {
				this.parameter.schema.enum.splice(index, 1);
			}
		},
		template: '#template-parameter',
		beforeMount : function() {
			if (this.parameter["$ref"]) {
				var ptr = this.parameter["$ref"].substr(1); // remove #
				try {
					var def = new JSONPointer(ptr).get(this.$parent.openapi);
					for (var p in def) {
						this.parameter[p] = def[p];
					}
					delete this.parameter["$ref"];
				}
				catch (ex) {
					this.$root.showAlert('Could not find $ref '+this.parameter["$ref"]);
				}
			}
		}
	});
// ■■■■■■■■ api-items: IN: #template-items, IN: #template-parameter ■■■■■■■■ //
	Vue.component('api-items', {
		props: ["openapi", "child", "level", "name"],
		computed: {
			formatListId : function() {
				return 'listFormats'+this._uid;
			},
			effectiveType : {
				get : function() {
					// return this.child.type;
					if (this.child.type == 'array' || this.child.type == 'object' || this.child.type == 'string' || this.child.type == 'integer' || this.child.type == 'number' || this.child.type == 'boolean') {
						return this.child.type;
					} else {
						return this.child.$ref;
					}
				},
				set : function(newVal) {
					// this.child.type = newVal;
					Vue.set(this.child, 'type', newVal);
					var items = {};
					if (newVal == 'array') {
							Vue.delete(this.child, '$ref');
						// TODO replicate parameter array switching logic
						items.type = 'string';
						// items = clone(this.child);
						Vue.set(this.child, 'items', items);
					} else if (newVal == 'object') {
							Vue.delete(this.child, '$ref');
						// TODO replicate parameter array switching logic
						Vue.set(this.child, 'properties', items);
					} else if (newVal == 'string' || newVal == 'integer' || newVal == 'number' || newVal == 'boolean') {
						Vue.delete(this.child, '$ref');
						Vue.delete(this.child, 'items');
						Vue.delete(this.child, 'uniqueItems');
						Vue.delete(this.child, 'minItems');
						Vue.delete(this.child, 'maxItems');
					} else {
							Vue.set(this.child, '$ref', newVal);
							for (var p in this.child) {
								console.log("p: ", p);
								if (p != '$ref') {
									delete this.child[p];
								}
							}
						Vue.delete(this.child, 'items');
						Vue.delete(this.child, 'uniqueItems');
						Vue.delete(this.child, 'minItems');
						Vue.delete(this.child, 'maxItems');
					}
				}
			},
			effectiveFormats : {
				get : function() {
					if (this.child.type == 'integer') return ['int32','int64'];
					if (this.child.type == 'number') return ['float','double'];
					if (this.child.type == 'string') return ['date','date-time','byte','binary','password'];
					return [];
				},
				set : function(newVal) {}
			},
			levelPlusOne : function() {
				return (this.level+1);
			}
		},
		methods: {
			addEnum : function() {
				if (!this.child.enum) {
					Vue.set(this.child, 'enum', []);
				}
				this.child.enum.push('newValue');
			},
			removeEnum : function(index) {
				this.child.enum.splice(index, 1);
				if (this.child.enum.length == 0) {
					Vue.delete(this.child, 'enum');
				}
			},
			selectRefParameter: function(e, s) {
				console.log("e: ", e);
				console.log("s: ", s);
				if (e == 'None') {
					Vue.delete(s, '$ref');
					Vue.set(s, 'type', 'string');
					// $('.components-column').addClass('column-minimize');
					// $('#schemas').collapse('hide');
				} else {
					for (var p in s) {
						console.log("p: ", p);
						if (p != '$ref') {
							delete s[p];
						}
					}
					// Vue.delete(s);
					// Vue.set(s, {} );
					// s = {}
					// Vue.set(s, '$ref', e );
					// $('.components-column').removeClass('column-minimize');
					// $('#schemas').collapse('show');
					// $('[data-schema="'+e+'"]').find('.collapse').collapse('show');
				}
			},
			addSchema: function(id) {
				if (!this.child.properties) {
					Vue.set(this.child, 'properties', {});
				}
				if (!this.child.properties.NewItem) {
					Vue.set(this.child.properties, 'NewItem', {type: 'object'});
					var i = Object.keys(this.child.properties).indexOf('NewItem');
					console.log("i: ", i);
					setTimeout(function(){
						$('#schemas').collapse('show');
						$('#'+id+i).collapse('show');
					},0);	
				}
			},
			duplicateSchema: function(key) {
				if (!this.child.properties.NewItem) {
					Vue.set(this.child.properties, 'NewItem', this.child.properties[key]);
				}
			},
			editSchema: function(key) {
					var initial = deref(this.child.properties[key], this.openapi);
					var editorOptions = {};
					var element = document.getElementById('schemaContainer');
					this.schemaEditor = new JSONEditor(element, editorOptions, initial);
					schemaEditorClose = function() {
						this.schemaEditor.destroy();
						// $('#schemaModal').removeClass('is-active');
						$('#schemaModal').modal('hide');
					}.bind(this);
					schemaEditorSave = function() {
						this.child.properties[key] = this.schemaEditor.get();
						schemaEditorClose();
					}.bind(this);
					$('#schemaModalTitle').text('Schema Editor - '+key);
					// $('#schemaModal').addClass('is-active');
					$('#schemaModal').modal({backdrop: 'static', keyboard: false});
			},
			removeSchema: function(key) {
				Vue.delete(this.child.properties, key);
			},
			storeSchemaName: function(key) {
				this.currentSchema = key;
			},
			renameSchema: function(key) {
				Vue.set(this.child.properties, key, this.child.properties[this.currentSchema]);
				Vue.delete(this.child.properties, this.currentSchema);
			},
		},
		data: function() {
			return {
				currentSchema: '',
			};
		},
		template: '#template-items'
	});
// ■■■■■■■■ api-output ■■■■■■■■ //
	Vue.component('api-output', {
		props: ['openapi','editorType'],
		data: function() {
			return {};
		}
	});
	Vue.component('api-input', {
		// props: ['openapi','editorType'],
		props: ['value','openapi'],
		data: function() {
			return {};
		}
	});
// ■■■■■■■■ api-secdef ■■■■■■■■ //
	Vue.component('api-secdef', {
		props: ['openapi', 'sd', 'sdname', 'index'],
		computed: {
			secname: {
				get : function() {
					return this.sdname;
				},
				set : function(newVal) {
					this.$parent.renameSecurityDefinition(this.sdname, newVal);
				}
			},
			type : {
				get : function() {
					return this.sd.type;
				},
				set : function(newVal) {
					this.sd.type = newVal;
					if (newVal != 'apiKey') {
						Vue.delete(this.sd, 'in');
						Vue.delete(this.sd, 'name');
					}
					if (newVal != 'oauth2') {
						Vue.delete(this.sd, 'flow');
					}
					if (newVal != 'http') {
						Vue.delete(this.sd, 'scheme');
					}
				}
			},
			appliesToAllPaths : {
				get : function() {
					var index = -1;
					for (var s=0;s<this.openapi.security.length;s++) {
						var sr = this.openapi.security[s];
						if (typeof sr[this.sdname] !== 'undefined') {
							index = s;
						}
					}
					return index >= 0 ? true : false;
				},
				set : function(newVal) {
					if (newVal) {
						if (!this.openapi.security) {
							Vue.set(this.openapi, 'security', []);
						}
						var newSr = {};
						newSr[this.sdname] = [];
						for (var s in this.sd.scopes) {
							newSr[this.sdname].push(s);
						}
						this.openapi.security.push(newSr);
					}
					else {
						this.$parent.filterSecurityDefinition(this.openapi.security, this.sdname);
					}
				}
			},
			hasImplicit: {
				get : function() {
					return this.sd.flows && this.sd.flows.implicit;
				},
				set : function(newVal) {
					if (newVal) Vue.set(this.sd.flows,'implicit',{});
					else Vue.delete(this.sd.flows,'implicit');
				}
			},
			hasPassword: {
				get : function() {
					return this.sd.flows && this.sd.flows.password;
				},
				set : function(newVal) {
					if (newVal) Vue.set(this.sd.flows,'password',{});
					else Vue.delete(this.sd.flows,'password');
				}
			},
			hasAuthCode: {
				get : function() {
					return this.sd.flows && this.sd.flows.authorizationCode;
				},
				set : function(newVal) {
					if (newVal) Vue.set(this.sd.flows,'authorizationCode',{});
					else Vue.delete(this.sd.flows,'authorizationCode');
				}
			},
			hasClientCred: {
				get : function() {
					return this.sd.flows && this.sd.flows.clientCredentials;
				},
				set : function(newVal) {
					if (newVal) Vue.set(this.sd.flows,'clientCredentials',{});
					else Vue.delete(this.sd.flows,'clientCredentials');
				}
			}
		},
		methods : {
			addSecurityDefinition : function() {
				this.$parent.addSecurityDefinition();
			},
			removeSecurityDefinition : function(sdname) {
				this.$parent.removeSecurityDefinition(sdname);
			},
			addScope: function (flow) {
				if (!flow.scopes) Vue.set(flow, 'scopes', {});
				if (!flow.scopes.newScope) {
					Vue.set(flow.scopes, 'newScope', 'description');
				}
			},
			renameScope : function(flow, oldName, newName) {
				Vue.set(flow.scopes, newName, flow.scopes[oldName]);
				Vue.delete(flow.scopes, oldName);
			},
			removeScope: function (flow, sName) {
				this.saveApi(this.openapi);
				Vue.delete(flow.scopes,sName);
			}
		},
		data: function() {
			return {};
		}
	});
	// ■■■■ api-scope: IN: api-secdef ■■■■ //
		Vue.component('api-scope', {
			props: ["sd", "sname", "sdname", "flow"],
			computed: {
				scopename: {
					get : function() {
						return this.sname;
					},
					set : function(newVal) {
						this.$parent.renameScope(this.flow, this.sname, newVal);
					}
				}
			},
			methods: {
				addScope: function() {
					this.$parent.addScope(this.flow);
				},
				removeScope: function(flow, sName) {
					this.$parent.removeScope(flow, sName);
				}
			},
			data: function() {
				return {};
			}
		});
// ■■■■■■■■ api-srvvar ■■■■■■■■ //
	Vue.component('api-srvvar', {
		props: ["name", "variable", "server", "sindex"],
		computed: {
			variableName: {
				get : function() {
					return this.name;
				},
				set : function(newVal) {
					this.$parent.renameVariable(this.server, this.name, newVal);
				}
			}
		},
		methods: {
			removeVariable: function(serverIndex) {
				this.$parent.removeVariable(this.server, this.name);
				// $('#server'+serverIndex).collapse('hide');
				// this.$parent.removeVariable(this.server, this.variable);
			},
			addVEnum: function() {
				if (!this.variable.enum) Vue.set(this.variable, 'enum', []);
				this.variable.enum.push('newValue');
			}
		},
		data: function() {
			return {};
		}
	});
	// ■■■■ api-venum: IN: api-srvvar ■■■■ //
		Vue.component('api-venum', {
			props: ["variable", "eindex"],
			computed: {
				vename: {
					get: function() {
						return this.variable.enum[this.eindex];
					},
					set: function(newValue) {
						this.variable.enum[this.eindex] = newValue;
					}
				}
			},
			methods: {
				removeVEnum: function(eIndex) {
					this.variable.enum.splice(eIndex,1);
				},
				addVEnum: function() {
					this.$parent.addVEnum();
				}
			},
			data: function() {
				return {};
			}
		});
	// ■■■■ api-venum: IN: api-srvvar ■■■■ //
		Vue.component('api-list', {
			props: ["api", "openapi", "lindex"],
			computed: {
				compCategoriesToList : {
					get : function() {
						if (this.api['x-abyss-platform'].categories == null) {
							this.api['x-abyss-platform'].categories = [];
						}
						// console.log("this.index: ", this.lindex);
						return this.api['x-abyss-platform'].categories.map(e => e.name).join(', ');
					},
				},
				compTagsToList : {
					get : function() {
						if (this.api['x-abyss-platform'].tags == null) {
							this.api['x-abyss-platform'].tags = [];
						}
						return this.api['x-abyss-platform'].tags.map(e => e.name).join(', ');
					},
				},
				compGroupsToList : {
					get : function() {
						if (this.api['x-abyss-platform'].groups == null) {
							this.api['x-abyss-platform'].groups = [];
						}
						return this.api['x-abyss-platform'].groups.map(e => e.name).join(', ');
					},
				},
			},
			methods: {
				selectApi(item, state) {
					this.$parent.selectApi(item, state);
				},
				addVEnum: function() {
					this.$parent.addVEnum();
				}
			},
			data: function() {
				return {};
			},
			mounted() {
				
			},
		});
// ■■■■■■■■ MY-APIS ■■■■■■■■ //
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('my-apis', {
		components: {
			vueDropzone: vue2Dropzone,
			// 'v-select': VueSelect.VueSelect
		},
		data: function () {
			return {
				cgData : {
					clients: [],
					servers: []
				},
				importschema : null,
				window : window,
				currentSchema: '',
				editorType: 'json',
				outputRendered: false,
				uploadRendered: false,
				swaggerRendered: true,
				operationsTags: ['default'],
				licenseOptions: [
					{
						name: 'MIT License',
						url: 'https://opensource.org/licenses/MIT'
					},
					{
						name: 'Apache 2.0 License',
						url: 'https://opensource.org/licenses/Apache-2.0'
					},
					{
						name: 'Creative Commons Attribution Share-alike',
						url: 'https://creativecommons.org/licenses/by/4.0/'
					},
					{
						name: 'Creative Commons No-Commercial Share-alike',
						url: 'https://creativecommons.org/licenses/by-nc/4.0/'
					},
					{
						name: 'Custom license',
						url: ''
					},
				],
				isLoading: true,
				isEditingMethods: false,
				sortApi: {
					key: 'x-abyss-platform.created',
					type: Date,
					order: 'desc'
				},
				sortMethod: {
					key: 'openapi.paths',
					type: String,
					order: 'desc'
				},
				pageState: 'init',
				paginate: {},
				ajaxUrl: abyss.ajax.my_api,
				ajaxHeaders: {},
				
				changes: {},
				isChanged: false,

				apiOptions: [],
				categoryOptions: [],
				tagOptions: [],
				groupOptions: [],
				stateOptions: [],

				dropSpecsOptions: {
					url: 'https://httpbin.org/post',
					method: 'post',
					uploadMultiple: false,
					maxFiles: 1,
					parallelUploads: 1,
					thumbnailWidth: 260,
					thumbnailHeight: 146,
					maxFilesize: 0.5,
					addRemoveLinks: true,
					acceptedFiles: '.txt, .json, .yaml, .wsdl, .wadl',
					headers: {
						"My-Awesome-Header": "header value"
					}
				},
				dropImageOptions: {
					url: 'https://httpbin.org/post',
					method: 'post',
					uploadMultiple: false,
					maxFiles: 1,
					parallelUploads: 1,
					thumbnailWidth: 260,
					thumbnailHeight: 146,
					maxFilesize: 0.5,
					addRemoveLinks: true,
					acceptedFiles: '.jpg, .png, .gif',
					headers: {
						"My-Awesome-Header": "header value"
					}
				},

				myApiList: [],
				swaggerText: {
					text: ''
				},
				newApi: {},
				selectedApi: {},
				newOpenapi: null,
				selectedOpenapi: null,
				openapi: {
					"openapi": "3.0.0",
					"info": {
						"title": "API",
						"version": "1.0.0",
						"contact": {},
						"license": {}
					},
					"servers": [
						{
							"url": "https://www.example.com"
						}
					],
					"tags": [],
					"security": [],
					"paths": {},
					"components": {
						"links": {},
						"callbacks": {},
						"schemas": {}
					},
					"externalDocs": {}
				},
				api: {
					// "openapi": "3.0.0",
					// "info": {
					// 	"title": "",
					// 	"version": "1.0.0",
						// "description": null,
						// "termsOfService": null,
						// "contact": {
						// 	"name": null,
						// 	"url": null,
						// 	"email": null
						// },
						// "license": {
						// 	"name": null,
						// 	"url": null
						// },
					// },
					// "tags": [{
					// 	"name": null,
					// 	"description": null,
					// 	"externalDocs": {
					// 		"url": null,
					// 		"description": null
					// 	}
					// }],
					// "servers": [{
					// 	"url": null,
					// 	"description": null,
					// 	"variables": {}
					// }],
					// "externalDocs": {
					// 	"url": null,
					// 	"description": null
					// },
					// "paths": {},
					// "x-origin": [],
					// "components": {
					// 	"headers": {},
					// 	"schemas": {},
					// 	"examples": {},
					// 	"responses": {},
					// 	"parameters": {},
					// 	"links": {},
					// 	"callbacks": {},
					// 	"requestBodies": {},
					// 	"securitySchemes": {}
					// },
					"x-abyss-platform": {
						"apistateid": 1,
						"apivisibilityid": 2,
						"businessapiid": null,
						"changelog": null,
						"color": null,
						"created": null,
						"dataformat": null,
						"deleted": null,
						"deployed": null,
						"image": null,
						"isdeleted": null,
						"isproxyapi": false,
						"languagename": null,
						"languageversion": null,
						"updated": null,
						"uuid": "00000000-0000-0000-0000-000000000000",
						"tags": [],
						"groups": [],
						"categories": [],
						"proxies_summary": [],
						/////////////
						"tagList": "",
						"groupList": "",
						"categoryList": "",
						"qosPolicy": "",
						"specs": null
					}
				},
				end: []
			};
		},
		props: {
			rootState: { type: String }
		},
		computed: {
			compCategoriesToList : {
				get : function() {
					if (this.api['x-abyss-platform'].categories == null) {
						this.api['x-abyss-platform'].categories = [];
					}
					// if (this.rootState == 'edit' || this.rootState == 'create' || this.rootState == 'preview') {
						// this.api['x-abyss-platform'].categoryList = this.api['x-abyss-platform'].categories.map(e => e.name).join(', 
						return this.api['x-abyss-platform'].categories.map(e => e.name).join(', ');
					// }
				},
				// set : function(newVal) {
				// 	Vue.set(this.api['x-abyss-platform'].categoryList, newVal);
				// }
			},
			compTagsToList : {
				get : function() {
					if (this.api['x-abyss-platform'].tags == null) {
						this.api['x-abyss-platform'].tags = [];
					}
					// if (this.rootState == 'edit' || this.rootState == 'create' || this.rootState == 'preview') {
						// this.api['x-abyss-platform'].tagList = this.api['x-abyss-platform'].tags.map(e => e.name).join(', ');
						return this.api['x-abyss-platform'].tags.map(e => e.name).join(', ');
					// }
				},
			},
			compGroupsToList : {
				get : function() {
					if (this.api['x-abyss-platform'].groups == null) {
						this.api['x-abyss-platform'].groups = [];
					}
					// if (this.rootState == 'edit' || this.rootState == 'create' || this.rootState == 'preview') {
						// this.api['x-abyss-platform'].groupList = this.api['x-abyss-platform'].groups.map(e => e.name).join(', ');
						return this.api['x-abyss-platform'].groups.map(e => e.name).join(', ');
					// }
				},
			},
		},
		methods: {
			addResponse : function() {
				var status = 200;
				while (this.openapi.components.responses[status]) {
					status++;
				}
				var response = {};
				response.description = 'Description';
				// response.content = {};
				// response.content['application/json'] = {};
				// response.content['application/json'].schema = {};
				Vue.set(this.openapi.components.responses, status, response);
				$('#responses').collapse('show');
			},
			addRequestBody : function() {
				if (!this.openapi.components.requestBodies.newRequestBody) {
					// Vue.set(this.openapi.components, 'requestBodies', {});
					Vue.set(this.openapi.components.requestBodies, 'newRequestBody', {
						content: {
							'*/*': {
								schema: {}
							}
						},
						description: 'Description',
						required: false
					});
					// var rb = {};
					// rb.required = false;
					// rb.description = 'Description';
					// rb.content = {
						// '*/*': {
							// schema: {}
						// }
					// };
					// Vue.set(this.openapi.components,'requestBodies',rb);
					$('#requestBodies').collapse('show');
				}
			},
			specLink: function(fragment) {
				return this.mixSpecLink(fragment);
			},
			licenseToList(item) {
				if (item == null) {
					
				} else {
					Vue.set(this.openapi.info.license,'url',item.url);
					// Vue.set(this.openapi.info.license,'name',item.name);
				}
			},
			enableLicenseSelect: function() {
				if ($('#drpLicense').hasClass('hide')) {
					$('#txtLicense').addClass('hide');
					$('#drpLicense').removeClass('hide');
					$('#selLicense').on('change',function(e){
						var license = $('#selLicense').val();
						$('#txtLicense').val(license);
						if (license == 'MIT') Vue.set(this.openapi.info.license,'url','https://opensource.org/licenses/MIT');
						if (license == 'Apache-2.0') Vue.set(this.openapi.info.license,'url','https://opensource.org/licenses/Apache-2.0');
						if (license == 'CC BY-SA 4.0') Vue.set(this.openapi.info.license,'url','https://creativecommons.org/licenses/by/4.0/');
						if (license == 'CC NC-SA 4.0') Vue.set(this.openapi.info.license,'url','https://creativecommons.org/licenses/by-nc/4.0/');
						if (license == '') Vue.set(this.openapi.info.license,'url','');
					});
				}
				else {
					$('#txtLicense').removeClass('hide');
					$('#drpLicense').addClass('hide');
				}
			},
			addResource: function () {
				if (!this.openapi.paths) Vue.set(this.openapi, 'paths', {});
				if (!this.openapi.paths['/newPath']) {
					Vue.set(this.openapi.paths, '/newPath', {});
					$('html,body').animate({ scrollTop: document.body.scrollHeight }, "fast");
				}
			},
			showResource: function (key) {
				var target = 'resource_' + key.split('/').join('').split('{').join('').split('}').join('');
				var e = document.getElementById(target);
				if (e) e.scrollIntoView();
			},
			addTag: function () {
				if (!this.openapi.tags) {
					Vue.set(this.openapi, 'tags', []);
				}
				// if (!this.openapi.tags.newTag) {
				var ttt = _.findIndex(this.openapi.tags, function(o) { return o.name == 'newTag'; });
				if (ttt == -1) {
					var newTag = {};
					newTag.name = 'newTag';
					newTag.externalDocs = {};
					this.openapi.tags.push(newTag);
				}
				var i = this.openapi.tags.length - 1;
				setTimeout(function(){
					$('#tags').collapse('show');
					$('#t'+i).collapse('show');
				},0);
			},
			removeTag: function (index) {
				this.openapi.tags.splice(index, 1);
				this.saveApi(this.openapi);
			},
			addSecurityDefinition: function () {
				if (!this.openapi.components.securitySchemes) {
					Vue.set(this.openapi.components, 'securitySchemes', {});
				}
				if (!this.openapi.components.securitySchemes.newSecurityScheme) {
					var newSecDef = {};
					newSecDef.type = 'apiKey';
					newSecDef.name = 'api_key';
					newSecDef.in = 'query';
					Vue.set(this.openapi.components.securitySchemes, 'newSecurityScheme', newSecDef);
					var i = Object.keys(this.openapi.components.securitySchemes).indexOf('newSecurityScheme');
					console.log("i: ", i);
					setTimeout(function(){
						$('#securitySchemes').collapse('show');
						$('#sd'+i).collapse('show');
					},0);	
				}
			},
			// !ERROR
			renameSecurityDefinition: function (oldName, newName) {
				console.log("oldName, newName: ", oldName, newName);
				Vue.set(this.openapi.components.securitySchemes, newName, this.openapi.components.securitySchemes[oldName]);
				Vue.delete(this.openapi.components.securitySchemes, oldName);
			},
			filterSecurityDefinition: function(security, sdname) {
				var index = -1;
				for (var s=0;s<security.length;s++) {
					var sr = security[s];
					if (typeof sr[sdname] !== 'undefined') {
						index = s;
					}
				}
				if (index >= 0) {
					security.splice(index, 1);
				}
			},
			removeSecurityDefinition: function (index) {
				this.saveApi(this.openapi);
				Vue.delete(this.openapi.components.securitySchemes, index);
				this.filterSecurityDefinition(this.openapi.security, index);
				for (var p in this.openapi.paths) {
					var path = this.openapi.paths[p];
					for (var o in path) {
						var op = path[o];
						if (op.security) {
							this.filterSecurityDefinition(op.security, index);
						}
					}
				}
			},
			addServer: function () {
				if (!this.openapi.servers) Vue.set(this.openapi, 'servers', []);
				this.openapi.servers.push({url:'https://www.example.com',description:''});
				var i = this.openapi.servers.length - 1;
				setTimeout(function(){
					$('#servers').collapse('show');
					$('#server'+i).collapse('show');
				},0);					
			},
			removeServer: function(index) {
				this.openapi.servers.splice(index,1);
			},
			addVariable: function (serverIndex) {
				if (!this.openapi.servers[serverIndex].variables) Vue.set(this.openapi.servers[serverIndex],'variables',{});
				Vue.set(this.openapi.servers[serverIndex].variables,'newVar',{description:'',default:'change-me'});
				$('#server'+serverIndex).collapse('show');
			},
			renameVariable : function(server, oldName, newName) {
				Vue.set(server.variables, newName, server.variables[oldName]);
				Vue.delete(server.variables, oldName);
			},
			removeVariable: function (server,index) {
				console.log("server,index: ", server,index);
				Vue.delete(server,'variables');
				// Vue.delete(server.variables,index);
			},
			addSchema: function() {
				if (!this.openapi.components.schemas.NewSchema) {
					Vue.set(this.openapi.components.schemas, 'NewSchema', {type: 'object'});
					var i = Object.keys(this.openapi.components.schemas).indexOf('NewSchema');
					console.log("i: ", i);
					setTimeout(function(){
						$('#schemas').collapse('show');
						$('#schema'+i).collapse('show');
					},0);	
				}
			},
			duplicateSchema: function(key) {
				if (!this.openapi.components.schemas.NewSchema) {
					Vue.set(this.openapi.components.schemas, 'NewSchema', this.openapi.components.schemas[key]);
				}
			},
			editSchema: function(key) {
					var initial = deref(this.openapi.components.schemas[key], this.openapi);
					var editorOptions = {};
					var element = document.getElementById('schemaContainer');
					this.schemaEditor = new JSONEditor(element, editorOptions, initial);
					schemaEditorClose = function() {
						this.schemaEditor.destroy();
						// $('#schemaModal').removeClass('is-active');
						$('#schemaModal').modal('hide');
					}.bind(this);
					schemaEditorSave = function() {
						this.openapi.components.schemas[key] = this.schemaEditor.get();
						schemaEditorClose();
					}.bind(this);
					$('#schemaModalTitle').text('Schema Editor - '+key);
					// $('#schemaModal').addClass('is-active');
					$('#schemaModal').modal({backdrop: 'static', keyboard: false});
			},
			removeSchema: function(key) {
				Vue.delete(this.openapi.components.schemas, key);
			},
			storeSchemaName: function(key) {
				this.currentSchema = key;
			},
			renameSchema: function(key) {
				Vue.set(this.openapi.components.schemas, key, this.openapi.components.schemas[this.currentSchema]);
				Vue.delete(this.openapi.components.schemas, this.currentSchema);
			},
			markdownPreview: function(selector) {
				$('#mdPreview').modal();
				var str = $(selector).val();
				var md = window.markdownit();
				var result = md.render(str);
				$('#mdPreviewText').html(result);
			},
			showAlert: function (text, callback) {
				$('#alertText').text(text);
				$('#alert').modal();
				$('#alert').on('shown.bs.modal', function() {
					// console.log("shown.bs.modal: ", this);
				}).on('hidden.bs.modal', function() {
					// console.log("hidden.bs.modal: ");
					if (callback) callback(false);
					console.log("callback: ", callback);
				});
			},
			showConfirm: function(title, text, callback) {
				$('#confirmTitle').text(title);
				$('#confirmSubtitle').text(text);
				$('#confirm').modal();
				$('#confirmOk').click(function(){
					if (callback) callback(true);
				});
				$('#confirm').on('shown.bs.modal', function() {
				}).on('hidden.bs.modal', function() {
					if (callback) callback(false);
				});
			},
			convertOpenApi2(schema,callback) {
				var convertUrl;
				if (window.intelligentBackend) convertUrl = '/api/v1/convert';
				else convertUrl = 'https://mermade.org.uk/openapi-converter/api/v1/convert';
				var data = new FormData();
				data.append('source',JSON.stringify(schema));
				$.ajax({
					url:convertUrl,
					type:"POST",
					contentType: false,
					processData: false,
					data:data,
					dataType:"json",
					success: function(schema) {
						callback(schema);
					}
				});
			},
			// ■■■■■■■■■■■■■■■■■■■■■■■■ ABYSS OAS ■■■■■■■■■■■■■■■■■■■■■■■■ //
			initSchema: function () {
				var ooo = _.cloneDeep(this.openapi);
				// console.log("1O: ", JSON.stringify(ooo, null, 2));
				Vue.set(this,'newApi',preProcessDefinition(_.cloneDeep(this.api)));
				Vue.set(this,'newOpenapi',preProcessDefinition(ooo));
				Vue.set(this,'openapi',preProcessDefinition(ooo));
				// console.log("2O: ", JSON.stringify(this.openapi, null, 2));
				// this.importschema = JSON.stringify(ooo, null, 2);
				// this.loadSchema();
			},
			setSchema: function (schema) {
				this.updateSchema(schema);
				Vue.set(this,'selectedOpenapi',_.cloneDeep(this.openapi));
				// swEditor.specActions.updateSpec(jsyaml.dump(schema));
			},
			updateSchema: function (schema) {
				schema = preProcessDefinition(schema);
				if (window.localStorage) window.localStorage.setItem('openapi3', JSON.stringify(schema));
				Vue.set(this, 'openapi', schema);
				// self.openapi.paths = {};
			},
			loadSchema: function () {
				var schema;
				try {
					schema = JSON.parse(this.importschema);
					console.log("'JSON definition parsed successfully': ");
				}
				catch (ex) {
					try {
						schema = jsyaml.safeLoad(this.importschema, {json:true});
						console.log("YAML definition parsed successfully");
					}
					catch (ex) {
						this.showAlert('The definition could not be parsed');
					}
				}
				if (schema.openapi && schema.openapi.startsWith('3.0.')) {
					this.setSchema(schema);
				} else if (schema.swagger && schema.swagger === '2.0') {
					var component = this;
					this.convertOpenApi2(schema,function(schema){
						if (schema.openapi && schema.openapi.startsWith('3.0.')) {
							if (window.localStorage) window.localStorage.setItem('openapi3', JSON.stringify(schema));
							component.showAlert('Definition successfully converted');
							component.setSchema(schema);
						}
					});
				} else {
					this.showAlert('OpenAPI version must be 2.0 or 3.0.x');
				}
			},
			editingSchema : function(val) {
				if (val == '') {
					this.clearSchema();
				} else {
					var schema = JSON.parse(val);
					this.updateSchema(schema);
				}
			},
			clearSchema : function(val) {
				Vue.set(this, 'openapi', _.cloneDeep(this.newOpenapi));
				this.importschema = JSON.stringify(this.openapi, null, 2);
			},
			updateSw: _.debounce(function() {
				// swEditor.specActions.updateSpec(jsyaml.dump(this.openapi));
				this.importschema = JSON.stringify(this.openapi, null, 2);
				swEditor.specActions.updateSpec(jsyaml.dump(this.postProcessDefinition()));
			}, 1000),
			listenSw: _.debounce(function(val) {
				Vue.set(this.swaggerText, 'text', val);
			}, 100),
			initSwagger: _.debounce(function(val) {
				var vm = this;
				const SpecUpdateListenerPlugin = function() {
					return {
						statePlugins: {
							spec: {
								wrapActions: {
									updateSpec: (oriAction) => (...args) => {
										const [str] = args;
										vm.listenSw(str);
										return oriAction(...args);
									}
								}
							}
						}
					};
				};
				const swEditor = SwaggerEditorBundle({
					dom_id: '#swagger-editor',
					spec: this.openapi,
					// spec: jsyaml.dump(this.postProcessDefinition()),
					// layout: 'StandaloneLayout',
					// layout: 'EditorLayout',
					presets: [
					   // SwaggerEditorStandalonePreset
					],
					plugins: [
						SwaggerEditorBundle.plugins.JumpToPathPlugin,
						SwaggerEditorBundle.plugins.DownloadUrl,
						SpecUpdateListenerPlugin,
						// BaseLayoutPlugin
					]
				});
				// console.log("swEditor: ", swEditor);
				window.swEditor = swEditor;
			}, 1000),
			uploadSchema : function(val) {
				try {
					if (typeof val === 'string') {
						this.importschema = val;
					} else {
						this.importschema = JSON.stringify(val, null, 2);
					}
					var vm = this;
					setTimeout(function(){
						vm.loadSchema();
					},100);	
				}
				catch (ex) {
					alert(ex);
				}
			},
			loadFromUrlSchema : function(val) {
				if (val != '') {
					var vm = this;
					$.ajax(val, {
						success: function(data) {
							try {
								console.log("data: ", data);
								if (typeof data === 'string') {
									vm.importschema = data;
								} else {
									vm.importschema = JSON.stringify(data, null, 2);
								}
							}
							catch (ex) {
								alert(ex);
							}
						},
						complete: function() {
							vm.loadSchema();
						}
					});
				}
			},
			postProcessDefinition : function() {
				return postProcessDefinition(this.openapi);
			},
			undoApi: function () {
				if (window.localStorage) {
					Vue.set(this, 'openapi', JSON.parse(window.localStorage.getItem('openapi3')));
				}
			},
			renderOutputAll: function (type) {
				$('#all-output').html('<pre class="prettyprint"><code id="pretty-'+type+'"></code></pre>');
				var def = this.postProcessDefinition();
				output = JSON.stringify(def, null, 4);
				if (type == 'yaml') {
					try {
						this.editorType = 'yaml';
						output = jsyaml.dump(def);
					}
					catch (ex) {
						alert(ex.message);
					}
				}
				$('#pretty-'+type).html(output);
				this.outputRendered = true;
				this.uploadRendered = false;
				this.swaggerRendered = false;
				clippy = new Clipboard('#copy-all', {
					// target: $('#pretty-'+type)
					target: function(trigger) {
						// return $('#pretty-'+type);
						return document.getElementById('pretty-'+type);
					}
				});
				setTimeout(function(){
					$('pre code').each(function (i, block) {
						hljs.highlightBlock(block);
					});
				},0);
				var data = 'text/'+type+';charset=utf-8,' + encodeURIComponent(output);
				$('#download-all').attr('href', 'data:' + data);
				$('#download-all').attr('download', 'openapi.'+type);
			},

			// ■■■■■■■■■■■■■■■■■■■■■■■■ ABYSS ■■■■■■■■■■■■■■■■■■■■■■■■ //

			dropSpecsSuccess(file, response) {
				console.log("file, response ", file, response);
				// this.specData = response.files;
				console.log("response.files: ", response.files);
				this.uploadSchema(response.files.file);
			},
			dropSpecsRemoved(file, error, xhr) {
				console.log("file, error, xhr", file, error, xhr);
			},
			dropImageSuccess(file, response) {
				console.log("file, response ", file, response);
				// var image = new Image();
				// image.src = response.files;
				this.api['x-abyss-platform'].image = response.files;
			},
			selectApi(item, state) {
				// console.log("pp selectApi: ", item);
				this.beforeCancelApi();
				this.updateSchema(item);
				this.api = item;
				// this.openapi = item;
				this.$root.setState(state);
				this.selectedApi = _.cloneDeep(this.api);
				this.initSwagger();
				this.updateSw();
				// $('#api'+this.api['x-abyss-platform'].uuid).collapse('show');
				// console.log("this.api: ", this.api);
				if ( state != 'preview') {
					this.$refs.dropImage.removeAllFiles(true);
					if (this.api['x-abyss-platform'].image != '') {
						this.$refs.dropImage.manuallyAddFile({ size: 123, name: this.api['x-abyss-platform'].image }, this.api['x-abyss-platform'].image);
					}
					$('.list-column').addClass('column-minimize');
					$('.create-column').addClass('column-minimize');
					$('.edit-column').addClass('column-minimize');
				} else {
					$('.create-column, .edit-column').addClass('column-minimize');
				}
			},
			getApiById(item, state) {
				axios.get(this.ajaxUrl + '?uuid=' + item.uuid).then(response => {
					this.api = Object.assign(item, response.data.myApi);
					this.$root.setState(state);
					this.selectedApi = _.cloneDeep(this.api);
					// $('#api'+this.api['x-abyss-platform'].uuid).collapse('show');
					if ( state != 'preview') {
						// $('.list-column').addClass('column-minimize');
						this.$refs.dropImage.removeAllFiles(true);
						if (this.api['x-abyss-platform'].image != '') {
							this.$refs.dropImage.manuallyAddFile({ size: 123, name: this.api['x-abyss-platform'].image }, this.api['x-abyss-platform'].image);
						}
					}
				}, error => {
					console.error(error);
				});
			},
			isSelectedApi(i) {
				return i === this.api['x-abyss-platform'].uuid;
			},
			beforeCancelApi() {
				if (this.isChanged && this.rootState != 'init') {
					var changes = [];
					for (var prop in this.changes) {
						changes.push(prop);
					}
					var r = confirm('Are you sure to cancel editing this API?' + '\nCHANGES: ' + changes.join(', '));
					if (r == true) {
						this.cancelApi();
					}
				}
				// else {
				// 	this.cancelApi();
				// }
			},
			cancelApi() {
				var index = this.myApiList.indexOf(this.api);
				this.myApiList[index] = this.selectedApi;
				this.api = _.cloneDeep(this.newApi);
				this.clearSchema();
				this.selectedApi = _.cloneDeep(this.newApi);
				this.$root.setState('init');
				this.isEditingMethods = false;
				$('.column-maximize').removeClass('column-maximize');
				this.$refs.dropSpecs.removeAllFiles(true);
				this.$refs.dropImage.removeAllFiles(true);
				// $('.list-column').removeClass('column-minimize');
			},
			saveMyApi() {
				this.api['x-abyss-platform'].updated = moment().toISOString();
				axios.post(this.ajaxUrl + '?' + 'uuid=' + this.api['x-abyss-platform'].uuid, this.api, this.ajaxHeaders).then(response => {
					this.selectedApi = response.data;
					this.$toast('success', {message: '<strong>' + this.api.info.title + '</strong> saved', title: 'API SAVED'});
					this.isChanged = false;
					this.taxonomies();
				}, error => {
					alert(error.code + ': ' + error.message);
				});
			},
			chooseSpec() {
				// this.$emit('set-state', 'create');
				this.$root.setState('create');
				this.clearSchema();
				this.initSwagger();
				setTimeout(function(){
					$('#upload').collapse('show');
					$('#servers').collapse('show');
				},0);
			},
			createApi() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						this.api['x-abyss-platform'].created = moment().toISOString();
						this.api['x-abyss-platform'].uuid = this.uuidv4();
						// axios.post(this.ajaxUrl, this.api, this.ajaxHeaders).then(response => {
						this.addItem(this.ajaxUrl, this.api, this.ajaxHeaders, this.myApiList).then(response => {
							this.$root.setState('edit');
							var item = this.myApiList.find((el) => el['x-abyss-platform'].uuid == this.api['x-abyss-platform'].uuid );
							// Vue.set(this.api, this.myApiList[index]);
							// this.selectedApi = response.data;
							this.api = item;
							this.updateSchema(item);
							this.selectedApi = _.cloneDeep(this.api);
							// this.api = _.merge(this.openapi, response.data);
							$('#api'+this.api['x-abyss-platform'].uuid).collapse('show');
							$('#servers').collapse('show');
							$('.list-column').addClass('column-minimize');
							this.$toast('success', {message: '<strong>' + this.api.info.title + '</strong> successfully registered', title: 'API CREATED'});
							// $('.list-column').addClass('column-minimize');
							this.taxonomies();
						}, error => {
							alert(error.code + ': ' + error.message);
						});
						return;
					}
					// alert('Correct them errors!');
				});
			},
			filterApi(filter) {
				if (filter == null) {
					this.getPage(1);
				} else {
					this.getPage(1, '&id='+filter.id);
				}
			},
			getPage(p, d) {
				var param = d || '';
				axios.get(abyss.ajax.my_api_list + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					this.myApiList = response.data.openApiList;
					this.paginate = this.makePaginate(response.data);
				}, error => {
					console.error(error);
				});
			},
			getApiOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.my_api_list, {
					params: {
						q: search
					}
				})
				.then(response => {
					this.apiOptions = response.data.openApiList;
					loading(false);
				});
			},
			apiGetStateName(val) {
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.id == val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.id == val );
				return slcVisibility.name;
			},
			apiChangeVisibility(item, val) {
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.id == val );
				var curVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.id == item['x-abyss-platform'].apivisibilityid );
				if (slcVisibility.id != curVisibility.id) {
					item['x-abyss-platform'].apivisibilityid = slcVisibility.id;
					axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
						console.log("response1: ", response);
						this.$root.getRootData();
						console.log("response2: ", response);
						this.$toast('info', {message: 'Visibility changed ' + ' to <strong>' + slcVisibility.name + '</strong>', title: 'Visibility: ' + slcVisibility.name, position: 'topLeft'});
					}, error => {
						alert(error.code + ': ' + error.message);
					});
				}
			},
			apiChangeState(item, val) {
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.id == val );
				var curState = this.$root.rootData.myApiStateList.find((el) => el.id == item['x-abyss-platform'].apistateid );
				if (slcState.id != curState.id) {
					item['x-abyss-platform'].apistateid = slcState.id;
					axios.post(this.ajaxUrl, item, this.ajaxHeaders).then(response => {
						console.log("response1: ", response);
						this.$root.getRootData();
						console.log("response2: ", response);
						this.$toast('info', {message: 'State changed ' + ' to <strong>' + slcState.name + '</strong>', title: 'State: ' + slcState.name, position: 'topLeft'});
						if (val == 10) {
							this.removeItem(abyss.ajax.my_api_list, item, this.ajaxHeaders, this.myApiList);
						}
					}, error => {
						alert(error.code + ': ' + error.message);
					});
				}
			},
			categoriesToList(item) {
				// if (this.rootState == 'edit' || this.rootState == 'create') {
					if (item == null) {
						item = [];
					}
					console.log("item: ", item);
					return item.map(e => e.name).join(', ');
					// console.log("this.api['x-abyss-platform'].categories: ", this.api['x-abyss-platform'].categories);
				// }
			},
			tagsToList(item) {
				// if (this.rootState == 'edit' || this.rootState == 'create') {
					if (item == null) {
						item = [];
					}
					console.log("item: ", item);
					return item.map(e => e.name).join(', ');
				// }
			},
			groupsToList(item) {
				// if (this.rootState == 'edit' || this.rootState == 'create') {
					if (item == null) {
						item = [];
					}
					console.log("item: ", item);
					return item.map(e => e.name).join(', ');
				// }
			},
			getCategoryOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.api_category_list, {
					params: {
						name: search
					}
				})
				.then((response) => {
					this.categoryOptions = response.data.respDataList;
					loading(false);
				});
			},
			getTagOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.api_tag_list, {
					params: {
						name: search
					}
				})
				.then((response) => {
					this.tagOptions = _.unionBy(this.$root.rootData.myApiTagList, response.data.respDataList, 'uuid');
					loading(false);
				});
			},
			taxonomies() {
				var newTags = this.api['x-abyss-platform'].tags.filter((item) => item.uuid == null );
				newTags.forEach((value, key) => {
					value.uuid = this.uuidv4();
					value.count = 1;
				});
				console.log("diffffff: ", _.differenceBy(this.$root.rootData.myApiTagList, this.api['x-abyss-platform'].tags, 'uuid'));
				this.$root.rootData.myApiTagList = _.unionBy(this.$root.rootData.myApiTagList, this.api['x-abyss-platform'].tags, 'uuid');
				this.$root.rootData.myApiCategoryList = _.unionBy(this.$root.rootData.myApiCategoryList, this.api['x-abyss-platform'].categories, 'uuid');
			},
			grouped: function () {
				// const grouped = _.groupBy(this.openapi.paths, 'subregion');
				var tags = [];
				for (var p in this.openapi.paths) {
					console.log("p: ", p);
					var path = this.openapi.paths[p];
					console.log("path: ", path);
					for (var o in path) {
						var op = path[o];
						var xxx = _.pick(op, ['tags']);
						tags.push(_.values(xxx));
						console.log("xxx: ", xxx);
						console.log("o: ", o);
						console.log("op: ", op);
					}
				}
				var ddd = _.uniq(_.flattenDeep(tags));
				console.log("tags: ", tags);
				console.log("ddd: ", ddd);
			},
		},
		watch: {
			openapi: {
				handler(val, oldVal) {
					// console.log('old val', oldVal);
					// console.log('new val', val);
					// this.grouped();
					// this.api = Object.assign(this.api, this.openapi);
					this.api = _.merge(this.api, this.openapi);
					// this.changes = this.checkDiff(val, this.selectedApi);
					this.changes = this.checkDiff(this.api, this.selectedApi);
					// console.log("this.isChanged: ", Object.keys(this.changes).length, this.isChanged, this.changes);
					if ( Object.keys(this.changes).length == 0 || (Object.keys(this.changes).length == 1 && Object.keys(this.changes).some(v => v == 'updated')) ) {
						this.isChanged = false; 
					} else {
						this.isChanged = true; 
						if (this.$root.rootState == 'edit' || this.$root.rootState == 'create') {
							this.updateSw();
						}
					}
				},
				deep: true
			},
			swaggerText: {
				handler(val, oldVal) {
					// var local = localStorage.getItem('swagger-editor-content');
					var old = swEditor.getState().getIn(['spec', 'spec']);
					this.changes = this.checkDiff(val, old);
					// console.log("this.changes: ", this.changes);
					if ( Object.keys(this.changes).length == 0 ) {
						// console.log("No change: ", this);
					} else {
						// console.log("Yes Change: ", this);
						this.uploadSchema(val.text);
					}
				},
				deep: true
			},
		},
		mounted() {
			this.preload();
		},
		created() {
			// axios.get('https://generator.swagger.io/api/gen/clients').then(response => {
			// 	this.cgData.clients = response.data;
			// }, error => {
			// 	console.error(error);
			// });
			// axios.get('https://generator.swagger.io/api/gen/servers').then(response => {
			// 	this.cgData.servers = response.data;
			// }, error => {
			// 	console.error(error);
			// });
			this.initSchema();
			this.$root.setPage('my-apis', 'init');
			this.getPage(1);
		}
	});

});