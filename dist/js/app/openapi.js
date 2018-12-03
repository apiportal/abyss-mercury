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
			if (!openapi) {
				openapi = {};
			}
			if (!openapi.openapi) {
				openapi.openapi = '3.0.0';
			}
			for (var t in openapi.tags) {
				var tag = openapi.tags[t];
				if (!tag.externalDocs) {
					tag.externalDocs = {};
				}
			}
			if (!openapi.info) {
				openapi.info = {version:"1.0.0",title:"Untitled",description:""};
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
			if (!openapi.servers) openapi.servers = [{"url": "https://www.example.com"}];
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
			if (!openapi.components.parameters) {
				openapi.components.parameters = {};
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
							console.log("jjjjjjjjjj: ");
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
			// ■■ api-mediatype, api-parameter, api-items, my-apis
			mixEditSchema(obj, key, openapi) {
				console.log("obj, key: ", obj, key);
				if (obj.schema && obj.schema.$ref ) {
					$('.components-column').removeClass('column-minimize');
					$('#schemas').collapse('show');
					var trg1 = $('#schemas').find('[data-schema="' + obj.schema.$ref + '"] > .field-sum > a[data-toggle="collapse"]').data('target');
					console.log("trg1: ", trg1);
					// $('#schemas').find('[data-schema="#/components/schemas/Order"] > .field-sum > a[data-toggle="collapse"]').data('target');
					$(trg1).collapse('show');
				} else if (obj.schema && obj.schema.items && obj.schema.items.$ref ) {
					$('.components-column').removeClass('column-minimize');
					$('#schemas').collapse('show');
					var trg2 = $('#schemas').find('[data-schema="' + obj.schema.items.$ref + '"] > .field-sum > a[data-toggle="collapse"]').data('target');
					console.log("trg2: ", trg2);
					$(trg2).collapse('show');
				} else if (obj.$ref ) {
					$('.components-column').removeClass('column-minimize');
					$('#parameters').collapse('show');
					var trg3 = $('#parameters').find('[data-param="' + obj.$ref + '"]').data('target');
					console.log("trg3: ", trg3);
					$(trg3).collapse('show');
				} else {
					if (!obj[key]) {
						Vue.set(obj, key, {});
					}
					var initial = deref(obj[key], openapi);
					var editorOptions = {};
					var element = document.getElementById('schemaContainer');
					this.schemaEditor = new JSONEditor(element, editorOptions, initial);
					schemaEditorClose = function() { // sonarqube not working with var
						this.schemaEditor.destroy();
						$('#schemaModal').modal('hide');
					}.bind(this);
					schemaEditorSave = function() { // sonarqube not working with var
						obj[key] = this.schemaEditor.get();
						schemaEditorClose();
					}.bind(this);
					if (key == 'schema') {
						// if (obj.schema.$ref ) {
							// $('#schemaModalTitle').text('Schema Editor - '+obj.schema.$ref);
						// } else if (obj.schema.items && obj.schema.items.$ref ) {
							// $('#schemaModalTitle').text('Schema Editor - '+obj.schema.items.$ref);
						// } else {
							$('#schemaModalTitle').text('Schema Editor - '+obj.name);
						// }
					} else {
						$('#schemaModalTitle').text('Schema Editor - '+key);
					}
					$('#schemaModal').modal({backdrop: 'static', keyboard: false});
				}
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
			addParameter(params, type) {
				var newParam = {};
				newParam.name = 'newParam';
				newParam.in = 'query';
				newParam.required = false;
				newParam.schema = {};
				newParam.schema.type = 'string';
				console.log("type: ", type, params);
				if (type == Object) {
					if (!params.newItem) {
						Vue.set(params, 'newItem', newParam);
					}
				} else {
					var exists = _.findIndex(params, { 'name': 'newParam' });
					console.log("exists: ", exists);
					if (exists == -1) {
						params.push(newParam);
					}
				}
				$('#parameters').collapse('show');
			},
			duplicateParameter(params, item, type) {
				var param = _.cloneDeep(item);
				Vue.set( param, 'name', 'newParam' );
				if (type == Object) {
					if (!params.newItem) {
						Vue.set(params, 'newItem', param);
					}
				} else {
					var exists = _.findIndex(params, { 'name': 'newParam' });
					if (exists == -1) {
						params.push(param);
					}
				}
			},
			removeParameter(params, index, type, item) {
				this.saveApi(this.openapi);
				if (type == Object) {
					Vue.delete(params, item);
				} else {
					params.splice(index,1);
				}
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
						if (p != '$ref') {
							delete s[p];
						}
					}
				}
			},
			selectRefParameter(e, s) {
				if (e == 'None') {
					Vue.delete(s, '$ref');
					Vue.set(s, 'name', 'newParam');
					Vue.set(s, 'in', 'query');
					Vue.set(s, 'required', false);
					Vue.set(s, 'schema', {});
					Vue.set(s.schema, 'type', 'string');
				} else {
					for (var p in s) {
						if (p != '$ref') {
							delete s[p];
						}
					}
				}
			},
			checkRefs(obj) {
				if (obj.$ref) {
					var def = this.nestedResolve(obj.$ref.replace('#/', '').replace(/\//g, '.'), this.openapi);
					if (!def) {
						this.$toast('warning', {title: 'Could not find $ref '+obj.$ref, message: 'Could not find $ref '+obj.$ref, position: 'topRight', timeout: 5000});
					}
				}
			},
			renameObj(obj, oldName, newName, fix) {
				console.log("oldName, newName: ", oldName, newName);
				Vue.set(obj, newName, obj[oldName]);
				if (fix) {
					console.log("fix: ", fix);
					/*for (var p in this.openapi.paths) {
						for (var m in this.openapi.paths[p]) {
							if (fix == 'parameters') {
								var refs = this.openapi.paths[p][m][fix].filter((el) => el.$ref == '#/components/' + fix + '/' + oldName );
								for (var i of refs) {
									Vue.set( i, '$ref', '#/components/' + fix + '/' + newName );
								}
							}
							else if (fix == 'requestBody') {
								if (_.has(this.openapi.paths[p][m], 'requestBody')) {
									if (this.openapi.paths[p][m]['requestBody']['$ref'] == '#/components/requestBodies/' + oldName) {
										this.openapi.paths[p][m]['requestBody']['$ref'] = '#/components/requestBodies/' + newName;
									}
								}
							}
							else if (fix == 'responses') {
								for (var r in this.openapi.paths[p][m]['responses']) {
									if (this.openapi.paths[p][m]['responses'][r]['$ref'] == '#/components/responses/' + oldName) {
										this.openapi.paths[p][m]['responses'][r]['$ref'] = '#/components/responses/' + newName;
									}
								}
							}
							else if (fix == 'schemas') {
								for (var r in this.openapi.paths[p][m]['responses']) {
									if (_.has(this.openapi.paths[p][m]['responses'][r], 'content')) {
										if (this.openapi.paths[p][m]['responses'][r]['content']['application/json']['schema'][$ref] == '#/components/schemas/' + oldName) {
											this.openapi.paths[p][m]['responses'][r]['content']['application/json']['schema'][$ref] = '#/components/schemas/' + newName;
										}
									}
								}
							}
						}
					}*/
					setTimeout(() => {
						var o = '"#/components/' + fix + '/' + oldName + '"';
						var n = '"#/components/' + fix + '/' + newName + '"';
						var re = new RegExp(o, "g");
						var rep = this.$root.$refs.refMyApis.importschema.replace(re, n);
						Vue.set( this.$root.$refs.refMyApis, 'importschema', rep );
						this.$root.$refs.refMyApis.loadSchema();
						// this.$root.$refs.refMyApis.uploadSchema(rep);
					},1);
				}
				Vue.delete(obj, oldName);
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
					if (sarr) {
						return sarr['x-abyss-path'];
					}
					// return sarr['x-abyss-path'];
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
								for (var s in this.openapi.components.securitySchemes) {
									var scheme = this.openapi.components.securitySchemes[s];
									var scopes = [];
									if (scheme.type === 'oauth2') {
										for (var f in scheme.flows) {
											var flow = scheme.flows[f];
											if (flow.scopes) {
												for (var sc in flow.scopes) {
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
						this.renameObj(this.method.responses, this.status, newVal, 'responses');
					}
				}
			},
			methods: {
				removeResponse() {
					this.saveApi(this.$parent.openapi);
					Vue.delete(this.method.responses, this.status);
					if (Object.keys(this.method.responses).length==0) {
						Vue.set(this.method.responses,'default',{description:'Default response'});
					}
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
			props: ["openapi", "response", "status", "method", "bindex", "single"],
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
						this.renameObj(this.method, this.status, newVal, 'requestBodies');
					}
				}
			},
			methods: {
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
						this.renameObj(this.container.content, this.mediatype, newVal);
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
		props: ['parameter', 'index', 'openapi', 'params', 'type', 'item'],
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
					if (this.parameter.schema && this.parameter.schema.$ref) {
						var schemaName1 = this.parameter.schema.$ref.replace('#/components/schemas/','');
						return 'Edit shared schema ('+schemaName1+')';
					} else if (this.parameter.$ref) {
						var refName = this.parameter.$ref.replace('#/components/parameters/','');
						return 'Edit shared parameter ('+refName+')';
					} else if (this.parameter.schema && this.parameter.schema.items && this.parameter.schema.items.$ref){
						var schemaName2 = this.parameter.schema.items.$ref.replace('#/components/schemas/','');
						return 'Edit shared schema ('+schemaName2+')';
					} else {
						return 'Edit inline schema';
					}
				}
			},
			parameterName: {
				get() {
					if (this.parameter.$ref) {
						// var ptr = this.parameter.$ref.split('/');
						// var k = ptr[ptr.length - 1];
						// return this.openapi.components.parameters[k].name;
						return '$ref';
					} else {
						return this.parameter.name
					}
				}
			},
			parameterKey: {
				get() {
					return this.item;
				},
				set(newVal) {
					this.renameObj(this.openapi.components.parameters, this.item, newVal, 'parameters');
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
		},
		template: '#template-parameter',
		beforeMount() {
			this.checkRefs(this.parameter);
		},
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
						// Vue.set(this.child, 'x-abyss-privacy', {attributeClass: 'auxiliary', action: 'passThrough'});
					} else if (newVal == 'object') {
						Vue.delete(this.child, '$ref');
						Vue.delete(this.child, 'items');
						// TODO replicate parameter array switching logic
						Vue.set(this.child, 'properties', items);
						// Vue.set(this.child, 'x-abyss-privacy', {attributeClass: 'auxiliary', action: 'passThrough'});
					} else if (newVal == 'string' || newVal == 'integer' || newVal == 'number' || newVal == 'boolean') {
						Vue.delete(this.child, '$ref');
						Vue.delete(this.child, 'items');
						Vue.delete(this.child, 'properties');
						Vue.delete(this.child, 'uniqueItems');
						Vue.delete(this.child, 'minItems');
						Vue.delete(this.child, 'maxItems');
						// Vue.set(this.child, 'x-abyss-privacy', {attributeClass: 'auxiliary', action: 'passThrough'});
					} else {
							Vue.set(this.child, '$ref', newVal);
							for (var p in this.child) {
								console.log("p: ", p);
								if (p != '$ref') {
									delete this.child[p];
								}
							}
						Vue.delete(this.child, 'properties');
						Vue.delete(this.child, 'items');
						Vue.delete(this.child, 'uniqueItems');
						Vue.delete(this.child, 'minItems');
						Vue.delete(this.child, 'maxItems');
					}
					Vue.delete(this.child, 'format');
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
			isAnonymized : {
				get() {
					// console.log("this.child: ", this.child.hasOwnProperty('x-abyss-privacy'));
					if (this.child.hasOwnProperty('x-abyss-privacy')) {
						return true;
					} else {
						return false;
					}
				},
				set(newVal) {
					console.log("newVal: ", newVal);
					console.log("this: ", this);
					if (newVal) {
						console.log("this.child: ", this.child);
						Vue.set(this.child, 'x-abyss-privacy', {attributeClass: 'auxiliary', action: 'passThrough'});
					} else {
						console.log("this.child: ", this.child);
						Vue.delete(this.child, 'x-abyss-privacy');
					}
				}
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
					// Vue.set(this.child.properties.NewItem, 'x-abyss-privacy', {attributeClass: 'auxiliary', action: 'passThrough'});
					this.generalizationLevel = false;
					this.maskPattern = false;
					this.matchPattern = false;
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
				// Vue.set(this.child.properties, key, this.child.properties[this.currentSchema]);
				// Vue.delete(this.child.properties, this.currentSchema);
				this.renameObj(this.child.properties, this.currentSchema, key);
			},
			/*anonymize(child) {
				// console.log("child: ", child);
				// if (!child.hasOwnProperty('$ref') && child['x-abyss-privacy']['attributeClass'] == 'auxiliary') {
				if (child['x-abyss-privacy']['attributeClass'] == 'auxiliary') {
					return 'Anonymize';
				} else {
					return 'ANONYMIZED';
				}
				// return 'Anonymize';
			},*/
			privacyAttributeClass(e, prv) {
				// console.log("e: ", e);
				// console.log("prv: ", prv);
				if (e == 'auxiliary') {
					Vue.set(prv, 'action', 'passThrough');
					Vue.delete(prv, 'matchPattern');
					Vue.delete(prv, 'maskPattern');
					Vue.delete(prv, 'generalizationLevel');
					this.generalizationLevel = false;
					this.action = false;
					this.maskPattern = false;
					this.matchPattern = false;
				} else if (e == 'id' || e == 'sensitive') {
					this.action = true;
				} else if (e == 'qid') {
					Vue.set(prv, 'action', 'generalize');
					Vue.delete(prv, 'matchPattern');
					Vue.delete(prv, 'maskPattern');
					this.generalizationLevel = true;
					this.action = true;
				}
			},
			privacyAction(e, prv) {
				if (e == 'remove') {
					Vue.delete(prv, 'matchPattern');
					Vue.delete(prv, 'maskPattern');
					Vue.delete(prv, 'generalizationLevel');
					this.generalizationLevel = false;
					this.maskPattern = false;
					this.matchPattern = false;
				} else if (e == 'mask') {
					Vue.delete(prv, 'generalizationLevel');
					this.generalizationLevel = false;
					this.maskPattern = true;
					this.matchPattern = true;
				} else if (e == 'generalize') {
					this.generalizationLevel = true;
					this.maskPattern = true;
					this.matchPattern = true;
				} else if (e == 'passThrough') {
					Vue.delete(prv, 'matchPattern');
					Vue.delete(prv, 'maskPattern');
					Vue.delete(prv, 'generalizationLevel');
					this.generalizationLevel = false;
					this.maskPattern = false;
					this.matchPattern = false;
				}
			},
		},
		data() {
			return {
				currentSchema: '',
				generalizationLevel: false,
				maskPattern: false,
				matchPattern: false,
				action: false,
			};
		},
		created() {
			/*if (this.child.properties) {
				for (var p in this.child.properties) {
					// console.log("p, this.child.properties[p]: ", p, this.child.properties[p].hasOwnProperty('$ref'), this.child.properties[p]);
					if (!this.child.properties[p].hasOwnProperty('$ref') && !this.child.properties[p]['x-abyss-privacy']) {
					// if (!this.child.properties[p]['x-abyss-privacy']) {
						Vue.set(this.child.properties[p], 'x-abyss-privacy', {attributeClass: 'auxiliary', action: 'passThrough'});
					}
				}
			}*/
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
					this.renameObj(this.openapi.components.securitySchemes, this.sdname, newVal);
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
			applyAllPaths(v) {
				/*if (v) {
					for (var p in this.openapi.paths) {
						for (var m in this.openapi.paths[p]) {
							delete this.openapi.paths[p][m].security;
						}
					}
				}*/
			},
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
						this.renameObj(this.flow.scopes, this.sname, newVal);
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
// ■■■■■■■■ api-servers ■■■■■■■■ //
	Vue.component('api-servers', {
		mixins: [mixOas],
		props: ["server", "sindex", "servers"],
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
					this.renameObj(this.server.variables, this.name, newVal);
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
// ■■■■■■■■ api-limits ■■■■■■■■ //
	Vue.component('api-limits', {
		template: '#template-limits',
		mixins: [mixOas],
		props: ['api', 'limits'],
		computed: {
			
		},
		methods: {
			
		},
		data() {
			return {};
		},
		created() {
		},
		
	});
// ■■■■■■■■ my-api-list ■■■■■■■■ //
	Vue.component('my-api-list', {
		mixins: [mixOas],
		template: '#template-list',
		props: ['api', 'openapi', 'lindex', 'apilist'],
		computed: {
			/*apiEnvironment : {
				get() {
					if (this.api.islive) {
						return 'Live';
					}
					if (this.api.issandbox) {
						return 'Sandbox';
					}
				}
			},*/
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
					var slcVisibility = this.$root.rootData.apiVisibilityList.find((el) => el.uuid == this.api.apivisibilityid );
					if (slcVisibility) {
						return slcVisibility.name;
					}
				},
			},
			activeState: {
				get() {
					var slcState = this.$root.rootData.apiStateList.find((el) => el.uuid == this.api.apistateid );
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
					var bapi = this.$parent.myApiList.find((el) => el.uuid == this.api.businessapiid );
					if (bapi) {
						return bapi.openapidocument.info.title;
					}
				}
			},
			compCategoriesToList : {
				get() {
					if (this.api.categories != null) {
						return this.api.categories.map(e => e.name).join(', ');
					}
				},
			},
			compTagsToList : {
				get() {
					if (this.api.tags != null) {
						return this.api.tags.map(e => e.name).join(', ');
					}
				},
			},
			compGroupsToList : {
				get() {
					if (this.api.groups != null) {
						return this.api.groups.map(e => e.name).join(', ');
					}
				},
			},
		},
		methods: {
			
		},
		data() {
			return {};
		},
	});
// ■■■■■■■■ api-preview ■■■■■■■■ //
	Vue.component('api-preview', {
		props: ['api'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed: {
			filteredApps : {
				get() {
					return _.reject(this.$root.appList, { contracts: [ { apiid: this.api.uuid, isdeleted: false } ]});
				}
			},
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
		methods : {
		},
		created() {
		}
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
				filterTxt: '',
				editorType: 'json',
				trigChange: true,
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
				pageState: 'init',
				paginate: {},
				ajaxMyBusinessUrl: abyss.ajax.my_business_api_list + this.$root.rootData.user.uuid,
				ajaxMyProxiesUrl: abyss.ajax.my_proxy_api_list + this.$root.rootData.user.uuid,
				
				swChanges: {},
				changes: {},
				isChanged: false,
				verChanged: false,

				apiOptions: [],
				businessApiOptions: [],
				proxyApiOptions: [],
				categoryOptions: [],
				tagOptions: [],
				groupOptions: [],
				stateOptions: [],

				dropSpecsOptions: {
					url: abyss.echoPost,
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
					url: abyss.echoPost,
					method: 'post',
					uploadMultiple: false,
					maxFiles: 1,
					// resizeWidth: 290px;
					// resizeQuality: 0.8;
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
				appList: [],
				myProxyList: [],
				swaggerText: {
					focus: true,
					text: ''
				},
				swOld: {
					focus: true,
					text: ''
				},
				newApi: {},
				selectedApi: {},
				openapi: null,
				// selectedOpenapi: null,
				blankOpenapi: {},
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
					"apistateid": abyss.defaultIds.apiStateDraft,
					"apivisibilityid": abyss.defaultIds.apiVisibilityPrivate,
					"languagename": "OpenAPI",
					"languageversion": "3.0.0",
					"languageformat": 1,
					"originaldocument": null,
					"openapidocument": {},
					"extendeddocument": null,
					"businessapiid": null,
					"image": "",
					"color": "#006699",
					"deployed": moment.utc().toISOString(),
					"changelog": "",
					"apioriginuuid": null,
					"version": "1.0.0",
					"issandbox": false,
					"islive": false,
					"isdefaultversion": true,
					"islatestversion": true,
					////////////
					"licenses": [],
					"tags": [],
					"groups": [],
					"categories": [],
					"proxies": [],
					"specs": null,
					"limits": {
						quota: null,
						quoteUnit: 'Hits/Day',
						rateLimit: null,
						throttling: null,
						circuitThreshold: null,
						circuitSampleSize: null,
						circuitReturn: null,
					},
				},
				tagsAdd: [],
				groupsAdd: [],
				categoriesAdd: [],
				tagsDelete: [],
				groupsDelete: [],
				categoriesDelete: [],
				licensesDelete: [],
				licensesAdd: [],
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
						} else if (name == 'abyssCookieAuth') {
							newSecDef.name = 'abyss.session';
							newSecDef.type = 'apiKey';
							newSecDef.in = 'cookie';
						} else if (name == 'abyssHttpBasicAuth') {
							newSecDef.type = 'http';
							newSecDef.scheme = 'basic';
							newSecDef.description = 'Authorization method for extra security of sensitive methods';
						} else if (name == 'abyssApiKeyAuth') {
							newSecDef.name = 'abyss.api.key';
							newSecDef.type = 'apiKey';
							newSecDef.in = 'header';
						} else if (name == 'abyssAppAccessTokenAuth') {
							newSecDef.name = 'abyss.app.access.token';
							newSecDef.type = 'apiKey';
							newSecDef.in = 'header';
						} else if (name == 'abyssAppAccessTokenCookieAuth') {
							newSecDef.name = 'abyss.app.access.token';
							newSecDef.type = 'apiKey';
							newSecDef.in = 'cookie';
						} else if (name == 'abyssJWTBearerAuth') {
							newSecDef.type = 'http';
							newSecDef.scheme = 'bearer';
							newSecDef.bearerFormat = 'JWT';
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
					// Vue.set(this.openapi.components.schemas, key, this.openapi.components.schemas[this.currentSchema]);
					// Vue.delete(this.openapi.components.schemas, this.currentSchema);
					this.renameObj(this.openapi.components.schemas, this.currentSchema, key, 'schemas');
				},
				markdownPreview(selector) {
					$('#mdPreview').modal();
					var str = $(selector).val();
					var md = window.markdownit();
					var result = md.render(str);
					$('#mdPreviewText').html(result);
				},
				/*showAlert(text, callback) {
					$('#alertText').text(text);
					$('#alert').modal();
					$('#alert').on('shown.bs.modal', function() {
						// console.log("shown.bs.modal: ");
					}).on('hidden.bs.modal', function() {
						// console.log("hidden.bs.modal: ");
						if (callback) callback(false);
						console.log("callback: ", callback);
					});
				},*/
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
					// var ooo = _.cloneDeep(this.openapi);
					// Vue.set(this,'newApi',preProcessDefinition(_.cloneDeep(this.api)));
					// Vue.set(this,'openapi',preProcessDefinition(ooo));
					Vue.set(this,'openapi',preProcessDefinition(_.cloneDeep(this.openapi)));
					Vue.set(this,'blankOpenapi',_.cloneDeep(this.openapi));
					Vue.set(this,'newApi',_.cloneDeep(this.api));
					this.isChanged = false;
				},
				updateSchema(schema) {
					schema = preProcessDefinition(schema);
					if (window.localStorage) window.localStorage.setItem('openapi3', JSON.stringify(schema));
					Vue.set(this, 'openapi', schema);
				},
				loadSchema() {
					var schema;
					try {
						// console.log("this.importschema: ", this.importschema);
						schema = JSON.parse(this.importschema);
						console.log("'JSON definition parsed successfully': ");
					}
					catch (ex) {
						try {
							schema = jsyaml.safeLoad(this.importschema, {json:true});
							console.log("YAML definition parsed successfully");
						}
						catch (ex) {
							this.$toast('warning', {title: 'The definition could not be parsed', message: 'The definition could not be parsed', position: 'topRight'});
						}
					}
					if (schema.openapi && schema.openapi.startsWith('3.0.')) {
						this.updateSchema(schema);
					} else if (schema.swagger && schema.swagger === '2.0') {
						var component = this;
						this.convertOpenApi2(schema,function(schema){
							if (schema.openapi && schema.openapi.startsWith('3.0.')) {
								if (window.localStorage) window.localStorage.setItem('openapi3', JSON.stringify(schema));
								component.$toast('warning', {title: 'Definition successfully converted', message: 'Definition successfully converted', position: 'topRight'});
								component.updateSchema(schema);
							}
						});
					} else {
						this.$toast('warning', {title: 'OpenAPI version must be 2.0 or 3.0.x', message: 'OpenAPI version must be 2.0 or 3.0.x', position: 'topRight'});
					}
				},
				clearSchema(val) {
					Vue.set(this, 'openapi', _.cloneDeep(this.blankOpenapi));
					this.importschema = JSON.stringify(this.openapi, null, 2);
				},
				updateSw() {
					// console.log("updateSw: ");
					this.importschema = JSON.stringify(this.openapi, null, 2);
					setTimeout(() => {
						swEditor.specActions.updateSpec(jsyaml.dump(this.postProcessDefinition()), 'fields');
					},100);
				},
				initSwagger(val) {
					var vm = this;
					// console.log("initSwaggerrrrrrrrrrrrrrrrr: ");
					require(['swagger-editor'],function(SwaggerEditorBundle){
						// localStorage.removeItem('swagger-editor-content');
						const SpecUpdateListenerPlugin = function() {
							return {
								statePlugins: {
									spec: {
										wrapActions: {
											updateSpec: (oriAction) => (...args) => {
												// var [str, src, arg1, arg2, arg3] = args;
												var [str, src] = args;
												// console.log("str: ", str);
												if (!src) {
													src = 'fields';
													Vue.set( vm.swaggerText, 'focus', true );
												}
												// console.log("args: ", src, args);
												if (src == 'fields') {
													Vue.set( vm.swaggerText, 'focus', true );
													Vue.set( vm.swOld, 'text', str );
												} else {
													Vue.set( vm.swOld, 'text', swEditor.getState().getIn(['spec', 'spec']) );
												}
												// vm.listenSw(str);
												Vue.set(vm.swaggerText, 'text', str);
												return oriAction(...args);
											}
										}
									}
								}
							};
						};
						window.swEditor = SwaggerEditorBundle({
							dom_id: '#swagger-editor',
							spec: this.openapi,
							// spec: jsyaml.dump(this.postProcessDefinition()),
							// layout: 'StandaloneLayout',
							// layout: 'EditorLayout',
							presets: [
							   // SwaggerEditorStandalonePreset
							],
							plugins: [
								// SwaggerEditorBundle.plugins.JumpToPathPlugin,
								// SwaggerEditorBundle.plugins.DownloadUrl,
								SpecUpdateListenerPlugin,
								// BaseLayoutPlugin
							]
						});
						var $div = $("#ace-editor");
						var observer = new MutationObserver(function(mutations) {
							mutations.forEach(function(mutation) {
								if (mutation.attributeName === "class") {
									var attributeValue = $(mutation.target).prop(mutation.attributeName);
									// console.log("Class attribute changed to:", attributeValue);
									console.log("attributeValue.includes('ace_focus'): ", attributeValue.includes('ace_focus'));
									if (attributeValue.includes('ace_focus')) {
										Vue.set( vm.swaggerText, 'focus', true );
									} else if (!attributeValue.includes("ace_focus")) {
										Vue.set( vm.swaggerText, 'focus', false );
									}
								}
							});
						});
						observer.observe($div[0], {
							attributes: true
						});
					});
				},
				uploadSchema(val) {
					try {
						if (typeof val === 'string') {
							this.importschema = val;
						} else {
							this.importschema = JSON.stringify(val, null, 2);
						}
						setTimeout(() => {
							console.log("uploadSchema: ");
							this.loadSchema();
						},100);	
					}
					catch (ex) {
						this.$toast('warning', {title: ex, message: ex, position: 'topRight'});
					}
				},
				async loadFromUrlSchema(val, load) {
					async function doAjax(args) {
						let data;
						try {
							data = await $.ajax({
								url: val,
							});
							return data;
						}
						catch (error) {
							console.error(error);
						}
					}
					if (val != '') {
						const data = await doAjax();
						var r;
						if (load) {
							r = await this.beforeCancelApi();
						} else {
							r = true;
						}
						if (r) {
							// console.log("loadFromUrlSchema data: ", data);
							if (typeof data === 'string') {
								this.importschema = data;
							} else {
								this.importschema = JSON.stringify(data, null, 2);
							}
							// setTimeout(() => {
							if (this.$root.rootState == 'init') {
								this.$root.setState('create');
							}
							await this.loadSchema(true);
							if (load) {
								this.loadApi();
							}
							this.isChanged = false;
							// },100);
						}
					}
				},
				postProcessDefinition() {
					return postProcessDefinition(this.openapi);
				},
				renderOutputAll(type) {
					$('#all-output').html('<pre class="prettyprint"><code id="pretty-'+type+'"></code></pre>');
					var def = this.postProcessDefinition();
					var output = JSON.stringify(def, null, 4);
					if (type == 'yaml') {
						try {
							this.editorType = 'yaml';
							output = jsyaml.dump(def);
						} catch (ex) {
							this.$toast('warning', {title: ex.message, message: ex.message, position: 'topRight'});
						}
					}
					$('#pretty-'+type).html(output);
					this.outputRendered = true;
					this.uploadRendered = false;
					this.swaggerRendered = false;
					var clippy = new ClipboardJS('#copy-all', {
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

			apiEndpoint(item) {
				if (item.isproxyapi) {
					return abyss.ajax.proxy_list;
				} else {
					return abyss.ajax.business_list;
				}
			},
			apiType(item) {
				if (item.isproxyapi) {
					return this.myProxyList;
				} else {
					return this.myApiList;
				}
			},
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
				if (!item.isproxyapi) {
					if (item.proxies == null) {
						Vue.set(item, 'proxies', []);
						// console.log("item.proxies: ", item.proxies.length, item.uuid);
						var papi = this.myProxyList.filter((el) => el.businessapiid == item.uuid );
						if (papi) {
							// item.proxies.push(papi);
							item.proxies = papi;
						}
					}
					if (item.specs == null) {
						Vue.set(item, 'specs', null);
					}
				}
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
					Vue.set(item, 'deployed', moment.utc().toISOString() );
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
				// if (item.businessapiid == null) {
				// 	Vue.set(item, 'businessapiid', '2741ce5d-0fcb-4de3-a517-405c0ceffbbe' );
				// }
				// if (item.apioriginuuid == null) {
				// 	Vue.set(item, 'apioriginuuid', '2741ce5d-0fcb-4de3-a517-405c0ceffbbe' );
				// }
				if (item.subjectid == null) {
					Vue.set(item,'subjectid',this.$root.rootData.user.uuid);
				}
				if (item.crudsubjectid == null) {
					Vue.set(item,'crudsubjectid',this.$root.rootData.user.uuid);
				}
				if (item.organizationid == null) {
					Vue.set(item,'organizationid',this.$root.abyssOrgId);
				}
				if (!item.limits) {
					Vue.set( item, 'limits', {
						quota: null,
						quoteUnit: 'Hits/Day',
						rateLimit: null,
						throttling: null,
						circuitThreshold: null,
						circuitSampleSize: null,
						circuitReturn: null,
					} );
				}
				if (item.isproxyapi) {
					Vue.set(item.openapidocument, 'servers', [{url: this.$root.abyssGatewayUrl + '/' + item.uuid}]);
					Vue.set(item.openapidocument, 'security', [{abyssApiKeyAuth: []}]);
					Vue.set(item.openapidocument.components, 'securitySchemes', { abyssApiKeyAuth: {
						in: "header",
						name: "abyss-gateway-api-access-token",
						type: "apiKey"
					}} );
					item.extendeddocument.servers.forEach((value, key) => {
						value.url = this.$root.abyssGatewayUrl + '/' + item.uuid;
					});
					// Vue.set(item.extendeddocument, 'servers', [{url: this.$root.abyssGatewayUrl + '/' + item.uuid}]);
					// Vue.set(item.extendeddocument, 'security', [{abyssApiKeyAuth: []}]);
					// Vue.set(item.extendeddocument.components, 'securitySchemes', { abyssApiKeyAuth: {
					// 	in: "header",
					// 	name: "abyss-gateway-api-access-token",
					// 	type: "apiKey"
					// }} );
					for (var p in item.openapidocument.paths) {
						delete item.openapidocument.paths[p]['x-abyss-path'];
						for (var m in item.openapidocument.paths[p]) {
							delete item.openapidocument.paths[p][m].security;
							// console.log("m, item.openapidocument.paths[p][m]: ", m, item.openapidocument.paths[p][m]);
						}
					}
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'tags');
				Vue.delete(item, 'groups');
				Vue.delete(item, 'categories');
				Vue.delete(item, 'proxies');
				Vue.delete(item, 'specs');
				Vue.delete(item, 'licenses');
				Vue.delete(item, 'resource');
				Vue.delete(item, 'apioriginuuid');
				return item;
			},
			async chooseSpec() {
				await this.loadFromUrlSchema('/data/pet3.json', true);
				/*this.$root.setState('create');
				this.selectedApi = _.cloneDeep(this.api);
				$('#upload').collapse('show');
				$('#servers').collapse('show');
				$('#info').collapse('show');
				this.apiColor();
				this.isChanged = false;*/
			},
			loadApi() {
				this.$root.setState('create');
				this.selectedApi = _.cloneDeep(this.api);
				$('.list-column').addClass('column-minimize');
				$('.create-column').addClass('column-minimize');
				$('.edit-column').removeClass('column-minimize');
				this.apiColor();
				this.isChanged = false;
			},
			async selectApi(item, state) {
				var cancel = await this.beforeCancelApi();
				console.log("cancel: ", cancel);
				if (cancel) {
				// if (this.beforeCancelApi()) {
					this.fixProps(item);
					this.updateSchema(item.openapidocument);
					this.api = _.cloneDeep(item);
					console.log("clone this.api: ", this.api);
					this.selectedApi = _.cloneDeep(this.api);
					this.$root.setState(state);
					if (item.isproxyapi) {
						await this.loadLicense(item);
					}
					// for updateSw timeout
					setTimeout(() => {
						this.isChanged = false;
						this.verChanged = false;
						this.$refs.dropImage.removeAllFiles(true);
						if (this.api.image) {
							this.$refs.dropImage.manuallyAddFile({ size: 123, name: this.api.image }, this.api.image);
						}
						$('.list-column').addClass('column-minimize');
						$('.create-column').addClass('column-minimize');
						$('.edit-column').removeClass('column-minimize');
						this.apiColor();
					},150);
				}
			},
			apiColor() {
				var vm = this;
				require(['css!colorpicker-css', 'colorpicker'],function(){
					$('.api-color').each(function(i, el) {
						var $thiz = $(this);
						$thiz.val(vm.api.color);
						var zbg = $thiz.data('targetbg')||'body';
						// var ztxt = $thiz.data('targettxt')||'h1,h2,h3';
						// var zformat = $thiz.data('format')||'rgba';
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
			isSelectedApi(i) {
				return i === this.api.uuid;
			},
			async beforeCancelConfirm() {
				return this.$swal({
					title: 'Are you sure to cancel editing this API?',
					html: '<pre class="txt-l">' + JSON.stringify(this.changes, null, 2) + '</pre>',
					type: 'warning',
					showCancelButton: true,
					confirmButtonText: 'Yes Cancel it!',
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
			async beforeCancelApi(c) {
				console.log("beforeCancelApi this.isChanged: ", this.isChanged, Object.keys(this.changes).length, this.changes, "version: ", _.has(this.changes, 'openapidocument.info.version'), this.verChanged);
				if (this.isChanged && this.rootState != 'init') {
					var beforeCancelConfirm = await this.beforeCancelConfirm();
					if (beforeCancelConfirm) {
						this.cancelApi();
						return beforeCancelConfirm;
					} else {
						// this.$swal('Cancelled', 'Your file is still intact', 'info');
						return false;
					}
				} else {
					this.cancelApi();
					return true;
				}
			},
			cancelApi() {
				console.log("cancelApi----------------");
				this.clearTax();
				this.api = _.cloneDeep(this.newApi);
				this.clearSchema();
				this.selectedApi = _.cloneDeep(this.newApi);
				this.$root.setState('init');
				this.isEditingMethods = false;
				$('.column-maximize').removeClass('column-maximize');
				$('.list-column').removeClass('column-minimize');
				this.$refs.dropSpecs.removeAllFiles(true);
				this.$refs.dropImage.removeAllFiles(true);
				this.swaggerText.text = '';
				this.swOld.text = '';
				this.swChanges = {};
				// this.changes = {};
				Vue.set( this, 'changes', {} );
				// $('.list-column').removeClass('column-minimize');
			},
			clearTax() {
				this.tagsAdd = [];
				this.groupsAdd = [];
				this.categoriesAdd = [];
				this.tagsDelete = [];
				this.groupsDelete = [];
				this.categoriesDelete = [];
				this.licensesDelete = [];
				this.licensesAdd= [];
				this.myApiLicenses = [];
			},
			undoApi() {
				var initial = _.cloneDeep(this.selectedApi);
				Vue.set(this, 'api',initial);
				Vue.set(this, 'openapi',initial.openapidocument);
				if (this.selectedApi.image) {
					this.$refs.dropImage.manuallyAddFile({ size: 123, name: this.selectedApi.image }, this.selectedApi.image);
				}
			},
			async apiChangeEnvironment(item, val) {
				if (val == 'islive' && !item.islive) {
					item.islive = true;
					item.issandbox = false;
					await this.editItem(this.apiEndpoint(item), item.uuid, this.deleteProps(item));
					this.$toast('info', {message: 'Environment changed successfully', title: 'Environment changed as LIVE', position: 'topLeft'});
				}
				if (val == 'issandbox' && !item.issandbox) {
					item.islive = false;
					item.issandbox = true;
					await this.editItem(this.apiEndpoint(item), item.uuid, this.deleteProps(item));
					this.$toast('info', {message: 'Environment changed successfully', title: 'Environment changed as SANDBOX', position: 'topLeft'});
				}
			},
			async apiChangeVersion(item, val) {
				if (val == 'isdefaultversion') {
					item.isdefaultversion = !item.isdefaultversion;
					await this.editItem(this.apiEndpoint(item), item.uuid, this.deleteProps(item));
					this.$toast('info', {message: 'Version preference changed successfully', title: 'Version preference changed', position: 'topLeft'});
				}
				if (val == 'islatestversion') {
					item.islatestversion = !item.islatestversion;
					await this.editItem(this.apiEndpoint(item), item.uuid, this.deleteProps(item));
					this.$toast('info', {message: 'Version preference changed successfully', title: 'Version preference changed', position: 'topLeft'});
				}
			},
			async apiChangeVisibility(item, val) {
				var slcVisibility = this.$root.rootData.apiVisibilityList.find((el) => el.name == val );
				var curVisibility = this.$root.rootData.apiVisibilityList.find((el) => el.uuid == item.apivisibilityid );
				if (slcVisibility.uuid != curVisibility.uuid) {
					item.apivisibilityid = slcVisibility.uuid;
					await this.editItem(this.apiEndpoint(item), item.uuid, this.deleteProps(item));
					this.$toast('info', {message: 'Visibility changed ' + ' to <strong>' + slcVisibility.name + '</strong>', title: 'Visibility: ' + slcVisibility.name, position: 'topLeft'});
				}
			},
			async apiChangeState(item, val) {
				var slcState = this.$root.rootData.apiStateList.find((el) => el.name == val );
				var curState = this.$root.rootData.apiStateList.find((el) => el.uuid == item.apistateid );
				if (slcState.uuid != curState.uuid) {
					item.apistateid = slcState.uuid;
					await this.editItem(this.apiEndpoint(item), item.uuid, this.deleteProps(item));
					this.$toast('info', {message: 'State changed ' + ' to <strong>' + slcState.name + '</strong>', title: 'State: ' + slcState.name, position: 'topLeft'});
				}
			},
			validateOas(obj, show) {
				var spec = {
					spec: obj
				};
				return axios.post(abyss.ajax.validate_oas, spec).then(response => {
					if (show) {
						if (response.data) {
							this.$toast('success', {title: 'VALID', message: 'Validation is sucessfull', position: 'topRight'});
						}
					}
					return response;
				});
			},
			async createProxy(a) {
				var item = _.cloneDeep(a);
				item.openapidocument = postProcessDefinition(item.openapidocument);
				item.businessapiid = item.uuid;
				item.isproxyapi = true;
				var validOas = await this.validateOas(item.openapidocument);
				if (validOas) {
					Vue.set(item, 'extendeddocument', _.cloneDeep(item.openapidocument));
					item.extendeddocument.servers.forEach((value, key) => {
						value['x-abyss-url'] = value.url;
						value.url = this.$root.abyssGatewayUrl;
					});
					for (var p in item.extendeddocument.paths) {
						var path = item.extendeddocument.paths[p];
						path['x-abyss-path'] = p;
					}
					var newApi = await this.addItem(abyss.ajax.proxy_list+'/', this.deleteProps(item));
					this.fixProps(newApi);
					await this.createResource(newApi, 'API', newApi.openapidocument.info.title + ' ' + newApi.openapidocument.info.version + ' ' + newApi.uuid, newApi.openapidocument.info.description);
					///////////
					var putApi = await this.editItem(abyss.ajax.proxy_list, newApi.uuid, this.deleteProps(newApi));
					Vue.set(putApi.openapidocument, 'servers', [{url: this.$root.abyssGatewayUrl + '/' + putApi.uuid}]);
					this.getTax(putApi);
					this.myProxyList.push(putApi);
					setTimeout(() => {
						this.$toast('info', {message: 'Proxy API created from this business API', title: 'Proxy API created', position: 'topLeft'});
					},0);
				}
			},
			async saveMyApi() {
				setTimeout(async () => {
					this.fixProps(this.api);
					var item = _.cloneDeep(this.api);
					if (!item.isproxyapi) {
						Vue.delete(item, 'businessapiid');
					}
					item.openapidocument = postProcessDefinition(item.openapidocument);
					item.extendeddocument = postProcessDefinition(item.extendeddocument);
					var validOas = await this.validateOas(item.openapidocument);
					if (validOas) {
						var currApi = await this.editItem(this.apiEndpoint(this.api), this.api.uuid, this.deleteProps(item));
						// this.apiType(this.api)
						await this.saveTaxonomies();
						this.fixProps(currApi);
						Object.assign(this.selectedApi, currApi);
						if (currApi.isproxyapi) {
							await this.getResources(currApi, 'API', currApi.openapidocument.info.title + ' ' + currApi.openapidocument.info.version, currApi.openapidocument.info.description);
							await this.updateResource(currApi, 'API', currApi.openapidocument.info.title + ' ' + currApi.openapidocument.info.version, currApi.openapidocument.info.description);
						}
						this.getPage(1);
						var index = _.findIndex(this.apiType(this.api), { 'uuid': this.selectedApi.uuid });
						this.apiType(this.api)[index] = this.selectedApi;
						console.log("this.apiType(this.api)[index]: ", this.apiType(this.api)[index]);
						this.$toast('success', {message: '<strong>' + this.api.openapidocument.info.title + '</strong> saved', title: 'API SAVED'});
						this.isChanged = false;
						this.clearTax();
					}
				},100);
			},
			async createApi() {
				var result = await this.$validator.validateAll();
				if (result) {
					this.fixProps(this.api);
					if (this.api.originaldocument == null) {
						Vue.set(this.api, 'originaldocument', this.swaggerText.text );
					}
					if (this.api.extendeddocument == null) {
						Vue.set(this.api, 'extendeddocument', {} );
					}
					var item = _.cloneDeep(this.api);
					Vue.delete(item, 'businessapiid');
					item.openapidocument = postProcessDefinition(item.openapidocument);
					var validOas = await this.validateOas(item.openapidocument);
					if (validOas) {
						var newApi = await this.addItem(abyss.ajax.business_list, this.deleteProps(item));
						this.$root.setState('edit');
						await this.saveTaxonomies();
						this.fixProps(newApi);
						this.getTax(newApi);
						this.myApiList.push(newApi);
						var found = this.myApiList.find((el) => el.uuid == newApi.uuid );
						Vue.set(this, 'api', found);
						// this.updateSchema(found.openapidocument);
						this.selectedApi = _.cloneDeep(this.api);
						this.isChanged = false;
						this.clearTax();
						setTimeout(() => {
							$('#api'+this.api.uuid).collapse('show');
							$('#servers').collapse('show');
							$('#info').collapse('show');
							$('.list-column').addClass('column-minimize');
							this.$toast('success', {message: '<strong>' + this.api.openapidocument.info.title + '</strong> successfully registered', title: 'API CREATED'});
						},0);	
					}
				}
			},
			async filterApi(filter) {
				if (filter == null) {
					this.getPage(1);
					this.filterTxt = '';
				} else {
					// this.myApiList = await this.getItem(this.ajaxMyBusinessUrl, filter.uuid);
					this.myApiList = [];
					this.myApiList.push(filter);
					this.myApiList.forEach((value, key) => {
						this.fixProps(value);
						this.getTax(value);
					});
					this.filterTxt = 'Search Result';
				}
			},
			async filterProxy(filter) {
				if (filter == null) {
					this.getPage(1);
					this.filterTxt = '';
				} else {
					// this.myProxyList = await this.getItem(this.ajaxMyProxiesUrl, filter.uuid);
					this.myProxyList = [];
					this.myProxyList.push(filter);
					this.myProxyList.forEach((value, key) => {
						this.fixProps(value);
						this.getTax(value);
					});
					this.filterTxt = 'Search Result';
				}
			},
			async getBusinessApiOptions(search, loading) {
				loading(true);
				this.businessApiOptions = await this.getList(this.ajaxMyBusinessUrl  + '?likename=' + search);
				this.businessApiOptions.forEach((value, key) => {
					Vue.set(value, 'name', value.openapidocument.info.title);
				});
				loading(false);
			},
			async getProxyApiOptions(search, loading) {
				loading(true);
				this.proxyApiOptions = await this.getList(this.ajaxMyProxiesUrl  + '?likename=' + search);
				this.proxyApiOptions.forEach((value, key) => {
					Vue.set(value, 'name', value.openapidocument.info.title);
				});
				loading(false);
			},
			async getCategoryOptions(search, loading) {
				loading(true);
				this.categoryOptions = await this.getList(abyss.ajax.api_category_list  + '?likename=' + search);
				loading(false);
			},
			async getTagOptions(search, loading) {
				loading(true);
				this.tagOptions = await this.getList(abyss.ajax.api_tag_list  + '?likename=' + search);
				loading(false);
			},
			async getGroupOptions(search, loading) {
				loading(true);
				this.groupOptions = await this.getList(abyss.ajax.api_group_list  + '?likename=' + search);
				loading(false);
			},
			fixCategory(filter) {
				if (filter && filter.length !== 0) {
					filter.forEach((value, key) => {
						// console.log("value: ", value);
						if (typeof value === 'string') {
							var newObj = {};
							newObj.name = value;
							newObj.description = "";
							newObj.organizationid = this.$root.abyssOrgId;
							newObj.crudsubjectid = this.$root.rootData.user.uuid;
							filter.push(newObj);
							filter.splice(key, 1);
						}
					});
					this.categoriesDelete = _.reject(this.selectedApi.categories, (v) => _.includes( this.api.categories.map(e => e.uuid), v.uuid));
					this.categoriesAdd = _.reject(this.api.categories, (v) => _.includes( this.selectedApi.categories.map(e => e.uuid), v.uuid));
				}
			},
			fixTag(filter) {
				if (filter && filter.length !== 0) {
					filter.forEach((value, key) => {
						// console.log("value: ", value);
						if (typeof value === 'string') {
							var newObj = {};
							newObj.name = value;
							newObj.description = "";
							newObj.externalurl = "";
							newObj.externaldescription = "";
							newObj.organizationid = this.$root.abyssOrgId;
							newObj.crudsubjectid = this.$root.rootData.user.uuid;
							filter.push(newObj);
							filter.splice(key, 1);
						}
					});
					this.tagsDelete = _.reject(this.selectedApi.tags, (v) => _.includes( this.api.tags.map(e => e.uuid), v.uuid));
					this.tagsAdd = _.reject(this.api.tags, (v) => _.includes( this.selectedApi.tags.map(e => e.uuid), v.uuid));
				}
			},
			fixGroup(filter) {
				if (filter && filter.length !== 0) {
					filter.forEach((value, key) => {
						if (!value.uuid) {
							value.description = "";
							value.organizationid = this.$root.abyssOrgId;
							value.crudsubjectid = this.$root.rootData.user.uuid;
							value.subjectid = this.$root.rootData.user.uuid;
						}
					});
					this.groupsDelete = _.reject(this.selectedApi.groups, (v) => _.includes( this.api.groups.map(e => e.uuid), v.uuid));
					this.groupsAdd = _.reject(this.api.groups, (v) => _.includes( this.selectedApi.groups.map(e => e.uuid), v.uuid));
				}
			},
			async saveTaxonomies() {
				this.licensesDelete.forEach(async (value, key) => {
					await this.deleteItem(abyss.ajax.api_licenses, value, false);
				});
				this.licensesAdd.forEach(async (value, key) => {
					await this.addItem(abyss.ajax.api_licenses, this.deleteProps(value));
				});
				this.categoriesDelete.forEach(async (value, key) => {
					await this.deleteItem(abyss.ajax.api_category, value, false);
				});
				this.tagsDelete.forEach(async (value, key) => {
					await this.deleteItem(abyss.ajax.api_tag, value, false);
				});
				this.groupsDelete.forEach(async (value, key) => {
					await this.deleteItem(abyss.ajax.api_group, value, false);
				});
				this.categoriesAdd.forEach(async (value, key) => {
					var newObj = {};
					if (!value.uuid) {
						var category = await this.addItem(abyss.ajax.api_category_list, this.deleteProps(value));
						if (category) {
							newObj.apiid = this.api.uuid;
							newObj.apicategoryid = category.uuid;
							newObj.organizationid = this.$root.abyssOrgId;
							newObj.crudsubjectid = this.$root.rootData.user.uuid;
							await this.addItem(abyss.ajax.api_category, this.deleteProps(newObj));
						}
					} else {
						newObj.apiid = this.api.uuid;
						newObj.apicategoryid = value.uuid;
						newObj.organizationid = this.$root.abyssOrgId;
						newObj.crudsubjectid = this.$root.rootData.user.uuid;
						await this.addItem(abyss.ajax.api_category, this.deleteProps(newObj));
					}
				});
				this.tagsAdd.forEach(async (value, key) => {
					var newObj = {};
					if (!value.uuid) {
						var tag = await this.addItem(abyss.ajax.api_tag_list, this.deleteProps(value));
						if (tag) {
							newObj.apiid = this.api.uuid;
							newObj.apitagid = tag.uuid;
							newObj.organizationid = this.$root.abyssOrgId;
							newObj.crudsubjectid = this.$root.rootData.user.uuid;
							await this.addItem(abyss.ajax.api_tag, this.deleteProps(newObj));
						}
					} else {
						newObj.apiid = this.api.uuid;
						newObj.apitagid = value.uuid;
						newObj.organizationid = this.$root.abyssOrgId;
						newObj.crudsubjectid = this.$root.rootData.user.uuid;
						await this.addItem(abyss.ajax.api_tag, this.deleteProps(newObj));
					}
				});
				this.groupsAdd.forEach(async (value, key) => {
					var newObj = {};
					if (!value.uuid) {
						var group = await this.addItem(abyss.ajax.api_group_list, this.deleteProps(value));
						if (group) {
							newObj.apiid = this.api.uuid;
							newObj.apigroupid = group.uuid;
							newObj.organizationid = this.$root.abyssOrgId;
							newObj.crudsubjectid = this.$root.rootData.user.uuid;
							await this.addItem(abyss.ajax.api_group, this.deleteProps(newObj));
						}
					} else {
						newObj.apiid = this.api.uuid;
						newObj.apigroupid = value.uuid;
						newObj.organizationid = this.$root.abyssOrgId;
						newObj.crudsubjectid = this.$root.rootData.user.uuid;
						await this.addItem(abyss.ajax.api_group, this.deleteProps(newObj));
					}
				});
			},
			async loadLicense(item) {
				var apiLicenses = await this.getList(abyss.ajax.api_licenses_api + item.uuid);
				if (apiLicenses) {
					console.log("this.myLicenseList: ", this.myLicenseList);
					this.myApiLicenses = apiLicenses.filter( (item) => !item.isdeleted );
					console.log("this.myApiLicenses: ", this.myApiLicenses);
					this.myLicenseList.forEach((value, key) => {
						var index = _.findIndex(this.myApiLicenses, { 'licenseid': value.uuid });
						if (index >= 0 ) {
							Vue.set( value, 'isactive', true );
						} else {
							Vue.set( value, 'isactive', false );
						}
					});
					Vue.set(this.api, 'licenses', _.filter(this.myLicenseList, { 'isactive': true }));
					Vue.set(this.selectedApi,'licenses',_.cloneDeep(this.api.licenses));
				}
			},
			async setLicense(item) {
				Vue.set(this.api, 'licenses', _.filter(this.myLicenseList, { 'isactive': true }));
				var addSlc = _.filter(this.selectedApi.licenses, { 'isactive': true });
				var addNew = _.filter(this.myLicenseList, { 'isactive': true });
				var licensesDelete = _.reject(addSlc, (v) => _.includes( addNew.map(e => e.uuid), v.uuid));
				var licensesAdd = _.reject(addNew, (v) => _.includes( addSlc.map(e => e.uuid), v.uuid));
				console.log("licensesDelete: ", licensesDelete);
				console.log("licensesAdd: ", licensesAdd);
				this.licensesDelete = _.filter(this.myApiLicenses, (item) => _.find(licensesDelete, { uuid: item.licenseid }));
				this.licensesAdd = [];
				if (licensesAdd.length) {
					licensesAdd.forEach((value, key) => {
						var itemObj = {
							organizationid: this.$root.abyssOrgId,
							crudsubjectid: this.$root.rootData.user.uuid,
							apiid: this.api.uuid,
							licenseid: value.uuid,
						};
						this.licensesAdd.push(itemObj);
					});
				}
				console.log("this.licensesDelete: ", this.licensesDelete);
				console.log("this.licensesAdd: ", this.licensesAdd);
			},
			async getPage(p, bs, px, nm) {
				var bsEndpoint = this.ajaxMyBusinessUrl;
				var pxEndpoint = this.ajaxMyProxiesUrl;
				if (bs) {
					bsEndpoint = bs;
				}
				if (px) {
					pxEndpoint = px;
				}
				if (nm) {
					this.filterTxt = nm;
				}
				this.myProxyList = await this.getList(pxEndpoint);
				this.myProxyList.forEach((value, key) => {
					this.fixProps(value);
					this.getTax(value);
					this.getResources(value, 'API', value.openapidocument.info.title + ' ' + value.openapidocument.info.version, value.openapidocument.info.description);
				});
				this.paginate = this.makePaginate(this.myProxyList);
				this.myApiList = await this.getList(bsEndpoint);
				this.myApiList.forEach((value, key) => {
					this.fixProps(value);
					this.getTax(value);
				});
				this.paginate = this.makePaginate(this.myApiList);
				this.preload();
				this.getMyAppList();
				this.$root.getYamls();
				this.initSwagger();
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
					}
					if (this.$root.rootState != 'init') {
						this.updateSw();
						this.verChanged = _.has(this.changes, 'openapidocument.info.version');
						if (this.verChanged && this.$root.rootState != 'create') {
							console.log("this.verChanged: ", this.verChanged);
							this.$toast('warning', {message: 'You have to save as new API if you change the version', title: 'VERSION CHANGE DETECTED', position: 'bottomRight'});
						}
					}
					console.log("this.isChanged: ", this.isChanged, Object.keys(this.changes).length, this.changes, "version: ", _.has(this.changes, 'openapidocument.info.version'), this.verChanged);
				},
				deep: true
			},
			swaggerText: {
				handler(val, oldVal) {
					// var local = localStorage.getItem('swagger-editor-content');
					this.swChanges = this.checkDiff(val, this.swOld);
					// console.log("swaggerText.swChanges: ", this.swChanges);
					if ( Object.keys(this.swChanges).length > 1 ) {
						if (val.focus === false) {
							// console.log("!!!!!!!!!!!!!!!!!!!!: ");
							this.uploadSchema(val.text);
						}
					}
				},
				deep: true
			},
		},
		async created() {
			this.$emit('set-page', 'my-apis', 'init');
			// this.$root.setPage('my-apis', 'init');
			this.initSchema();
			var subject_licenses_list = this.getList(abyss.ajax.subject_licenses_list + this.$root.rootData.user.uuid );
			var subject_policies_list = this.getList(abyss.ajax.subject_policies_list + this.$root.rootData.user.uuid );
			var [myLicenseList, myPolicyList] = await Promise.all([subject_licenses_list, subject_policies_list]);
			this.myLicenseList = myLicenseList.filter( (item) => !item.isdeleted );
			this.myPolicyList = myPolicyList.filter( (item) => !item.isdeleted );
			var newLcs = this.myLicenseList;
			newLcs.forEach((value, key) => {
				Vue.set(value, 'policies', _.filter(this.myPolicyList, (v) => _.includes(value.licensedocument.termsOfService.policyKey, v.uuid)) );
				Vue.set(value, 'isactive', false);
			});
			this.myLicenseList = newLcs;
			this.getPage(1);
		}
	});
});
