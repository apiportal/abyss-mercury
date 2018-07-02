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
			if (!openapi.components.securitySchemes) {
				openapi.components.securitySchemes = {};
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
						// if (o != 'get') {
						// if ('get.delete'.indexOf(o)<0) {
						// 	if (!op.requestBody) op.requestBody = {};
						// 	if (!op.requestBody.$ref && !op.requestBody.content) op.requestBody.content = {};
						// }
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
		function removeAbyssProps(object) {
			function removeAbyss(object) {
				return _.transform(object, (result, value, key) => {
					if (!_.startsWith(key, 'x-abyss')) {
						result[key] = ( _.isObject(value) ) ? removeAbyss(value) : value;
					}
				});
			}
			return removeAbyss(object);
		}
		function postProcessDefinition(openapi) {
			// var ooo = clone(openapi);
			// var def = removeAbyssProps(ooo);
			var def = clone(openapi);
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
// ■■■■■■■■ MIXINS ■■■■■■■■ //
	const mixOas = {
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
			// ■■ root
			saveApi(ooo) {
				if (window.localStorage) {
					window.localStorage.setItem('openapi3', JSON.stringify(ooo));
				}
				if (window.intelligentBackend) {
					var data = new FormData();
					data.append('source',JSON.stringify(ooo));
					$.ajax({
						url:'/store',
						type:"POST",
						contentType: false,
						processData: false,
						data:data,
						success(result) {
						}
					});
				}
			},
			// ■■ my-api-list, api-preview
			apiGetStateName(val) {
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.uuid == val );
				return slcState.name;
			},
			apiGetVisibilityName(val) {
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == val );
				return slcVisibility.name;
			},
			
			// ■■ api-mediatype, api-parameter, api-items, my-apis
			mixEditSchema(obj, key, openapi) {
				if (!obj[key]) {
					Vue.set(obj, key, {});
				}
				var initial = deref(obj[key], openapi);
				var editorOptions = {};
				var element = document.getElementById('schemaContainer');
				this.schemaEditor = new JSONEditor(element, editorOptions, initial);
				schemaEditorClose = function() {
					this.schemaEditor.destroy();
					$('#schemaModal').modal('hide');
				}.bind(this);
				schemaEditorSave = function() {
					obj[key] = this.schemaEditor.get();
					schemaEditorClose();
				}.bind(this);
				if (key == 'schema') {
					$('#schemaModalTitle').text('Schema Editor - '+obj.name);
				} else {
					$('#schemaModalTitle').text('Schema Editor - '+key);
				}
				$('#schemaModal').modal({backdrop: 'static', keyboard: false});
			},
			addResponse(obj) {
				var status = 200;
				while (obj.responses[status]) {
					status++;
				}
				var response = {};
				response.description = 'Description';
				Vue.set(obj.responses, status, response);
				$('#responses').collapse('show');
			},
			addRequestBody(obj, rb) {
				console.log("rb, obj.newRequestBody: ", rb, obj.newRequestBody);
				if (rb && !obj.requestBody) {
					Vue.set(obj, 'requestBody', {
						content: {
							'*/*': {
								schema: {}
							}
						},
						description: 'Description',
						required: false
					});
				}
				if (!rb && !obj.newRequestBody) {
					Vue.set(obj, 'newRequestBody', {
						content: {
							'*/*': {
								schema: {}
							}
						},
						description: 'Description',
						required: false
					});
					$('#requestBodies').collapse('show');
				}
			},
			addMediaType(obj) {
				console.log("obj: ", obj);
				if (!obj.content) {
					Vue.set(obj,'content',{});
					Vue.set(obj.content,'change/me',{schema:{}});
				}
				if (!obj.content['change/me']) {
					Vue.set(obj.content,'change/me',{schema:{}});
				}
			},
			selectRefResponse(e, s) {
				console.log("e, s: ", e, s);
				if (e == 'None') {
					Vue.delete(s, '$ref');
					Vue.set(s, 'content', {
						'*/*': {
							schema: {}
						}
					});
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
		}
	};
// ■■■■■■■■ api-resource ■■■■■■■■ //
	Vue.component('api-resource', {
		mixins: [mixOas],
		props: ['openapi', 'path', 'index', 'maintags', 'iii'],
		computed: {
			pathEntry : {
				get() {
					return this.index;
				},
				set(newVal) {
					if (this.$parent.api.isproxyapi) {
						Vue.set(this.$parent.api.extendeddocument.paths, newVal, this.$parent.api.extendeddocument.paths[this.index]);
						Vue.delete(this.$parent.api.extendeddocument.paths, this.index);
					}
					Vue.set(this.openapi.paths, newVal, this.openapi.paths[this.index]);
					Vue.delete(this.openapi.paths, this.index);
				}
			},
			xPathEntry : {
				get() {
					var sarr = this.$parent.api.extendeddocument.paths[this.index];
					return sarr['x-abyss-path'];
				}
			},
			httpMethods() {
				var result = {};
				for (var m in this.methods) {
					if (this.path[this.methods[m]]) {
						result[this.methods[m]] = this.path[this.methods[m]];
					}
				}
				return result;
			}
		},
		data() {
			return {
				methods : ['get','post','put','delete','patch','head','options','trace']
			};
		},
		methods : {
			sanitisePath() {
				return 'resource_'+this.index.split('/').join('').split('{').join('').split('}').join('');
			},
			addResource () {
				this.$parent.addResource();
			},
			duplicateResource (index) {
				if (!this.openapi.paths['newPath']) {
					Vue.set(this.openapi.paths,'/newPath',this.openapi.paths[index]);
				}
			},
			removePath(target) {
				this.saveApi(this.openapi);
				Vue.delete(this.openapi.paths, target);
			},
			// editPathDesc() {
			// 	$('#pathDesc'+this.sanitisePath()).toggleClass('hide');
			// },
			// hidePathDesc() {
				// $('#pathDesc'+this.sanitisePath()).addClass('hide');
			// },
			addOperation(template) {
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
			removeOperation(target) {
				this.saveApi(this.openapi);
				Vue.delete(this.path, target);
			},
			renameOperation(oldMethod, newMethod) {
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
	// ■■■■ api-method: IN: template-method, api-response ■■■■ //
		Vue.component('api-method', {
			mixins: [mixOas],
			props: ['openapi', 'method', 'index', 'maintags', 'path'],
			data() {
				return {
					// visible: false,
					schemaEditor: undefined,
					cbName: undefined,
					expName: undefined
				};
			},
			methods: {
				markdownPreview() {
					this.$parent.$parent.markdownPreview('#'+this.descId);
				},
				addOperation() {
					this.$parent.addOperation();
				},
				duplicateOperation(method) {
					this.$parent.addOperation(method);
				},
				removeOperation(target) {
					this.$parent.removeOperation(target);
				},
				addParameter() {
					var newParam = {};
					newParam.name = 'newParam';
					newParam.in = 'query';
					newParam.required = false;
					newParam.schema = {};
					newParam.schema.type = 'string';
					this.method.parameters.push(newParam);
				},
				removeParameter(index) {
					this.saveApi(this.openapi);
					this.method.parameters.splice(index,1);
				},
				duplicateParameter(param) {
					this.method.parameters.push(param);
				},
				addCallback() {
					if (!this.method.callbacks) {
						Vue.set(this.method,'callbacks',{});
					}
					if (!this.method.callbacks.newCallback) {
						Vue.set(this.method.callbacks,'newCallback',{newExpression:{}});
					}
				},
				duplicateCallback(cbname) {
					if (!this.method.callbacks.newCallback) {
						Vue.set(this.method.callbacks,'newCallback',clone(this.method.callbacks[cbname]));
					}
				},
				removeCallback(cbname) {
					Vue.delete(this.method.callbacks,cbname);
				},
				storeCallbackName(oldName) {
					this.cbName = oldName;
				},
				renameCallback(newName) {
					Vue.set(this.method.callbacks,newName,this.method.callbacks[this.cbName]);
					Vue.delete(this.method.callbacks,this.cbName);
				},
				addCallbackURL(cbname) {
					if (!this.method.callbacks[cbname].newExpression) {
						Vue.set(this.method.callbacks[cbname],'newExpression',{});
					}
				},
				duplicateExpression(cbname, expname) {
					if (!this.method.callbacks[cbname].newExpression) {
						Vue.set(this.method.callbacks[cbname],'newExpression',clone(this.method.callbacks[cbname][expname]));
					}
				},
				removeExpression(cbname, expname) {
					Vue.delete(this.method.callbacks[cbname],expname);
				},
				storeExpressionName(oldName) {
					this.expName = oldName;
				},
				renameExpression(cbName, newName) {
					Vue.set(this.method.callbacks[cbName],newName,this.method.callbacks[cbName][this.expName]);
					Vue.delete(this.method.callbacks[cbName],this.expName);
				},
				addExpressionOperation(exp) {
					if (!exp.get) {
						Vue.set(exp,'get',{parameters:[],responses:{default:{description:'Default response'}}});
					}
				},
				removeSecScheme(index) {
					this.method.security.splice(index,1);
					Vue.set(this.method,'security',this.method.security);
				}
			},
			computed: {
				numResponses : {
					get() {
						return this.getObjCount(this.method.responses);
					}
				},
				numRequestBodies : {
					get() {
						return this.getObjCount(this.method.requestBody);
					}
				},
				numCallbacks : {
					get() {
						return this.getObjCount(this.method.callbacks);
					}
				},
				numLinks : {
					get() {
						return this.getObjCount(this.method.links);
					}
				},
				httpMethod : {
					get() {
						return this.index.toUpperCase();
					},
					set(newVal) {
						this.$parent.renameOperation(this.index, newVal.toLowerCase());
					}
				},
				hashUid() {
					return '#'+this._uid;
				},
				descId() {
					return 'txtOpDesc'+this._uid;
				},
				tagId() {
					return 'tags-input'+this._uid;
				},
				hashTagId() {
					return '#'+this.tagId;
				},
				vtags : {
					get() {
						if (!this.method.tags) Vue.set(this.method, 'tags', []);
						return this.method.tags;
					},
					set(newVal) {
						this.method.tags = newVal;
					}
				},
				mtags : {
					get() {
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
				secType : {
					get() {
						if (!this.method.security) return 'default';
						if (this.method.security && this.method.security.length === 0) return 'none';
						return 'custom';
					},
					set(newVal) {
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
			beforeUpdate() {
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
	// ■■■■ api-response: IN: template-method, my-apis ■■■■ //
		Vue.component('api-response', {
			mixins: [mixOas],
			props: ["openapi", "response", "status", "method", "rindex"],
			computed: {
				statusCode: {
					get() {
						return this.status;
					},
					set(newVal) {
						this.renameResponse(this.status, newVal);
					}
				}
			},
			methods: {
				removeResponse() {
					console.log("this.response: ", this.response);
					console.log("this.method: ", this.method);
					this.saveApi(this.$parent.openapi);
					Vue.delete(this.method.responses, this.status);
					if (Object.keys(this.method.responses).length==0) {
						Vue.set(this.method.responses,'default',{description:'Default response'});
					}
				},
				renameResponse(oldName, newName) {
					console.log("this.response: ", this.response);
					console.log("this.method: ", this.method);
					Vue.set(this.method.responses, newName, this.method.responses[oldName]);
					Vue.delete(this.method.responses, oldName);
				},
			},
			data() {
				return {};
			},
			template: '#template-responses'
		});
	// ■■■■ api-requestbody: IN: template-method, my-apis ■■■■ //
		Vue.component('api-requestbody', {
			mixins: [mixOas],
			props: ["openapi", "response", "status", "method", "bindex"],
			computed: {
				effectiveRequestBody : {
					get() {
						if (!this.method.requestBody) return null;
						if (!this.method.requestBody.$ref) return this.method.requestBody;
						return this.method.requestBody;
						// return deref(this.method.requestBody, this.openapi);
					}
				},
				requestName: {
					get() {
						return this.status;
					},
					set(newVal) {
						this.renameRequestBodies(this.status, newVal);
					}
				}
			},
			methods: {
				renameRequestBodies(oldName, newName) {
					console.log("oldName, newName: ", oldName, newName);
					Vue.set(this.method, newName, this.method[oldName]);
					Vue.delete(this.method, oldName);
				},
				removeRequestBody(key) {
					// Vue.delete(this.openapi.components.requestBodies,key);
					Vue.delete(this.method,key);
				},
				openRef(ref) {
					console.log("ref: ", ref);
				},
			},
			data() {
				return {};
			},
			template: '#template-requestbody'
		});
	// ■■■■ api-mediatype: IN: api-requestbody, api-response, my-apis ■■■■ //
		Vue.component('api-mediatype', {
			mixins: [mixOas],
			props: ["openapi","content", "mediatype", "container"],
			computed: {
				mediaTypeName: {
					get() {
						return this.mediatype;
					},
					set(newVal) {
						this.renameMediaType(this.mediatype, newVal);
					}
				},
				schemaTooltip : {
					get() {
						if (!this.content.schema) {
							Vue.set(this.content,'schema',{});
						}
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
				renameMediaType(oldName, newName) {
					Vue.set(this.container.content, newName, this.container.content[oldName]);
					Vue.delete(this.container.content, oldName);
				},
				duplicateMediaType() {
					if (!this.container.content['change/me']) {
						var newContent = clone(this.content);
						Vue.set(this.container.content,'change/me',newContent);
					}
				},
				removeMediaType() {
					this.saveApi(this.openapi);
					Vue.delete(this.container.content, this.mediatype);
					if (Object.keys(this.container.content).length==0) {
						Vue.set(this.container.content,'application/json',{schema:{}});
					}
				}
			},
			data() {
				return {};
			},
			template: '#template-mediatype'
		});
// ■■■■■■■■ api-parameter: #template-parameter, IN: #template-method ■■■■■■■■ //
	Vue.component('api-parameter', {
		mixins: [mixOas],
		props: ['parameter', 'index', 'openapi'],
		computed: {
			hashUid() {
				return '#'+this._uid;
			},
			formatListId() {
				return 'listFormats'+this._uid;
			},
			descId() {
				return 'txtParmDesc'+this._uid;
			},
			effectiveIn : {
				get() {
					if (!this.parameter.in) return 'body';
					return this.parameter.in;
				},
				set(newVal) {
					this.parameter.in = newVal;
					if (newVal == 'path') Vue.set(this.parameter, 'required', true);
				}
			},
			effectiveRequired : {
				get() {
					if (typeof this.parameter.required === 'undefined') return false;
					return this.parameter.required;
				},
				set(newVal) {
					this.parameter.required = newVal;
				}
			},
			schemaTooltip : {
				get() {
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
		data() {
			return {
				schemaEditor: undefined
			};
		},
		methods : {
			markdownPreview() {
				this.$parent.$parent.$parent.markdownPreview('#'+this.descId);
			},
			isComplex() {
				if (this.effectiveType === 'object' ||
					this.effectiveType === 'array' ||
					this.effectiveType === 'file') {
					return true;
				}
				return false;
			},
			addParameter() {
				this.$parent.addParameter();
			},
			removeParameter() {
				this.$parent.removeParameter(this.index);
			},
			duplicateParameter(param) {
				this.$parent.duplicateParameter(param);
			},
		},
		template: '#template-parameter',
		beforeMount() {
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
// ■■■■■■■■ api-items: IN: #template-items, IN: #template-items++, #template-parameter, my-apis ■■■■■■■■ //
	Vue.component('api-items', {
		mixins: [mixOas],
		props: ["openapi", "child", "level", "name"],
		computed: {
			formatListId() {
				return 'listFormats'+this._uid;
			},
			effectiveType : {
				get() {
					// return this.child.type;
					if (this.child.type == 'array' || this.child.type == 'object' || this.child.type == 'string' || this.child.type == 'integer' || this.child.type == 'number' || this.child.type == 'boolean') {
						return this.child.type;
					} else {
						return this.child.$ref;
					}
				},
				set(newVal) {
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
				get() {
					if (this.child.type == 'integer') return ['int32','int64'];
					if (this.child.type == 'number') return ['float','double'];
					if (this.child.type == 'string') return ['date','date-time','byte','binary','password','uri','uuid','email','hostname','ipv4','ipv6','pattern'];
					return [];
				},
				set(newVal) {}
			},
			levelPlusOne() {
				return (this.level+1);
			}
		},
		methods: {
			addEnum() {
				if (!this.child.enum) {
					Vue.set(this.child, 'enum', []);
				}
				this.child.enum.push('newValue');
			},
			removeEnum(index) {
				this.child.enum.splice(index, 1);
				if (this.child.enum.length == 0) {
					Vue.delete(this.child, 'enum');
				}
			},
			addSchema(id) {
				if (!this.child.properties) {
					Vue.set(this.child, 'properties', {});
				}
				if (!this.child.properties.NewItem) {
					Vue.set(this.child.properties, 'NewItem', {type: 'object'});
					var i = Object.keys(this.child.properties).indexOf('NewItem');
					console.log("i: ", i);
					setTimeout(() => {
						$('#schemas').collapse('show');
						$('#'+id+i).collapse('show');
					},0);	
				}
			},
			duplicateSchema(key) {
				if (!this.child.properties.NewItem) {
					Vue.set(this.child.properties, 'NewItem', this.child.properties[key]);
				}
			},
			removeSchema(key) {
				Vue.delete(this.child.properties, key);
			},
			storeSchemaName(key) {
				this.currentSchema = key;
			},
			renameSchema(key) {
				Vue.set(this.child.properties, key, this.child.properties[this.currentSchema]);
				Vue.delete(this.child.properties, this.currentSchema);
			},
		},
		data() {
			return {
				currentSchema: '',
			};
		},
		template: '#template-items'
	});
// ■■■■■■■■ api-output ■■■■■■■■ //
	Vue.component('api-output', {
		mixins: [mixOas],
		props: ['openapi','editorType'],
		data() {
			return {};
		}
	});
	Vue.component('api-input', {
		mixins: [mixOas],
		// props: ['openapi','editorType'],
		props: ['value','openapi'],
		data() {
			return {};
		}
	});
// ■■■■■■■■ api-secdef ■■■■■■■■ //
	Vue.component('api-secdef', {
		mixins: [mixOas],
		props: ['openapi', 'sd', 'sdname', 'index'],
		computed: {
			secname: {
				get() {
					return this.sdname;
				},
				set(newVal) {
					this.$parent.renameSecurityDefinition(this.sdname, newVal);
				}
			},
			type : {
				get() {
					return this.sd.type;
				},
				set(newVal) {
					this.sd.type = newVal;
					if (newVal != 'apiKey') {
						Vue.delete(this.sd, 'in');
						Vue.delete(this.sd, 'name');
					}
					if (newVal != 'oauth2') {
						Vue.delete(this.sd, 'flows');
					}
					if (newVal == 'oauth2') {
						Vue.set(this.sd,'flows',{});
					}
					if (newVal != 'http') {
						Vue.delete(this.sd, 'scheme');
					}
					if (newVal != 'openIdConnect') {
						Vue.delete(this.sd, 'openIdConnectUrl');
					}
				}
			},
			appliesToAllPaths : {
				get() {
					var index = -1;
					for (var s=0;s<this.openapi.security.length;s++) {
						var sr = this.openapi.security[s];
						if (typeof sr[this.sdname] !== 'undefined') {
							index = s;
						}
					}
					return index >= 0 ? true : false;
				},
				set(newVal) {
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
				get() {
					return this.sd.flows && this.sd.flows.implicit;
				},
				set(newVal) {
					if (newVal) {
						// Vue.set(this.sd.flows,'implicit',{scopes: {newScope: "description"}});
						Vue.set(this.sd.flows,'implicit',{scopes: {}});
						setTimeout(() => {
							$('#flow-implicit').collapse('show');
						},0);
					} else {
						Vue.delete(this.sd.flows,'implicit');
					}
				}
			},
			hasPassword: {
				get() {
					return this.sd.flows && this.sd.flows.password;
				},
				set(newVal) {
					if (newVal) {
						// Vue.set(this.sd.flows,'password',{scopes: {newScope: "description"}});
						Vue.set(this.sd.flows,'password',{scopes: {}});
						setTimeout(() => {
							$('#flow-password').collapse('show');
						},0);
					} else {
						Vue.delete(this.sd.flows,'password');
					}
				}
			},
			hasAuthCode: {
				get() {
					return this.sd.flows && this.sd.flows.authorizationCode;
				},
				set(newVal) {
					if (newVal) {
						// Vue.set(this.sd.flows,'authorizationCode',{scopes: {newScope: "description"}});
						Vue.set(this.sd.flows,'authorizationCode',{scopes: {}});
						setTimeout(() => {
							$('#flow-authorizationCode').collapse('show');
						},0);
					} else {
						Vue.delete(this.sd.flows,'authorizationCode');
					}
				}
			},
			hasClientCred: {
				get() {
					return this.sd.flows && this.sd.flows.clientCredentials;
				},
				set(newVal) {
					if (newVal) {
						// Vue.set(this.sd.flows,'clientCredentials',{scopes: {newScope: "description"}});
						Vue.set(this.sd.flows,'clientCredentials',{scopes: {}});
						setTimeout(() => {
							$('#flow-clientCredentials').collapse('show');
						},0);
					} else {
						Vue.delete(this.sd.flows,'clientCredentials');
					}
				}
			}
		},
		methods : {
			addSecurityDefinition(name) {
				this.$parent.addSecurityDefinition(name);
			},
			removeSecurityDefinition(sdname) {
				this.$parent.removeSecurityDefinition(sdname);
			},
			addScope(flow) {
				if (!flow.scopes) Vue.set(flow, 'scopes', {});
				if (!flow.scopes.newScope) {
					Vue.set(flow.scopes, 'newScope', 'description');
				}
			},
			renameScope(flow, oldName, newName) {
				Vue.set(flow.scopes, newName, flow.scopes[oldName]);
				Vue.delete(flow.scopes, oldName);
			},
			removeScope(flow, sName) {
				this.saveApi(this.openapi);
				Vue.delete(flow.scopes,sName);
			}
		},
		data() {
			return {};
		}
	});
	// ■■■■ api-scope: IN: api-secdef ■■■■ //
		Vue.component('api-scope', {
			mixins: [mixOas],
			props: ["sd", "sname", "sdname", "flow", "sindex"],
			computed: {
				scopename: {
					get() {
						return this.sname;
					},
					set(newVal) {
						this.$parent.renameScope(this.flow, this.sname, newVal);
					}
				}
			},
			methods: {
				addScope() {
					this.$parent.addScope(this.flow);
				},
				removeScope(flow, sName) {
					this.$parent.removeScope(flow, sName);
				}
			},
			data() {
				return {};
			}
		});
// ■■■■■■■■ api-srvvar ■■■■■■■■ //
	Vue.component('api-servers', {
		mixins: [mixOas],
		props: ["server", "sindex"],
		computed: {
			serverUrl : {
				get() {
					return this.server.url;
				},
				set(newVal) {
					if (this.$parent.api.isproxyapi) {
						var sarr = this.$parent.api.extendeddocument.servers.find( (item) => item.url == this.server.url );
						Vue.set(sarr, 'url', newVal);
					}
					this.server.url = newVal;
				}
			},
			xServerUrl : {
				get() {
					var sarr = this.$parent.api.extendeddocument.servers.find( (item) => item.url == this.server.url );
					if (this.server.description) {
						Vue.set(sarr, 'description', this.server.description);
					}
					return sarr['x-abyss-url'];
				}
			},
		},
		methods: {
			addServer() {
				this.$parent.addServer();
			},
			removeServer(i) {
				this.$parent.removeServer(i);
			},
			addVariable(i) {
				this.$parent.addVariable(i);
			},
		},
		data() {
			return {};
		}
	});
// ■■■■■■■■ api-srvvar ■■■■■■■■ //
	Vue.component('api-srvvar', {
		mixins: [mixOas],
		props: ["name", "variable", "server", "sindex"],
		computed: {
			variableName: {
				get() {
					return this.name;
				},
				set(newVal) {
					this.$parent.renameVariable(this.server, this.name, newVal);
				}
			}
		},
		methods: {
			removeVariable(serverIndex) {
				this.$parent.removeVariable(this.server, this.name);
				// $('#server'+serverIndex).collapse('hide');
				// this.$parent.removeVariable(this.server, this.variable);
			},
			addVEnum() {
				if (!this.variable.enum) Vue.set(this.variable, 'enum', []);
				this.variable.enum.push('newValue');
			}
		},
		data() {
			return {};
		}
	});
	// ■■■■ api-venum: IN: api-srvvar ■■■■ //
		Vue.component('api-venum', {
			mixins: [mixOas],
			props: ["variable", "eindex"],
			computed: {
				vename: {
					get() {
						return this.variable.enum[this.eindex];
					},
					set(newValue) {
						this.variable.enum[this.eindex] = newValue;
					}
				}
			},
			methods: {
				removeVEnum(eIndex) {
					this.variable.enum.splice(eIndex,1);
				},
				addVEnum() {
					this.$parent.addVEnum();
				}
			},
			data() {
				return {};
			}
		});
// ■■■■■■■■ my-api-list ■■■■■■■■ //
	Vue.component('my-api-list', {
		mixins: [mixOas],
		template: '#template-list',
		props: ['api', 'openapi', 'lindex', 'apilist'],
		computed: {
			apiEnvironment : {
				get() {
					if (this.api.islive) {
						return 'Live';
					}
					if (this.api.issandbox) {
						return 'Sandbox';
					}
				}
			},
			apiDefaultVersion : {
				get() {
					if (this.api.isdefaultversion) {
						return 'Default';
					}
				}
			},
			apiLatestVersion : {
				get() {
					if (this.api.islatestversion) {
						return 'Latest';
					}
				}
			},
			activeVisibility: {
				get() {
					var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == this.api.apivisibilityid );
					if (slcVisibility) {
						return slcVisibility.name;
					}
				},
			},
			activeState: {
				get() {
					var slcState = this.$root.rootData.myApiStateList.find((el) => el.uuid == this.api.apistateid );
					if (slcState) {
						return slcState.name;
					}
				},
			},
			numSecuritySchemes : {
				get() {
					if (this.api.openapidocument.components.securitySchemes) {
						return this.getObjCount(this.api.openapidocument.components.securitySchemes);
					} else {
						return 0;
					}
				}
			},
			businessapi: {
				get() {
					// var index = _.findIndex(this.$parent.myApiList, { 'uuid': this.api.businessapiid });
					// console.log("index: ", index);
					// if (index != -1) {
					// 	return this.$parent.myApiList[index].openapidocument.info.title;
					// }
					var bapi = this.$parent.myApiList.find((el) => el.uuid == this.api.businessapiid );
					if (bapi) {
						return bapi.openapidocument.info.title;
					}
				}
			}
		},
		methods: {
			/*apiIsActiveState(item, val) {
				// console.log("apiIsActiveState item: ", item);
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.uuid == item.apistateid );
				return slcState.name == val;
			},
			apiIsActiveVisibility(item, val) {
				// console.log("apiIsActiveVisibility item: ", item);
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == item.apivisibilityid );
				return slcVisibility.name == val;
			},*/
		},
		data() {
			return {};
		},
		mounted() {
			// this.log(this.$options.name);
		},
	});
// ■■■■■■■■ MY-APIS ■■■■■■■■ //
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('my-apis', {
		mixins: [mixOas],
		components: {
			vueDropzone: vue2Dropzone,
			// 'v-select': VueSelect.VueSelect
		},
		data() {
			return {
				cgData : {
					clients: [],
					servers: []
				},
				debugProxy : false,
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
					key: 'created',
					type: Date,
					order: 'desc'
				},
				sortLicense: {
					key: 'created',
					type: Date,
					order: 'desc'
				},
				// sortMethod: {
				// 	key: 'openapi.paths',
				// 	type: String,
				// 	order: 'desc'
				// },
				pageState: 'init',
				paginate: {},
				ajaxApiUrl: abyss.ajax.api_list,
				// ajaxUrl: abyss.ajax.my_api_list + this.$cookie.get('abyss.principal.uuid'),
				ajaxUrl: abyss.ajax.my_business_api_list + this.$cookie.get('abyss.principal.uuid'),
				ajaxMyProxiesUrl: abyss.ajax.my_proxy_api_list + this.$cookie.get('abyss.principal.uuid'),
				ajaxHeaders: {},
				
				swChanges: {},
				changes: {},
				isChanged: false,
				verChanged: false,

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
				myLicenseList: [],
				myPolicyList: [],
				myApiLicenses: [],
				myApiList: [],
				myProxyList: [],
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
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"subjectid": null,
					"isproxyapi": false,
					"apistateid": "dccb1796-9338-4ae8-a0d9-02654d1e2c6d",
					"apivisibilityid": "043d4827-cff4-43f9-9d5b-782d1f83b3f0",
					"languagename": "OpenAPI",
					"languageversion": "3.0.0",
					"languageformat": 1,
					"originaldocument": null,
					"openapidocument": {},
					"extendeddocument": null,
					"businessapiid": "2741ce5d-0fcb-4de3-a517-405c0ceffbbe",
					"image": "",
					"color": "#006699",
					"deployed": moment().toISOString(),
					"changelog": "",
					"apioriginuuid": null,
					"version": "1.0.0",
					"issandbox": false,
					"islive": false,
					"isdefaultversion": true,
					"islatestversion": true,
					////////////
					"tags": [],
					"groups": [],
					"categories": [],
					"proxies": [],
					////////////
					"tagList": "",
					"groupList": "",
					"categoryList": "",
					"qosPolicy": "",
					"specs": null
				},
				apiapiTag: [],
				apiapiGroup: [],
				apiapiCategory: [],
				/*apiapiTag: {
					"uuid": null,
					"organizationid": this.$root.rootData.user.organizationid,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": this.$root.rootData.user.uuid,
					"apiid": null,
					"apitagid": null
				},
				apiapiGroup: {
					"uuid": null,
					"organizationid": this.$root.rootData.user.organizationid,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": this.$root.rootData.user.uuid,
					"apiid": null,
					"apigroupid": null
				},
				apiapiCategory: {
					"uuid": null,
					"organizationid": this.$root.rootData.user.organizationid,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": this.$root.rootData.user.uuid,
					"apiid": null,
					"apicategoryid": null
				},*/
				end: []
			};
		},
		props: {
			rootState: { type: String },
			// rootData: { type: Object }
		},
		methods: {
			// ■■■■■■■■■■■■■■■■■■■■■■■■ OAS ■■■■■■■■■■■■■■■■■■■■■■■■ //
				licenseToList(item) {
					if (item == null) {
						Vue.set(this.openapi.info.license,'url',null);
					} else {
						Vue.set(this.openapi.info.license,'url',item.url);
						// Vue.set(this.openapi.info.license,'name',item.name);
					}
				},
				licenseFromList(item) {
					Vue.set(this.openapi.info.license,'name',item.name);
					Vue.set(this.openapi.info.license,'url',item.url);
				},
				enableLicenseSelect() {
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
				addResource() {
					if (!this.openapi.paths) Vue.set(this.openapi, 'paths', {});
					if (!this.openapi.paths['/newPath']) {
						Vue.set(this.openapi.paths, '/newPath', {});
						$('html,body').animate({ scrollTop: document.body.scrollHeight }, "fast");
					}
				},
				showResource(key) {
					var target = 'resource_' + key.split('/').join('').split('{').join('').split('}').join('');
					var e = document.getElementById(target);
					if (e) e.scrollIntoView();
				},
				addTag() {
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
					setTimeout(() => {
						$('#tags').collapse('show');
						$('#t'+i).collapse('show');
					},0);
				},
				removeTag(index) {
					this.openapi.tags.splice(index, 1);
					this.saveApi(this.openapi);
				},
				addSecurityDefinition(name) {
					if (!this.openapi.components.securitySchemes) {
						Vue.set(this.openapi.components, 'securitySchemes', {});
					}
					if (!this.openapi.components.securitySchemes[name]) {
						console.log("name: ", name);
						var newSecDef = {};
						if (name == 'basicAuth') {
							// newSecDef.name = name;
							newSecDef.type = 'http';
							newSecDef.scheme = 'basic';
						} else if (name == 'bearerAuth') {
							// newSecDef.name = name;
							newSecDef.type = 'http';
							newSecDef.scheme = 'bearer';
						} else {
							newSecDef.type = 'apiKey';
							newSecDef.name = 'api_key';
							newSecDef.in = 'query';
						}
						Vue.set(this.openapi.components.securitySchemes, name, newSecDef);
						var i = Object.keys(this.openapi.components.securitySchemes).indexOf(name);
						console.log("i: ", i);
						setTimeout(() => {
							$('#securitySchemes').collapse('show');
							$('#sd'+i).collapse('show');
						},0);	
					}
				},
				// !ERROR
				renameSecurityDefinition(oldName, newName) {
					console.log("oldName, newName: ", oldName, newName);
					Vue.set(this.openapi.components.securitySchemes, newName, this.openapi.components.securitySchemes[oldName]);
					Vue.delete(this.openapi.components.securitySchemes, oldName);
				},
				filterSecurityDefinition(security, sdname) {
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
				removeSecurityDefinition(index) {
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
				addServer() {
					if (!this.openapi.servers) Vue.set(this.openapi, 'servers', []);
					this.openapi.servers.push({url:'https://www.example.com',description:''});
					var i = this.openapi.servers.length - 1;
					setTimeout(() => {
						$('#servers').collapse('show');
						$('#server'+i).collapse('show');
					},0);					
				},
				removeServer(index) {
					this.openapi.servers.splice(index,1);
				},
				addVariable(serverIndex) {
					if (!this.openapi.servers[serverIndex].variables) Vue.set(this.openapi.servers[serverIndex],'variables',{});
					Vue.set(this.openapi.servers[serverIndex].variables,'newVar',{description:'',default:'change-me'});
					$('#server'+serverIndex).collapse('show');
				},
				renameVariable(server, oldName, newName) {
					Vue.set(server.variables, newName, server.variables[oldName]);
					Vue.delete(server.variables, oldName);
				},
				removeVariable(server,index) {
					console.log("server,index: ", server,index);
					Vue.delete(server,'variables');
					// Vue.delete(server.variables,index);
				},
				addSchema() {
					if (!this.openapi.components.schemas.NewSchema) {
						Vue.set(this.openapi.components.schemas, 'NewSchema', {type: 'object'});
						var i = Object.keys(this.openapi.components.schemas).indexOf('NewSchema');
						console.log("i: ", i);
						setTimeout(() => {
							$('#schemas').collapse('show');
							$('#schema'+i).collapse('show');
						},0);	
					}
				},
				duplicateSchema(key) {
					if (!this.openapi.components.schemas.NewSchema) {
						Vue.set(this.openapi.components.schemas, 'NewSchema', this.openapi.components.schemas[key]);
					}
				},
				removeSchema(key) {
					Vue.delete(this.openapi.components.schemas, key);
				},
				storeSchemaName(key) {
					this.currentSchema = key;
				},
				renameSchema(key) {
					Vue.set(this.openapi.components.schemas, key, this.openapi.components.schemas[this.currentSchema]);
					Vue.delete(this.openapi.components.schemas, this.currentSchema);
				},
				markdownPreview(selector) {
					$('#mdPreview').modal();
					var str = $(selector).val();
					var md = window.markdownit();
					var result = md.render(str);
					$('#mdPreviewText').html(result);
				},
				showAlert(text, callback) {
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
				showConfirm(title, text, callback) {
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
						success(schema) {
							callback(schema);
						}
					});
				},
			// ■■■■■■■■■■■■■■■■■■■■■■■■ ABYSS OAS ■■■■■■■■■■■■■■■■■■■■■■■■ //
				initSchema() {
					var ooo = _.cloneDeep(this.openapi);
					// console.log("1O: ", JSON.stringify(ooo, null, 2));
					Vue.set(this,'newApi',preProcessDefinition(_.cloneDeep(this.api)));
					Vue.set(this,'newOpenapi',preProcessDefinition(ooo));
					Vue.set(this,'openapi',preProcessDefinition(ooo));
					// console.log("2O: ", JSON.stringify(this.openapi, null, 2));
					// this.importschema = JSON.stringify(ooo, null, 2);
					// this.loadSchema();
				},
				setSchema(schema) {
					this.updateSchema(schema);
					Vue.set(this,'selectedOpenapi',_.cloneDeep(this.openapi));
					// swEditor.specActions.updateSpec(jsyaml.dump(schema));
				},
				updateSchema(schema) {
					// console.log("updateSchema: ", schema);
					schema = preProcessDefinition(schema);
					if (window.localStorage) window.localStorage.setItem('openapi3', JSON.stringify(schema));
					Vue.set(this, 'openapi', schema);
					// self.openapi.paths = {};
				},
				loadSchema() {
					// console.log("loadSchema: ", this.importschema);
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
				editingSchema(val) {
					if (val == '') {
						this.clearSchema();
					} else {
						var schema = JSON.parse(val);
						this.updateSchema(schema);
					}
				},
				clearSchema(val) {
					Vue.set(this, 'openapi', _.cloneDeep(this.newOpenapi));
					this.importschema = JSON.stringify(this.openapi, null, 2);
				},
				updateSw: _.debounce(function() {
					// swEditor.specActions.updateSpec(jsyaml.dump(this.openapi));
					this.importschema = JSON.stringify(this.openapi, null, 2);
					if (typeof swEditor == 'undefined') {
						this.initSwagger();
						setTimeout(() => {
							swEditor.specActions.updateSpec(jsyaml.dump(this.postProcessDefinition()));
						},1000);
					} else {
						swEditor.specActions.updateSpec(jsyaml.dump(this.postProcessDefinition()));
					}
					
				}, 100),
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
				}, 0),
				uploadSchema(val) {
					// console.log("uploadSchema: ", val);
					try {
						if (typeof val === 'string') {
							this.importschema = val;
						} else {
							this.importschema = JSON.stringify(val, null, 2);
						}
						// var vm = this;
						// setTimeout(function(){
						setTimeout(() => {
							this.loadSchema();
							// vm.loadSchema();
						},100);	
					}
					catch (ex) {
						alert(ex);
					}
				},
				loadFromUrlSchema(val, load) {
					console.log("val: ", val);
					if (val != '') {
						var vm = this;
						$.ajax({
							url: val,
							// dataType: "jsonp",
						})
							.done(function(data) {
								if (vm.beforeCancelApi()) {
									console.log("loadFromUrlSchema data: ", data);
									if (typeof data === 'string') {
										vm.importschema = data;
									} else {
										vm.importschema = JSON.stringify(data, null, 2);
									}
								}
							})
							.fail(function(data, error) {
								console.log("fail data: ", data);
								console.log("fail error: ", error);
							})
							.always(function() {
								// setTimeout(() => {
									vm.loadSchema();
									if (load) {
											vm.chooseLink();
									}
								// },100);	
							});
					}
				},
				postProcessDefinition() {
					return postProcessDefinition(this.openapi);
				},
				renderOutputAll(type) {
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
					clippy = new ClipboardJS('#copy-all', {
						// target: $('#pretty-'+type)
						target(trigger) {
							// return $('#pretty-'+type);
							return document.getElementById('pretty-'+type);
							// return document.getElementsByClassName('select-pretty');
							// return document.querySelectorAll('[data-pretty]');
						}
					});
					setTimeout(() => {
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
				console.log("file.dataURL: ", file.dataURL);
				console.log("response.files: ", response.files);
				console.log("response.files.file: ", response.files.file);
				// Vue.set(this.api, 'image', response.files.file);
				Vue.set(this.api, 'image', file.dataURL);
				// this.api.image = response.files;
			},
			fixProps(item) {
				if (item.proxies == null) {
					Vue.set(item, 'proxies', []);
					// console.log("item.proxies: ", item.proxies.length, item.uuid);
					var papi = this.myApiList.find((el) => el.businessapiid == item.uuid );
					if (papi) {
						item.proxies.push(papi);
					}
				}
				// console.log("item.openapidocument.info.title: ", item.openapidocument.info.title);
				if (!item.openapidocument.components) {
					// console.log("no.components: ", item.openapidocument.info.title, item.uuid);
					Vue.set(item.openapidocument, 'components', {});
					// Vue.set(item.openapidocument.components, 'securitySchemes', {});
				}
				/*if (!item.openapidocument.openapi) {
					console.log("OAS 2 REMOVED: ", item.openapidocument.info.title, item.uuid);
					// Vue.set(item.openapidocument.components, 'securitySchemes', {});
					var index = this.myApiList.indexOf(item);
					this.myApiList.splice(index, 1);
				}*/
				if (typeof item.openapidocument === 'string') {
					item.openapidocument = JSON.parse(item.openapidocument);
				}
				if (item.color == null) {
					Vue.set(item, 'color', '#006699');
				}
				if (item.deployed == null) {
					Vue.set(item, 'deployed', moment().toISOString() );
				}
				if (item.image == null) {
					Vue.set(item, 'image', '' );
				}
				if (item.changelog == null) {
					Vue.set(item, 'changelog', '' );
				}
				if (item.issandbox == null) {
					Vue.set(item, 'issandbox', false );
				}
				if (item.islive == null) {
					Vue.set(item, 'islive', false );
				}
				if (item.isdefaultversion == null) {
					Vue.set(item, 'isdefaultversion', true );
				}
				if (item.islatestversion == null) {
					Vue.set(item, 'islatestversion', true );
				}
				if (item.version == null) {
					Vue.set(item, 'version', this.api.openapidocument.info.version );
				}
				if (item.businessapiid == null) {
					Vue.set(item, 'businessapiid', '2741ce5d-0fcb-4de3-a517-405c0ceffbbe' );
				}
				if (item.apioriginuuid == null) {
					Vue.set(item, 'apioriginuuid', '2741ce5d-0fcb-4de3-a517-405c0ceffbbe' );
				}
				if (item.subjectid == null) {
					Vue.set(item,'subjectid',this.$root.rootData.user.uuid);
				}
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
				}
				if (item.organizationid == null) {
					Vue.set(item,'organizationid',this.$root.rootData.user.organizationid);
				}
				if (item.tags == null) {
					Vue.set(item, 'tags', []);
				}
				if (item.groups == null) {
					Vue.set(item, 'groups', []);
				}
				if (item.categories == null) {
					Vue.set(item, 'categories', []);
				}
				if (item.tagList == null) {
					Vue.set(item, 'tagList', '');
				}
				if (item.groupList == null) {
					Vue.set(item, 'groupList', '');
				}
				if (item.categoryList == null) {
					Vue.set(item, 'categoryList', '');
				}
				if (item.qosPolicy == null) {
					Vue.set(item, 'qosPolicy', '');
				}
				if (item.specs == null) {
					Vue.set(item, 'specs', null);
				}
			},
			deleteProps(el) {
				var item = _.cloneDeep(el);
				Vue.delete(item, 'uuid');
				Vue.delete(item, 'created');
				Vue.delete(item, 'updated');
				Vue.delete(item, 'deleted');
				Vue.delete(item, 'isdeleted');
				// Vue.delete(item, 'extendeddocument');
				Vue.delete(item, 'tags');
				Vue.delete(item, 'groups');
				Vue.delete(item, 'categories');
				Vue.delete(item, 'proxies');
				Vue.delete(item, 'tagList');
				Vue.delete(item, 'groupList');
				Vue.delete(item, 'categoryList');
				Vue.delete(item, 'qosPolicy');
				Vue.delete(item, 'specs');
				return item;
			},
			apiChangeEnvironment(item, val) {
				if (val == 'islive' && !item.islive) {
					item.islive = true;
					item.issandbox = false;
					this.updateItem(this.ajaxApiUrl + '/' + item.uuid, this.deleteProps(item), this.ajaxHeaders, this.myApiList).then(response => {
						console.log("apiChangeEnvironment response: ", response);
						this.$toast('info', {message: 'Environment changed successfully', title: 'Environment changed as LIVE', position: 'topLeft'});
					});
				}
				if (val == 'issandbox' && !item.issandbox) {
					item.islive = false;
					item.issandbox = true;
					this.updateItem(this.ajaxApiUrl + '/' + item.uuid, this.deleteProps(item), this.ajaxHeaders, this.myApiList).then(response => {
						console.log("apiChangeEnvironment response: ", response);
						this.$toast('info', {message: 'Environment changed successfully', title: 'Environment changed as SANDBOX', position: 'topLeft'});
					});
				}
			},
			apiChangeVersion(item, val) {
				if (val == 'isdefaultversion') {
					item.isdefaultversion = !item.isdefaultversion;
					this.updateItem(this.ajaxApiUrl + '/' + item.uuid, this.deleteProps(item), this.ajaxHeaders, this.myApiList).then(response => {
						console.log("apiChangeVersion response: ", response);
						this.$toast('info', {message: 'Version preference changed successfully', title: 'Version preference changed', position: 'topLeft'});
					});
				}
				if (val == 'islatestversion') {
					item.islatestversion = !item.islatestversion;
					this.updateItem(this.ajaxApiUrl + '/' + item.uuid, this.deleteProps(item), this.ajaxHeaders, this.myApiList).then(response => {
						console.log("apiChangeVersion response: ", response);
						this.$toast('info', {message: 'Version preference changed successfully', title: 'Version preference changed', position: 'topLeft'});
					});
				}
			},
			apiChangeVisibility(item, val) {
				var slcVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.name == val );
				var curVisibility = this.$root.rootData.myApiVisibilityList.find((el) => el.uuid == item.apivisibilityid );
				if (slcVisibility.uuid != curVisibility.uuid) {
					item.apivisibilityid = slcVisibility.uuid;
					this.updateItem(this.ajaxApiUrl + '/' + item.uuid, this.deleteProps(item), this.ajaxHeaders, this.myApiList).then(response => {
						console.log("apiChangeVisibility response: ", response);
						// this.$root.getRootData(this.$cookie.get('abyss.principal.uuid'));
						this.$toast('info', {message: 'Visibility changed ' + ' to <strong>' + slcVisibility.name + '</strong>', title: 'Visibility: ' + slcVisibility.name, position: 'topLeft'});
					});
				}
			},
			apiChangeState(item, val) {
				var slcState = this.$root.rootData.myApiStateList.find((el) => el.name == val );
				var curState = this.$root.rootData.myApiStateList.find((el) => el.uuid == item.apistateid );
				if (slcState.uuid != curState.uuid) {
					item.apistateid = slcState.uuid;
					this.updateItem(this.ajaxApiUrl + '/' + item.uuid, this.deleteProps(item), this.ajaxHeaders, this.myApiList).then(response => {
						console.log("apiChangeState response: ", response);
						// this.$root.getRootData(this.$cookie.get('abyss.principal.uuid'));
						this.$toast('info', {message: 'State changed ' + ' to <strong>' + slcState.name + '</strong>', title: 'State: ' + slcState.name, position: 'topLeft'});
					});
				}
			},
			chooseSpec() {
				// this.$emit('set-state', 'create');
				this.$root.setState('create');
				// this.clearSchema();
				this.loadFromUrlSchema('/data/pet3.json');
				this.selectedApi = _.cloneDeep(this.api);
				// this.initSwagger();
				// setTimeout(() => {
					console.log("chooseSpec setTimeout: ", this.selectedApi);
					// this.updateSw();
					console.log("chooseSpec setTimeout: ", this.selectedApi);
					$('#upload').collapse('show');
					$('#servers').collapse('show');
					$('#info').collapse('show');
					// console.log("this.api: ", this.api);
					// console.log("this.selectedApi: ", this.selectedApi);
					/*require(['css!colorpicker-css', 'colorpicker'],function(){
						$('.input-color').initz_inputcolor();
						// $('.input-color').colorpicker({});
					});*/
					this.apiColor();
				// },1000);
			},
			chooseLink() {
				// if (this.beforeCancelApi()) {
					this.$root.setState('create');
					this.selectedApi = _.cloneDeep(this.api);
					// this.initSwagger();
					// setTimeout(() => {
						// this.updateSw();
						$('.list-column').addClass('column-minimize');
						$('.create-column').addClass('column-minimize');
						$('.edit-column').removeClass('column-minimize');
						this.apiColor();
					// },1000);
				// }
			},
			selectApi(item, state) {
				console.log("item.extendeddocument: ", item.extendeddocument);
				if (this.beforeCancelApi()) {
					this.fixProps(item);
					this.updateSchema(item.openapidocument);
					this.api = _.cloneDeep(item);
					// this.openapi = item;
					this.$root.setState(state);
					this.selectedApi = _.cloneDeep(this.api);
					// this.initSwagger();
					this.loadLicense(item);
					// setTimeout(() => {
						this.updateSw();
						// $('#api'+this.api.uuid).collapse('show');
						if ( state != 'preview') {
							this.$refs.dropImage.removeAllFiles(true);
							if (this.api.image != '') {
								this.$refs.dropImage.manuallyAddFile({ size: 123, name: this.api.image }, this.api.image);
							}
							$('.list-column').addClass('column-minimize');
							$('.create-column').addClass('column-minimize');
							$('.edit-column').removeClass('column-minimize');
							this.apiColor();
						} else {
							// $('.create-column, .edit-column').addClass('column-minimize');
						}
					// },1000);
				}
			},
			apiColor() {
				var vm = this;
				require(['css!colorpicker-css', 'colorpicker'],function(){
					$('.api-color').each(function(i, el) {
						var $thiz = $(this);
						var zbg = $thiz.data('targetbg')||'body';
						// var ztxt = $thiz.data('targettxt')||'h1,h2,h3';
						var zformat = $thiz.data('format')||'rgba';
						// var bodyStyle = $(zbg)[0].style;
						$thiz.colorpicker({
							// format: zformat, 
							// component: '.add-on', 
							sliders: {
								saturation: {
									maxLeft: 200,
									maxTop: 200
								},
								hue: {
									maxTop: 200
								},
								alpha: {
									maxTop: 200
								}
							},
							// color: bodyStyle.backgroundColor
						}).on('changeColor', function(ev) {
							$(zbg).attr('style', 'background-color: ' + ev.color + ' !important');
							// $(ztxt).attr('style', 'color: ' + ev.color + ' !important');
						}).on('hidePicker', function(ev) {
							console.log("ev: ", ev.color.toString(), ev.color.toHex());
							vm.api.color = ev.color.toHex();
						});
						
					});
				});
			},
			getApiById(item, state) {
				axios.get(this.ajaxApiUrl + '/' + item.uuid).then(response => {
					this.api = Object.assign(item, response.data);
					this.$root.setState(state);
					this.selectedApi = _.cloneDeep(this.api);
					// $('#api'+this.api.uuid).collapse('show');
					if ( state != 'preview') {
						// $('.list-column').addClass('column-minimize');
						this.$refs.dropImage.removeAllFiles(true);
						if (this.api.image != '') {
							this.$refs.dropImage.manuallyAddFile({ size: 123, name: this.api.image }, this.api.image);
						}
					}
				}, error => {
					this.handleError(error);
				});
			},
			isSelectedApi(i) {
				return i === this.api.uuid;
			},
			beforeCancelApi() {
				if (this.isChanged && this.rootState != 'init') {
					// var changes = [];
					// for (var prop in this.changes) {
					// 	changes.push(prop);
					// }
					// var r = confirm('Are you sure to cancel editing this API?' + '\nCHANGES: ' + changes.join(', '));
					var r = confirm('Are you sure to cancel editing this API?' + '\nCHANGES: ' + JSON.stringify(this.changes, null, 2));
					if (r == true) {
						this.cancelApi();
					}
					return r;
				}
				else {
					this.cancelApi();
					return true;
				}
			},
			cancelApi() {
				// var index = this.myApiList.indexOf(this.api);
				// console.log("this.myApiList[index]: ", this.myApiList[index]);
				// console.log("this.selectedApi: ", this.selectedApi);
				// this.myApiList[index] = this.selectedApi;
				// this.myApiList[index] = this.fixProps(this.selectedApi);
				// var item = this.myApiList.find((el) => el.uuid == newApi.uuid );
				this.myApiLicenses = [];
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
			undoApi() {
				// if (window.localStorage) {
				// 	Vue.set(this, 'openapi', JSON.parse(window.localStorage.getItem('openapi3')));
				// }
				var initial = _.cloneDeep(this.selectedApi);
				Vue.set(this, 'api',initial);
				Vue.set(this, 'openapi',initial.openapidocument);
			},
			extDoc(a) {
				if (this.debugProxy && a.isproxyapi) {
					item = _.cloneDeep(a);
					delete item.openapidocument['x-servers'];
					delete item.openapidocument['x-path'];
					delete item.openapidocument['x-abyss-servers'];
					item.openapidocument.servers.forEach((value, key) => {
						value['x-abyss-url'] = value.url;
					});
					for (var p in item.openapidocument.paths) {
						var path = item.openapidocument.paths[p];
						path['x-abyss-path'] = p;
					}
					console.log("item: ", item);
					Vue.set(this.api, 'extendeddocument', item.openapidocument);
				}
			},
			createProxy(a) {
				item = _.cloneDeep(a);
				item.businessapiid = item.uuid;
				item.isproxyapi = true;
				// item.openapidocument['x-abyss-servers'] = item.openapidocument.servers;
				item.openapidocument.servers.forEach((value, key) => {
					value['x-abyss-url'] = value.url;
				});
				for (var p in item.openapidocument.paths) {
					var path = item.openapidocument.paths[p];
					path['x-abyss-path'] = p;
				}
				Vue.set(item, 'extendeddocument', item.openapidocument);
				// item.businessapiid = '2741ce5d-0fcb-4de3-a517-405c0ceffbbe';
				// item.isproxyapi = false;
				// this.updateItem(this.ajaxApiUrl + '/' + item.uuid, this.deleteProps(item), this.ajaxHeaders, this.myApiList).then(response => {
				// 	console.log("createProxy response: ", response);
				// 	this.$toast('info', {message: 'Proxy API created from this business API', title: 'Proxy API created', position: 'topLeft'});
				// });
				var itemArr = [];
				itemArr.push(this.deleteProps(item));
				axios.post(this.ajaxApiUrl, itemArr, this.ajaxHeaders).then(response => {
					if (response.data[0].status != 500 ) {
						console.log("createProxy response: ", response);
						var newApi = response.data[0].response;
						this.fixProps(newApi);
						this.myProxyList.push(newApi);
						setTimeout(() => {
							this.$toast('info', {message: 'Proxy API created from this business API', title: 'Proxy API created', position: 'topLeft'});
						},0);	
					}
				}, error => {
					this.handleError(error);
				});
			},
			saveMyApi() {
				this.extDoc(this.api);
				this.updateItem(this.ajaxApiUrl + '/' + this.api.uuid, this.deleteProps(this.api), this.ajaxHeaders, this.myApiList).then(response => {
					console.log("SAVE response.data: ", response.data[0]);
					var currApi = response.data[0];
					this.fixProps(currApi);
					Object.assign(this.selectedApi, currApi);
					console.log("this.selectedApi: ", this.selectedApi);
					this.getPage(1);
					var index = _.findIndex(this.myApiList, { 'uuid': this.selectedApi.uuid });
					this.myApiList[index] = this.selectedApi;
					this.$toast('success', {message: '<strong>' + this.api.openapidocument.info.title + '</strong> saved', title: 'API SAVED'});
					this.isChanged = false;
					this.taxonomies();
				}, error => {
					this.handleError(error);
				});
			},
			createApi() {
				this.$validator.validateAll().then((result) => {
					if (result) {
						this.fixProps(this.api);
						if (this.api.originaldocument == null) {
							Vue.set(this.api, 'originaldocument', this.swaggerText.text );
						}
						var itemArr = [];
						itemArr.push(this.deleteProps(this.api));
						axios.post(this.ajaxApiUrl, itemArr, this.ajaxHeaders).then(response => {
						// this.addItem(this.ajaxApiUrl, itemArr, this.ajaxHeaders, this.myApiList).then(response => {
						// axios.post(abyss.echo, itemArr, this.ajaxHeaders).then(response => {
							if (response.data[0].status != 500 ) {
								this.$root.setState('edit');
								console.log("createApi response: ", response);
								var newApi = response.data[0].response;
								this.fixProps(newApi);
								this.myApiList.push(newApi);
								var item = this.myApiList.find((el) => el.uuid == newApi.uuid );
								Vue.set(this, 'api', item);
								// this.updateSchema(item.openapidocument);
								this.selectedApi = _.cloneDeep(this.api);
								this.isChanged = false;
								// this.api = _.merge(this.openapi, response.data);
								setTimeout(() => {
									$('#api'+this.api.uuid).collapse('show');
									$('#servers').collapse('show');
									$('#info').collapse('show');
									$('.list-column').addClass('column-minimize');
									this.$toast('success', {message: '<strong>' + this.api.openapidocument.info.title + '</strong> successfully registered', title: 'API CREATED'});
									// $('.list-column').addClass('column-minimize');
									this.taxonomies();
								},0);	
							}
						}, error => {
							this.handleError(error);
						});
						return;
					}
					// alert('Correct them errors!');
				});
			},
			filterApi(filter) {
				console.log("filter: ", filter);
				if (filter == null) {
					this.getPage(1);
				} else {
					// axios.get(this.ajaxUrl + '/' + filter.uuid, this.ajaxHeaders)
					axios.get(this.ajaxUrl, this.ajaxHeaders)
					.then(response => {
						console.log("response: ", response);
						if (response.data != null) {
							// this.myApiList = response.data;
							this.myApiList = [];
							this.myApiList.push(filter);
							// !!!!!!!!!!! openapidocument string geliyor
							if (typeof this.myApiList[0].openapidocument === 'string') {
								this.myApiList[0].openapidocument = JSON.parse(this.myApiList[0].openapidocument);
							}
							this.myApiList.forEach((value, key) => {
								this.fixProps(value);
							});
							// this.fixProps(this.api);
							this.paginate = this.makePaginate(response.data);
							console.log("this.myApiList: ", this.myApiList);
						}
					}, error => {
						this.handleError(error);
					});
				}
			},
			getPage(p, d) {
				var param = d || '';
				axios.get(this.ajaxUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					// console.log("response: ", response);
					if (response.data != null) {
						this.myApiList = response.data;
						this.myApiList.forEach((value, key) => {
							this.fixProps(value);
						});
						this.paginate = this.makePaginate(response.data);
					}
				}, error => {
					this.handleError(error);
				});
				axios.get(this.ajaxMyProxiesUrl + '?page=' + p + param, this.ajaxHeaders)
				.then(response => {
					// console.log("response: ", response);
					if (response.data != null) {
						this.myProxyList = response.data;
						this.myProxyList.forEach((value, key) => {
							this.fixProps(value);
						});
						this.paginate = this.makePaginate(response.data);
					}
				}, error => {
					this.handleError(error);
				});
			},
			getApiOptions(search, loading) {
				loading(true);
				// !!! not working
				// axios.get(this.ajaxApiUrl + '?likename=' + search, this.ajaxHeaders)
				axios.get(this.ajaxUrl, this.ajaxHeaders)
				.then((response) => {
					if (response.data != null) {
						this.apiOptions = response.data;
					} else {
						this.apiOptions = [];
					}
					loading(false);
				}, error => {
					loading(false);
					this.handleError(error);
				});
			},
			getCategoryOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.api_category_list + '?likename=' + search, this.ajaxHeaders)
				.then((response) => {
					if (response.data != null) {
						this.categoryOptions = response.data;
					} else {
						this.categoryOptions = [];
					}
					loading(false);
				}, error => {
					loading(false);
					this.handleError(error);
				});
			},
			getTagOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.api_tag_list + '?likename=' + search, this.ajaxHeaders)
				.then((response) => {
					if (response.data != null) {
						this.tagOptions = _.unionBy(this.$root.rootData.myApiTagList + '?likename=' + search, response.data, 'uuid');
					} else {
						this.tagOptions = [];
					}
					loading(false);
				}, error => {
					loading(false);
					this.handleError(error);
				});
			},
			getGroupOptions(search, loading) {
				loading(true);
				axios.get(abyss.ajax.api_group_list + '?likename=' + search, this.ajaxHeaders)
				.then((response) => {
					if (response.data != null) {
						this.groupOptions = response.data;
					} else {
						this.groupOptions = [];
					}
					loading(false);
				}, error => {
					loading(false);
					this.handleError(error);
				});
			},
			// 2DO
			getTax() {
				axios.all([
					axios.get(abyss.ajax.api_tag),
					axios.get(abyss.ajax.api_category),
					axios.get(abyss.ajax.api_group),
					// axios.get('/data/create-api.json')
				]).then(
					axios.spread((api_tag, api_category, api_group) => {
						var ttt = api_tag.data.filter((item) => item.crudsubjectid == this.$root.rootData.user.uuid );
						var ccc = api_category.data.filter((item) => item.crudsubjectid == this.$root.rootData.user.uuid );
						var ggg = api_group.data.filter((item) => item.crudsubjectid == this.$root.rootData.user.uuid );
						Vue.set(this, 'apiapiTag', ttt );
						Vue.set(this, 'apiapiGroup', ggg );
						Vue.set(this, 'apiapiCategory', ccc );
						// console.log("this.apiapiTag: ", this.apiapiTag);
						// console.log("this.apiapiGroup: ", this.apiapiGroup);
						// console.log("this.apiapiCategory: ", this.apiapiCategory);
						console.log("apiapiTag: ", _.uniq(_.map(this.apiapiTag, 'apiid')));
						console.log("apiapiGroup: ", _.uniq(_.map(this.apiapiTag, 'apitagid')));
						console.log("apiapiCategory: ", _.uniq(_.map(this.apiapiTag, 'uuid')));
					})
				).catch(error => {
					this.handleError(error);
				});
			},
			taxonomies() {
				if (Object.keys(this.changes).some(v => v == 'tags')) {
					var tags = [];
					var newTags = this.api.tags.filter((item) => item.uuid == null );
					if (newTags.length > 0) {
						newTags.forEach((value, key) => {
							// value.count = 1;
							value.crudsubjectid = this.$root.rootData.user.uuid;
							value.description = "";
							value.organizationid = this.$root.rootData.user.organizationid;
						});
						console.log("diffffff: ", _.differenceBy(this.$root.rootData.myApiTagList, this.api.tags, 'uuid'));
						axios.post(abyss.ajax.api_tag_list, newTags, this.ajaxHeaders).then(response => {
							console.log("add tags response: ", response);
							if (response.data[0].status != 500 ) {
								var newTag = response.data[0].response;
								// tags.push(newTag);
								this.api.tags.forEach((value, key) => {
									var newObj = {};
									if (!value.apitagid) {
										newObj.apiid = newTag.uuid;
									}
									newObj.apiid = this.api.uuid;
									newObj.apitagid = value.uuid;
									newObj.organizationid = this.$root.rootData.user.organizationid;
									newObj.crudsubjectid = this.$root.rootData.user.uuid;
									tags.push(this.deleteProps(newObj));
								});
								axios.post(abyss.ajax.api_tag, tags, this.ajaxHeaders).then(response => {
									console.log("tags response: ", response);
									if (response.data[0].status != 500 ) {
										this.$root.rootData.myApiTagList = _.unionBy(this.$root.rootData.myApiTagList, this.api.tags, 'uuid');
									}
								}, error => {
									this.handleError(error);
								});
							}
						}, error => {
							this.handleError(error);
						});
					} else {
						this.api.tags.forEach((value, key) => {
							var newObj = {};
							newObj.apiid = this.api.uuid;
							newObj.apitagid = value.uuid;
							newObj.organizationid = this.$root.rootData.user.organizationid;
							newObj.crudsubjectid = this.$root.rootData.user.uuid;
							tags.push(this.deleteProps(newObj));
						});
						axios.post(abyss.ajax.api_tag, tags, this.ajaxHeaders).then(response => {
							console.log("tags response: ", response);
							if (response.data[0].status != 500 ) {
								this.$root.rootData.myApiTagList = _.unionBy(this.$root.rootData.myApiTagList, this.api.tags, 'uuid');
							}
						}, error => {
							this.handleError(error);
						});
					}
				}
				if (Object.keys(this.changes).some(v => v == 'categories')) {
					var cats = [];
					this.api.categories.forEach((value, key) => {
						var newObj = {};
						newObj.apiid = this.api.uuid;
						newObj.apicategoryid = value.uuid;
						newObj.organizationid = this.$root.rootData.user.organizationid;
						newObj.crudsubjectid = this.$root.rootData.user.uuid;
						cats.push(this.deleteProps(newObj));
					});
					axios.post(abyss.ajax.api_category, cats, this.ajaxHeaders).then(response => {
						console.log("categories response: ", response);
						if (response.data[0].status != 500 ) {
							this.$root.rootData.myApiCategoryList = _.unionBy(this.$root.rootData.myApiCategoryList, this.api.categories, 'uuid');
						}
					}, error => {
						this.handleError(error);
					});
				}
				if (Object.keys(this.changes).some(v => v == 'groups')) {
					var grps = [];
					this.api.groups.forEach((value, key) => {
						var newObj = {};
						newObj.apiid = this.api.uuid;
						newObj.apigroupid = value.uuid;
						newObj.organizationid = this.$root.rootData.user.organizationid;
						newObj.crudsubjectid = this.$root.rootData.user.uuid;
						grps.push(this.deleteProps(newObj));
					});
					axios.post(abyss.ajax.api_group, grps, this.ajaxHeaders).then(response => {
						console.log("groups response: ", response);
						if (response.data[0].status != 500 ) {
							this.$root.rootData.myApiGroupList = _.unionBy(this.$root.rootData.myApiGroupList, this.api.groups, 'uuid');
						}
					}, error => {
						this.handleError(error);
					});
				}
			},
			grouped() {
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
			loadLicense(item) {
				axios.get(abyss.ajax.api_licenses_api + item.uuid, this.ajaxHeaders).then(response => {
					if (response.data != null) {
						console.log("GET License response: ", response);
						this.myApiLicenses = response.data.filter( (item) => item.isdeleted == false );
						var actLcs = _.filter(this.myApiLicenses, { 'apiid': item.uuid });
						actLcs.forEach((value, key) => {
							// _.filter(obj, { 'subjectid': this.user.uuid })
							console.log("*********: ", _.find(this.myLicenseList, { 'isdeleted': false }, (v) => _.includes(value.licenseid, v.uuid)));
							Vue.set(_.find(this.myLicenseList, (v) => _.includes(value.licenseid, v.uuid)), 'isactive', true);
						});
					}
				}, error => {
					this.handleError(error);
				});
			},
			setLicense(item) {
				var actLcs = _.find(this.myApiLicenses, { 'licenseid': item.uuid, 'apiid': this.api.uuid });
				var itemArr = [];
				var itemObj = {
					organizationid: this.$root.rootData.user.organizationid,
					crudsubjectid: this.$root.rootData.user.uuid,
					apiid: this.api.uuid,
					licenseid: item.uuid,
				};
				if (actLcs) {
					// Vue.set(actLcs, 'isdeleted', !item.isactive);
					Vue.set(actLcs, 'isactive', item.isactive);
					console.log("----------: ", actLcs);
					this.updateItem(abyss.ajax.api_licenses + actLcs.uuid, this.deleteProps(actLcs), this.ajaxHeaders, this.myApiLicenses).then(response => {
						console.log("UPDATE License response: ", response);
					});
				} else {
					if (item.isactive) {
						itemArr.push(itemObj);
						axios.post(abyss.ajax.api_licenses, itemArr, this.ajaxHeaders).then(response => {
							if (response.data[0].status != 500 ) {
								console.log("ADD License response: ", response);
							}
						}, error => {
							this.handleError(error);
						});
					} else {
						// Vue.set(actLcs, 'isdeleted', !item.isactive);
						Vue.set(actLcs, 'isactive', item.isactive);
						this.updateItem(abyss.ajax.api_licenses + actLcs.uuid, this.deleteProps(actLcs), this.ajaxHeaders, this.myApiLicenses).then(response => {
							console.log("ADD-UPDATE License response: ", response);
						});
					}
				}
				console.log("----------: ", actLcs);
				console.log("item.isactive: ", item.isactive);
			},
		},
		watch: {
			openapi: {
				handler(val, oldVal) {
					Vue.set(this.api,'openapidocument',val);
				},
				deep: true
			},
			api: {
				handler(val, oldVal) {
					this.changes = this.checkDiff(val, this.selectedApi);
					if ( Object.keys(this.changes).length == 0 || (Object.keys(this.changes).length == 1 && Object.keys(this.changes).some(v => v == 'specs')) ) {
						this.isChanged = false; 
					} else {
						this.isChanged = true; 
						if (this.$root.rootState == 'edit' || this.$root.rootState == 'create') {
							this.updateSw();
						}
					}
					this.verChanged = _.has(this.changes, 'openapidocument.info.version'); 
					console.log("this.isChanged: ", this.isChanged, Object.keys(this.changes).length, this.changes, "version: ", _.has(this.changes, 'openapidocument.info.version'), this.verChanged);
				},
				deep: true
			},
			/*openapi: {
				handler(val, oldVal) {
					// console.log('old val', oldVal);
					// console.log('new val', val);
					// this.grouped();
					// this.api = Object.assign(this.api, this.openapi);
					//!!! this.api = _.merge(this.api, this.openapi);
					Vue.set(this.api,'openapidocument',val);
					// this.changes = this.checkDiff(val, this.selectedApi);
					this.changes = this.checkDiff(this.api, this.selectedApi);
					console.log("this.isChanged: ", Object.keys(this.changes).length, this.isChanged, this.changes);
					// if ( Object.keys(this.changes).length == 0 || (Object.keys(this.changes).length == 1 && Object.keys(this.changes).some(v => v == 'updated')) ) {
					if ( Object.keys(this.changes).length == 0 ) {
						this.isChanged = false; 
					} else {
						this.isChanged = true; 
						if (this.$root.rootState == 'edit' || this.$root.rootState == 'create') {
							this.updateSw();
						}
					}
				},
				deep: true
			},*/
			swaggerText: {
				handler(val, oldVal) {
					// var local = localStorage.getItem('swagger-editor-content');
					var old = swEditor.getState().getIn(['spec', 'spec']);
					this.swChanges = this.checkDiff(val, old);
					// console.log("swaggerText.swChanges: ", this.swChanges);
					if ( Object.keys(this.swChanges).length == 0 ) {
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
			// 2DO
		},
		computed: {
			filteredApis() {
				var cat = this.$root.filterTax;
				if(cat === '') {
					return this.myApiList;
				} else {
					// return this.people.filter(function(person)	 {
					// 	return person.category === cat;
					// });
					return this.myApiList.filter(e => e.category === cat);
				}
			}
		},
		created() {
			this.initSchema();
			this.$root.setPage('my-apis', 'init');
			// !!!!!!!!!!!!!!!!!!
			// this.getTax();
			axios.all([
				axios.get(abyss.ajax.subject_licenses_list + this.$root.rootData.user.uuid ),
				axios.get(abyss.ajax.subject_policies_list + this.$root.rootData.user.uuid ),
			]).then(
				axios.spread((subject_licenses_list, subject_policies_list) => {
					this.myLicenseList = subject_licenses_list.data.filter( (item) => item.isdeleted == false );
					this.myPolicyList = subject_policies_list.data.filter( (item) => item.isdeleted == false );
					// this.myApiLicenses = api_licenses.data.filter( (item) => item.isdeleted == false );
					this.getPage(1);
					var newLcs = this.myLicenseList;
					newLcs.forEach((value, key) => {
						Vue.set(value, 'policies', _.filter(this.myPolicyList, (v) => _.includes(value.licensedocument.termsOfService.policyKey, v.uuid)) );
						Vue.set(value, 'isactive', false);
					});
					this.myLicenseList = newLcs;
				})
			).catch(error => {
				this.handleError(error);
			});
		}
	});

});
