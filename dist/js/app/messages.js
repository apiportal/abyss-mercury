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
					key: 'lastMessage.sentat',
					type: Date,
					order: 'desc'
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
					"sendersubjectid": null,
					"receiversubjectid": null,
					"subject": null,
					"body": null,
					"priority": "",
					"isstarred": false,
					"isread": false,
					// "sentat": null,
					// "readat": null,
					"sentat": moment.utc('1900-01-01').toISOString(),
					"readat": moment.utc('1900-01-01').toISOString(),
					messageType: null,
					receiver: null,
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
			stringifyMessage : {
				get() {
					return JSON.stringify(this.message, null, '\t');
				}
			},
			stringifyViewMessage : {
				get() {
					return JSON.stringify(this.viewMessage, null, '\t');
				}
			},
			filteredMessages() {
				var messageList = this.messageList;
				// console.log("messageList: ", messageList);
				if (this.searchMessages) {
					messageList = messageList.filter(item => item.Name.toLowerCase().includes(this.searchMessages));
				}
				// console.log("this.filt.fval: ", this.filt.fval);
				// console.log("this.filt.fkey: ", this.filt.fkey);
				if (this.filt.fval == 'Sent') {
					messageList = messageList.filter((item) => (item.children && !item.isdeleted) || (item[this.filt.fkey] == this.filt.fval) && !item.isdeleted );
				} else if (this.filt.fkey == 'isdeleted') {
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval && item.isdeleted == true );
				} else if (this.filt.fval == 'Inbox') {
					messageList = messageList.filter((item) => (item.children && !item.isdeleted) || item[this.filt.fkey] == this.filt.fval && !item.isdeleted );
					// messageList = messageList.filter((item) => (item.children && item.folder == 'Sent' && !item.isdeleted) || item[this.filt.fkey] == this.filt.fval && !item.isdeleted );
					// messageList = messageList.filter((item) => (item.lastMessage && item.lastMessage.sendersubjectid != this.$root.rootData.user.uuid && item.folder == 'Sent' && !item.isdeleted) || item[this.filt.fkey] == this.filt.fval && !item.isdeleted );
				} else if (this.filt.fval == '') {
					messageList = messageList;
				} else {
					messageList = messageList.filter((item) => item[this.filt.fkey] == this.filt.fval && !item.isdeleted );
				}
				// if (this.searchMessages) {
				// 	messageList = this.unflattenParents(messageList, {uuid: null}, 'parentmessageid')
				// }
				// return this.$refs.roomFilters.orderBy(rooms);
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
				// if (!item.lastMessage.isread && item.folder != 'Draft' && item.folder != 'Sent' && item.lastMessage.sendersubjectid != this.$root.rootData.user.uuid) {
				if (!item.lastMessage.isread && item.lastMessage.sendersubjectid != this.$root.rootData.user.uuid) {
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
					this.setPage();
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
			selectMessage(item, i) {
				this.fixProps(item);
				this.selectedMessage = _.cloneDeep(item);
				this.message = item;
				this.selected = i;
			},
			async selectViewMessage(item, i) {
				if (!item.sentat || item.sentat == '1900-01-01T00:00:00.000Z' ) {
					this.fixProps(item);
					this.selectedMessage = _.cloneDeep(item);
					this.message = item;
					this.selected = i;
					this.$emit('set-state', 'edit');
					console.log("editdraft: ", this.message);
				} else {
					// this.selectedMessage = _.cloneDeep(item);
					this.viewMessage = item;
					console.log("view: ", this.viewMessage);
					if (this.viewMessage.lastMessage.sendersubjectid == this.$root.rootData.user.uuid) {
						this.message.receiver = this.viewMessage.lastMessage.receiver;
						this.message.receiversubjectid = this.viewMessage.lastMessage.receiversubjectid;
						console.log("my message: ", this.viewMessage);
					} else {
						if (!this.viewMessage.lastMessage.isread) {
							var read = this.viewMessage.lastMessage;
							read.readat = moment.utc().toISOString();
							read.isread = true;
							console.log("read: ", this.deleteProps(read));
							// console.log("read: ", JSON.stringify(this.deleteProps(read), null, '\t'));
							await this.editItem( abyss.ajax.messages, read.uuid, this.deleteProps(read), this.messageList );
						}
						this.message.messagetypeid = this.viewMessage.lastMessage.messagetypeid;
						this.message.receiver = this.viewMessage.lastMessage.sender;
						this.message.receiversubjectid = this.viewMessage.lastMessage.sendersubjectid;
						this.message.subject = this.viewMessage.lastMessage.subject;
						this.message.parentmessageid = this.viewMessage.lastMessage.uuid;
					}
					this.selected = i;
					this.$emit('set-state', 'view');
				}
			},
			isSelected(i) {
				return i === this.selected;
			},
			fixProps(item) {
				this.fillProps(item);
				if (item.sendersubjectid == null) {
					Vue.set(item,'sendersubjectid',this.$root.rootData.user.uuid);
				}
				if (item.readat == null) {
					Vue.set(item,'readat', moment.utc('1900-01-01').toISOString());
				}
				if (item.sentat == null) {
					Vue.set(item,'sentat', moment.utc('1900-01-01').toISOString());
				}
			},
			deleteProps(obj) {
				var item = this.cleanProps(obj);
				Vue.delete(item, 'messageType');
				Vue.delete(item, 'sender');
				Vue.delete(item, 'receiver');
				Vue.delete(item, 'folder');
				Vue.delete(item, 'lastMessage');
				Vue.delete(item, 'isLastMessage');
				Vue.delete(item, 'children');
				return item;
			},
			async deleteMessage(item) {
				console.log("delete: ", item);
				await this.deleteItem(abyss.ajax.messages, item, true);
				this.getPage();
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
					Vue.set( this.message, 'receiversubjectid', filter.uuid );
				}
			},
			async messageAction(act) {
				var result = await this.$validator.validateAll();
				if (result) {
					// this.message.body = JSON.stringify(this.message.body);
					if (act === 'send') {
						this.fixProps(this.message);
						this.message.sentat = moment.utc().toISOString();
						console.log("send: ", JSON.stringify(this.deleteProps(this.message), null, '\t'));
						var item = await this.addItem(abyss.ajax.messages, this.deleteProps(this.message), this.messageList);
						if (item) {
							this.$emit('set-state', 'init');
							this.message = _.cloneDeep(this.newMessage);
							this.getPage();
						}
					}
					if (act === 'create') {
						this.fixProps(this.message);
						console.log("create: ", JSON.stringify(this.deleteProps(this.message), null, '\t'));
						var item = await this.addItem(abyss.ajax.messages, this.deleteProps(this.message), this.messageList);
						if (item) {
							// this.$emit('set-state', 'init');
							// this.message = _.cloneDeep(this.newMessage);
							this.getPage();
						}
					}
					if (act === 'edit') {
						console.log("edit: ", JSON.stringify(this.deleteProps(this.message), null, '\t'));
						var item = await this.editItem( abyss.ajax.messages, this.message.uuid, this.deleteProps(this.message), this.messageList );
						if (item) {
							// this.$emit('set-state', 'init');
							// this.message = _.cloneDeep(this.newMessage);
							// this.selected = null;
							this.getPage();
						}
					}
				}
			},
			async setPage() {
				this.messageList.forEach(async (value, key) => {
					if (value.receiversubjectid == this.$root.rootData.user.uuid) {
						Vue.set( value, 'folder', 'Inbox' );
					}
					if (value.sendersubjectid == this.$root.rootData.user.uuid) {
						Vue.set( value, 'folder', 'Sent' );
					}
					if (!value.sentat || value.sentat == '1900-01-01T00:00:00.000Z' ) {
						Vue.set( value, 'folder', 'Draft' );
					}
					if (!value.parentmessageid ) {
						Vue.set( value, 'parentmessageid', '175a21b0-8a62-40ff-a824-c7b98aa57240' );
					}
					var type = _.find(this.messageTypes, { 'uuid': value.messagetypeid });
					Vue.set( value, 'messageType', _.pick(type, ['uuid', 'name']) );
					var receiver = await this.getItem(abyss.ajax.subjects, value.receiversubjectid);
					Vue.set( value, 'receiver', _.pick(receiver, ['uuid', 'organizationid', 'subjecttypeid', 'displayname', 'email', 'picture']) );
					var sender = await this.getItem(abyss.ajax.subjects, value.sendersubjectid);
					Vue.set( value, 'sender', _.pick(sender, ['uuid', 'organizationid', 'subjecttypeid', 'displayname', 'email', 'picture']) );
				});
				this.messageList = await this.unflattenParents(this.messageList, {uuid: '175a21b0-8a62-40ff-a824-c7b98aa57240'}, 'parentmessageid');
				this.messageList.forEach(async(value, key) => {
					var lastMessage = this.findUnread(value, 'isLastMessage');
					// console.log("lastMessage: ", lastMessage[0].body, lastMessage);
					if (lastMessage.length) {
						Vue.set( value, 'lastMessage', lastMessage[0] );
						// Vue.set( value, 'lastMessage', lastMessage[0].body );
					}
				});
			},
			async getPage(p, d) {
				// var message_list = this.getList(abyss.ajax.my_messages + this.$root.rootData.user.uuid);
				// var message_drafts = this.getList(abyss.ajax.my_messages_drafts + this.$root.rootData.user.uuid);
				var message_list = this.getList(abyss.ajax.messages);
				var message_types = this.getList(abyss.ajax.message_types);
				var [messageList, messageTypes] = await Promise.all([message_list, message_types]);
				Vue.set( this, 'messageList', messageList );
				Vue.set( this, 'messageTypes', messageTypes );
				await this.setPage();
				
				this.paginate = this.makePaginate(this.messageList);
				this.isLoading = false;
				this.preload();
			},
			findUnread(obj, key) {
				if (_.has(obj, key)){
					return [obj];
				}
				return _.flatten(_.map(obj, (v) => {
					return typeof v == "object" ? this.findUnread(v, key) : [];
				}), true);
			},
			async findUnread222(obj, key) {
				var res = [];
				_.forEach(obj, (v) => {
					if (typeof v == "object" && (v = this.findUnread(v, key)).length)
						res.push.apply(res, v);
				});
				return res;
			},
			async unflattenParents(array, parent, parentid) {
				var children = _.filter(array, child => child[parentid] == parent.uuid);
				// console.log("children: ", children);
				if (!_.isEmpty(children)) {
					if (parent.uuid == '175a21b0-8a62-40ff-a824-c7b98aa57240') {
					} else {
						parent['children'] = children[0];
					}
					_.each(children, child => {
						this.unflattenParents(array, child, parentid)
					});
				} else {
					parent['isLastMessage'] = true;
				}
				return children;
			},
		},
		created() {
			this.$emit('set-page', 'messages', 'init');
			this.newMessage = _.cloneDeep(this.message);
			this.getPage(1);
		}
	});
});
