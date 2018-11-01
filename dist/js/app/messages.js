define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue-select', 'vue-medium-editor', 'turndown', 'css!medium-editor-css'], function(abyss, Vue, axios, VeeValidate, _, moment, VueSelect, vueMediumEditor, turndown) {
	Vue.component('v-select', VueSelect.VueSelect);
	Vue.component('medium-editor', vueMediumEditor.default);
	
	Vue.component('message-tree', {
		template:'#message-tree',
		props: ['message'],
		data() {
			return {
				isLoading: true,
			};
		},
		computed : {
			markdownMessage(str) {
				var md = window.markdownit();
				return md.render(this.message.body);
			},
		},
		methods : {},
		created() {
			
		},
	});
	Vue.component('my-messages', {
		props: {
			rootState: { type: String }
		},
		data() {
			return {
				isLoading: true,
				sort: {
					key: 'sentat',
					type: Date,
					order: 'desc'
				},
				sortTree: {
					key: 'sentat',
					type: Date,
					order: 'asc'
				},
				pageState: 'init',
				paginate: {},
				selected: null,
				message: {
					"uuid": null,
					"organizationid": null,
					"created": null,
					"updated": null,
					"deleted": null,
					"isdeleted": false,
					"crudsubjectid": null,
					"messagetypeid": null,
					"parentmessageid": "175a21b0-8a62-40ff-a824-c7b98aa57240",
					"ownersubjectid": null,
					"conversationid": 0,
					"folder": "Sent",
					"sender": {
						'displayname': this.$root.rootData.user.displayname,
						'organizationid': this.$root.abyssOrgId, 
						'organizationname': this.$root.abyssOrgName,
						'picture': this.$root.rootData.user.picture,
						'subjectid': this.$root.rootData.user.uuid,
						'subjecttypeid': this.$root.rootData.user.subjecttypeid,
					},
					"receiver": null,
					"subject": null,
					"bodycontenttype": "application/text", // 'text/plain', text/markdown
					"body": '',
					"priority": "Normal",
					"isstarred": false,
					"isread": false,
					"sentat": null,
					"readat": moment.utc('1900-01-01').toISOString(),
					"istrashed": false,
					messageType: null,
					html: '',
				},
				viewMessage: null,
				selectedMessage: {},
				newMessage: {},
				messageList: [],
				messageTypes: [],
				filterTxt: '',
				messageOptions: [],
				searchMessages: '',
				filt: {
					fkey: 'folder',
					fval: 'Inbox'
				},
				editorOptions: {
					buttonLabels: 'fontawesome',
					// toolbar: {buttons: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'bold', 'italic', 'underline', 'anchor', 'quote', 'unorderedlist', 'orderedlist', 'indent', 'outdent', 'pre', 'removeFormat']},
					toolbar: {buttons: ['h4', 'h5', 'h6', 'bold', 'italic', 'underline', 'quote', 'unorderedlist', 'orderedlist', 'indent', 'outdent', 'pre', 'removeFormat']},
					disableExtraSpaces: true,
					targetBlank: true,
					autoLink: true,
					paste: {
						forcePlainText: false,
						cleanPastedHTML: true,
						cleanReplacements: [],
						cleanAttrs: ['class', 'style', 'dir'],
						cleanTags: ['meta'],
						unwrapTags: []
					},
					// extensions: {
					// 	'imageDragging': {}
					// }
				},
				md: window.markdownit(),
				allChecked: false,
				checkedMessages: [],
				end: []
			};
		},
		computed: {
			filteredMessages() {
				var messageList = this.messageList;
				if (this.filt.fkey == 'istrashed') {
					// messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval && item.istrashed == true && !item.isdeleted );
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval && item.istrashed == true );
				} else if (this.filt.fval == '') {
					messageList = messageList.filter((item) => !item.isdeleted );
				} else {
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval && !item.istrashed && !item.isdeleted );
				}
				return this.sortByNested(this.sort, messageList);
			},
		},
		methods: {
			getNo(val, key) {
				var messageList = this.messageList;
				if (key == 'istrashed') {
					// return this.messageList.filter((item) => item[key] == val && !item.isread && item.istrashed && !item.isdeleted ).length;
					var tno = this.messageList.filter((item) => item[key] == val && !item.isread && item.istrashed && !item.isdeleted );
					if (tno.length) {
						return '<span class="badge badge-pill badge-outline flt-r">' + tno.length + '</span>';
					} else {
						return;
					}
				} else {
					var eno = this.messageList.filter((item) => item[key] == val && !item.isread && !item.istrashed && !item.isdeleted );
					if (eno.length) {
						return '<span class="badge badge-pill badge-outline flt-r">' + eno.length + '</span>';
					} else {
						return;
					}
				}
			},
			onEdit(txt) {
				var text = txt.api.origElements;
				// console.log("txt, txt.event.bubbles: ", txt, txt.event.bubbles);
				if (txt.event.bubbles) {
					// $(text).find('pre:not(:has(code))').each(function(index, el) {
					// 	console.log("el: ", el);
					// 	$(el).wrapInner( "<code></code>")
					// });
					var preTags = $(text).find('pre:not(:has(code))');
					preTags.wrapInner( "<code></code>")

					var ulTags = $(text).find('ul');
					if (ulTags.parent().is("p")) {
						ulTags.unwrap();
					}
					var olTags = $(text).find('ol');
					if (olTags.parent().is("p")) {
						olTags.unwrap();
					}
					var liTags = $(text).find('li');
					liTags.find('br:last-child').remove();

					var ulFix = $(text).find('li + ul');
					ulFix.prev('li').append(ulFix);

					var ulFix = $(text).find('li + ul');
					ulFix.prev('li').append(ulFix);

					var olFix = $(text).find('li + ol');
					olFix.prev('li').append(olFix);

					// $('b').contents().unwrap().wrap('<strong/>');
					// $('i').contents().unwrap().wrap('<em/>');

					$(text).find('b').replaceWith(function(){
						return $("<strong />").append($(this).contents());
					});
					$(text).find('i').replaceWith(function(){
						return $("<em />").append($(this).contents());
					});
					//pTags.wrap("<div></div>");
				}
				this.message.html = text.innerHTML;
				// this.toMarkdown(this.message.html);
				this.toMarkdown(text.innerHTML);
			},
			toHtml(text) {
				// console.log("text: ", text);
				// var md = window.markdownit();
				this.message.html = this.md.render(text);
				// this.message.body = md.render(text);
			},
			toMarkdown(text) {
				var TurndownService = require('turndown');
				var turndownService = new TurndownService({
					headingStyle: 'atx', // setext
					hr: '* * *',
					bulletListMarker: '*', // -, +, or *
					codeBlockStyle: 'indented', // indented or fenced
					fence: '```', // ``` or ~~~
					emDelimiter: '_', // _ or *
					strongDelimiter: '**', // ** or __
					linkStyle: 'inlined', // inlined or referenced
					linkReferenceStyle: 'full', // full, collapsed, or shortcut
				});
				this.message.body = turndownService.turndown(text);
			},
			// filterApis $root.filterApis(group, 'group')
			filterMessages(v, k) {
				Vue.set( this.filt, 'fkey', k );
				Vue.set( this.filt, 'fval', v );
				this.checkedMessages = [];
				// this.getList(abyss.ajax.my_messages_drafts + this.$root.rootData.user.uuid)
			},
			myReadeds(item) {
				if (!item.isread) {
					return true;
				} else {
					return false;
				}
			},
			async filterMessage(filter) {
				if (filter == null) {
					this.getPage(1);
					Vue.set( this.filt, 'fkey', 'folder' );
					Vue.set( this.filt, 'fval', 'Inbox' );
				} else {
					Vue.set( this.filt, 'fkey', 'folder' );
					Vue.set( this.filt, 'fval', '' );
					this.messageList = [];
					this.messageList.push(filter);
					this.setGetPage();
				}
			},
			async getMessageOptions(search, loading) {
				loading(true);
				this.messageOptions = await this.getList(abyss.ajax.messages + '?likename=' + search);
				loading(false);
			},
			async setIsRead(read) {
				if (this.checkedMessages.length) {
					var bulkObj = {};
					for (var item of this.checkedMessages) {
						item.isread = read;
						bulkObj[item.uuid] = this.deleteProps(item);
					}
					console.log("bulkObj: ", bulkObj);
					await this.editBulkItems(abyss.ajax.messages, bulkObj);
				}
			},
			async setIsTrashed(trashed) {
				if (this.checkedMessages.length) {
					var bulkObj = {};
					for (var item of this.checkedMessages) {
						item.istrashed = trashed;
						bulkObj[item.uuid] = this.deleteProps(item);
					}
					console.log("bulkObj: ", bulkObj);
					await this.editBulkItems(abyss.ajax.messages, bulkObj);
				}
			},
			checkAll() {
				this.checkedMessages = [];
				console.log("this.allChecked: ", this.allChecked);
				if (this.allChecked) {
					for (item in this.filteredMessages) {
						this.checkedMessages.push(this.filteredMessages[item]);
					}
				}
			},
			checkMessage() {
				this.allChecked = false;
			},
			selectType(typ) {
				var type = this.messageTypes.find((el) => el.uuid === typ );
				Vue.set(this.message,'messagetypeid',type.uuid);
			},
			cancelMessage() {
				var index = this.messageList.indexOf(this.message);
				this.messageList[index] = this.selectedMessage;
				this.message = _.cloneDeep(this.newMessage);
				this.selectedMessage = _.cloneDeep(this.newMessage);
				this.viewMessage = null;
				this.selected = null;
			},
			async selectMessage(item, i) {
				// if (item.folder == 'Draft' || !item.sentat || item.sentat == '1900-01-01T00:00:00.000Z' ) {
				if (item.folder == 'Draft') {
					// this.fixProps(item);
					this.selectedMessage = _.cloneDeep(item);
					this.message = item;
					this.selected = i;
					this.$emit('set-state', 'edit');
					console.log("editdraft: ", this.message);
					this.toHtml(this.message.body);
				} else {
					// this.selectedMessage = _.cloneDeep(item);
					this.viewMessage = item;
					console.log("view: ", this.viewMessage);
					if (!this.viewMessage.isread) {
						var read = this.viewMessage;
						read.readat = moment.utc().toISOString();
						read.isread = true;
						console.log("read: ", this.deleteProps(read));
						// console.log("read: ", JSON.stringify(this.deleteProps(read), null, '\t'));
						await this.editItem( abyss.ajax.messages, read.uuid, this.deleteProps(read), this.messageList );
					}
					if (this.viewMessage.sender.subjectid == this.$root.rootData.user.uuid) {
						this.message = _.cloneDeep(this.viewMessage);
						this.message.body = '';
						this.message.html = '';
						console.log("my message: ", JSON.stringify(this.message, null, '\t'));
					} else {
						const message = _.cloneDeep(this.viewMessage);
						// this.message = message;
						this.message = _.cloneDeep(this.viewMessage);
						this.message.receiver = message.sender;
						this.message.sender = message.receiver;
						this.message.body = '';
						this.message.html = '';
						// console.log("message2: ", JSON.stringify(message, null, '\t'));
						// console.log("message: ", JSON.stringify(this.message, null, '\t'));
					}
					this.selected = i;
					this.$emit('set-state', 'view');
				}
			},
			isSelected(i) {
				return i === this.selected;
			},
			async fixProps(item) {
				this.fillProps(item);
				if (item.conversationid == null) {
					Vue.set(item, 'conversationid', 0);
				}
				if (item.ownersubjectid == null) {
					Vue.set(item, 'ownersubjectid', this.$root.rootData.user.uuid);
				}
				// if (item.sender == null) {
				// 	Vue.set(item,'sender', {});
				// 	Vue.set(item.sender,'subjectid',this.$root.rootData.user.uuid);
				// 	Vue.set(item.sender, 'organizationid', this.$root.abyssOrgId);
				// 	Vue.set(item.sender, 'organizationid', this.$root.abyssOrgName);
				// 	Vue.set(item.sender,'subjecttypeid',this.$root.rootData.user.subjecttypeid);
				// 	Vue.set(item.sender,'displayname',this.$root.rootData.user.displayname);
				// 	Vue.set(item.sender,'picture',this.$root.rootData.user.picture);
				// }
				if (item.readat == null) {
					Vue.set(item,'readat', moment.utc('1900-01-01').toISOString());
				}
				if (item.sentat == null) {
					Vue.set(item,'sentat', moment.utc('1900-01-01').toISOString());
				}
				if (item.receiver.organizationname == null) {
					var r = _.pick(item.receiver, ['uuid', 'subjectid', 'organizationid', 'subjecttypeid', 'displayname', 'picture']);
					if (item.receiver.subjectid) {
						Vue.set( r, 'subjectid', r.subjectid );
					} else {
						Vue.set( r, 'subjectid', r.uuid );
					}
					Vue.delete(r, 'uuid');
					Vue.set( item, 'receiver', r );
					var org = await this.getItem(abyss.ajax.organizations_list, r.organizationid);
					Vue.set( item.receiver, 'organizationname', org.name );
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'messageType');
				Vue.delete(item, 'html');
				Vue.delete(item.receiver, 'uuid');
				return item;
			},
			async deleteTrashed() {
				if (this.checkedMessages.length) {
					for (var item of this.checkedMessages) {
						console.log("item: ", item);
						// await this.deleteMessage(item);
					}
				}
			},
			async deleteMessage(item) {
				console.log("delete: ", item);
				var del = await this.deleteItem(abyss.ajax.messages, item, true);
				if (del) {
					item.isdeleted = true;
					// this.getPage();
				}
			},
			async trashMessage(item) {
				console.log("trash: ", item);
				// item.istrashed = !item.istrashed;
				item.istrashed = true;
				var res = await this.editItem( abyss.ajax.messages, item.uuid, this.deleteProps(item), this.messageList );
				if (res) {
					item.istrashed = res.istrashed;
				}
			},
			async markAsStarred(item) {
				this.fixProps(item);
				item.isstarred = !item.isstarred;
				console.log("star: ", JSON.stringify(this.deleteProps(item), null, '\t'));
				var res = await this.editItem( abyss.ajax.messages, item.uuid, this.deleteProps(item), this.messageList );
				if (res) {
					item.isstarred = res.isstarred;
				}
			},
			setReceiver(filter) {
				if (filter != null) {
					console.log("filter: ", filter);
					// ?? diğerleri gerekli mi?
					// Vue.set( this.message.receiver, 'subjectid', filter.uuid );
					// Vue.set( this.message.receiver, 'organizationid', filter.organizationid );
					// Vue.set( this.message.receiver, 'subjecttypeid', filter.subjecttypeid );
					// Vue.set( this.message.receiver, 'displayname', filter.displayname );
					// Vue.set( this.message.receiver, 'picture', filter.picture );
				}
			},
			async messageAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					this.message.isread = true;
					this.message.readat = moment.utc().toISOString();
					if (act === 'send') {
						this.message.folder = 'Sent';
						this.message.sentat = moment.utc().toISOString();
						// if (this.message.folder == 'Draft' || !this.message.sentat || this.message.sentat == '1900-01-01T00:00:00.000Z') {
						if (this.message.folder == 'Draft') {
							this.editMessage(this.message, act);
						} else {
							await this.fixProps(this.message);
							this.addMessage(this.message, act);
						}
					}
					if (act === 'add') {
						this.message.folder = 'Draft';
						this.message.sentat = moment.utc('1900-01-01').toISOString();
						await this.fixProps(this.message);
						this.addMessage(this.message, act);
					}
					if (act === 'edit') {
						this.message.folder = 'Draft';
						this.message.sentat = moment.utc('1900-01-01').toISOString();
						this.editMessage(this.message, act);
					}
				}
			},
			async addMessage(msg, act) {
				console.log(act, JSON.stringify(this.deleteProps(msg), null, '\t'));
				var item = await this.addItem(abyss.ajax.messages, this.deleteProps(msg));
				if (item) {
					this.$emit('set-state', 'init');
					this.message = _.cloneDeep(this.newMessage);
					this.selected = null;
					this.getPage();
				}
			},
			async editMessage(msg, act) {
				console.log(act, JSON.stringify(this.deleteProps(msg), null, '\t'));
				var item = await this.editItem( abyss.ajax.messages, msg.uuid, this.deleteProps(msg) );
				if (item) {
					this.$emit('set-state', 'init');
					this.message = _.cloneDeep(this.newMessage);
					this.selected = null;
					this.getPage();
				}
			},
			/*async fixMessage() {
				var msg = {
					uuid: "9c5892cd-9d3f-47d3-a0ce-8a75005bf958",
					organizationid: "89db8aca-51b3-435b-a79d-e1f4067d2076",
					created: "2018-10-26T19:02:02.47977Z",
					updated: "2018-10-26T19:02:02.47977Z",
					deleted: null,
					isdeleted: false,
					crudsubjectid: "9820d2aa-eb02-4a58-8cc5-8b9a89504df9",
					messagetypeid: "b11ff37f-4563-4e7c-857a-11f3b19e5744",
					parentmessageid: "175a21b0-8a62-40ff-a824-c7b98aa57240",
					ownersubjectid: "9820d2aa-eb02-4a58-8cc5-8b9a89504df9",
					conversationid: 9,
					folder: "Sent",
					sender: {
						picture: "sender picture",
						subjectid: "9820d2aa-eb02-4a58-8cc5-8b9a89504df9",
						displayname: "sender display name",
						subjecttypeid: "sender type",
						organizationid: "89db8aca-51b3-435b-a79d-e1f4067d2076",
						organizationname: "monasdyas"
					},
						receiver: {
						picture: "receiver picture",
						subjectid: "32c9c734-11cb-44c9-b06f-0b52e076672d",
						displayname: "receiver display name",
						subjecttypeid: "receiver type",
						organizationid: "3c65fafc-8f3a-4243-9c4e-2821aa32d293",
						organizationname: "Abyss"
					},
					subject: "API Classification",
					bodycontenttype: "application/text",
					body: "Api classification reply of reply next message",
					priority: "Important",
					isstarred: false,
					isread: false,
					sentat: "2018-10-26T19:02:02.47977Z",
					readat: moment.utc('1900-01-01').toISOString(),
					istrashed: false
				}
				console.log('fix', JSON.stringify(this.deleteProps(msg), null, '\t'));
				var item = await this.editItem( abyss.ajax.messages, msg.uuid, this.deleteProps(msg) );
				if (item) {
					this.getPage();
				}
			},*/
			async setGetPage() {
				this.messageList.forEach(async (value, key) => {
					if (!value.parentmessageid ) {
						Vue.set( value, 'parentmessageid', '175a21b0-8a62-40ff-a824-c7b98aa57240' );
					}
					var type = _.find(this.messageTypes, { 'uuid': value.messagetypeid });
					Vue.set( value, 'messageType', _.pick(type, ['uuid', 'name']) );
				});
			},
			async getPage(p, d) {
				// var message_list = this.getList(abyss.ajax.my_messages + this.$root.rootData.user.uuid);
				var message_list = this.getList(abyss.ajax.messages_of_subject); // + this.$root.rootData.user.uuid);
				var message_types = this.getList(abyss.ajax.message_types);
				var [messageList, messageTypes] = await Promise.all([message_list, message_types]);
				Vue.set( this, 'messageList', messageList );
				Vue.set( this, 'messageTypes', messageTypes );
				await this.setGetPage();
				
				this.paginate = this.makePaginate(this.messageList);
				this.isLoading = false;
				this.preload();
			},
		},
		created() {
			this.$emit('set-page', 'messages', 'init');
			this.newMessage = _.cloneDeep(this.message);
			this.getPage(1);
			// this.fixMessage();
		}
	});
});
