define(['config', 'Vue', 'axios', 'vee-validate', 'lodash', 'moment', 'vue-select'], function(abyss, Vue, axios, VeeValidate, _, moment, VueSelect) {
	Vue.component('v-select', VueSelect.VueSelect);
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
				// var result = md.render(str);
				// $('#mdPreviewText').html(result);
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
					"bodycontenttype": "application/text",
					"body": null,
					"priority": "Normal",
					"isstarred": false,
					"isread": false,
					"sentat": null,
					"readat": moment.utc('1900-01-01').toISOString(),
					"istrashed": false,
					messageType: null,
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
				fff: '',
				end: []
			};
		},
		computed: {
			filteredMessages() {
				var messageList = this.messageList;
				if (this.filt.fkey == 'istrashed') {
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval && item.istrashed == true );
				} else if (this.filt.fval == '') {
					messageList = messageList;
				} else {
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval && !item.istrashed );
				}
				return this.sortByNested(this.sort, messageList);
			},
		},
		methods: {
			// filterApis $root.filterApis(group, 'group')
			filterMessages(v, k) {
				Vue.set( this.filt, 'fkey', k );
				Vue.set( this.filt, 'fval', v );
				// this.getList(abyss.ajax.my_messages_drafts + this.$root.rootData.user.uuid)
			},
			myReadeds(item) {
				if (!item.isread && item.sender.subjectid != this.$root.rootData.user.uuid) {
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
				if (item.folder == 'Draft' || !item.sentat || item.sentat == '1900-01-01T00:00:00.000Z' ) {
					// this.fixProps(item);
					this.selectedMessage = _.cloneDeep(item);
					this.message = item;
					this.selected = i;
					this.$emit('set-state', 'edit');
					console.log("editdraft: ", this.message);
				} else {
					// this.selectedMessage = _.cloneDeep(item);
					this.viewMessage = item;
					console.log("view: ", this.viewMessage);
					if (this.viewMessage.sender.subjectid == this.$root.rootData.user.uuid) {
						this.message = _.cloneDeep(this.viewMessage);
						this.message.body = null;
						console.log("my message: ", JSON.stringify(this.message, null, '\t'));
					} else {
						if (!this.viewMessage.isread) {
							var read = this.viewMessage;
							read.readat = moment.utc().toISOString();
							read.isread = true;
							console.log("read: ", this.deleteProps(read));
							// console.log("read: ", JSON.stringify(this.deleteProps(read), null, '\t'));
							await this.editItem( abyss.ajax.messages, read.uuid, this.deleteProps(read), this.messageList );
						}
						const message = _.cloneDeep(this.viewMessage);
						// this.message = message;
						this.message = _.cloneDeep(this.viewMessage);
						this.message.receiver = message.sender;
						this.message.sender = message.receiver;
						this.message.body = null;
						console.log("message2: ", JSON.stringify(message, null, '\t'));
						console.log("message: ", JSON.stringify(this.message, null, '\t'));
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
				Vue.delete(item.receiver, 'uuid');
				return item;
			},
			async deleteMessage(item) {
				console.log("delete: ", item);
				// await this.deleteItem(abyss.ajax.messages, item, true);
				// item.istrashed = true;
				// this.getPage();
				item.istrashed = !item.istrashed;
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
					if (act === 'send') {
						this.message.isread = false;
						if (this.message.folder == 'Draft' || !this.message.sentat || this.message.sentat == '1900-01-01T00:00:00.000Z') {
							this.message.folder = 'Sent';
							this.message.sentat = moment.utc().toISOString();
							this.message.readat = moment.utc('1900-01-01').toISOString();
							this.editMessage(this.message, act);
						} else {
							await this.fixProps(this.message);
							this.message.folder = 'Sent';
							this.message.sentat = moment.utc().toISOString();
							this.message.readat = moment.utc('1900-01-01').toISOString();
							this.addMessage(this.message, act);
						}
					}
					if (act === 'add') {
						this.message.folder = 'Draft';
						this.message.isread = false;
						this.message.sentat = moment.utc('1900-01-01').toISOString();
						this.message.readat = moment.utc('1900-01-01').toISOString();
						await this.fixProps(this.message);
						this.addMessage(this.message, act);
					}
					if (act === 'edit') {
						this.message.folder = 'Draft';
						this.message.isread = false;
						this.message.sentat = moment.utc('1900-01-01').toISOString();
						this.message.readat = moment.utc('1900-01-01').toISOString();
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
			async fixMessage() {
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
			},
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
				// var message_drafts = this.getList(abyss.ajax.my_messages_drafts + this.$root.rootData.user.uuid);
				var message_list = this.getList(abyss.ajax.messages_of_subject); // + this.$root.rootData.user.uuid);
				var message_types = this.getList(abyss.ajax.message_types);
				var [messageList, messageTypes] = await Promise.all([message_list, message_types]);
				Vue.set( this, 'messageList', messageList );
				Vue.set( this, 'messageTypes', messageTypes );
				await this.setGetPage();
				
				this.paginate = this.makePaginate(this.messageList);
				this.isLoading = false;
				this.preload();
				// XSS test
				// this.$toast('warning', {title: 'aaaaaaa &#x3C;img src=&#x22;http://unsplash.it/100/100?random&#x22; onclick=&#x22;alert(true);&#x22; /&#x3E;', message: '99999999 <script>alert("xss")</script>', position: 'topRight', timeout: false, closeOnClick: false});
				// this.$toast('warning', {title: 'aaaaaaa &lt;img src=&quot;http://unsplash.it/100/100?random&quot; onclick=&quot;alert(true);&quot; /&gt;', message: '99999999 <script>alert("xss")</script>', position: 'topRight', timeout: false, closeOnClick: false});
				// this.$toast('info', {title: 'aaaaaaa <img src="http://unsplash.it/100/100?random" onclick="alert(true);" />', message: '99999999 <script>alert("xss")</script>', position: 'topRight', timeout: false, closeOnClick: false});
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
